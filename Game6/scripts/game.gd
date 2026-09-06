# Root node and state machine: loading, title, play, pause, shop, panels.
# Also owns the save file and the headless test hooks:
#   godot --headless --path Game6 -- --selftest
#   xvfb-run godot --path Game6 -- --shots /tmp/shots
extends Node

enum S { LOADING, TITLE, PLAY, PAUSE, PANEL, DEAD }

const SAVE_PATH := "user://hattrick.cfg"
const SHOP_ITEMS := [
	{"id": "moon", "label": "Power Moon", "price": 100},
	{"id": "cap:blue", "label": "Blue Cap", "price": 30},
	{"id": "cap:green", "label": "Green Cap", "price": 30},
	{"id": "cap:purple", "label": "Purple Cap", "price": 40},
	{"id": "cap:gold", "label": "Gold Cap", "price": 120},
	{"id": "cap:dino", "label": "Dino Cap", "price": 12, "purple": true},
	{"id": "cap:red", "label": "Red Cap", "price": 0},
	{"id": "shirt:yellow", "label": "Yellow Shirt", "price": 5, "purple": true},
	{"id": "shirt:cyan", "label": "Cyan Shirt", "price": 5, "purple": true},
	{"id": "shirt:white", "label": "White Shirt", "price": 5, "purple": true},
	{"id": "shirt:black", "label": "Black Shirt", "price": 8, "purple": true},
	{"id": "shirt:red", "label": "Red Shirt", "price": 0},
]

var state := S.LOADING
var sfx: Sfx
var hud: Hud
var touch: TouchControls
var level: Level
var player: Player
var cam: CameraRig
var hat: Hat
var touch_mode := false
var owned := {"cap:red": true, "shirt:red": true}
var cap_id := "red"
var shirt_id := "red"
var muted := false
var _celebrate := 0.0
var _dead_t := 0.0
var _title_yaw := 0.0
var _loading_label: Label
var _selftest := false
var _shots := ""
var _mouse_down := false
var _shop_open := false


func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	process_mode = Node.PROCESS_MODE_ALWAYS
	process_physics_priority = -10
	_setup_input()
	if "--lightweight" in args:
		Quality.force(true)
	touch_mode = DisplayServer.is_touchscreen_available() or OS.has_feature("web") or OS.has_feature("mobile")
	if "--desktop" in args:
		touch_mode = false
	if "--touch" in args:
		touch_mode = true
	_selftest = "--selftest" in args
	var si := args.find("--shots")
	if si >= 0 and si + 1 < args.size():
		_shots = args[si + 1]
	_apply_quality()
	sfx = Sfx.new()
	sfx.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(sfx)
	hud = Hud.new()
	hud.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(hud)
	hud.set_touch(touch_mode)
	hud.ui.connect(_on_ui)
	touch = TouchControls.new()
	touch.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(touch)
	touch.pause_pressed.connect(_toggle_pause)
	touch.cam_drag.connect(func(d: Vector2): if cam: cam.rotate_by(d.x * 0.006, d.y * 0.004))
	_show_loading(true)
	await get_tree().process_frame
	await get_tree().process_frame
	_build_world()
	if _selftest or _shots != "":
		var da := DirAccess.open("user://")
		if da and da.file_exists("hattrick.cfg"):
			da.remove("hattrick.cfg")
	_load()
	_show_loading(false)
	if _selftest:
		_run_selftest()
		return
	if _shots != "":
		_run_shots()
		return
	_enter_title()


func _setup_input() -> void:
	var defs := {
		"move_left": [KEY_A, KEY_LEFT], "move_right": [KEY_D, KEY_RIGHT],
		"move_up": [KEY_W, KEY_UP], "move_down": [KEY_S, KEY_DOWN],
		"jump": [KEY_SPACE, KEY_Z, KEY_K], "hat": [KEY_X, KEY_J, KEY_F], "pound": [KEY_C, KEY_SHIFT, KEY_L],
		"cam_left": [KEY_Q], "cam_right": [KEY_E], "pause": [KEY_ESCAPE, KEY_P], "confirm": [KEY_ENTER, KEY_SPACE],
	}
	for a in defs:
		if not InputMap.has_action(a):
			InputMap.add_action(a, 0.2)
		for k in defs[a]:
			var ev := InputEventKey.new()
			ev.physical_keycode = k
			InputMap.action_add_event(a, ev)
	var joy := {"jump": [JOY_BUTTON_A], "hat": [JOY_BUTTON_X, JOY_BUTTON_Y], "pound": [JOY_BUTTON_B, JOY_BUTTON_LEFT_SHOULDER, JOY_BUTTON_RIGHT_SHOULDER],
		"pause": [JOY_BUTTON_START], "confirm": [JOY_BUTTON_A, JOY_BUTTON_START]}
	for a in joy:
		for b in joy[a]:
			var ev := InputEventJoypadButton.new()
			ev.button_index = b
			InputMap.action_add_event(a, ev)
	var axes := {"move_left": [JOY_AXIS_LEFT_X, -1.0], "move_right": [JOY_AXIS_LEFT_X, 1.0], "move_up": [JOY_AXIS_LEFT_Y, -1.0], "move_down": [JOY_AXIS_LEFT_Y, 1.0]}
	for a in axes:
		var ev := InputEventJoypadMotion.new()
		ev.axis = axes[a][0]
		ev.axis_value = axes[a][1]
		InputMap.action_add_event(a, ev)


func _apply_quality() -> void:
	var vp := get_viewport()
	if Quality.lightweight():
		var win := DisplayServer.window_get_size()
		vp.scaling_3d_mode = Viewport.SCALING_3D_MODE_BILINEAR
		vp.scaling_3d_scale = 0.75 if win.x * win.y < 2600000 else 0.6
		vp.msaa_3d = Viewport.MSAA_DISABLED
	else:
		vp.msaa_3d = Viewport.MSAA_2X
	Engine.max_fps = 60 if Quality.lightweight() else 120


func _show_loading(on: bool) -> void:
	if on:
		var layer := CanvasLayer.new()
		layer.layer = 20
		layer.name = "LoadingLayer"
		add_child(layer)
		var bg := ColorRect.new()
		bg.set_anchors_preset(Control.PRESET_FULL_RECT)
		bg.color = Color(0.18, 0.45, 0.8)
		layer.add_child(bg)
		_loading_label = Label.new()
		_loading_label.text = "BUILDING DINO RIDGE..."
		var ls := LabelSettings.new()
		ls.font = ThemeDB.fallback_font
		ls.font_size = 34
		ls.outline_size = 6
		ls.outline_color = Color(0.02, 0.1, 0.3)
		_loading_label.label_settings = ls
		_loading_label.set_anchors_preset(Control.PRESET_CENTER)
		_loading_label.grow_horizontal = Control.GROW_DIRECTION_BOTH
		_loading_label.grow_vertical = Control.GROW_DIRECTION_BOTH
		layer.add_child(_loading_label)
	else:
		var l := get_node_or_null("LoadingLayer")
		if l:
			l.queue_free()


func _build_world() -> void:
	var t0 := Time.get_ticks_msec()
	player = Player.new()
	player.name = Player.HERO_NAME
	hat = Hat.new()
	hat.name = "Hat"
	player.hat = hat
	cam = CameraRig.new()
	cam.name = "Camera"
	level = Level.new()
	level.name = "Level"
	add_child(level)
	level.build(player, cam, hat)
	player.level = level
	player.cam = cam
	add_child(cam)
	cam.target = player
	cam.snap()
	level.coins_changed.connect(func(c, p): hud.set_counts(c, p))
	level.moon_got.connect(_on_moon)
	level.message.connect(func(t): hud.toast(t))
	level.shop_zone.connect(_on_shop_zone)
	level.balloon_touched.connect(_on_balloon)
	level.timer_changed.connect(func(t): hud.set_timer(t))
	level.boss_event.connect(_on_boss_event)
	level.checkpoint_set.connect(func(_i): _save())
	player.died.connect(_on_died)
	player.hearts_changed.connect(func(n): hud.set_hearts(n))
	player.captured_changed.connect(_on_captured)
	hud.set_moons(0, level.total_moons())
	print("world built in %d ms" % (Time.get_ticks_msec() - t0))


# ---------------------------------------------------------------- states --

func _enter_title() -> void:
	state = S.TITLE
	player.frozen = true
	hud.show_panel("title")
	touch.enable(false)
	_title_yaw = cam.yaw
	hud.set_moons(level.moon_count(), level.total_moons())
	hud.set_counts(level.coins, level.purple)


func _start_play() -> void:
	state = S.PLAY
	hud.hide_panel()
	player.frozen = false
	touch.enable(touch_mode)
	cam.manual_t = 0.0
	Sfx.music(true)
	if level.moon_count() == 0:
		hud.toast("Find Power Moons, %s! The balloon needs %d of them." % [Player.HERO_NAME, Level.NEEDED], 5.0)


func _toggle_pause() -> void:
	if state == S.PLAY:
		state = S.PAUSE
		get_tree().paused = true
		hud.show_panel("pause", {"muted": muted})
		touch.enable(false)
		Sfx.play("click")
	elif state == S.PAUSE:
		_resume()


func _resume() -> void:
	get_tree().paused = false
	hud.hide_panel()
	_shop_open = false
	state = S.PLAY
	player.frozen = false
	touch.enable(touch_mode)


func _on_ui(action: String, _arg: String) -> void:
	Sfx.play("click", -6.0)
	match action:
		"resume", "close":
			_resume()
		"moons":
			var list := []
			for id in Level.MOON_NAMES:
				list.append({"name": Level.MOON_NAMES[id] + ("  (x3)" if id in Level.MULTI else ""), "got": level.moons_got.has(id)})
			hud.show_panel("moons", {"count": level.moon_count(), "total": level.total_moons(), "list": list})
		"mute":
			muted = Sfx.toggle_mute()
			hud.show_panel("pause", {"muted": muted})
			_save()
		"reset":
			_reset_save()
		_:
			if action.begins_with("buy:"):
				_buy(action.substr(4))


func _on_shop_zone(inside: bool) -> void:
	if inside and state == S.PLAY:
		hud.prompt("HAT button: open the shop" if touch_mode else "X: open the shop")
	else:
		hud.prompt("")


func _open_shop() -> void:
	state = S.PANEL
	_shop_open = true
	player.frozen = true
	get_tree().paused = true
	touch.enable(false)
	hud.prompt("")
	_refresh_shop()


func _refresh_shop() -> void:
	var items := []
	for it in SHOP_ITEMS:
		var d: Dictionary = it.duplicate()
		d["owned"] = owned.has(d["id"]) or d["id"] == "moon" and false
		d["equipped"] = (d["id"] == "cap:" + cap_id) or (d["id"] == "shirt:" + shirt_id)
		items.append(d)
	hud.show_panel("shop", {"coins": level.coins, "purple": level.purple, "items": items})


func _buy(id: String) -> void:
	var item: Dictionary = {}
	for it in SHOP_ITEMS:
		if it["id"] == id:
			item = it
	if item.is_empty():
		return
	if id == "moon":
		if level.moons_got.has("shop"):
			hud.toast("You already bought that moon!")
			Sfx.play("deny")
		elif level.coins >= 100:
			level.coins -= 100
			hud.set_counts(level.coins, level.purple)
			_resume()
			level.award_moon("shop")
		else:
			hud.toast("You need 100 coins for a moon.")
			Sfx.play("deny")
		return
	if not owned.has(id):
		var purple: bool = item.get("purple", false)
		var price: int = item["price"]
		if purple and level.purple >= price:
			level.purple -= price
		elif not purple and level.coins >= price:
			level.coins -= price
		else:
			hud.toast("Not enough %s coins yet." % ("purple" if purple else ""))
			Sfx.play("deny")
			return
		owned[id] = true
		Sfx.play("buy")
	if id.begins_with("cap:"):
		cap_id = id.substr(4)
	elif id.begins_with("shirt:"):
		shirt_id = id.substr(6)
	_apply_costume()
	_save()
	_refresh_shop()


func _apply_costume() -> void:
	player.cap_colour = Models.CAP_COLOURS.get(cap_id, Models.CAP_COLOURS["red"])
	player.shirt_colour = Models.SHIRT_COLOURS.get(shirt_id, Models.SHIRT_COLOURS["red"])
	player.rebuild_model()


func _on_moon(_id: String, name: String, count: int, multi: bool) -> void:
	hud.set_moons(count, level.total_moons())
	hud.banner("MULTI MOON!" if multi else "YOU GOT A MOON!", name, 3.0)
	player.frozen = true
	_celebrate = 2.4
	_save()
	if count >= Level.NEEDED and not level.cleared:
		hud.toast("That's enough moons to power the balloon!", 5.0)


func _on_captured(kind: String) -> void:
	match kind:
		"frog":
			hud.toast("Captured a frog! JUMP goes sky high. HAT to let go.", 4.0)
		"rex":
			hud.toast("You are the T-REX! Walk through boulders. JUMP to roar. HAT to let go.", 5.0)
		"rocket":
			hud.toast("Rocket! Steer with the stick, push forward to climb. HAT to bail out.", 5.0)
		"stilt":
			hud.toast("Hold JUMP to stretch up. Let go with HAT at the top to hop off.", 5.0)


func _on_balloon() -> void:
	if state != S.PLAY or _celebrate > 0.0:
		return
	var n := level.moon_count()
	if level.cleared:
		return
	if n >= Level.NEEDED:
		level.cleared = true
		Sfx.play("cleared")
		_save()
		state = S.PANEL
		get_tree().paused = true
		touch.enable(false)
		hud.show_panel("cleared", {"left": level.total_moons() - n})
	elif _balloon_toast_t <= 0.0:
		hud.toast("The balloon needs %d more moons to fly." % (Level.NEEDED - n), 3.0)
		_balloon_toast_t = 4.0

var _balloon_toast_t := 0.0


func _on_boss_event(kind: String, hp: int) -> void:
	match kind:
		"start":
			hud.set_boss(hp)
			hud.banner("KING RAPTOR", "Dodge his charge, %s, then hit his crown when he is dizzy!" % Player.HERO_NAME, 3.5)
		"hit":
			hud.set_boss(hp)
		"down":
			hud.set_boss(-1)


func _on_died() -> void:
	state = S.DEAD
	_dead_t = 1.6
	hud.set_boss(-1)
	hud.show_panel("dead")
	touch.enable(false)


func _process(dt: float) -> void:
	_balloon_toast_t = maxf(_balloon_toast_t - dt, 0.0)
	match state:
		S.TITLE:
			cam.yaw = _title_yaw + sin(Time.get_ticks_msec() * 0.0002) * 0.6
			cam.pitch = 0.2
			cam.manual_t = 1.0
			if Input.is_action_just_pressed("confirm") or Input.is_action_just_pressed("jump") or _tap_anywhere():
				_start_play()
		S.PLAY:
			if _celebrate > 0.0:
				_celebrate -= dt
				if _celebrate <= 0.0:
					player.frozen = false
			if Input.is_action_just_pressed("pause"):
				_toggle_pause()
			elif level.shop_inside and not player.capture and Input.is_action_just_pressed("hat") and _celebrate <= 0.0:
				_open_shop()
		S.PAUSE:
			if Input.is_action_just_pressed("pause"):
				_resume()
		S.PANEL:
			if Input.is_action_just_pressed("pause"):
				_resume()
		S.DEAD:
			_dead_t -= dt
			if _dead_t <= 0.0:
				hud.hide_panel()
				level.respawn_player()
				state = S.PLAY
				player.frozen = false
				touch.enable(touch_mode)


var _tapped := false


func _tap_anywhere() -> bool:
	var t := _tapped
	_tapped = false
	return t


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch and event.pressed and state == S.TITLE:
		_tapped = true
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		_mouse_down = event.pressed
		if event.pressed and state == S.TITLE:
			_tapped = true
	elif event is InputEventMouseMotion and _mouse_down and not touch_mode and state == S.PLAY and cam:
		cam.rotate_by(event.relative.x * 0.005, event.relative.y * 0.004)


# ------------------------------------------------------------------ save --

func _save() -> void:
	var cf := ConfigFile.new()
	var st := level.state()
	for k in st:
		cf.set_value("level", k, st[k])
	cf.set_value("costume", "cap", cap_id)
	cf.set_value("costume", "shirt", shirt_id)
	cf.set_value("costume", "owned", owned.keys())
	cf.set_value("options", "muted", muted)
	cf.save(SAVE_PATH)


func _load() -> void:
	var cf := ConfigFile.new()
	if cf.load(SAVE_PATH) != OK:
		return
	var d := {}
	for k in ["coins", "purple", "moons", "purples", "bonks", "cleared", "cp", "bell"]:
		if cf.has_section_key("level", k):
			d[k] = cf.get_value("level", k)
	level.restore(d)
	cap_id = str(cf.get_value("costume", "cap", "red"))
	shirt_id = str(cf.get_value("costume", "shirt", "red"))
	for o in cf.get_value("costume", "owned", []):
		owned[str(o)] = true
	_apply_costume()
	muted = bool(cf.get_value("options", "muted", false))
	if muted and not sfx.muted:
		Sfx.toggle_mute()
	var sp := level.spawn_point()
	player.global_position = sp["pos"] + Vector3(0, 0.3, 0)
	player.facing = sp["yaw"]
	cam.yaw = sp["yaw"]
	cam.snap()
	hud.set_moons(level.moon_count(), level.total_moons())
	hud.set_counts(level.coins, level.purple)


func _reset_save() -> void:
	var da := DirAccess.open("user://")
	if da:
		da.remove("hattrick.cfg")
	get_tree().paused = false
	get_tree().reload_current_scene()


# ------------------------------------------------------------- testing ---

func _press(action: String, strength: float = 1.0) -> void:
	Input.action_press(action, strength)


func _release(action: String) -> void:
	Input.action_release(action)


func _step(frames: int) -> void:
	for i in frames:
		await get_tree().physics_frame


func _unfreeze() -> void:
	_celebrate = 0.0
	player.frozen = false


func _run_selftest() -> void:
	var st := {"checks": 0, "fails": 0}
	var check := func(ok: bool, what: String):
		st["checks"] += 1
		if not ok:
			st["fails"] += 1
		print("  [%s] %s" % ["ok" if ok else "FAIL", what])
	state = S.PLAY
	player.frozen = false
	await _step(30)
	check.call(player.is_on_floor(), "player lands on the meadow at start (y=%.2f)" % player.global_position.y)
	var p0 := player.global_position
	_press("move_up")
	await _step(60)
	_release("move_up")
	check.call(player.global_position.distance_to(p0) > 5.0, "runs forward %.1f m in a second" % player.global_position.distance_to(p0))
	# Jump.
	await _step(20)
	var y0 := player.global_position.y
	_press("jump")
	await _step(2)
	_release("jump")
	var top := y0
	for i in 40:
		await _step(1)
		top = maxf(top, player.global_position.y)
	check.call(top - y0 > 1.8, "single jump reaches %.2f m" % (top - y0))
	# Hat throw and return.
	_press("hat")
	await _step(2)
	_release("hat")
	await _step(5)
	check.call(hat.is_out(), "hat is out after throwing")
	await _step(130)
	check.call(not hat.is_out(), "hat comes back")
	# Coins.
	var c0 := level.coins
	level.spawn_coins(player.global_position, 4)
	await _step(10)
	check.call(level.coins > c0, "coins collected on contact (%d -> %d)" % [c0, level.coins])
	# Capture a frog by placing the hat on it.
	var frog: Capturable = null
	for c in level.capturables:
		if c.kind == "frog":
			frog = c
	check.call(frog != null, "frog exists")
	if frog:
		player.global_position = frog.global_position + Vector3(3, 0.5, 0)
		await _step(5)
		level.hat_touch(hat, frog.global_position + Vector3(0, 0.4, 0))
		await _step(5)
		check.call(player.capture == frog, "hat on the frog captures it")
		_press("jump")
		await _step(2)
		_release("jump")
		var ftop := frog.global_position.y
		for i in 60:
			await _step(1)
			ftop = maxf(ftop, frog.global_position.y)
		check.call(ftop - frog.home.y > 6.0, "frog jump reaches %.1f m" % (ftop - frog.home.y))
		await _step(60)
		_unfreeze()
		_press("hat")
		await _step(2)
		_release("hat")
		await _step(5)
		check.call(player.capture == null, "hat button releases the capture")
	# Rex smashes the boulders.
	var rex: Capturable = null
	for c in level.capturables:
		if c.kind == "rex":
			rex = c
	check.call(rex != null, "rex exists")
	if rex:
		var nb := level.boulders.size()
		player.global_position = rex.global_position + Vector3(4, 0.5, 0)
		await _step(5)
		level.hat_touch(hat, rex.global_position + Vector3(0, 1.5, 0))
		await _step(5)
		check.call(player.capture == rex, "rex captured")
		rex.global_position = Vector3(10.0, Level.g(10.0, -74.0) + 0.6, -74.0)
		rex.facing = 0.0
		cam.yaw = 0.0
		cam.manual_t = 5.0
		_press("move_up")
		await _step(120)
		_release("move_up")
		check.call(level.boulders.size() < nb, "rex walking into the cave smashes the boulders (%d -> %d)" % [nb, level.boulders.size()])
		_unfreeze()
		_press("hat")
		await _step(2)
		_release("hat")
		await _step(30)
		check.call(player.capture == null, "released from rex")
	# Ground pound on the slab.
	var slab: Node3D = level.slabs[0] if level.slabs.size() > 0 else null
	check.call(slab != null, "cracked slab exists")
	_unfreeze()
	if slab:
		var nm := level.moons.size()
		player.global_position = slab.global_position + Vector3(0, 4.0, 0)
		player.velocity = Vector3.ZERO
		await _step(3)
		_press("pound")
		await _step(2)
		_release("pound")
		await _step(50)
		check.call(level.slabs.size() == 0, "ground pound breaks the slab")
		check.call(level.moons.size() == nm + 1 or level.moons_got.has("slab"), "a moon rises from under it")
		await _step(60)
		check.call(level.moons_got.has("slab"), "and gets collected (moons=%d)" % level.moon_count())
		_celebrate = 0.0
		player.frozen = false
	# Boss: wake, get him dazed, hit him three times.
	var boss := level.boss
	_unfreeze()
	player.global_position = level.arena_center + Vector3(8, 0.5, 0)
	player.velocity = Vector3.ZERO
	await _step(20)
	check.call(boss.state != Boss.S.SLEEP, "boss wakes when you enter the arena")
	var hits := 0
	for round in 6:
		var t := 0
		while boss.state != Boss.S.DAZED and t < 400 and boss.state != Boss.S.DEAD:
			player.global_position = level.arena_center + Vector3(8, 0.5, 0)
			player.velocity = Vector3.ZERO
			player.invuln = 1.0
			_unfreeze()
			await _step(1)
			t += 1
		if boss.state == Boss.S.DAZED:
			if boss.hat_hit():
				hits += 1
			await _step(5)
		if boss.state == Boss.S.DEAD:
			break
	check.call(boss.state == Boss.S.DEAD, "boss goes down after %d hits" % hits)
	await _step(30)
	player.global_position = level.arena_center + Vector3(0, 0.5, 0)
	await _step(90)
	check.call(level.moons_got.has("boss"), "multi moon collected (count=%d)" % level.moon_count())
	# Save / load round trip.
	_save()
	var cf := ConfigFile.new()
	check.call(cf.load(SAVE_PATH) == OK, "save file written")
	check.call(cf.get_value("level", "coins", -1) == level.coins, "saved coins match")
	print("SELFTEST: %d checks, %d failures" % [st["checks"], st["fails"]])
	get_tree().quit(1 if st["fails"] > 0 else 0)


func _run_shots() -> void:
	DirAccess.make_dir_recursive_absolute(_shots)
	state = S.PLAY
	touch.enable(touch_mode)
	player.frozen = false
	var scenes := [
		{"name": "01_title", "pos": Vector3(0, 0.3, 15), "yaw": 0.0, "pitch": 0.2, "title": true},
		{"name": "02_meadow", "pos": Vector3(0, 0.3, 10), "yaw": 0.0, "pitch": 0.3},
		{"name": "03_shop", "pos": Vector3(14, 0.3, 17), "yaw": PI, "pitch": 0.25},
		{"name": "04_frogs", "pos": Vector3(-30, 0.5, 0), "yaw": 0.6, "pitch": 0.3},
		{"name": "05_waterfall", "pos": Vector3(-4, 0.5, -12), "yaw": 0.2, "pitch": 0.25},
		{"name": "06_rex", "pos": Vector3(24, 12.5, -66), "yaw": 0.6, "pitch": 0.3},
		{"name": "07_cave", "pos": Vector3(10, 12.5, -72), "yaw": 0.0, "pitch": 0.25},
		{"name": "08_cannon", "pos": Vector3(50, 0.5, 15), "yaw": -PI * 0.5, "pitch": 0.3},
		{"name": "09_arena", "pos": Vector3(12, 26.5, -108), "yaw": PI * 0.5, "pitch": 0.3},
		{"name": "10_stilt", "pos": Vector3(-50, 0.5, 30), "yaw": 0.6, "pitch": 0.3},
		{"name": "11_overview", "pos": Vector3(44, 26.5, -100), "yaw": PI, "pitch": 0.55},
		{"name": "12_peak", "pos": Vector3(-30, 26.5, -104), "yaw": -0.8, "pitch": 0.35},
	]
	for sc in scenes:
		if sc.get("title", false):
			_enter_title()
			state = S.TITLE
		else:
			hud.hide_panel()
			state = S.PLAY
			player.frozen = false
			touch.enable(touch_mode)
		player.global_position = sc["pos"]
		player.velocity = Vector3.ZERO
		player.facing = sc["yaw"]
		cam.yaw = sc["yaw"]
		cam.pitch = sc["pitch"]
		cam.manual_t = 2.0
		cam.snap()
		await _step(4)
		if sc.get("title", false):
			cam.yaw = sc["yaw"]
		await get_tree().process_frame
		await get_tree().process_frame
		var img := get_viewport().get_texture().get_image()
		img.save_png("%s/%s.png" % [_shots, sc["name"]])
		print("shot ", sc["name"])
	get_tree().quit()
