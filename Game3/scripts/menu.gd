# Menus: title, circuit select, ship select, how-to-play, pause and results.
# Everything is big and finger-sized. Built from Control nodes with one
# neon theme so it looks consistent on the iPad and on a desktop browser.
class_name Menu
extends CanvasLayer

signal race_requested(track_idx: int, team_idx: int)
signal resume_requested()
signal quit_requested()
signal restart_requested()
signal next_track_requested()
signal music_toggled(on: bool)

const CYAN := Color(0.0, 0.95, 1.0)
const PINK := Color(1.0, 0.3, 0.8)

var track_idx := 0
var team_idx := 0
var best_times := {}
var music_on := true

var _root: Control
var _dim: ColorRect
var _screen: Control
var _theme: Theme
var _font: Font


func _ready() -> void:
	layer = 20
	_font = ThemeDB.fallback_font
	_theme = _make_theme()
	_root = Control.new()
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.theme = _theme
	add_child(_root)
	_dim = ColorRect.new()
	_dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_dim.color = Color(0.02, 0.03, 0.06, 0.55)
	_dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(_dim)
	visible = false


func _make_theme() -> Theme:
	var t := Theme.new()
	var normal := StyleBoxFlat.new()
	normal.bg_color = Color(0.05, 0.08, 0.14, 0.85)
	normal.border_color = Color(CYAN, 0.8)
	normal.set_border_width_all(2)
	normal.set_corner_radius_all(14)
	normal.set_content_margin_all(14)
	var hover := normal.duplicate()
	hover.bg_color = Color(0.08, 0.16, 0.24, 0.95)
	hover.border_color = CYAN
	var pressed := normal.duplicate()
	pressed.bg_color = Color(CYAN, 0.35)
	pressed.border_color = Color.WHITE
	var disabled := normal.duplicate()
	disabled.bg_color = Color(0.05, 0.06, 0.08, 0.6)
	disabled.border_color = Color(0.4, 0.4, 0.45, 0.5)
	t.set_stylebox("normal", "Button", normal)
	t.set_stylebox("hover", "Button", hover)
	t.set_stylebox("pressed", "Button", pressed)
	t.set_stylebox("focus", "Button", hover)
	t.set_stylebox("disabled", "Button", disabled)
	t.set_font_size("font_size", "Button", 28)
	t.set_color("font_color", "Button", Color.WHITE)
	t.set_color("font_hover_color", "Button", Color.WHITE)
	t.set_color("font_pressed_color", "Button", Color.WHITE)
	t.set_font_size("font_size", "Label", 22)
	var panel := StyleBoxFlat.new()
	panel.bg_color = Color(0.03, 0.05, 0.09, 0.82)
	panel.border_color = Color(CYAN, 0.5)
	panel.set_border_width_all(2)
	panel.set_corner_radius_all(18)
	panel.set_content_margin_all(24)
	t.set_stylebox("panel", "PanelContainer", panel)
	return t


func _clear() -> void:
	if _screen != null:
		_screen.queue_free()
		_screen = null


func hide_all() -> void:
	_clear()
	visible = false


func _open(dim: float = 0.55) -> VBoxContainer:
	_clear()
	visible = true
	_dim.color.a = dim
	_screen = Control.new()
	_screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.add_child(_screen)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_screen.add_child(center)
	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 16)
	center.add_child(box)
	return box


func _title(box: Container, text: String, size: int = 64, col: Color = CYAN) -> Label:
	var l := Label.new()
	l.text = text
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.8))
	l.add_theme_constant_override("outline_size", 8)
	box.add_child(l)
	return l


func _label(box: Container, text: String, size: int = 22, col: Color = Color(1, 1, 1, 0.9)) -> Label:
	var l := Label.new()
	l.text = text
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.7))
	l.add_theme_constant_override("outline_size", 4)
	box.add_child(l)
	return l


func _button(box: Container, text: String, cb: Callable, min_w: float = 320.0, size: int = 28) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(min_w, 68)
	b.add_theme_font_size_override("font_size", size)
	b.pressed.connect(cb)
	b.focus_mode = Control.FOCUS_NONE
	box.add_child(b)
	return b


# ------------------------------------------------------------- screens ---

func show_title() -> void:
	var box := _open(0.35)
	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 30)
	box.add_child(spacer)
	_title(box, "VELOCITY ZERO", 92)
	_label(box, "ANTI-GRAVITY RACING LEAGUE", 24, Color(PINK, 0.95))
	var sp2 := Control.new()
	sp2.custom_minimum_size = Vector2(0, 24)
	box.add_child(sp2)
	_button(box, "RACE", func(): show_tracks(), 360, 36)
	_button(box, "HOW TO PLAY", func(): show_help(), 360)
	_button(box, "MUSIC: " + ("ON" if music_on else "OFF"), func():
		music_on = not music_on
		music_toggled.emit(music_on)
		show_title(), 360, 22)
	var sp3 := Control.new()
	sp3.custom_minimum_size = Vector2(0, 30)
	box.add_child(sp3)
	_label(box, "Add to Home Screen on the iPad for full screen", 16, Color(1, 1, 1, 0.6))


func show_tracks() -> void:
	var box := _open(0.5)
	_title(box, "SELECT CIRCUIT", 52)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 18)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_child(row)
	var defs := TrackDefs.all()
	for i in defs.size():
		var d: Dictionary = defs[i]
		var b := Button.new()
		b.custom_minimum_size = Vector2(300, 220)
		b.focus_mode = Control.FOCUS_NONE
		var v := VBoxContainer.new()
		v.set_anchors_preset(Control.PRESET_FULL_RECT)
		v.mouse_filter = Control.MOUSE_FILTER_IGNORE
		v.alignment = BoxContainer.ALIGNMENT_CENTER
		v.add_theme_constant_override("separation", 10)
		b.add_child(v)
		var nm := _label(v, d["name"], 30, CYAN)
		nm.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var tg := _label(v, d["tagline"], 16)
		tg.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		tg.custom_minimum_size = Vector2(260, 0)
		tg.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var best: float = best_times.get(d["id"], -1.0)
		var bl := _label(v, "BEST LAP  " + (Hud.fmt_time(best) if best > 0.0 else "--:--.--"), 16, Color(1, 0.85, 0.3))
		bl.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var lp := _label(v, "%d LAPS" % d["laps"], 16, Color(1, 1, 1, 0.7))
		lp.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.pressed.connect(func():
			track_idx = i
			show_ships())
		row.add_child(b)
	_button(box, "BACK", func(): show_title(), 220, 22)


func show_ships() -> void:
	var box := _open(0.5)
	_title(box, "SELECT SHIP", 52)
	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 14)
	box.add_child(grid)
	var teams := TrackDefs.teams()
	for i in teams.size():
		var tm: Dictionary = teams[i]
		var b := Button.new()
		b.custom_minimum_size = Vector2(240, 150)
		b.focus_mode = Control.FOCUS_NONE
		var sb: StyleBoxFlat = _theme.get_stylebox("normal", "Button").duplicate()
		sb.border_color = tm["color"]
		sb.set_border_width_all(3)
		b.add_theme_stylebox_override("normal", sb)
		var sh: StyleBoxFlat = sb.duplicate()
		sh.bg_color = Color(tm["color"], 0.25)
		b.add_theme_stylebox_override("hover", sh)
		var sp: StyleBoxFlat = sb.duplicate()
		sp.bg_color = Color(tm["color"], 0.5)
		b.add_theme_stylebox_override("pressed", sp)
		var v := VBoxContainer.new()
		v.set_anchors_preset(Control.PRESET_FULL_RECT)
		v.mouse_filter = Control.MOUSE_FILTER_IGNORE
		v.alignment = BoxContainer.ALIGNMENT_CENTER
		v.add_theme_constant_override("separation", 4)
		b.add_child(v)
		var nm := _label(v, tm["name"], 26, tm["color"].lerp(Color.WHITE, 0.3))
		nm.mouse_filter = Control.MOUSE_FILTER_IGNORE
		for stat in [["SPEED", "speed"], ["THRUST", "thrust"], ["TURNING", "handling"], ["SHIELD", "shield"]]:
			var bar := _stat_bar(stat[0], float(tm[stat[1]]), tm["color"])
			v.add_child(bar)
		b.pressed.connect(func():
			team_idx = i
			race_requested.emit(track_idx, team_idx))
		grid.add_child(b)
	_label(box, "tap a ship to start the race", 18, Color(1, 1, 1, 0.7))
	_button(box, "BACK", func(): show_tracks(), 220, 22)


func _stat_bar(name: String, value: float, col: Color) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(200, 18)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.draw.connect(func():
		c.draw_string(_font, Vector2(0, 14), name, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(1, 1, 1, 0.8))
		c.draw_rect(Rect2(76, 4, 120, 10), Color(1, 1, 1, 0.15))
		c.draw_rect(Rect2(76, 4, 120 * value, 10), col))
	return c


func show_help() -> void:
	var box := _open(0.6)
	_title(box, "HOW TO PLAY", 48)
	var panel := PanelContainer.new()
	box.add_child(panel)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	panel.add_child(v)
	var lines := [
		"Your ship hovers and accelerates by itself. Eight ships, three laps.",
		"STEER: hold the < > buttons bottom-left, or touch the left half of the screen and drag.",
		"AIRBRAKE: hold the pink button to turn much tighter (you lose a little speed).",
		"FIRE: the round button fires whatever weapon you are carrying.",
		"Fly over glowing ARROWS for a speed boost. Cross a pink strip to pick up a weapon:",
		"ROCKETS (3 shots ahead)   MISSILE (homes on the ship in front)   MINES (drop 3 behind)",
		"SHIELD (7 seconds of immunity)   TURBO (a big burst of speed)",
		"Scraping walls and taking hits drains ENERGY. At zero your ship gets slower. It slowly recovers.",
		"Keyboard: arrows or A/D steer, S / shift airbrake, space fires, P pauses.",
		"",
		"Textures: Godot TPS demo (CC-BY 3.0), Godot demos and three.js (MIT), ambientCG (CC0).",
		"Skies: Poly Haven (CC0), Milky Way by Emil Persson. Music: C. F. Perucchi (CC-BY 3.0), congusbongus (CC0).",
	]
	for ln in lines:
		var l := _label(v, ln, 18)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	_button(box, "BACK", func(): show_title(), 220, 22)


func show_pause() -> void:
	var box := _open(0.6)
	_title(box, "PAUSED", 56)
	_button(box, "RESUME", func(): resume_requested.emit(), 320, 30)
	_button(box, "RESTART", func(): restart_requested.emit(), 320)
	_button(box, "QUIT TO MENU", func(): quit_requested.emit(), 320)


func show_results(results: Array, track_name: String) -> void:
	var box := _open(0.6)
	var me: Dictionary = {}
	for r in results:
		if r["player"]:
			me = r
	var rank: int = me.get("rank", 8)
	var head := "VICTORY!" if rank == 1 else ("PODIUM!" if rank <= 3 else "RACE OVER")
	_title(box, head, 60, Color(1.0, 0.85, 0.3) if rank <= 3 else CYAN)
	_label(box, track_name, 22, Color(PINK, 0.95))
	var panel := PanelContainer.new()
	box.add_child(panel)
	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 28)
	grid.add_theme_constant_override("v_separation", 4)
	panel.add_child(grid)
	for hdr in ["POS", "TEAM", "TIME", "BEST LAP"]:
		_label(grid, hdr, 16, Color(1, 1, 1, 0.6))
	for r in results:
		var col: Color = Color(1, 1, 1) if r["player"] else Color(0.85, 0.85, 0.9)
		var sz := 22 if r["player"] else 18
		_label(grid, "%d" % r["rank"], sz, col)
		var nm := _label(grid, r["name"] + ("  (YOU)" if r["player"] else ""), sz, r["color"].lerp(Color.WHITE, 0.35 if r["player"] else 0.1))
		nm.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		var t: float = r["time"]
		_label(grid, Hud.fmt_time(t) if t >= 0.0 else "+%d lap" % maxi(1, 3 - int(r["laps"])), sz, col)
		_label(grid, Hud.fmt_time(r["best"]) if r["best"] > 0.0 else "--", sz, col)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 14)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_child(row)
	_button(row, "RACE AGAIN", func(): restart_requested.emit(), 240, 24)
	_button(row, "NEXT CIRCUIT", func(): next_track_requested.emit(), 240, 24)
	_button(row, "MENU", func(): quit_requested.emit(), 180, 24)


func show_loading(text: String) -> void:
	var box := _open(0.7)
	_title(box, text, 44)
