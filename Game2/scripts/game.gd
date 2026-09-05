# Level director: owns the world, the player, the stars, the creatures and the
# boss, and runs the phase machine.
#
#   EXPLORE -> (every star found) -> UNLOCKED -> (enter arena) -> BOSS
#   BOSS -> beaten: next level  |  out of stars: retry the level
extends Node3D

enum Phase { LOADING, EXPLORE, UNLOCKED, BOSS, LEVEL_WON, LEVEL_LOST, VICTORY }

const FINAL_LEVEL := 5
const BASE_SEED := 20260829

const SURFACE_STARS := 2
const CAVE_STARS := 3
const STAR_ROCKS := 3
const CREATURES_BASE := 4
const CREATURE_RESPAWN := 22.0

const PlayerScript = preload("res://scripts/player.gd")
const BossScript = preload("res://scripts/boss.gd")
const CreatureScript = preload("res://scripts/creature.gd")
const StarScript = preload("res://scripts/star.gd")
const TouchScript = preload("res://scripts/touch_controls.gd")

var world: VoxelWorld
var player: Player
var boss: Boss
var hud: HUD
var debris: Debris
var touch: TouchControls

var phase: int = Phase.LOADING
var level := 1
var stars_required := 0
var stars_found := 0
var lives := 0
var _creatures: Array[Creature] = []
var _respawn_queue: Array[float] = []
var _beam: MeshInstance3D
var _touch_mode := false
var _headless := false
var _phase_t := 0.0
var _rng := RandomNumberGenerator.new()


func _ready() -> void:
	add_to_group("game")
	_headless = DisplayServer.get_name() == "headless"
	# Lets a desktop run exercise the mobile path: --lightweight
	if "--lightweight" in OS.get_cmdline_args() or "--lightweight" in OS.get_cmdline_user_args():
		Quality.force(true)
	_register_input()
	_build_environment()

	world = VoxelWorld.new()
	world.name = "World"
	add_child(world)
	if not _headless and Quality.lightweight():
		# Spread meshing over frames so a tablet never freezes on a level start.
		world.rebuild_budget = 1
		world.initial_budget = 6
	world.block_broken.connect(_on_block_broken)

	debris = Debris.new()
	add_child(debris)

	player = PlayerScript.new()
	player.name = "Player"
	player.world = world
	player.game = self
	player.debris = debris
	add_child(player)
	player.hit_taken.connect(_on_player_hit)
	player.blocked.connect(func(msg: String) -> void: hud.toast(msg))
	player.recalled.connect(func() -> void: hud.toast("Recalled to the surface"))

	hud = HUD.new()
	add_child(hud)
	hud.retry_pressed.connect(_on_retry)
	hud.next_pressed.connect(_on_next)
	hud.quit_pressed.connect(func() -> void: get_tree().quit())

	touch = TouchScript.new()
	add_child(touch)
	touch.action_pressed.connect(_on_touch_action)
	touch.world_tap.connect(func() -> void: player.queue_zap())
	player.touch = touch

	_build_beam()

	if not _headless and not _touch_mode:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	if DisplayServer.is_touchscreen_available():
		_set_touch_mode(true)

	start_level(1)

	if "--shot" in OS.get_cmdline_args() or "--shot" in OS.get_cmdline_user_args():
		_run_screenshots()
	elif "--soak" in OS.get_cmdline_args() or "--soak" in OS.get_cmdline_user_args():
		_run_soak()


# Plays the level for real -- world gen, stars, creatures, the seal, the arena
# and the boss -- so anything that only breaks in motion has somewhere to
# surface. Run with --headless --soak, or with a window to soak the renderer.
func _run_soak() -> void:
	print("=== SOAK (lightweight=%s) ===" % Quality.lightweight())
	await get_tree().process_frame
	print("level %d: %d stars required, %d creatures" % [level, stars_required, _creatures.size()])
	print("player frozen at start: ", player.frozen)

	var frames := 0
	var released := -1
	while frames < 3600:                       # 60 s at 60 Hz
		await get_tree().physics_frame
		frames += 1
		if released < 0 and not player.frozen:
			released = frames
			print("player released on frame ", released, " at y=", snappedf(player.global_position.y, 0.01))
		if frames % 900 == 0:
			print("  t=%ds  phase=%d  stars=%d/%d  lives=%d  y=%.1f  actors=%d"
				% [frames / 60, phase, stars_found, stars_required, lives,
					player.global_position.y, get_child_count()])

	# Force the boss fight, which is where the light count peaks.
	print("forcing the arena...")
	stars_found = stars_required
	lives = 3                                  # or the arena bounces us out
	phase = Phase.UNLOCKED
	player.teleport(world.arena_centre() + Vector3(0, 2.0, 0))
	var extra := 0
	while extra < 1800 and phase != Phase.LEVEL_WON and phase != Phase.LEVEL_LOST:
		await get_tree().physics_frame
		extra += 1
	print("after arena: phase=", phase, "  bossHP=",
		(boss.health if is_instance_valid(boss) else -1.0))
	print("=== SOAK OK ===")
	get_tree().quit(0)


# ----------------------------------------------------------------- setup ---

func _register_input() -> void:
	var binds := {
		"move_forward": [KEY_W, KEY_UP],
		"move_back": [KEY_S, KEY_DOWN],
		"move_left": [KEY_A, KEY_LEFT],
		"move_right": [KEY_D, KEY_RIGHT],
		# Minecraft layout: Ctrl sprints, Shift sneaks. Dig/zap are already on
		# left/right mouse, which matches mine/use.
		"jump": [KEY_SPACE],
		"sprint": [KEY_CTRL],
		"sneak": [KEY_SHIFT],
		"recall": [KEY_R],
		"descend": [KEY_F],
		"help": [KEY_H, KEY_TAB],
		"touch_toggle": [KEY_T, KEY_F9],
	}
	for action in binds.keys():
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for key in binds[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)

	for pair in [["dig", MOUSE_BUTTON_LEFT], ["zap", MOUSE_BUTTON_RIGHT]]:
		var action: String = pair[0]
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		var mb := InputEventMouseButton.new()
		mb.button_index = pair[1]
		InputMap.action_add_event(action, mb)


func _build_environment() -> void:
	var env := Environment.new()
	var sky := Sky.new()
	var mat := ProceduralSkyMaterial.new()
	mat.sky_top_color = Color(0.26, 0.4, 0.68)
	mat.sky_horizon_color = Color(0.66, 0.72, 0.82)
	mat.ground_bottom_color = Color(0.12, 0.11, 0.14)
	mat.ground_horizon_color = Color(0.4, 0.38, 0.42)
	mat.sun_angle_max = 22.0
	sky.sky_material = mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	# Ambient is deliberately weak: caves have to be dark enough that the
	# headlamp and the glowing blocks are what you actually navigate by.
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.42, 0.48, 0.62)
	env.ambient_light_energy = 0.3
	env.fog_enabled = true
	env.fog_light_color = Color(0.14, 0.14, 0.2)
	env.fog_density = 0.009
	# Fog is there to give the caves depth. Left at the default it also paints
	# over the sky, which flattens the whole surface into a grey lid.
	env.fog_sky_affect = 0.0
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC

	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	var sun := DirectionalLight3D.new()
	sun.light_energy = 0.95
	sun.light_color = Color(1.0, 0.96, 0.88)
	sun.rotation_degrees = Vector3(-52, -128, 0)
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 70.0
	add_child(sun)

	# Mobile WebGL path: shorter shadows and no MSAA. The lights on stars,
	# creatures and bolts are dropped separately, in their own scripts.
	if not _headless and Quality.lightweight():
		sun.directional_shadow_max_distance = 34.0
		sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
		var vp := get_viewport()
		if vp != null:
			vp.msaa_3d = Viewport.MSAA_DISABLED


# A pillar of light over the boss cavern, shown once the seal breaks.
func _build_beam() -> void:
	_beam = MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 1.1
	cm.bottom_radius = 1.1
	cm.height = 60.0
	cm.radial_segments = 12
	_beam.mesh = cm
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.85, 0.6, 1.0, 0.34)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	_beam.set_surface_override_material(0, mat)
	_beam.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_beam.visible = false
	add_child(_beam)


# ------------------------------------------------------------ level flow ---

func start_level(n: int) -> void:
	level = n
	phase = Phase.LOADING
	_phase_t = 0.0
	_rng.seed = BASE_SEED + n * 7919

	_clear_actors()
	hud.hide_end()
	hud.hide_boss()
	hud.set_dig(0.0)
	world.generate(BASE_SEED + n * 7919, n)

	stars_found = 0
	lives = 3
	stars_required = SURFACE_STARS + CAVE_STARS + STAR_ROCKS + _creature_count()

	_place_star_rocks()
	_spawn_stars()
	_spawn_creatures()

	var spawn := _surface_spawn()
	player.global_position = spawn
	player.velocity = Vector3.ZERO
	player.can_recall = true
	player.alive = true
	player.frozen = true          # released once the chunks have collision

	_beam.visible = false
	_beam.global_position = world.arena_centre() + Vector3(0, 30.0, 0)

	hud.set_level(level, _boss_name_for(level))
	hud.set_progress(stars_found, stars_required)
	hud.set_lives(lives)
	hud.banner("LEVEL %d" % level, "Find every golden star, then break the seal")
	hud.set_hint("Dig down. Star Rock glows gold. Zap creatures for stars.")
	phase = Phase.EXPLORE


func _creature_count() -> int:
	return CREATURES_BASE + level


func _boss_name_for(n: int) -> String:
	return str(Boss.PROFILE[clampi(n - 1, 0, Boss.PROFILE.size() - 1)]["name"])


func _surface_spawn() -> Vector3:
	var x := VoxelWorld.SX / 2
	var z := VoxelWorld.SZ / 2
	return Vector3(float(x) + 0.5, float(world.surface_y(x, z)) + 0.4, float(z) + 0.5)


func _clear_actors() -> void:
	for c in _creatures:
		if is_instance_valid(c):
			c.queue_free()
	_creatures.clear()
	_respawn_queue.clear()
	if boss != null and is_instance_valid(boss):
		boss.queue_free()
	boss = null
	for s in get_tree().get_nodes_in_group("stars"):
		s.queue_free()
	for p in get_tree().get_nodes_in_group("bolts"):
		p.queue_free()


# Star Rock is buried inside solid stone, so the only way to it is to dig.
func _place_star_rocks() -> void:
	var placed := 0
	var attempts := 0
	while placed < STAR_ROCKS and attempts < 4000:
		attempts += 1
		var x := _rng.randi_range(5, VoxelWorld.SX - 6)
		var z := _rng.randi_range(5, VoxelWorld.SZ - 6)
		var y := _rng.randi_range(VoxelWorld.ARENA_TOP + 4, 40)
		var id := world.get_block(x, y, z)
		if id != Blocks.STONE and id != Blocks.DEEPSTONE:
			continue
		# Prefer a spot with at least one exposed face, so it can be spotted
		# from a tunnel rather than needing blind luck.
		var exposed := false
		for d in [Vector3i(1, 0, 0), Vector3i(-1, 0, 0), Vector3i(0, 1, 0),
				Vector3i(0, -1, 0), Vector3i(0, 0, 1), Vector3i(0, 0, -1)]:
			if world.get_block(x + d.x, y + d.y, z + d.z) == Blocks.AIR:
				exposed = true
				break
		if not exposed and attempts < 3000:
			continue
		world.set_block(x, y, z, Blocks.STARROCK)
		placed += 1


func _spawn_stars() -> void:
	var used := {}
	for i in SURFACE_STARS:
		var p = _take_spot(world.surface_spots, used, 6)
		if p != null:
			_make_star(Vector3(p) + Vector3(0.5, 0.9, 0.5), false)
	for i in CAVE_STARS:
		var p2 = _take_spot(world.cave_spots, used, 8)
		if p2 != null:
			_make_star(Vector3(p2) + Vector3(0.5, 0.7, 0.5), false)


# Pops a spot at least min_gap away from everything already taken.
func _take_spot(pool: Array[Vector3i], used: Dictionary, min_gap: int):
	for i in pool.size():
		var p: Vector3i = pool[i]
		var ok := true
		for k in used.keys():
			var other: Vector3i = k
			if Vector3(p - other).length() < float(min_gap):
				ok = false
				break
		if ok:
			used[p] = true
			pool.remove_at(i)
			return p
	if pool.is_empty():
		return null
	var q: Vector3i = pool[0]
	pool.remove_at(0)
	used[q] = true
	return q


func _make_star(pos: Vector3, from_creature: bool) -> Star:
	var s := Star.new()
	s.from_creature = from_creature
	s.world = world
	s.player = player
	s.position = pos
	s.add_to_group("stars")
	add_child(s)
	s.collected.connect(_on_star_collected)
	return s


func _spawn_creatures() -> void:
	var used := {}
	var n := _creature_count()
	for i in n:
		var surface := i < 2
		var pool: Array[Vector3i] = world.surface_spots if surface else world.cave_spots
		var p = _take_spot(pool, used, 5)
		if p == null:
			continue
		_make_creature(Vector3(p) + Vector3(0.5, 0.1, 0.5))


func _make_creature(pos: Vector3) -> void:
	var c := Creature.new()
	var kind := Creature.Kind.CRAWLER
	var roll := _rng.randf()
	if level >= 3 and roll > 0.72:
		kind = Creature.Kind.SPITTER
	elif level >= 2 and roll > 0.45:
		kind = Creature.Kind.FLOATER
	c.configure(kind, level)
	c.world = world
	c.player = player
	c.debris = debris
	c.position = pos
	add_child(c)
	c.died.connect(_on_creature_died)
	_creatures.append(c)


# ---------------------------------------------------------------- events ---

func _on_block_broken(pos: Vector3i, id: int, by_player: bool) -> void:
	if id == Blocks.STARROCK:
		var s := _make_star(Vector3(pos) + Vector3(0.5, 0.5, 0.5), true)
		s.toss(Vector3(randf() - 0.5, 0, randf() - 0.5).normalized() * 0.4)
		debris.emit_burst(Vector3(pos) + Vector3(0.5, 0.5, 0.5), Color(1.0, 0.85, 0.35), 18, 5.0, 0.15)
		hud.toast("Star Rock cracked open!")
	elif not by_player:
		debris.emit_burst(Vector3(pos) + Vector3(0.5, 0.5, 0.5), Blocks.color_of(id), 4, 4.0, 0.16)


func _on_star_collected(s: Star) -> void:
	s.queue_free()
	lives += 1
	if stars_found < stars_required:
		stars_found += 1
	hud.set_lives(lives)
	hud.set_progress(stars_found, stars_required)
	debris.emit_burst(s.global_position, Color(1.0, 0.85, 0.35), 12, 4.0, 0.1)

	if phase == Phase.EXPLORE and stars_found >= stars_required:
		_unlock_seal()
	elif phase == Phase.EXPLORE:
		var left := stars_required - stars_found
		hud.toast("Star! %d to go" % left)


func _on_creature_died(pos: Vector3, by_player: bool) -> void:
	_creatures = _creatures.filter(func(c: Creature) -> bool: return is_instance_valid(c))
	if by_player:
		var s := _make_star(pos, true)
		s.toss(Vector3(randf() - 0.5, 0, randf() - 0.5).normalized())
	# Creatures come back, so stars (and therefore lives) are always farmable.
	_respawn_queue.append(CREATURE_RESPAWN)


func _on_player_hit() -> void:
	if phase == Phase.LEVEL_WON or phase == Phase.LEVEL_LOST or phase == Phase.VICTORY:
		return
	lives = maxi(0, lives - 1)
	hud.set_lives(lives)
	hud.flash_damage()
	if lives <= 0:
		if phase == Phase.BOSS:
			_lose_level()
		else:
			hud.toast("Last star lost! Zap a creature to get one back.")
			_bounce_to_surface()
	elif phase == Phase.BOSS:
		hud.toast("Star spent!  %d left" % lives)


func _bounce_to_surface() -> void:
	var x := clampi(floori(player.global_position.x), 3, VoxelWorld.SX - 4)
	var z := clampi(floori(player.global_position.z), 3, VoxelWorld.SZ - 4)
	player.teleport(Vector3(float(x) + 0.5, float(world.surface_y(x, z)) + 0.4, float(z) + 0.5))


func _unlock_seal() -> void:
	phase = Phase.UNLOCKED
	world.open_seal()
	_beam.visible = true
	hud.banner("THE SEAL IS BROKEN", "Dig down to the arena, or press DESCEND")
	hud.set_hint("Every star found. Head down - your stars are now your lives.")
	debris.emit_burst(world.arena_centre() + Vector3(0, 8, 0), Color(0.85, 0.6, 1.0), 40, 9.0, 0.3)


func _descend() -> void:
	if phase != Phase.UNLOCKED:
		hud.toast("The seal is still closed - find every star first")
		return
	if lives <= 0:
		hud.toast("You need at least one star to face the boss")
		return
	var c := world.arena_centre()
	player.teleport(c + Vector3(float(VoxelWorld.ARENA_R) - 3.0, 1.4, 0))
	_start_boss()


func _start_boss() -> void:
	if phase == Phase.BOSS:
		return
	phase = Phase.BOSS
	_phase_t = 0.0
	player.can_recall = false
	_beam.visible = false

	boss = BossScript.new()
	boss.configure(level)
	boss.world = world
	boss.player = player
	boss.debris = debris
	boss.position = world.arena_centre()
	add_child(boss)
	boss.health_changed.connect(hud.set_boss_health)
	boss.died.connect(_win_level)
	boss.telegraph.connect(hud.boss_telegraph)
	boss.wants_minions.connect(_spawn_minions)

	hud.show_boss(boss.boss_name)
	hud.set_boss_health(boss.health, boss.max_health)
	hud.banner(boss.boss_name, "Your stars are your lives - spend them wisely")
	hud.set_hint("ZAP the glowing core. Every hit you take costs a star.")


func _spawn_minions(count: int) -> void:
	var c := world.arena_centre()
	for i in count:
		var ang := randf() * TAU
		var r := float(VoxelWorld.ARENA_R) - 4.0
		_make_creature(c + Vector3(cos(ang) * r, 1.0, sin(ang) * r))


func _win_level() -> void:
	boss = null
	hud.hide_boss()
	if level >= FINAL_LEVEL:
		phase = Phase.VICTORY
		hud.show_end("ALL DEPTHS CLEARED",
			"You cracked every seal and beat all %d bosses with %d star%s to spare." %
				[FINAL_LEVEL, lives, "" if lives == 1 else "s"],
			"PLAY AGAIN", true)
	else:
		phase = Phase.LEVEL_WON
		hud.show_end("LEVEL %d CLEARED" % level,
			"%s is down. You finished with %d star%s. The next cavern is deeper and meaner." %
				[_boss_name_for(level), lives, "" if lives == 1 else "s"],
			"NEXT LEVEL", true)
	_release_mouse()


func _lose_level() -> void:
	phase = Phase.LEVEL_LOST
	hud.hide_boss()
	if boss != null and is_instance_valid(boss):
		boss.queue_free()
	boss = null
	hud.show_end("OUT OF STARS",
		"Every star was spent before the boss went down. Retry the level - the caves regenerate exactly the same, so you know where to dig.",
		"", false)
	_release_mouse()


func _on_retry() -> void:
	hud.hide_end()
	_capture_mouse()
	start_level(level)


func _on_next() -> void:
	hud.hide_end()
	_capture_mouse()
	if phase == Phase.VICTORY:
		start_level(1)
	else:
		start_level(mini(level + 1, FINAL_LEVEL))


# ----------------------------------------------------------------- input ---

func _on_touch_action(id: String) -> void:
	match id:
		"recall":
			player.recall()
		"descend":
			_descend()
		"help":
			hud.toggle_help()


func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch and not _touch_mode:
		_set_touch_mode(true)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("help"):
		hud.toggle_help()
	elif event.is_action_pressed("recall"):
		player.recall()
	elif event.is_action_pressed("descend"):
		_descend()
	elif event.is_action_pressed("touch_toggle"):
		_set_touch_mode(not _touch_mode)
	elif event.is_action_pressed("ui_cancel"):
		if hud.help_visible():
			hud.toggle_help()
		elif not _touch_mode:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	elif event is InputEventMouseButton and event.pressed:
		if not _touch_mode and not hud.end_visible() and not hud.help_visible():
			if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
				Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _set_touch_mode(on: bool) -> void:
	if _touch_mode == on:
		return
	_touch_mode = on
	touch.enable(on)
	hud.set_touch_layout(on)
	if on:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	elif not _headless:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _capture_mouse() -> void:
	if _touch_mode:
		touch.enable(true)
	elif not _headless:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _release_mouse() -> void:
	# The end panel has real buttons, so touch overlay input must stop eating
	# events, the pointer has to come back, and the player must stop digging
	# and shooting behind the panel.
	player.alive = false
	if _touch_mode:
		touch.enable(false)
	elif not _headless:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


# ------------------------------------------------------------------ tick ---

func _process(delta: float) -> void:
	if player.frozen and world.pending_rebuilds() == 0:
		# Re-seat on the finished terrain, then hand control over.
		player.global_position = _surface_spawn()
		player.velocity = Vector3.ZERO
		player.frozen = false

	_phase_t += delta
	hud.set_depth(player.depth_metres())
	hud.set_dig(world.dig_progress(player.target_block) if player.target_block != null else 0.0)

	if _touch_mode:
		touch.set_context(phase == Phase.UNLOCKED, player.recall_cool <= 0.0, player.can_recall)

	_tick_respawns(delta)

	if phase == Phase.UNLOCKED and _in_arena(player.global_position):
		if lives > 0:
			_start_boss()
		else:
			hud.toast("You need at least one star to face the boss")
			_bounce_to_surface()

	if _beam.visible:
		_beam.rotation.y += delta * 0.6


func _tick_respawns(delta: float) -> void:
	if _respawn_queue.is_empty():
		return
	for i in range(_respawn_queue.size() - 1, -1, -1):
		_respawn_queue[i] -= delta
		if _respawn_queue[i] > 0.0:
			continue
		_respawn_queue.remove_at(i)
		if phase == Phase.BOSS or world.cave_spots.is_empty():
			continue
		var p: Vector3i = world.cave_spots[_rng.randi_range(0, world.cave_spots.size() - 1)]
		# Never drop one on the player's head.
		if Vector3(p).distance_to(player.global_position) < 8.0:
			_respawn_queue.append(4.0)
			continue
		_make_creature(Vector3(p) + Vector3(0.5, 0.1, 0.5))


# --------------------------------------------------------- screenshots ----

# Dev aid: poses the camera at each beat of the loop and writes PNGs, so the
# render can be checked without playing. Run with --shot (needs a real window).
func _run_screenshots() -> void:
	await get_tree().process_frame
	DirAccess.make_dir_recursive_absolute("res://_shots")

	var sx := VoxelWorld.SX / 2
	var sz := VoxelWorld.SZ / 2
	var sy := world.surface_y(sx, sz)
	_make_star(Vector3(float(sx) + 0.5, float(sy) + 1.0, float(sz) + 0.5), false)
	await get_tree().create_timer(0.5).timeout

	player.global_position = Vector3(float(sx) + 0.5, float(sy) + 1.0, float(sz) + 9.0)
	player.rotation.y = 0.0
	player.camera.rotation.x = -0.14
	await _capture("01_surface")

	# A cave pocket, lit only by the headlamp and the glowing blocks.
	if not world.cave_spots.is_empty():
		var c: Vector3i = world.cave_spots[world.cave_spots.size() / 2]
		player.global_position = Vector3(c) + Vector3(0.5, 0.2, 0.5)
		player.camera.rotation.x = -0.05
		await get_tree().create_timer(1.1).timeout
		await _capture("02_underground")

	# A carved chamber with Star Rock in the wall, which is the buried-star beat.
	var rx := sx + 6
	var rz := sz + 6
	var ry := VoxelWorld.ARENA_TOP + 10
	for dy in range(-2, 4):
		for dz in range(-4, 3):
			for dx in range(-3, 4):
				world.set_block(rx + dx, ry + dy, rz + dz, Blocks.AIR)
	world.set_block(rx, ry, rz, Blocks.STARROCK)
	world.set_block(rx + 2, ry - 1, rz - 1, Blocks.CRYSTAL)
	player.global_position = Vector3(float(rx) + 0.5, float(ry) - 0.7, float(rz) + 4.5)
	player.camera.rotation.x = 0.02
	await get_tree().create_timer(1.1).timeout
	await _capture("03_star_rock")

	# Seal broken: the pillar of light over the boss cavern.
	stars_found = stars_required
	hud.set_progress(stars_found, stars_required)
	_unlock_seal()
	player.global_position = Vector3(float(sx) + 14.0, float(sy) + 2.0, float(sz) + 14.0)
	player.rotation.y = PI * 0.25
	player.camera.rotation.x = 0.06
	await get_tree().create_timer(0.6).timeout
	await _capture("04_seal_broken")

	# The boss fight.
	_descend()
	await get_tree().create_timer(2.2).timeout
	var c2 := world.arena_centre()
	# Threaded between two of the crystal pillars, looking back at the middle.
	player.global_position = c2 + Vector3(4.5, 1.4, 7.8)
	player.rotation.y = 0.524
	player.camera.rotation.x = 0.02
	boss.global_position = c2
	await get_tree().create_timer(0.4).timeout
	await _capture("05_boss")

	_set_touch_mode(true)
	await get_tree().create_timer(0.5).timeout
	await _capture("06_touch")

	print("screenshots written to res://_shots")
	get_tree().quit(0)


func _capture(tag: String) -> void:
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	img.save_png("res://_shots/%s.png" % tag)


func _in_arena(p: Vector3) -> bool:
	var c := world.arena_centre()
	if p.y > float(VoxelWorld.ARENA_TOP) or p.y < float(VoxelWorld.ARENA_FLOOR) - 1.0:
		return false
	return Vector2(p.x - c.x, p.z - c.z).length() < float(VoxelWorld.ARENA_R)
