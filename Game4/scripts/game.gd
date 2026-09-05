# Root node: menus, HUD, the state machine around the board, save data,
# and the headless self-test (godot --headless --path . -- --selftest).
extends Node

enum S { TITLE, LEVELS, PLAN, RUN, WIN, FAIL, ARCADE, ARCADE_END }

const SAVE_PATH := "user://lizard_rocket.cfg"
const BAR_H := 76.0
const FOOT_H := 44.0

var state := S.TITLE
var sim := Sim.new()
var view: BoardView
var ui: CanvasLayer
var level_idx := 0
var unlocked := 1
var best_score := 0
var muted := false
var _win_t := 0.0
var _last_size := Vector2.ZERO
var _tick_t := 0.0

# UI pieces.
var _title: Control
var _levels: Control
var _levels_grid: GridContainer
var _hud: Control
var _hud_left: Label
var _hud_mid: Label
var _hud_buttons: HBoxContainer
var _btn_go: Button
var _btn_clear: Button
var _btn_reset: Button
var _btn_menu: Button
var _foot: Label
var _overlay: Control
var _ov_title: Label
var _ov_msg: Label
var _ov_buttons: HBoxContainer
var _best_label: Label
var _sound_btn: Button


func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	if "--selftest" in args:
		_selftest()
		return
	Engine.max_fps = 60
	_load_save()
	var sfx := Sfx.new()
	add_child(sfx)
	sfx.muted = muted
	view = BoardView.new()
	add_child(view)
	view.swipe.connect(_on_swipe)
	view.tap.connect(_on_tap)
	_build_ui()
	_show_title()


# ------------------------------------------------------------------ save ---

func _load_save() -> void:
	var cf := ConfigFile.new()
	if cf.load(SAVE_PATH) == OK:
		unlocked = int(cf.get_value("progress", "unlocked", 1))
		best_score = int(cf.get_value("stampede", "best", 0))
		muted = bool(cf.get_value("audio", "muted", false))
	unlocked = clampi(unlocked, 1, Levels.puzzles().size())


func _save() -> void:
	var cf := ConfigFile.new()
	cf.set_value("progress", "unlocked", unlocked)
	cf.set_value("stampede", "best", best_score)
	cf.set_value("audio", "muted", muted)
	cf.save(SAVE_PATH)


# -------------------------------------------------------------------- ui ---

func _style(col: Color, radius: int = 14) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = col
	sb.set_corner_radius_all(radius)
	sb.content_margin_left = 22
	sb.content_margin_right = 22
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	return sb


func _button(text: String, col: Color, cb: Callable, size: int = 24) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_size_override("font_size", size)
	b.add_theme_color_override("font_color", Color.WHITE)
	b.add_theme_color_override("font_hover_color", Color.WHITE)
	b.add_theme_color_override("font_pressed_color", Color.WHITE)
	b.add_theme_color_override("font_disabled_color", Color(1, 1, 1, 0.5))
	b.add_theme_stylebox_override("normal", _style(col))
	b.add_theme_stylebox_override("hover", _style(col.lightened(0.1)))
	b.add_theme_stylebox_override("pressed", _style(col.darkened(0.2)))
	b.add_theme_stylebox_override("disabled", _style(col.darkened(0.35)))
	b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	b.custom_minimum_size = Vector2(0, 54)
	b.pressed.connect(func():
		Sfx.play("click", -8.0)
		cb.call())
	return b


func _label(text: String, size: int, col := Color(0.2, 0.12, 0.05)) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return l


func _full(c: Control) -> void:
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE


func _build_ui() -> void:
	ui = CanvasLayer.new()
	add_child(ui)

	# Title screen.
	_title = Control.new()
	_full(_title)
	ui.add_child(_title)
	var tv := VBoxContainer.new()
	tv.set_anchors_preset(Control.PRESET_CENTER)
	tv.grow_horizontal = Control.GROW_DIRECTION_BOTH
	tv.grow_vertical = Control.GROW_DIRECTION_BOTH
	tv.alignment = BoxContainer.ALIGNMENT_CENTER
	tv.add_theme_constant_override("separation", 16)
	_title.add_child(tv)
	tv.add_child(_label("LIZARD ROCKET", 64, Color(0.2, 0.45, 0.15)))
	tv.add_child(_label("Guide the lizards to the rocket. Swipe on a tile to lay an arrow.\nSnakes eat lizards, holes swallow everyone, and at a wall they all turn right.", 22, Color(0.35, 0.25, 0.12)))
	var sp := Control.new()
	sp.custom_minimum_size = Vector2(0, 10)
	tv.add_child(sp)
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 24)
	tv.add_child(row)
	var b1 := _button("PUZZLES", Color(0.25, 0.6, 0.25), _show_levels, 30)
	b1.custom_minimum_size = Vector2(260, 72)
	row.add_child(b1)
	var b2 := _button("STAMPEDE", Color(0.9, 0.5, 0.1), _start_arcade, 30)
	b2.custom_minimum_size = Vector2(260, 72)
	row.add_child(b2)
	_best_label = _label("", 20, Color(0.4, 0.3, 0.15))
	tv.add_child(_best_label)
	_sound_btn = _button("SOUND ON", Color(0.4, 0.35, 0.3), _toggle_sound, 18)
	_sound_btn.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	_sound_btn.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	_sound_btn.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_sound_btn.position = Vector2(-160, -70)
	_title.add_child(_sound_btn)

	# Level select.
	_levels = Control.new()
	_full(_levels)
	ui.add_child(_levels)
	var lv := VBoxContainer.new()
	lv.set_anchors_preset(Control.PRESET_CENTER)
	lv.grow_horizontal = Control.GROW_DIRECTION_BOTH
	lv.grow_vertical = Control.GROW_DIRECTION_BOTH
	lv.alignment = BoxContainer.ALIGNMENT_CENTER
	lv.add_theme_constant_override("separation", 18)
	_levels.add_child(lv)
	lv.add_child(_label("PICK A PUZZLE", 40, Color(0.2, 0.45, 0.15)))
	_levels_grid = GridContainer.new()
	_levels_grid.columns = 4
	_levels_grid.add_theme_constant_override("h_separation", 14)
	_levels_grid.add_theme_constant_override("v_separation", 14)
	lv.add_child(_levels_grid)
	var back := _button("BACK", Color(0.4, 0.35, 0.3), _show_title)
	lv.add_child(back)

	# In-game HUD bar.
	_hud = Control.new()
	_full(_hud)
	ui.add_child(_hud)
	var bar := PanelContainer.new()
	bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
	bar.custom_minimum_size = Vector2(0, BAR_H)
	var bsb := StyleBoxFlat.new()
	bsb.bg_color = Color(0.3, 0.2, 0.1)
	bsb.content_margin_left = 16
	bsb.content_margin_right = 16
	bar.add_theme_stylebox_override("panel", bsb)
	_hud.add_child(bar)
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 12)
	bar.add_child(hb)
	_hud_left = _label("", 24, Color(1, 0.95, 0.85))
	_hud_left.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	_hud_left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hb.add_child(_hud_left)
	_hud_mid = _label("", 28, Color(1, 0.9, 0.5))
	_hud_mid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hb.add_child(_hud_mid)
	_hud_buttons = HBoxContainer.new()
	_hud_buttons.add_theme_constant_override("separation", 10)
	_hud_buttons.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_hud_buttons.alignment = BoxContainer.ALIGNMENT_END
	hb.add_child(_hud_buttons)
	_btn_clear = _button("CLEAR", Color(0.5, 0.4, 0.3), _clear_arrows, 20)
	_hud_buttons.add_child(_btn_clear)
	_btn_reset = _button("RESET", Color(0.5, 0.4, 0.3), _reset_run, 20)
	_hud_buttons.add_child(_btn_reset)
	_btn_go = _button("GO!", Color(0.25, 0.6, 0.25), _go, 22)
	_btn_go.custom_minimum_size = Vector2(120, 54)
	_hud_buttons.add_child(_btn_go)
	_btn_menu = _button("MENU", Color(0.4, 0.35, 0.3), _quit_to_menu, 20)
	_hud_buttons.add_child(_btn_menu)
	_foot = _label("", 20, Color(0.35, 0.25, 0.12))
	_foot.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_foot.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_foot.custom_minimum_size = Vector2(0, FOOT_H)
	_foot.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_hud.add_child(_foot)

	# Result overlay.
	_overlay = Control.new()
	_full(_overlay)
	ui.add_child(_overlay)
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.45)
	_full(dim)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	_overlay.add_child(dim)
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	var psb := _style(Color(0.98, 0.93, 0.8), 22)
	psb.content_margin_left = 40
	psb.content_margin_right = 40
	psb.content_margin_top = 28
	psb.content_margin_bottom = 28
	panel.add_theme_stylebox_override("panel", psb)
	_overlay.add_child(panel)
	var ov := VBoxContainer.new()
	ov.add_theme_constant_override("separation", 14)
	panel.add_child(ov)
	_ov_title = _label("", 44, Color(0.2, 0.45, 0.15))
	ov.add_child(_ov_title)
	_ov_msg = _label("", 24)
	ov.add_child(_ov_msg)
	_ov_buttons = HBoxContainer.new()
	_ov_buttons.alignment = BoxContainer.ALIGNMENT_CENTER
	_ov_buttons.add_theme_constant_override("separation", 16)
	ov.add_child(_ov_buttons)


func _set_screens(title: bool, levels: bool, hud: bool, overlay: bool) -> void:
	_title.visible = title
	_levels.visible = levels
	_hud.visible = hud
	_overlay.visible = overlay


func _toggle_sound() -> void:
	muted = Sfx.toggle_mute()
	_sound_btn.text = "SOUND OFF" if muted else "SOUND ON"
	_save()


# ---------------------------------------------------------------- states ---

func _show_title() -> void:
	state = S.TITLE
	view.visible = false
	_set_screens(true, false, false, false)
	_best_label.text = ("Best stampede: %d lizards" % best_score) if best_score > 0 else ""
	_sound_btn.text = "SOUND OFF" if muted else "SOUND ON"


func _show_levels() -> void:
	state = S.LEVELS
	view.visible = false
	_set_screens(false, true, false, false)
	for ch in _levels_grid.get_children():
		ch.queue_free()
	var lv := Levels.puzzles()
	for i in lv.size():
		var open := i < unlocked
		var b := _button("%d\n%s" % [i + 1, lv[i].name] if open else "%d\nlocked" % (i + 1), Color(0.25, 0.6, 0.25) if open else Color(0.5, 0.45, 0.4), _start_level.bind(i), 20)
		b.custom_minimum_size = Vector2(190, 84)
		b.disabled = not open
		_levels_grid.add_child(b)


func _start_level(i: int) -> void:
	level_idx = i
	sim.load_level(Levels.puzzles()[i], false)
	_enter_plan()


func _enter_plan() -> void:
	state = S.PLAN
	view.sim = sim
	view.visible = true
	view.planning = true
	view.launch_t = -1.0
	_set_screens(false, false, true, false)
	_btn_go.visible = true
	_btn_clear.visible = true
	_btn_reset.visible = false
	_hud_left.text = "Puzzle %d: %s" % [level_idx + 1, sim.level.name]
	_foot.text = sim.level.get("hint", "")
	_update_hud()


func _go() -> void:
	if state != S.PLAN:
		return
	state = S.RUN
	view.planning = false
	sim.start()
	Sfx.play("go", -4.0)
	_btn_go.visible = false
	_btn_clear.visible = false
	_btn_reset.visible = true
	_foot.text = "Watch them go..."


func _reset_run() -> void:
	sim.reset_run()
	_enter_plan()


func _clear_arrows() -> void:
	sim.clear_arrows()
	Sfx.play("remove", -6.0)
	_update_hud()


func _start_arcade() -> void:
	state = S.ARCADE
	sim.load_level(Levels.stampede(), true)
	view.sim = sim
	view.visible = true
	view.planning = false
	view.launch_t = -1.0
	_set_screens(false, false, true, false)
	_btn_go.visible = false
	_btn_clear.visible = false
	_btn_reset.visible = false
	_hud_left.text = "Stampede"
	_foot.text = "Swipe to lay arrows (three at a time, they fade). Snakes in the rocket cost a third of your lizards."
	sim.start()
	Sfx.play("go", -4.0)
	_update_hud()


func _quit_to_menu() -> void:
	sim.running = false
	_show_title()


func _next_level() -> void:
	if level_idx + 1 < Levels.puzzles().size():
		_start_level(level_idx + 1)
	else:
		_show_title()


func _show_result(title: String, msg: String, buttons: Array) -> void:
	_ov_title.text = title
	_ov_msg.text = msg
	for ch in _ov_buttons.get_children():
		ch.queue_free()
	for b in buttons:
		var btn := _button(b[0], b[1], b[2], 24)
		btn.custom_minimum_size = Vector2(170, 60)
		_ov_buttons.add_child(btn)
	_overlay.visible = true


func _on_win() -> void:
	state = S.WIN
	_win_t = 0.0
	view.launch_t = 0.0
	Sfx.play("rocket", -6.0)
	if level_idx + 1 >= unlocked and level_idx + 1 < Levels.puzzles().size():
		unlocked = level_idx + 2
		_save()
	_btn_reset.visible = false


func _on_fail() -> void:
	state = S.FAIL
	Sfx.play("lose", -6.0)
	_show_result("OH NO", sim.failed, [
		["TRY AGAIN", Color(0.25, 0.6, 0.25), _reset_run],
		["MENU", Color(0.4, 0.35, 0.3), _show_levels]])


func _on_arcade_end() -> void:
	state = S.ARCADE_END
	var msg := "You launched %d lizards." % sim.score
	if sim.score > best_score:
		best_score = sim.score
		_save()
		msg += "\nNew best!"
		Sfx.play("win", -4.0)
	else:
		msg += "\nBest: %d" % best_score
		Sfx.play("rocket", -6.0)
	view.launch_t = 0.0
	_show_result("TIME UP", msg, [
		["PLAY AGAIN", Color(0.9, 0.5, 0.1), _start_arcade],
		["MENU", Color(0.4, 0.35, 0.3), _show_title]])


# ----------------------------------------------------------------- input ---

func _on_swipe(cell: Vector2i, d: int) -> void:
	if state != S.PLAN and state != S.ARCADE:
		return
	var r := sim.place_arrow(cell, d)
	match r:
		"placed", "turned":
			Sfx.play("place", -6.0)
		"full":
			Sfx.play("deny", -6.0)
			_foot.text = "No arrows left. Tap an arrow to pick it up, or CLEAR."
		"no":
			Sfx.play("deny", -12.0)
	_update_hud()


func _on_tap(cell: Vector2i) -> void:
	if state == S.PLAN or state == S.ARCADE:
		if sim.remove_arrow(cell):
			Sfx.play("remove", -6.0)
		elif state == S.PLAN:
			_foot.text = "Swipe across a tile to lay an arrow that way."
		_update_hud()


func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_SPACE, KEY_ENTER:
				if state == S.PLAN:
					_go()
			KEY_R:
				if state == S.RUN or state == S.FAIL:
					_reset_run()
			KEY_ESCAPE:
				if state != S.TITLE:
					_quit_to_menu()


# ------------------------------------------------------------------ loop ---

func _process(dt: float) -> void:
	if view == null:
		return
	var vs := get_viewport().get_visible_rect().size
	if vs != _last_size:
		_last_size = vs
		view.set_area(Rect2(Vector2(10, BAR_H + 6), Vector2(vs.x - 20, vs.y - BAR_H - FOOT_H - 12)))
	match state:
		S.RUN:
			sim.step(minf(dt, 1.0 / 30.0))
			_update_hud()
			if sim.won:
				_on_win()
			elif sim.failed != "":
				_on_fail()
		S.WIN:
			_win_t += dt
			if _win_t > 1.5 and not _overlay.visible:
				var last := level_idx + 1 >= Levels.puzzles().size()
				Sfx.play("win", -4.0)
				var who := "The lizard" if sim.saved == 1 else "All %d lizards" % sim.saved
				_show_result("LIFT OFF!", "%s launched in %.1f seconds." % [who, sim.time] + ("\nThat was the last puzzle. Try Stampede!" if last else ""), [
					["MENU" if last else "NEXT", Color(0.25, 0.6, 0.25), _show_title if last else _next_level],
					["REPLAY", Color(0.4, 0.35, 0.3), _reset_run]])
		S.ARCADE:
			sim.step(minf(dt, 1.0 / 30.0))
			_update_hud()
			var left := sim.time_left()
			if left <= 10.0:
				_tick_t -= dt
				if _tick_t <= 0.0:
					_tick_t = 1.0
					Sfx.play("tick", -6.0)
			if sim.won:
				_on_arcade_end()


func _update_hud() -> void:
	if sim.arcade:
		_hud_mid.text = "%d lizards   %02d s" % [sim.score, int(ceil(sim.time_left()))]
	elif state == S.PLAN:
		_hud_mid.text = "Arrows left: %d" % sim.arrows_left()
	else:
		var total := sim.saved + sim.count(Sim.Kind.LIZARD) + sim.count(Sim.Kind.GOLD)
		_hud_mid.text = "Launched %d / %d" % [sim.saved, total]


# -------------------------------------------------------------- selftest ---

func _selftest() -> void:
	var fails := 0
	var lv := Levels.puzzles()
	for i in lv.size():
		var def: Dictionary = lv[i]
		# Without arrows the puzzle must not solve itself.
		var s0 := Sim.new()
		s0.load_level(def, false)
		s0.start()
		var t := 0.0
		while s0.running and t < Sim.PUZZLE_TIMEOUT + 1.0:
			s0.step(1.0 / 60.0)
			t += 1.0 / 60.0
		var trivial := s0.won
		# With the known solution it must.
		var s := Sim.new()
		s.load_level(def, false)
		var sol := Levels.parse_solution(def.solution)
		var placed_ok := true
		for a in sol:
			if s.place_arrow(a.cell, a.dir) != "placed":
				placed_ok = false
		s.start()
		t = 0.0
		while s.running and t < Sim.PUZZLE_TIMEOUT + 1.0:
			s.step(1.0 / 60.0)
			t += 1.0 / 60.0
		var ok := s.won and placed_ok and not trivial and sol.size() <= int(def.arrows)
		if not ok:
			fails += 1
		print("%s %2d %-16s arrows=%d/%d won=%s time=%.1f fail='%s' trivial=%s" % [
			"PASS" if ok else "FAIL", i + 1, def.name, sol.size(), def.arrows, s.won, s.time, s.failed, trivial])
	# Arrows must survive a reset (TRY AGAIN keeps the player's layout).
	var r := Sim.new()
	r.load_level(lv[0], false)
	r.place_arrow(Vector2i(10, 4), 0)
	r.start()
	r.step(0.5)
	r.reset_run()
	var rok: bool = r.arrows.size() == 1 and not r.running and r.creatures.size() == 1 and r.creatures[0].cell == Vector2i(1, 4)
	if not rok:
		fails += 1
	print("%s reset keeps arrows: arrows=%d creatures=%d" % ["PASS" if rok else "FAIL", r.arrows.size(), r.creatures.size()])
	# Stampede, played sensibly: keep one arrow on each ring in line with a
	# gap in the pen. A round like that must score well.
	var a := Sim.new()
	a.load_level(Levels.stampede(), true)
	a.start()
	var t := 0.0
	var relay := 0.0
	var peak := 0
	while a.running:
		a.step(1.0 / 60.0)
		t += 1.0 / 60.0
		relay -= 1.0 / 60.0
		if relay <= 0.0:
			relay = 9.0
			a.place_arrow(Vector2i(5, 0), 2)
			a.place_arrow(Vector2i(11, 4), 3)
			a.place_arrow(Vector2i(5, 8), 0)
		a.events.clear()
		peak = maxi(peak, a.creatures.size())
	var aok := a.won and t >= Sim.ARCADE_LENGTH - 0.1 and a.score >= 60
	if not aok:
		fails += 1
	print("%s stampede (played): score=%d saved=%d lost=%d peak_creatures=%d time=%.1f" % ["PASS" if aok else "FAIL", a.score, a.saved, a.lost, peak, t])
	# And with random arrows, which just has to hold together.
	var b := Sim.new()
	b.load_level(Levels.stampede(), true)
	b.start()
	var rng := RandomNumberGenerator.new()
	rng.seed = 99
	t = 0.0
	relay = 0.0
	while b.running:
		b.step(1.0 / 60.0)
		t += 1.0 / 60.0
		relay -= 1.0 / 60.0
		if relay <= 0.0:
			relay = 1.5
			b.place_arrow(Vector2i(rng.randi_range(0, Sim.W - 1), rng.randi_range(0, Sim.H - 1)), rng.randi_range(0, 3))
		b.events.clear()
	var bok := b.won and b.score >= 0
	if not bok:
		fails += 1
	print("%s stampede (random): score=%d saved=%d lost=%d time=%.1f" % ["PASS" if bok else "FAIL", b.score, b.saved, b.lost, t])
	print("selftest: %d failure(s)" % fails)
	get_tree().quit(1 if fails > 0 else 0)
