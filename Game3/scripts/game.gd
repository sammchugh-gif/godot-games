# Root node and state machine: attract-mode race behind the menus, the real
# race with HUD + touch controls, pause and results. Also the headless
# self-test (run with: godot --headless --path . -- --selftest).
extends Node

enum S { TITLE, MENU, LOADING, RACE, PAUSE, RESULTS }

const SAVE_PATH := "user://velocity_zero.cfg"

var state := S.TITLE
var sfx: Sfx
var menu: Menu
var hud: Hud
var touch: TouchControls
var race: Race
var attract: Race
var track_idx := 0
var team_idx := 0
var touch_mode := true
var best_times := {}
var music_on := true
var _pending_race := false
var _pending_frames := 0
var _attract_t := 0.0
var _attract_i := 0
var _shots_mode := false
var _shots_dir := ""
var _shots_t := 0.0
var _shots_n := 0


func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	if "--selftest" in args:
		_selftest()
		return
	if "--lightweight" in args:
		Quality.force(true)
	touch_mode = DisplayServer.is_touchscreen_available() or OS.has_feature("web") or OS.has_feature("mobile")
	if "--desktop" in args:
		touch_mode = false
	process_mode = Node.PROCESS_MODE_ALWAYS
	_apply_quality()
	_load_settings()
	sfx = Sfx.new()
	add_child(sfx)
	sfx.set_music_enabled(music_on)
	hud = Hud.new()
	hud.process_mode = Node.PROCESS_MODE_PAUSABLE
	add_child(hud)
	touch = TouchControls.new()
	add_child(touch)
	touch.fire_pressed.connect(func(): _fire_queued = true)
	touch.pause_pressed.connect(_toggle_pause)
	menu = Menu.new()
	add_child(menu)
	menu.best_times = best_times
	menu.music_on = music_on
	menu.race_requested.connect(_on_race_requested)
	menu.resume_requested.connect(_toggle_pause)
	menu.quit_requested.connect(_quit_to_menu)
	menu.restart_requested.connect(func(): _start_race(track_idx, team_idx))
	menu.next_track_requested.connect(func(): _start_race((track_idx + 1) % TrackDefs.all().size(), team_idx))
	menu.music_toggled.connect(func(on):
		music_on = on
		sfx.set_music_enabled(on)
		_save_settings())
	_start_attract()
	menu.show_title()
	sfx.music("music_menu")
	state = S.TITLE
	# Debug: --shots <dir> [--track N] auto-drives a race and saves screenshots.
	var si := args.find("--shots")
	if si >= 0 and si + 1 < args.size():
		_shots_dir = args[si + 1]
		var ti := args.find("--track")
		if ti >= 0 and ti + 1 < args.size():
			track_idx = int(args[ti + 1])
		_shots_mode = true


func _apply_quality() -> void:
	var vp := get_viewport()
	if Quality.lightweight():
		# iPad retina canvases are huge; render 3D at a fraction and let the
		# compositor scale. MSAA stays on because edges matter at speed.
		vp.scaling_3d_mode = Viewport.SCALING_3D_MODE_BILINEAR
		vp.scaling_3d_scale = 0.66
		vp.msaa_3d = Viewport.MSAA_2X
	else:
		vp.msaa_3d = Viewport.MSAA_4X
	Engine.max_fps = 60


func _load_settings() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) == OK:
		music_on = cfg.get_value("settings", "music", true)
		for d in TrackDefs.all():
			var v: float = cfg.get_value("best", d["id"], -1.0)
			if v > 0.0:
				best_times[d["id"]] = v


func _save_settings() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("settings", "music", music_on)
	for k in best_times.keys():
		cfg.set_value("best", k, best_times[k])
	cfg.save(SAVE_PATH)


# ------------------------------------------------------------- attract ---

func _start_attract() -> void:
	if attract != null:
		attract.queue_free()
	attract = Race.new()
	attract.process_mode = Node.PROCESS_MODE_PAUSABLE
	add_child(attract)
	attract.build(TrackDefs.all()[_attract_i % TrackDefs.all().size()], randi() % 8, TrackDefs.teams())
	attract.player.is_player = false
	attract.cinematic = true
	attract.countdown = 0.5
	_attract_t = 0.0


func _stop_attract() -> void:
	if attract != null:
		attract.queue_free()
		attract = null


# ---------------------------------------------------------------- race ---

func _on_race_requested(t: int, tm: int) -> void:
	_start_race(t, tm)


func _start_race(t: int, tm: int) -> void:
	track_idx = t
	team_idx = tm
	state = S.LOADING
	get_tree().paused = false
	_stop_attract()
	if race != null:
		race.queue_free()
		race = null
	hud.attach(null, touch_mode)
	touch.enable(false)
	menu.show_loading("LOADING " + TrackDefs.all()[t]["name"])
	_pending_race = true
	_pending_frames = 2


func _build_race() -> void:
	race = Race.new()
	race.process_mode = Node.PROCESS_MODE_PAUSABLE
	add_child(race)
	race.build(TrackDefs.all()[track_idx], team_idx, TrackDefs.teams())
	race.race_finished.connect(_on_race_finished)
	race.effect.connect(_on_effect)
	race.countdown_tick.connect(func(n):
		if n > 0:
			sfx.play("beep", -4.0)
		else:
			sfx.play("go", -2.0))
	menu.hide_all()
	hud.attach(race, touch_mode)
	touch.enable(touch_mode)
	sfx.engine(true)
	sfx.music(race.track.theme["music"])
	state = S.RACE


func _on_race_finished(results: Array) -> void:
	state = S.RESULTS
	touch.enable(false)
	var d: Dictionary = TrackDefs.all()[track_idx]
	var best: float = race.player.best_lap
	if best > 0.0 and (not best_times.has(d["id"]) or best < best_times[d["id"]]):
		best_times[d["id"]] = best
		menu.best_times = best_times
		_save_settings()
	menu.show_results(results, d["name"])
	sfx.engine(false)


func _quit_to_menu() -> void:
	get_tree().paused = false
	state = S.TITLE
	touch.enable(false)
	hud.attach(null, touch_mode)
	if race != null:
		race.queue_free()
		race = null
	sfx.engine(false)
	_attract_i += 1
	_start_attract()
	menu.show_title()
	sfx.music("music_menu")


func _toggle_pause() -> void:
	if state == S.RACE:
		state = S.PAUSE
		get_tree().paused = true
		touch.enable(false)
		menu.show_pause()
		sfx.engine(false)
	elif state == S.PAUSE:
		state = S.RACE
		get_tree().paused = false
		menu.hide_all()
		touch.enable(touch_mode)
		sfx.engine(true)


var _fire_queued := false


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and (state == S.RACE or state == S.PAUSE):
		_toggle_pause()
	elif event.is_action_pressed("fire") and state == S.RACE:
		_fire_queued = true


func _process(delta: float) -> void:
	if _shots_mode:
		_shots_step(delta)
	if _pending_race:
		_pending_frames -= 1
		if _pending_frames <= 0:
			_pending_race = false
			_build_race()
		return
	if state == S.RACE and race != null:
		var steer := Input.get_axis("steer_left", "steer_right")
		var brake := 1.0 if Input.is_action_pressed("airbrake") else 0.0
		var thrust := 1.0
		if touch_mode:
			steer = clampf(steer + touch.steer(), -1.0, 1.0)
			brake = maxf(brake, touch.brake())
		race.set_player_input(steer, brake, _fire_queued, thrust)
		_fire_queued = false
		var p := race.player
		sfx.engine_state(p.v / p.max_speed, 1.0 if p.boost_t > 0.0 else 0.0, 1.0 if p.scraping else 0.0)
	elif state == S.TITLE or state == S.MENU:
		_fire_queued = false
		if attract != null:
			_attract_t += delta
			if attract.state == Race.State.FINISHED or _attract_t > 150.0:
				_attract_i += 1
				_start_attract()


func _on_effect(kind: String, sh: Ship) -> void:
	if race == null:
		return
	var is_p := sh == race.player
	var db := 0.0 if is_p else -10.0
	if not is_p and sh != null:
		var d := race.track.wrap_s(sh.s - race.player.s)
		if d > race.track.length * 0.5:
			d -= race.track.length
		if absf(d) > 120.0:
			return
	match kind:
		"wall": sfx.play("bump1" if randf() < 0.5 else "bump2", db, randf_range(0.9, 1.1))
		"boost": sfx.play("boost", db)
		"turbo": sfx.play("boost", db + 2.0, 0.85)
		"pickup": sfx.play("pickup", db)
		"hit":
			sfx.play("explosion", db - 3.0)
			sfx.play("hit", db)
		"shield_hit": sfx.play("shield_hit", db)
		"rocket": sfx.play("laser", db - 2.0, randf_range(0.95, 1.05))
		"missile":
			sfx.play("missile", db)
			if is_p:
				sfx.play("lock", -6.0)
		"mine": sfx.play("mine", db)
		"shield": sfx.play("shield", db)
		"lap": sfx.play("lap", -2.0)
		"finish": sfx.play("finish", 0.0)
		"bump": sfx.play("impact_small", db - 4.0, randf_range(0.9, 1.2))
		"land": sfx.play("bump2", db - 6.0, 0.8)


func _shots_step(delta: float) -> void:
	_shots_t += delta
	var want := -1
	if _shots_n == 0 and _shots_t > 2.0:
		want = 0
	elif _shots_n == 1 and _shots_t > 4.0:
		want = 1
	if want == 0:
		_save_shot("title")
		_shots_n = 1
	elif want == 1:
		_shots_n = 2
		_start_race(track_idx, 1)
	elif _shots_n >= 2 and state == S.RACE and race != null:
		race.player.is_player = false
		if _shots_t > 6.0 + (_shots_n - 2) * 3.0:
			_save_shot("race_%02d" % (_shots_n - 2))
			_shots_n += 1
			# Teleport in front of the first boost pad, then the first weapon pad.
			if _shots_n == 5 or _shots_n == 9:
				var kind := "boost" if _shots_n == 5 else "weapon"
				for pd in race.track.pads:
					if pd["type"] == kind:
						race.player.s = race.track.wrap_s(pd["s"] - 45.0)
						race.player.x = pd["x"]
						race.player.v = 35.0
						break
			if _shots_n > 16:
				get_tree().quit()


func _save_shot(name: String) -> void:
	var img := get_viewport().get_texture().get_image()
	img.save_png("%s/%s.png" % [_shots_dir, name])
	print("shot ", name)


# ------------------------------------------------------------ selftest ---

func _selftest() -> void:
	var fails := 0
	var teams := TrackDefs.teams()
	for d in TrackDefs.all():
		var t0 := Time.get_ticks_msec()
		var r := Race.new()
		r.headless = true
		add_child(r)
		r.build(d, 0, teams)
		var tr := r.track
		var ms := Time.get_ticks_msec() - t0
		print("%s: length %.0f m, %d frames, %d pads, built in %d ms" % [d["name"], tr.length, tr.n, tr.pads.size(), ms])
		var worst := 1e9
		var i := 0
		while i < tr.n:
			var j := i + 60
			while j < tr.n:
				if tr.n - (j - i) > 60:
					var a := tr.pos[i]
					var b := tr.pos[j]
					var dxz := Vector2(a.x - b.x, a.z - b.z).length()
					if dxz < (tr.width[i] + tr.width[j]) * 0.5 + 4.0:
						worst = minf(worst, absf(a.y - b.y))
				j += 4
			i += 4
		var maxc := 0.0
		for k in tr.n:
			maxc = maxf(maxc, absf(tr.curv[k]))
		print("  clearance %.1f m, tightest radius %.0f m" % [worst, 1.0 / maxf(maxc, 1e-4)])
		if worst < 9.0:
			fails += 1
		r.player.is_player = false
		var counts := {"hit": 0, "wall": 0, "fired": 0}
		r.effect.connect(func(kind, _sh):
			if kind == "hit": counts["hit"] += 1
			elif kind == "wall": counts["wall"] += 1
			elif kind in ["rocket", "missile", "mine"]: counts["fired"] += 1)
		var t1 := Time.get_ticks_msec()
		var dt := 1.0 / 60.0
		var frames := 60 * 200
		var max_h := 0.0
		var max_v := 0.0
		for f in frames:
			r.step(dt)
			for sh in r.ships:
				max_h = maxf(max_h, sh.h)
				max_v = maxf(max_v, sh.v)
		var sim_ms := Time.get_ticks_msec() - t1
		var laps := []
		var walls := []
		var picks := []
		for sh in r.ships:
			laps.append(sh.lap)
			walls.append(sh.wall_hits)
			picks.append(sh.pickups)
		print("  sim %d frames in %d ms (%.2f ms/frame); laps %s; wall hits %s; pickups %s; fired %d, hits %d; max h %.1f, max v %.1f" % [frames, sim_ms, float(sim_ms) / frames, laps, walls, picks, counts["fired"], counts["hit"], max_h, max_v])
		print("  player lap times %s, finished %s, rank %d, energy %.0f" % [r.player.lap_times, r.player.finished, r.rank_of(r.player), r.player.energy])
		var min_lap := 99
		for l in laps:
			min_lap = mini(min_lap, l)
		if min_lap < 2:
			print("  FAIL: a ship completed fewer than 2 laps")
			fails += 1
		if counts["fired"] == 0:
			print("  FAIL: no weapons fired")
			fails += 1
		if r.state != Race.State.FINISHED:
			print("  FAIL: race did not finish in 200 s")
			fails += 1
		var res := r._make_results()
		if res.size() != 8:
			fails += 1
		r.queue_free()
	# UI smoke test: build every menu screen and the HUD once.
	var m := Menu.new()
	add_child(m)
	m.show_title(); m.show_tracks(); m.show_ships(); m.show_help(); m.show_pause()
	m.show_results([{"name": "X", "color": Color.RED, "time": 100.0, "best": 40.0, "player": true, "rank": 1, "laps": 3}], "T")
	m.queue_free()
	var tc := TouchControls.new()
	add_child(tc)
	tc.enable(true)
	tc.queue_free()
	print("SELFTEST %s" % ("PASS" if fails == 0 else "FAIL"))
	get_tree().quit(0 if fails == 0 else 1)
