# Heads-up display and menus: ring counter, timer, speed, boost gauge, the
# title screen, pause, results with a rank. Everything is drawn with the
# built-in font and shapes so there is nothing to load.
class_name Hud
extends CanvasLayer

signal start_requested()
signal resume_requested()
signal restart_requested()

var rings := 0
var time_s := 0.0
var speed := 0.0
var boost := 0.0
var boosting := false
var boss_hp := -1.0   # 0..1 while the boss fight is on, negative to hide
var running := false
var _root: Control
var _title: Control
var _pause: Control
var _results: Control
var _font: Font
var _msg := ""
var _msg_t := 0.0
var _ring_pulse := 0.0
var _blink := 0.0
var _touch := false
var _fade: ColorRect
var _fade_a := 0.0


func _ready() -> void:
	layer = 10
	_font = ThemeDB.fallback_font
	_root = Control.new()
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_root)
	_root.draw.connect(_draw_hud)
	_fade = ColorRect.new()
	_fade.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade.color = Color(0, 0, 0, 0)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_fade)
	_title = _build_title()
	add_child(_title)
	_pause = _build_pause()
	_pause.visible = false
	add_child(_pause)
	_results = _build_results()
	_results.visible = false
	add_child(_results)


func set_touch(on: bool) -> void:
	_touch = on


func _label(text: String, size: int, color: Color = Color.WHITE, outline: int = 0) -> Label:
	var l := Label.new()
	l.text = text
	var ls := LabelSettings.new()
	ls.font = _font
	ls.font_size = size
	ls.font_color = color
	ls.outline_size = outline
	ls.outline_color = Color(0.05, 0.1, 0.3, 0.9)
	ls.shadow_size = 3
	ls.shadow_color = Color(0, 0, 0, 0.35)
	l.label_settings = ls
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return l


func _panel() -> Control:
	var c := Control.new()
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return c


func _center_box() -> VBoxContainer:
	var v := VBoxContainer.new()
	v.set_anchors_preset(Control.PRESET_CENTER)
	v.grow_horizontal = Control.GROW_DIRECTION_BOTH
	v.grow_vertical = Control.GROW_DIRECTION_BOTH
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 10)
	return v


func _build_title() -> Control:
	var c := _panel()
	var v := _center_box()
	v.name = "Box"
	v.set_anchors_preset(Control.PRESET_CENTER_TOP)
	v.grow_horizontal = Control.GROW_DIRECTION_BOTH
	v.grow_vertical = Control.GROW_DIRECTION_END
	v.position.y = 40.0
	c.add_child(v)
	var logo := _label("SONIC SPIN", 88, Color(1.0, 0.95, 0.85), 10)
	logo.name = "Logo"
	v.add_child(logo)
	var sub := _label("EMERALD SHORE  •  ACT 1", 26, Color(0.85, 0.95, 1.0), 5)
	v.add_child(sub)
	var sp := Control.new()
	sp.custom_minimum_size = Vector2(0, 6)
	v.add_child(sp)
	var sp2 := Control.new()
	sp2.custom_minimum_size = Vector2(0, 330)
	v.add_child(sp2)
	var go := _label("PRESS SPACE OR TAP TO START", 24, Color(1.0, 0.9, 0.3), 5)
	go.name = "Go"
	v.add_child(go)
	var help := _label("MOVE: WASD / arrows / stick      JUMP: Space (again in the air: homing attack)\nSPIN / ROLL / SPIN DASH: X or C      BOOST: Shift      DRIFT: Q / E      PAUSE: Esc      RESTART: R", 16, Color(0.9, 0.95, 1.0), 4)
	help.name = "Help"
	v.add_child(help)
	return c


func _build_pause() -> Control:
	var c := _panel()
	var dim := ColorRect.new()
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0, 0.05, 0.15, 0.55)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.add_child(dim)
	var v := _center_box()
	c.add_child(v)
	v.add_child(_label("PAUSED", 64, Color.WHITE, 8))
	v.add_child(_label("Esc / P to resume      R to restart", 22, Color(0.9, 0.95, 1.0), 4))
	return c


func _build_results() -> Control:
	var c := _panel()
	var dim := ColorRect.new()
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0, 0.05, 0.15, 0.35)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.add_child(dim)
	var v := _center_box()
	v.name = "Box"
	c.add_child(v)
	v.add_child(_label("ACT CLEAR", 72, Color(1.0, 0.9, 0.3), 9))
	var stats := _label("", 30, Color.WHITE, 5)
	stats.name = "Stats"
	v.add_child(stats)
	var rank := _label("", 120, Color(1.0, 0.85, 0.2), 12)
	rank.name = "Rank"
	v.add_child(rank)
	var again := _label("R / tap to run it again", 22, Color(0.9, 0.95, 1.0), 4)
	v.add_child(again)
	return c


func show_title() -> void:
	_title.visible = true
	_results.visible = false
	_pause.visible = false
	running = false
	if _touch:
		(_title.get_node("Box/Go") as Label).text = "TAP TO START"
		(_title.get_node("Box/Help") as Label).text = "Left thumb: move.   Right: JUMP (tap again in the air to home in), SPIN, BOOST, DRIFT."


func show_game() -> void:
	_title.visible = false
	_results.visible = false
	_pause.visible = false
	running = true


func show_pause(on: bool) -> void:
	_pause.visible = on


func show_results(t: float, r: int, total: int) -> void:
	running = false
	_results.visible = true
	var rank := "S" if t < 95.0 else ("A" if t < 120.0 else ("B" if t < 160.0 else "C"))
	if r >= int(total * 0.8) and rank == "A":
		rank = "S"
	(_results.get_node("Box/Stats") as Label).text = "TIME  %s\nRINGS  %d / %d" % [_fmt_time(t), r, total]
	(_results.get_node("Box/Rank") as Label).text = rank


func message(text: String, dur: float = 1.6) -> void:
	_msg = text
	_msg_t = dur


func ring_pulse() -> void:
	_ring_pulse = 1.0


func fade_to(a: float, dur: float) -> void:
	var tw := create_tween()
	tw.tween_property(_fade, "color:a", a, dur)


func _fmt_time(t: float) -> String:
	var m := int(t / 60.0)
	var s := t - m * 60.0
	return "%d:%05.2f" % [m, s]


func _process(dt: float) -> void:
	_msg_t = maxf(_msg_t - dt, 0.0)
	_ring_pulse = maxf(_ring_pulse - dt * 4.0, 0.0)
	_blink += dt
	if _title.visible:
		var go := _title.get_node("Box/Go") as Label
		go.modulate.a = 0.55 + 0.45 * absf(sin(_blink * 3.0))
		var logo := _title.get_node("Box/Logo") as Label
		logo.rotation = sin(_blink * 1.2) * 0.02
		logo.scale = Vector2.ONE * (1.0 + 0.02 * sin(_blink * 2.4))
		logo.pivot_offset = logo.size * 0.5
	_root.queue_redraw()


func _draw_hud() -> void:
	if not running:
		return
	var vp := _root.size
	var f := _font
	# Rings: icon + count, top-left.
	var pulse := 1.0 + _ring_pulse * 0.25
	var rx := 34.0
	var ry := 36.0
	_root.draw_arc(Vector2(rx, ry), 13.0 * pulse, 0.0, TAU, 32, Color(1.0, 0.8, 0.2), 6.0, true)
	_root.draw_arc(Vector2(rx, ry), 13.0 * pulse, 0.0, TAU, 32, Color(1.0, 0.95, 0.6), 2.0, true)
	var rcol := Color.WHITE
	if rings == 0 and fmod(_blink, 0.6) < 0.3:
		rcol = Color(1.0, 0.4, 0.4)
	_shadow_text(Vector2(rx + 24.0, ry + 12.0), "%d" % rings, 34, rcol)
	# Timer under it.
	_shadow_text(Vector2(22.0, 82.0), _fmt_time(time_s), 26, Color(0.95, 0.97, 1.0))
	# Speed, bottom-right, with the boost gauge above it. With touch controls
	# the buttons own the bottom corners, so both move to the bottom centre.
	var kmh := int(round(speed * 3.6))
	var sx := vp.x - 30.0
	var sy := vp.y - 30.0
	if _touch:
		sx = vp.x * 0.5 + 150.0
		sy = vp.y - 26.0
	var stxt := "%d" % kmh
	var w := f.get_string_size(stxt, HORIZONTAL_ALIGNMENT_RIGHT, -1, 46).x
	_shadow_text(Vector2(sx - w - 52.0, sy), stxt, 46, Color(1.0, 1.0, 1.0) if not boosting else Color(0.6, 0.9, 1.0))
	_shadow_text(Vector2(sx - 46.0, sy), "km/h", 18, Color(0.85, 0.9, 1.0))
	# Boost gauge.
	var gw := 220.0
	var gh := 14.0
	var gx := vp.x - 30.0 - gw
	var gy := vp.y - 86.0
	if _touch:
		gw = 260.0
		gx = vp.x * 0.5 - gw * 0.5 - 60.0
		gy = vp.y - 40.0
	_root.draw_rect(Rect2(gx - 2, gy - 2, gw + 4, gh + 4), Color(0, 0.05, 0.15, 0.6))
	_root.draw_rect(Rect2(gx, gy, gw * boost / 100.0, gh), Color(0.35, 0.75, 1.0) if not boosting else Color(0.75, 0.95, 1.0))
	for i in 5:
		_root.draw_line(Vector2(gx + gw * (i + 1) / 5.0, gy), Vector2(gx + gw * (i + 1) / 5.0, gy + gh), Color(0, 0.05, 0.15, 0.5), 2.0)
	_shadow_text(Vector2(gx, gy - 6.0), "BOOST", 16, Color(0.85, 0.92, 1.0))
	# Boss health, top centre.
	if boss_hp >= 0.0:
		var bw := minf(vp.x * 0.5, 520.0)
		var bx := vp.x * 0.5 - bw * 0.5
		var by := 26.0
		_shadow_text(Vector2(bx, by - 4.0), "EGG MOBILE", 18, Color(1.0, 0.85, 0.8))
		_root.draw_rect(Rect2(bx - 2, by, bw + 4, 18), Color(0, 0.02, 0.08, 0.7))
		_root.draw_rect(Rect2(bx, by + 2, bw * boss_hp, 14), Color(1.0, 0.25, 0.2))
		for i in 8:
			_root.draw_line(Vector2(bx + bw * (i + 1) / 8.0, by + 2), Vector2(bx + bw * (i + 1) / 8.0, by + 16), Color(0, 0.02, 0.08, 0.6), 2.0)
	# Message.
	if _msg_t > 0.0:
		var a := clampf(_msg_t * 2.0, 0.0, 1.0)
		var mw := f.get_string_size(_msg, HORIZONTAL_ALIGNMENT_CENTER, -1, 40).x
		_shadow_text(Vector2(vp.x * 0.5 - mw * 0.5, vp.y * 0.28), _msg, 40, Color(1.0, 0.92, 0.4, a))


func _shadow_text(pos: Vector2, text: String, size: int, color: Color) -> void:
	_root.draw_string(_font, pos + Vector2(2, 2), text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, Color(0, 0, 0.1, 0.55 * color.a))
	_root.draw_string(_font, pos, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)
