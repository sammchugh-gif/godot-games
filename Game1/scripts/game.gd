# Round director: owns the world, the player, the boss and the phase machine.
# BUILD -> PREP -> SIEGE -> (won) next round | (lost) game over.
extends Node3D

enum Phase { LOADING, BUILD, PREP, SIEGE, ROUND_WON, GAME_OVER }

const MIN_BLOCKS_TO_START := 15
const FINAL_ROUND := 10
const INTEGRITY_LOSS := 0.25          # fort is considered wrecked below this
const BASE_SEED := 20260829

const PlayerScript = preload("res://scripts/player.gd")
const BossScript = preload("res://scripts/boss.gd")
const ProjectileScript = preload("res://scripts/projectile.gd")
const TouchScript = preload("res://scripts/touch_controls.gd")

var world: VoxelWorld
var player: Player
var boss: Boss
var hud: HUD
var debris: Debris
var touch: TouchControls

var phase: int = Phase.LOADING
var round_no := 1
var credits := 0
var timer := 0.0
var total_blocks_placed := 0
var _phase_t := 0.0
var _turret_cool := {}
var _tnt_check_t := 0.0
var _headless := false
var _touch_mode := false
var _touch_sig := []
var _lightweight := false
var _last_touch_jump_ms := 0


func _ready() -> void:
	add_to_group("game")
	_headless = DisplayServer.get_name() == "headless"
	_register_input()
	_build_environment()

	world = VoxelWorld.new()
	world.name = "World"
	add_child(world)
	if _lightweight:
		# Spread meshing over frames so a tablet never freezes on a round start.
		world.rebuild_budget = 1
		world.initial_budget = 6
	world.structure_changed.connect(_on_structure_changed)
	world.block_broken.connect(_on_block_broken)

	debris = Debris.new()
	add_child(debris)

	player = PlayerScript.new()
	player.name = "Player"
	player.world = world
	player.game = self
	add_child(player)
	player.health_changed.connect(_on_player_health)
	player.died.connect(_on_player_died)
	player.build_rejected.connect(func(msg: String) -> void: hud.toast(msg))

	hud = HUD.new()
	hud.name = "HUD"
	add_child(hud)
	hud.attach_atlas(world.atlas)
	hud.restart_pressed.connect(start_game)
	hud.quit_pressed.connect(func() -> void: get_tree().quit())

	touch = TouchScript.new()
	touch.name = "TouchControls"
	touch.hud = hud
	add_child(touch)
	touch.action_pressed.connect(_on_touch_action)
	touch.slot_selected.connect(func(i: int) -> void: player.selected_slot = i)
	touch.world_tap.connect(func() -> void: player.place_from_touch())
	player.touch = touch
	_set_touch_mode(_detect_touch())

	if "--selftest" in OS.get_cmdline_args() or "--selftest" in OS.get_cmdline_user_args():
		_run_selftest()
		return

	start_game()

	if "--shot" in OS.get_cmdline_args() or "--shot" in OS.get_cmdline_user_args():
		_run_screenshots()
	elif "--soak" in OS.get_cmdline_args() or "--soak" in OS.get_cmdline_user_args():
		_run_soak()


func _detect_touch() -> bool:
	if "--touch" in OS.get_cmdline_args() or "--touch" in OS.get_cmdline_user_args():
		return true
	if _headless:
		return false
	if OS.has_feature("mobile"):
		return true
	# Desktop browsers keep mouse-look; iPads and phones get the overlay.
	if OS.has_feature("web") and DisplayServer.is_touchscreen_available():
		return true
	return false


func _set_touch_mode(on: bool) -> void:
	_touch_mode = on
	touch.enable(on)
	hud.set_touch_layout(on)
	_touch_sig = []
	if on:
		Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
		hud.set_hint("Left thumb on MOVE  ·  drag anywhere to look  ·  tap to place, hold to mine")
	elif not _headless and phase != Phase.GAME_OVER and phase != Phase.LOADING:
		Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)


func _on_touch_action(id: String) -> void:
	match id:
		"jump":
			# Double-tapping the up button toggles flight, as in creative mode.
			var now := Time.get_ticks_msec()
			if now - _last_touch_jump_ms < 320:
				player.toggle_fly()
				_last_touch_jump_ms = 0
			else:
				_last_touch_jump_ms = now
		"ready":
			if phase == Phase.BUILD:
				_finish_building()
		"help":
			hud.toggle_help()


func _register_input() -> void:
	var binds := {
		"move_forward": [KEY_W, KEY_UP],
		"move_back": [KEY_S, KEY_DOWN],
		"move_left": [KEY_A, KEY_LEFT],
		"move_right": [KEY_D, KEY_RIGHT],
		# Minecraft layout: Shift sneaks/descends, Ctrl sprints, and flying is
		# toggled by double-tapping Space (F kept as an alias).
		"jump": [KEY_SPACE],
		"crouch": [KEY_SHIFT],
		"sprint": [KEY_CTRL],
		"toggle_fly": [KEY_F],
		"ready_up": [KEY_E, KEY_R],
		"toggle_help": [KEY_TAB],
		"pause_toggle": [KEY_ESCAPE],
		"confirm": [KEY_ENTER, KEY_KP_ENTER],
		"toggle_touch": [KEY_F9],
	}
	for i in 9:
		binds["slot_%d" % (i + 1)] = [KEY_1 + i]

	for action in binds.keys():
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for key in binds[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)

	var mouse := {
		"break_block": MOUSE_BUTTON_LEFT,
		"place_block": MOUSE_BUTTON_RIGHT,
		"pick_block": MOUSE_BUTTON_MIDDLE,
	}
	for action in mouse.keys():
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		var ev := InputEventMouseButton.new()
		ev.button_index = mouse[action]
		InputMap.action_add_event(action, ev)


func _build_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY

	var sky := Sky.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color(0.24, 0.44, 0.78)
	sky_mat.sky_horizon_color = Color(0.72, 0.82, 0.92)
	sky_mat.ground_bottom_color = Color(0.45, 0.52, 0.6)
	sky_mat.ground_horizon_color = Color(0.72, 0.82, 0.92)
	sky_mat.sun_angle_max = 24.0
	sky.sky_material = sky_mat
	env.sky = sky

	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 1.0
	env.ambient_light_energy = 0.7
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.fog_enabled = true
	env.fog_light_color = Color(0.68, 0.78, 0.9)
	env.fog_density = 0.0022
	env.fog_sky_affect = 0.2

	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52, -38, 0)
	sun.light_energy = 1.15
	sun.light_color = Color(1.0, 0.96, 0.88)
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 90.0
	sun.shadow_bias = 0.06
	sun.shadow_normal_bias = 1.6
	add_child(sun)

	_apply_platform_quality(sun, env)


# Tablets run the WebGL path on a mobile GPU. Shadow range and MSAA are the two
# things that cost the most there for the least visible gain at this art style.
func _apply_platform_quality(sun: DirectionalLight3D, env: Environment) -> void:
	if _headless:
		return
	var lightweight: bool = OS.has_feature("web") or OS.has_feature("mobile")
	if not lightweight:
		return
	sun.directional_shadow_max_distance = 42.0
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	# Fog stays on: it is cheap here and the horizon reads as a pale void without it.
	var vp := get_viewport()
	if vp != null:
		vp.msaa_3d = Viewport.MSAA_DISABLED
	_lightweight = true


# ------------------------------------------------------------ lifecycle ---

func start_game() -> void:
	round_no = 1
	credits = 0
	total_blocks_placed = 0
	hud.hide_end()
	_start_round()


func _start_round() -> void:
	world.generate(BASE_SEED + round_no * 7919)
	_turret_cool.clear()

	var cx := VoxelWorld.SX / 2
	var cz := VoxelWorld.SZ / 2
	var sy := world.surface_y(cx, cz)
	player.spawn_at(Vector3(cx + 0.5, sy + 0.2, cz + 0.5))
	player.frozen = true          # released once the chunks have collision

	var carry: int = mini(credits / 2, 200)
	credits = _budget_for(round_no) + carry

	timer = _build_time_for(round_no)
	_set_phase(Phase.BUILD)

	if not _headless and not _touch_mode:
		Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	if _touch_mode:
		touch.enable(true)

	hud.show_boss(false)
	hud.set_credits(credits)
	hud.set_selected(player.selected_slot)
	hud.set_integrity(1.0, 0)
	hud.set_health(player.health, Player.MAX_HEALTH)
	var sub := "Spend your credits. Press E when the fort is ready."
	if carry > 0:
		sub = "Carried over %d credits. Press E when ready." % carry
	hud.banner("ROUND %d" % round_no, sub, 3.0)
	if _touch_mode:
		hud.set_hint("Left thumb on MOVE  ·  drag anywhere to look  ·  tap to place, hold to mine")
	else:
		hud.set_hint("Right click to place  ·  1-9 or wheel to choose  ·  F to fly  ·  Tab for help")


func _budget_for(r: int) -> int:
	return 380 + 90 * (r - 1)


func _build_time_for(r: int) -> float:
	return maxf(150.0 - 8.0 * float(r - 1), 75.0)


func _set_phase(p: int) -> void:
	phase = p
	_phase_t = 0.0
	match p:
		Phase.BUILD:
			player.can_build = true
			player.can_fight = false
			player.can_fly = true
			hud.set_phase("BUILD PHASE", HUD.ACCENT)
		Phase.PREP:
			player.can_build = true
			player.can_fight = true
			player.can_fly = false
			player.flying = false
			hud.set_phase("BRACE", HUD.WARN)
			hud.set_hint("Swing your axe at the golem. The glowing core takes triple damage.")
		Phase.SIEGE:
			player.can_build = true
			player.can_fight = true
			player.can_fly = false
			hud.set_phase("SIEGE", HUD.BAD)
			hud.set_hint("")
		Phase.ROUND_WON:
			player.can_fight = false
			hud.set_hint("")
		Phase.GAME_OVER:
			player.can_fight = false
			player.can_build = false
			# Hand input back to the UI so the end-screen buttons are tappable.
			touch.enable(false)
			if not _headless:
				Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)


func _finish_building() -> void:
	if world.placed_total < MIN_BLOCKS_TO_START:
		hud.toast("Build something first — at least %d blocks." % MIN_BLOCKS_TO_START)
		return
	timer = 4.0
	_set_phase(Phase.PREP)
	hud.banner("IT IS COMING", "Get behind your walls.", 2.0)
	_spawn_boss()


func _spawn_boss() -> void:
	if is_instance_valid(boss):
		boss.queue_free()
	boss = BossScript.new()
	boss.name = "Boss"
	boss.configure(round_no)
	boss.world = world
	boss.player = player
	add_child(boss)

	# Enter from the arena edge furthest from the fort.
	var fort := _fort_centre()
	var best := Vector3(6, 0, 6)
	var best_d := -1.0
	var corners: Array[Vector3] = [
		Vector3(6, 0, 6), Vector3(VoxelWorld.SX - 6, 0, 6),
		Vector3(6, 0, VoxelWorld.SZ - 6), Vector3(VoxelWorld.SX - 6, 0, VoxelWorld.SZ - 6)]
	for c in corners:
		var d := c.distance_to(fort)
		if d > best_d:
			best_d = d
			best = c
	var gy := world.surface_y(int(best.x), int(best.z))
	boss.global_position = Vector3(best.x, gy, best.z)

	boss.health_changed.connect(func(c: float, m: float) -> void: hud.set_boss_health(c, m))
	boss.died.connect(_on_boss_died)
	boss.smashed.connect(_on_boss_smashed)
	boss.telegraph.connect(func(kind: String) -> void: hud.boss_telegraph(kind))

	hud.show_boss(true, _boss_title())
	hud.set_boss_health(boss.health, boss.max_health)


func _boss_title() -> String:
	var names := ["SIEGE GOLEM", "STONE BREAKER", "THE WRECKER", "RUINMAW",
		"COLOSSUS", "BASALT TYRANT", "THE LANDSLIDE", "OBSIDIAN WARDEN",
		"THE MOUNTAIN", "WORLDBREAKER"]
	return names[mini(round_no - 1, names.size() - 1)]


func _fort_centre() -> Vector3:
	if world.placed.is_empty():
		return Vector3(VoxelWorld.SX * 0.5, 0, VoxelWorld.SZ * 0.5)
	var sum := Vector3.ZERO
	for i in world.placed.keys():
		sum += Vector3(world.decode_index(i))
	return sum / float(world.placed.size())


# --------------------------------------------------------------- loop -----

func _process(delta: float) -> void:
	if player.frozen and world.pending_rebuilds() == 0:
		# Re-seat on the finished terrain, then hand control over.
		var gx := clampi(floori(player.global_position.x), 0, VoxelWorld.SX - 1)
		var gz := clampi(floori(player.global_position.z), 0, VoxelWorld.SZ - 1)
		player.global_position.y = float(world.surface_y(gx, gz)) + 0.2
		player.velocity = Vector3.ZERO
		player.frozen = false

	_phase_t += delta
	match phase:
		Phase.BUILD:
			timer -= delta
			hud.set_timer(timer)
			if timer <= 0.0:
				if world.placed_total >= MIN_BLOCKS_TO_START:
					_finish_building()
				else:
					timer = 20.0
					hud.toast("Not enough built — 20 more seconds.")
		Phase.PREP:
			timer -= delta
			hud.set_timer(timer)
			if timer <= 0.0:
				_set_phase(Phase.SIEGE)
				hud.banner("SIEGE", "Break it before it breaks you.", 1.6)
		Phase.SIEGE:
			hud.set_timer(0.0, false)
			_siege_tick(delta)
		Phase.ROUND_WON:
			hud.set_timer(0.0, false)
			if _phase_t > 4.5:
				round_no += 1
				if round_no > FINAL_ROUND:
					_end_game(true)
				else:
					_start_round()
		_:
			pass


func _siege_tick(delta: float) -> void:
	if not is_instance_valid(boss):
		return
	_tick_turrets(delta)
	_tick_tnt(delta)

	if world.structure_integrity() < INTEGRITY_LOSS:
		_end_game(false, "The golem levelled your fort.")


func _tick_turrets(delta: float) -> void:
	if world.turret_blocks.is_empty() or not is_instance_valid(boss):
		return
	var target := boss.global_position + Vector3(0, 4.0 * boss.bscale, 0)
	for i in world.turret_blocks.keys():
		var cool: float = float(_turret_cool.get(i, 0.0)) - delta
		if cool > 0.0:
			_turret_cool[i] = cool
			continue
		var p := Vector3(world.decode_index(i)) + Vector3(0.5, 0.5, 0.5)
		var to := target - p
		if to.length() > 30.0:
			_turret_cool[i] = 0.2
			continue
		_turret_cool[i] = 1.1
		var proj := ProjectileScript.new()
		proj.setup(7.0, Color(0.4, 0.95, 1.0), 62.0, true, 0.14)
		proj.world = world
		add_child(proj)
		# Nudge the spawn clear of the turret block so it does not shoot itself.
		proj.global_position = p + to.normalized() * 0.75
		proj.direction = to.normalized()


func _tick_tnt(delta: float) -> void:
	_tnt_check_t -= delta
	if _tnt_check_t > 0.0 or world.tnt_blocks.is_empty() or not is_instance_valid(boss):
		return
	_tnt_check_t = 0.12

	var bpos := boss.global_position + Vector3(0, 2.0 * boss.bscale, 0)
	var to_blow := []
	for i in world.tnt_blocks.keys():
		var p := Vector3(world.decode_index(i)) + Vector3(0.5, 0.5, 0.5)
		if p.distance_to(bpos) < 4.0 + boss.bscale:
			to_blow.append(p)
	for p in to_blow:
		_detonate(p, true)


func _detonate(centre: Vector3, chain: bool) -> void:
	var b := Vector3i(floori(centre.x), floori(centre.y), floori(centre.z))
	if world.get_blockv(b) != Blocks.TNT:
		return
	world.set_block(b.x, b.y, b.z, Blocks.AIR)

	var broken := world.damage_sphere(centre, 4.4, 26.0)
	on_blast(centre, broken)
	debris.emit_burst(centre, Color(1.0, 0.72, 0.25), 40, 11.0, 0.22)
	_shake(0.55)

	if is_instance_valid(boss):
		var d := boss.global_position.distance_to(centre)
		if d < 7.5:
			var falloff: float = clampf(1.0 - d / 7.5, 0.2, 1.0)
			boss.apply_damage(80.0 * falloff, centre, false)
	if player.alive:
		var pd := player.global_position.distance_to(centre)
		if pd < 6.5:
			player.take_damage(26.0 * clampf(1.0 - pd / 6.5, 0.0, 1.0))
			player.knockback(player.global_position - centre, 10.0)

	if chain:
		# Neighbouring charges cook off a beat later.
		var nearby := []
		for i in world.tnt_blocks.keys():
			var p := Vector3(world.decode_index(i)) + Vector3(0.5, 0.5, 0.5)
			if p.distance_to(centre) < 5.5:
				nearby.append(p)
		for p in nearby:
			var t := get_tree().create_timer(0.12 + randf() * 0.12)
			t.timeout.connect(func() -> void: _detonate(p, true))


# --------------------------------------------------------- callbacks ------

func try_spend(amount: int) -> bool:
	if credits < amount:
		return false
	credits -= amount
	total_blocks_placed += 1
	hud.set_credits(credits)
	return true


func refund(amount: int) -> void:
	credits += amount
	hud.set_credits(credits)


func spawn_break_particles(pos: Vector3, id: int, count: int) -> void:
	debris.emit_burst(pos, Blocks.color_of(id), count, 4.0)


func spawn_spark_burst(pos: Vector3, colour: Color, count: int) -> void:
	debris.emit_burst(pos, colour, count, 6.0, 0.09)


func on_blast(centre: Vector3, broken: Array) -> void:
	var n: int = mini(broken.size(), 26)
	for i in n:
		var b: Dictionary = broken[i]
		debris.emit_burst(Vector3(b["pos"]) + Vector3(0.5, 0.5, 0.5), Blocks.color_of(int(b["id"])), 3, 6.5)
	if broken.size() > 0:
		_shake(minf(0.12 + float(broken.size()) * 0.01, 0.5))
	elif centre != Vector3.ZERO:
		debris.emit_burst(centre, Color(0.6, 0.6, 0.6), 4, 4.0)


func on_boss_hit(pos: Vector3, _amount: float, is_core: bool) -> void:
	debris.emit_burst(pos, Color(1.0, 0.8, 0.3) if is_core else Color(0.55, 0.5, 0.5), 6 if is_core else 3, 5.0, 0.1)


func _on_boss_smashed(pos: Vector3) -> void:
	debris.emit_burst(pos, Color(0.55, 0.5, 0.48), 14, 7.0, 0.2)
	_shake(0.32)


func _on_boss_died() -> void:
	if phase != Phase.SIEGE:
		return
	_set_phase(Phase.ROUND_WON)
	hud.show_boss(false)
	var bonus: int = 60 + 20 * round_no
	credits += bonus
	hud.set_credits(credits)
	if round_no >= FINAL_ROUND:
		hud.banner("WORLDBREAKER DOWN", "You outlasted every wave.", 4.0)
	else:
		hud.banner("ROUND %d CLEARED" % round_no, "Salvage bonus: %d credits" % bonus, 4.0)


func _on_player_health(cur: float, maxv: float) -> void:
	hud.set_health(cur, maxv)
	hud.flash_damage()


func _on_player_died() -> void:
	if phase == Phase.GAME_OVER:
		return
	_end_game(false, "The golem got to you.")


func _on_structure_changed() -> void:
	hud.set_integrity(world.structure_integrity(), world.placed_remaining())


func _on_block_broken(pos: Vector3i, id: int, by_boss: bool) -> void:
	if by_boss:
		return
	debris.emit_burst(Vector3(pos) + Vector3(0.5, 0.5, 0.5), Blocks.color_of(id), 4, 4.0)


func _end_game(won: bool, reason: String = "") -> void:
	if phase == Phase.GAME_OVER:
		return
	_set_phase(Phase.GAME_OVER)
	hud.show_boss(false)
	if reason != "":
		hud.toast(reason)
	hud.show_end(won, round_no - (0 if won else 1), total_blocks_placed)


func _shake(amount: float) -> void:
	if player == null or player.camera == null:
		return
	var cam := player.camera
	var tw := create_tween()
	var base := Vector3(0, 1.62, 0)
	for i in 4:
		var off := Vector3(randf() - 0.5, randf() - 0.5, 0) * amount * (1.0 - float(i) / 4.0)
		tw.tween_property(cam, "position", base + off, 0.045)
	tw.tween_property(cam, "position", base, 0.06)


# ------------------------------------------------------------- input ------

# Safety net for tablets: if a real finger lands and we are still in desktop
# mode, switch over. There is no keyboard to press F9 on an iPad, so we cannot
# rely on touchscreen detection alone getting it right. This lives in _input
# rather than _unhandled_input so that a Control under the finger cannot
# swallow the event before we see it.
func _input(event: InputEvent) -> void:
	if _touch_mode or _headless:
		return
	if event is InputEventScreenTouch or event is InputEventScreenDrag:
		_set_touch_mode(true)
		hud.toast("Touch controls enabled.")


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("toggle_touch"):
		_set_touch_mode(not _touch_mode)
		hud.toast("Touch controls %s" % ("on" if _touch_mode else "off"))
		get_viewport().set_input_as_handled()
		return

	if event.is_action_pressed("toggle_help"):
		hud.toggle_help()
		get_viewport().set_input_as_handled()
		return

	if event.is_action_pressed("pause_toggle"):
		if not _headless:
			if Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
				Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
			elif phase != Phase.GAME_OVER:
				Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
		return

	if phase == Phase.GAME_OVER:
		if event.is_action_pressed("confirm"):
			start_game()
		return

	if event is InputEventMouseButton and event.pressed and not _headless and not _touch_mode:
		if Input.get_mouse_mode() != Input.MOUSE_MODE_CAPTURED and not hud.help_visible():
			Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

	if phase == Phase.BUILD and event.is_action_pressed("ready_up"):
		_finish_building()


func _physics_process(_delta: float) -> void:
	if hud == null or player == null:
		return
	hud.set_selected(player.selected_slot)
	hud.set_click_prompt(
		not _touch_mode and not _headless
		and phase != Phase.GAME_OVER and phase != Phase.LOADING
		and Input.get_mouse_mode() != Input.MOUSE_MODE_CAPTURED
		and not hud.help_visible())
	if _touch_mode and touch.active:
		# Only push context to the overlay when something it draws changed.
		var sig := [phase == Phase.SIEGE, player.can_fly, player.flying, phase == Phase.BUILD]
		if sig != _touch_sig:
			_touch_sig = sig
			touch.set_context(sig[0], sig[1], sig[2], sig[3])


# --------------------------------------------------------------- soak -----

# Plays a whole round for real -- build, boss spawn, siege, traps, kill, next
# round -- so anything that only blows up mid-fight has somewhere to surface.
# Run with --headless --soak (or with a window to soak the GL renderer).
func _run_soak() -> void:
	print("=== SOAK ===")
	await get_tree().process_frame
	var base := world.surface_y(32, 32)
	_demo_fort(base)
	print("fort built: ", world.placed_total, " blocks, ",
		world.tnt_blocks.size(), " tnt, ", world.turret_blocks.size(), " turrets, ",
		world.spike_blocks.size(), " spikes")

	_finish_building()
	print("phase after finish: ", phase, "  boss valid: ", is_instance_valid(boss))

	var frames := 0
	var last_report := 0
	while frames < 5400:                       # 90 s at 60 Hz
		await get_tree().physics_frame
		frames += 1
		if phase == Phase.GAME_OVER:
			print("game over at frame ", frames)
			break
		if phase == Phase.ROUND_WON and frames - last_report > 60:
			print("round won at frame ", frames)
			break
		if frames - last_report >= 900:
			last_report = frames
			var hp := boss.health if is_instance_valid(boss) else -1.0
			print("  t=%ds  phase=%d  bossHP=%.0f  integrity=%.2f  playerHP=%.0f  projectiles=%d"
				% [frames / 60, phase, hp, world.structure_integrity(),
					player.health, _count_projectiles()])

	# Push through the round transition, which rebuilds the whole world.
	var extra := 0
	while extra < 600 and phase != Phase.BUILD and phase != Phase.GAME_OVER:
		await get_tree().physics_frame
		extra += 1
	print("after transition: phase=", phase, " round=", round_no)

	print("=== SOAK OK ===")
	get_tree().quit(0)


func _count_projectiles() -> int:
	var n := 0
	for c in get_children():
		if c is Area3D:
			n += 1
	return n


# --------------------------------------------------------- screenshots ----

# Dev aid: builds a demo fort, poses the camera and writes PNGs so the render
# can be inspected without playing. Run with --shot (needs a real window).
func _run_screenshots() -> void:
	await get_tree().process_frame
	DirAccess.make_dir_recursive_absolute("res://_shots")

	var base := world.surface_y(32, 32)
	_demo_fort(base)
	await get_tree().create_timer(0.6).timeout

	player.can_fly = true
	player.flying = true
	player.global_position = Vector3(32.5, base + 8.0, 50.0)
	player.rotation.y = 0.0
	player.camera.rotation.x = -0.28
	await _capture("01_fort")

	player.global_position = Vector3(32.5, base + 2.2, 43.0)
	player.camera.rotation.x = -0.05
	await _capture("02_ground")

	_finish_building()
	await get_tree().create_timer(2.4).timeout      # let the spawn rise finish
	boss.global_position = Vector3(32.5, base, 45.0)
	boss.state = Boss.State.CHASE
	boss._root.position.y = 0.0
	boss.rotation.y = PI
	player.global_position = Vector3(32.5, base + 2.6, 55.0)
	player.camera.rotation.x = 0.06
	await get_tree().create_timer(0.2).timeout
	await _capture("03_boss")

	await get_tree().create_timer(2.5).timeout
	await _capture("04_siege")

	if _touch_mode:
		await _capture("05_touch")
	else:
		_set_touch_mode(true)
		await get_tree().create_timer(0.4).timeout
		await _capture("05_touch")

	print("screenshots written to res://_shots")
	get_tree().quit(0)


func _demo_fort(base: int) -> void:
	# A ring wall with corner towers, a turret, spikes and a TNT charge.
	for i in range(-6, 7):
		for h in 4:
			world.set_block(32 + i, base + h, 26, Blocks.STONE, true)
			world.set_block(32 + i, base + h, 38, Blocks.BRICK, true)
			world.set_block(26, base + h, 32 + i, Blocks.STONE, true)
			world.set_block(38, base + h, 32 + i, Blocks.METAL, true)
	for c in [Vector2i(26, 26), Vector2i(38, 26), Vector2i(26, 38), Vector2i(38, 38)]:
		for h in 7:
			world.set_block(c.x, base + h, c.y, Blocks.LOG, true)
	for i in range(-2, 3):
		world.set_block(32 + i, base + 4, 26, Blocks.GLASS, true)
	world.set_block(32, base + 5, 26, Blocks.TURRET, true)
	world.set_block(30, base + 5, 26, Blocks.TURRET, true)
	for i in range(-4, 5):
		world.set_block(32 + i, base, 23, Blocks.SPIKE, true)
	world.set_block(33, base, 24, Blocks.TNT, true)
	_on_structure_changed()


func _capture(tag: String) -> void:
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	img.save_png("res://_shots/%s.png" % tag)


# ---------------------------------------------------------- self test -----

# Headless smoke test: exercises world gen, meshing, building, the boss and
# the win path without a display. Run with --headless --selftest.
func _run_selftest() -> void:
	print("=== SELFTEST ===")
	world.generate(BASE_SEED)
	print("generated: surface at centre y=", world.surface_y(32, 32))
	assert(world.surface_y(32, 32) > 0, "terrain failed to generate")

	var base := world.surface_y(32, 32)
	var n := 0
	for dz in 5:
		for dx in 5:
			for dy in 4:
				world.set_block(30 + dx, base + dy, 30 + dz, Blocks.STONE, true)
				n += 1
	# Deliberately outside the stone block so each is a distinct placement.
	world.set_block(33, base, 36, Blocks.TNT, true)
	world.set_block(30, base + 4, 30, Blocks.TURRET, true)
	world.set_block(31, base, 35, Blocks.SPIKE, true)
	print("placed ", n + 3, " blocks; placed_total=", world.placed_total)
	assert(world.placed_total == n + 3, "placed accounting is wrong")
	assert(world.tnt_blocks.size() == 1 and world.turret_blocks.size() == 1
		and world.spike_blocks.size() == 1, "trap registries out of sync")

	# Force the mesher to run so any meshing error surfaces here.
	for i in range(VoxelWorld.CX * VoxelWorld.CZ):
		world._rebuild_chunk(i)
	var tri_count := 0
	for i in range(VoxelWorld.CX * VoxelWorld.CZ):
		var m: Mesh = world.get_child(i * 2).mesh
		if m != null:
			for s in m.get_surface_count():
				tri_count += m.surface_get_array_len(s)
	print("mesh vertices across chunks: ", tri_count)
	assert(tri_count > 1000, "chunk meshing produced almost nothing")

	var hit := world.raycast(Vector3(32.5, base + 8, 32.5), Vector3.DOWN, 30.0)
	print("downward raycast hit: ", hit.get("block", "MISS"), " id=", hit.get("id", -1))
	assert(not hit.is_empty(), "voxel raycast missed solid ground")

	world.damage_sphere(Vector3(32.5, base + 1.5, 32.5), 3.0, 100.0)
	print("after blast: remaining=", world.placed_remaining(), " integrity=", world.structure_integrity())
	assert(world.structure_integrity() < 1.0, "damage_sphere did not register losses")

	# The axe: one swing straight down should remove the block underfoot.
	var ax := 44
	var az := 44
	var ay := world.surface_y(ax, az)
	world.set_block(ax, ay, az, Blocks.STONE, true)
	player.can_build = true
	player.can_fight = false
	player.spawn_at(Vector3(ax + 0.5, ay + 3.0, az + 0.5))
	player.rotation.y = 0.0
	player.camera.rotation.x = -PI * 0.5 + 0.02
	player.force_update_transform()
	player.camera.force_update_transform()
	player.swing()
	for i in 40:
		player._update_swing(1.0 / 60.0)
	print("axe mine test: block is now ", world.get_block(ax, ay, az), " (0 = air)")
	assert(world.get_block(ax, ay, az) == Blocks.AIR, "axe swing did not mine the block")

	# Walking must not depend on pointer lock. A browser refuses to grant it
	# until the player clicks, so gating movement on it froze the web build.
	player.can_build = false
	player.camera.rotation.x = 0.0
	player.spawn_at(Vector3(ax + 0.5, float(world.surface_y(ax, az)) + 0.2, az + 0.5))
	player.rotation.y = 0.0
	player.velocity = Vector3.ZERO
	var start := player.global_position
	print("mouse mode during test: ", Input.get_mouse_mode(), " (0 = visible, not captured)")
	assert(Input.get_mouse_mode() != Input.MOUSE_MODE_CAPTURED, "test needs an uncaptured mouse")
	# Driven by real physics frames: move_and_slide() only integrates inside a
	# physics step, so calling _physics_process by hand proves nothing here.
	Input.action_press("move_forward")
	for i in 50:
		await get_tree().physics_frame
	Input.action_release("move_forward")
	var walked := Vector2(player.global_position.x - start.x, player.global_position.z - start.z).length()
	print("walked without pointer lock: ", snappedf(walked, 0.01), " m")
	assert(walked > 0.5, "keyboard movement is gated on mouse capture")
	player.can_build = true

	round_no = 3
	_spawn_boss()
	print("boss hp=", boss.health, " scale=", boss.bscale, " hurl=", boss.can_hurl)
	boss.state = Boss.State.CHASE
	for i in 30:
		boss._physics_process(1.0 / 60.0)
	print("boss walked to ", boss.global_position.round())

	# The boss must smash walls, not ratchet itself up them one block a frame.
	var flat := world.surface_y(20, 20)
	boss.global_position = Vector3(20.5, flat, 20.5)
	boss.state = Boss.State.CHASE
	for wy in 6:
		for wz in range(18, 24):
			world.set_block(23, flat + wy, wz, Blocks.METAL, true)
	var y_before := boss.global_position.y
	for i in 120:
		boss._apply_gravity_and_ground(1.0 / 60.0)
	var climbed: float = boss.global_position.y - y_before
	print("wall-climb test: boss rose ", climbed, " m against a 6m wall")
	assert(climbed < 1.8, "boss climbed the wall instead of being stopped by it")

	# A one-block step is still walkable.
	world.set_block(21, flat, 20, Blocks.STONE, true)
	boss.global_position = Vector3(20.5, flat, 20.5)
	for i in 60:
		boss._apply_gravity_and_ground(1.0 / 60.0)
	print("step-up test: boss at y=", boss.global_position.y, " (ground was ", flat, ")")
	assert(boss.global_position.y > float(flat), "boss failed to step up a single block")
	boss.apply_damage(boss.max_health, boss.global_position, true)
	print("boss dead=", boss.state == Boss.State.DYING)
	assert(boss.state == Boss.State.DYING, "boss did not die at zero health")

	print("=== SELFTEST OK ===")
	get_tree().quit(0)
