# Root node and state machine: loading, the title (Sonic idling on the
# cliff while the camera orbits), the run with HUD + touch controls, pause,
# and results. Also the headless self-test:
#   godot --headless --path Game4 -- --selftest
extends Node

enum S { LOADING, TITLE, PLAY, PAUSE, RESULTS }

var state := S.LOADING
var sfx: Sfx
var hud: Hud
var touch: TouchControls
var level: Level
var player: Player
var cam: CameraRig
var fx: Fx
var time_s := 0.0
var touch_mode := false
var checkpoint := 0
var _dying := false
var _victory_t := 0.0
var _loading_label: Label
var _selftest := false


func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	process_mode = Node.PROCESS_MODE_ALWAYS
	if "--lightweight" in args:
		Quality.force(true)
	touch_mode = DisplayServer.is_touchscreen_available() or OS.has_feature("web") or OS.has_feature("mobile")
	if "--desktop" in args:
		touch_mode = false
	if "--touch" in args:
		touch_mode = true
	_selftest = "--selftest" in args
	_apply_quality()
	sfx = Sfx.new()
	sfx.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(sfx)
	hud = Hud.new()
	hud.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(hud)
	hud.set_touch(touch_mode)
	touch = TouchControls.new()
	touch.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(touch)
	touch.pause_pressed.connect(_toggle_pause)
	_show_loading(true)
	# Let the loading text draw before the (multi-second) build.
	await get_tree().process_frame
	await get_tree().process_frame
	_build_world()
	_show_loading(false)
	if _selftest:
		_run_selftest()
		return
	_enter_title()


func _apply_quality() -> void:
	var vp := get_viewport()
	if Quality.lightweight():
		var win := DisplayServer.window_get_size()
		vp.scaling_3d_mode = Viewport.SCALING_3D_MODE_BILINEAR
		vp.scaling_3d_scale = 0.7 if win.x * win.y < 2600000 else 0.58
		vp.msaa_3d = Viewport.MSAA_2X
	else:
		vp.msaa_3d = Viewport.MSAA_4X
	Engine.max_fps = 120 if not Quality.lightweight() else 60


func _show_loading(on: bool) -> void:
	if on:
		var layer := CanvasLayer.new()
		layer.layer = 20
		layer.name = "LoadingLayer"
		add_child(layer)
		var bg := ColorRect.new()
		bg.set_anchors_preset(Control.PRESET_FULL_RECT)
		bg.color = Color(0.06, 0.35, 0.75)
		layer.add_child(bg)
		_loading_label = Label.new()
		_loading_label.text = "BUILDING EMERALD SHORE..."
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
	player.name = "Sonic"
	level = Level.new()
	level.name = "Level"
	add_child(level)
	level.build(player, sfx)
	cam = CameraRig.new()
	cam.name = "Camera"
	cam.player = player
	cam.level = level
	add_child(cam)
	cam.snap()
	fx = Fx.new()
	fx.name = "Fx"
	add_child(fx)
	fx.setup(player, cam)
	player.ring_collected.connect(func(_n): hud.ring_pulse())
	player.died.connect(_on_died)
	player.took_hit.connect(func():
		sfx.play("hurt")
		_scatter_rings())
	player.jumped.connect(func(): sfx.play("jump", -4.0, randf_range(0.95, 1.05)))
	player.landed.connect(func(s): sfx.play("land", -12.0 + s * 8.0, randf_range(0.9, 1.1)))
	player.spindash_released.connect(func(_c): sfx.play("spindash_release", -2.0))
	player.boost_changed.connect(func(on):
		if on:
			sfx.play("boost", -3.0))
	player.homing_hit.connect(func(_t): sfx.play("homing", -3.0))
	player.dashed.connect(func(): sfx.play("dash", -8.0, 1.2))
	player.rail_changed.connect(func(on):
		if on:
			sfx.play("rail_land", -6.0))
	player.drift_changed.connect(func(on):
		if on:
			sfx.play("drift", -10.0))
	level.goal_reached.connect(_on_goal)
	level.checkpoint_reached.connect(func(i):
		checkpoint = i
		hud.message("CHECKPOINT"))
	print("Sonic Spin: world built in %d ms, %d frames, %d rings" % [Time.get_ticks_msec() - t0, level.track.frames.size(), level.stats["rings_total"]])


func _enter_title() -> void:
	state = S.TITLE
	player.frozen = true
	cam.attract = true
	hud.show_title()
	touch.enable(false)
	sfx.music(true)
	sfx.set_music_volume(-14.0)


func _start_run() -> void:
	state = S.PLAY
	time_s = 0.0
	checkpoint = 0
	player.frozen = false
	cam.attract = false
	cam.snap()
	hud.show_game()
	hud.message("GO!", 1.0)
	touch.enable(touch_mode)
	sfx.set_music_volume(-8.0)
	sfx.play("go", -4.0)


func _restart() -> void:
	# Full rebuild: objects, rings, enemies and the bridge all come back.
	get_tree().paused = false
	_show_loading(true)
	await get_tree().process_frame
	await get_tree().process_frame
	level.queue_free()
	cam.queue_free()
	fx.queue_free()
	await get_tree().process_frame
	_build_world()
	_show_loading(false)
	_start_run()


func _toggle_pause() -> void:
	if state == S.PLAY:
		state = S.PAUSE
		get_tree().paused = true
		hud.show_pause(true)
	elif state == S.PAUSE:
		state = S.PLAY
		get_tree().paused = false
		hud.show_pause(false)


func _process(dt: float) -> void:
	match state:
		S.TITLE:
			var tap := false
			if touch_mode and Input.is_action_just_pressed("confirm"):
				tap = true
			if Input.is_action_just_pressed("confirm") or Input.is_action_just_pressed("jump") or tap or _tap_anywhere():
				_start_run()
		S.PLAY:
			time_s += dt
			hud.time_s = time_s
			hud.rings = player.rings
			hud.speed = player.visual_speed()
			hud.boost = player.boost_gauge
			hud.boosting = player.boosting
			sfx.update(dt, player.visual_speed(), player.st == Player.St.RAIL, player.boosting, player.st == Player.St.AIR)
			if Input.is_action_just_pressed("pause"):
				_toggle_pause()
			elif Input.is_action_just_pressed("restart"):
				_restart()
			if player.st == Player.St.VICTORY:
				_victory_t += dt
				if _victory_t > 2.6:
					state = S.RESULTS
					hud.show_results(time_s, player.rings, level.stats["rings_total"])
					sfx.play("goal", -2.0)
		S.PAUSE:
			if Input.is_action_just_pressed("pause"):
				_toggle_pause()
			elif Input.is_action_just_pressed("restart"):
				_restart()
		S.RESULTS:
			if Input.is_action_just_pressed("restart") or Input.is_action_just_pressed("confirm") or _tap_anywhere():
				_restart()
		_:
			pass


func _tap_anywhere() -> bool:
	if not touch_mode:
		return false
	return Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT) and Input.is_action_just_pressed("confirm")


func _unhandled_input(event: InputEvent) -> void:
	if state == S.TITLE and (event is InputEventScreenTouch or event is InputEventMouseButton):
		if event.is_pressed():
			_start_run()
	elif state == S.RESULTS and (event is InputEventScreenTouch or event is InputEventMouseButton):
		if event.is_pressed():
			_restart()


func _scatter_rings() -> void:
	# The classic ring spill: nothing to spill if empty.
	var n := mini(player.rings, 14)
	# (player.rings is already zeroed by take_hit; hud shows 0.)
	var floor_y := player.global_position.y - 0.5
	for i in n:
		var r := Ring.new()
		r.position = player.global_position + Vector3(0, 0.6, 0)
		var a := TAU * float(i) / n
		r.scatter(Vector3(cos(a) * 6.0, 9.0 + (i % 3) * 2.0, sin(a) * 6.0), floor_y)
		level.add_child(r)
	cam.shake(1.0)


func _on_died() -> void:
	if _dying:
		return
	_dying = true
	level.splash(player.global_position)
	hud.fade_to(1.0, 0.5)
	await get_tree().create_timer(0.8).timeout
	level.respawn(checkpoint)
	cam.snap()
	hud.fade_to(0.0, 0.5)
	_dying = false


func _on_goal() -> void:
	if player.st == Player.St.VICTORY:
		return
	player.start_victory()
	_victory_t = 0.0
	hud.message("GOAL!", 2.0)
	sfx.play("checkpoint", 0.0, 1.3)


# ---------------------------------------------------------------------------
# Headless self-test: build the world, drive Sonic forward for a few seconds
# and check he ran down the hill on the ground.

func _run_selftest() -> void:
	var ok := true
	var frames: int = level.track.frames.size()
	print("selftest: %d route frames, %.0f m long, %d rings, %d checkpoints" % [frames, level.track.length, level.stats["rings_total"], level.checkpoints.size()])
	if frames < 500 or level.stats["rings_total"] < 100:
		ok = false
	player.frozen = false
	cam.attract = false
	var start := player.global_position
	Input.action_press("move_up")
	for i in 240:
		await get_tree().physics_frame
	Input.action_release("move_up")
	var moved := start.distance_to(player.global_position)
	print("selftest: moved %.1f m, speed %.1f m/s, state %d, y %.1f" % [moved, player.speed, player.st, player.global_position.y])
	if moved < 40.0 or player.st == Player.St.DEAD:
		ok = false
	print("SELFTEST " + ("PASS" if ok else "FAIL"))
	get_tree().quit(0 if ok else 1)
