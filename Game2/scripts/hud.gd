# All UI is constructed in code so the project has no binary scene dependencies.
class_name HUD
extends CanvasLayer

signal retry_pressed()
signal next_pressed()
signal quit_pressed()

const GOLD := Color(1.0, 0.82, 0.28)
const ACCENT := Color(0.55, 0.85, 1.0)
const WARN := Color(1.0, 0.6, 0.25)
const BAD := Color(0.95, 0.3, 0.28)
const GOOD := Color(0.5, 0.88, 0.45)

var _level_label: Label
var _depth_label: Label
var _hint_label: Label
var _finder_label: Label
var _progress_label: Label
var _progress_bar: ProgressBar
var _lives_row: Control
var _lives := 0
var _lives_cap := 8

var _crosshair: Control
var _dig := 0.0

var _banner: Label
var _banner_sub: Label
var _banner_t := 0.0
var _toast: Label
var _toast_t := 0.0

var _boss_panel: Control
var _boss_name: Label
var _boss_bar: ProgressBar
var _boss_tele: Label
var _tele_t := 0.0

var _flash: ColorRect
var _flash_t := 0.0

var _help: Control
var _end_panel: Control
var _end_title: Label
var _end_body: Label
var _end_primary: Button

var _touch_layout := false


func _ready() -> void:
	layer = 10
	_build()


# ------------------------------------------------------------- building ----

func _sb(color: Color, radius: int = 8, border: int = 0, border_col: Color = Color(0, 0, 0, 0)) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = color
	sb.corner_radius_top_left = radius
	sb.corner_radius_top_right = radius
	sb.corner_radius_bottom_left = radius
	sb.corner_radius_bottom_right = radius
	if border > 0:
		sb.border_width_left = border
		sb.border_width_right = border
		sb.border_width_top = border
		sb.border_width_bottom = border
		sb.border_color = border_col
	return sb


func _label(text: String, size: int, colour: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", colour)
	l.add_theme_constant_override("outline_size", 5)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.85))
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


func _bar(colour: Color, height: int) -> ProgressBar:
	var b := ProgressBar.new()
	b.show_percentage = false
	b.custom_minimum_size = Vector2(0, height)
	b.add_theme_stylebox_override("background", _sb(Color(0, 0, 0, 0.55), 5))
	b.add_theme_stylebox_override("fill", _sb(colour, 5))
	b.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return b


func _button(text: String, colour: Color) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(210, 66)
	b.add_theme_font_size_override("font_size", 24)
	b.add_theme_stylebox_override("normal", _sb(colour, 10, 2, colour.lightened(0.4)))
	b.add_theme_stylebox_override("hover", _sb(colour.lightened(0.18), 10, 2, Color(1, 1, 1, 0.8)))
	b.add_theme_stylebox_override("pressed", _sb(colour.darkened(0.2), 10, 2, Color(1, 1, 1, 0.9)))
	b.add_theme_color_override("font_color", Color(1, 1, 1))
	return b


func _build() -> void:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	# --- top left: level and depth ---
	var tl := VBoxContainer.new()
	tl.position = Vector2(22, 18)
	tl.add_theme_constant_override("separation", 2)
	tl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(tl)
	_level_label = _label("LEVEL 1", 30, Color(1, 1, 1))
	tl.add_child(_level_label)
	_depth_label = _label("Surface", 19, Color(0.75, 0.82, 0.9))
	tl.add_child(_depth_label)

	# --- top centre: star progress ---
	var top := VBoxContainer.new()
	top.set_anchors_preset(Control.PRESET_CENTER_TOP)
	top.position = Vector2(-190, 18)
	top.custom_minimum_size = Vector2(380, 0)
	top.add_theme_constant_override("separation", 4)
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(top)
	_progress_label = _label("STARS  0 / 0", 22, GOLD)
	_progress_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_progress_label.custom_minimum_size = Vector2(380, 0)
	top.add_child(_progress_label)
	_progress_bar = _bar(GOLD, 14)
	_progress_bar.custom_minimum_size = Vector2(380, 14)
	top.add_child(_progress_bar)
	_finder_label = _label("", 16, Color(0.98, 0.9, 0.6))
	_finder_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_finder_label.custom_minimum_size = Vector2(380, 0)
	top.add_child(_finder_label)

	# --- top right: lives, drawn as star pips ---
	_lives_row = Control.new()
	_lives_row.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_lives_row.position = Vector2(-430, 84)
	_lives_row.custom_minimum_size = Vector2(410, 52)
	_lives_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_lives_row)
	_lives_row.draw.connect(_draw_lives)

	# --- centre: crosshair with a dig ring ---
	_crosshair = Control.new()
	_crosshair.set_anchors_preset(Control.PRESET_FULL_RECT)
	_crosshair.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_crosshair)
	_crosshair.draw.connect(_draw_crosshair)

	# --- banner + toast ---
	var mid := VBoxContainer.new()
	mid.set_anchors_preset(Control.PRESET_CENTER)
	mid.position = Vector2(-360, -140)
	mid.custom_minimum_size = Vector2(720, 0)
	mid.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(mid)
	_banner = _label("", 54, Color(1, 1, 1))
	_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_banner.custom_minimum_size = Vector2(720, 0)
	mid.add_child(_banner)
	_banner_sub = _label("", 24, Color(0.85, 0.9, 1.0))
	_banner_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_banner_sub.custom_minimum_size = Vector2(720, 0)
	mid.add_child(_banner_sub)

	_toast = _label("", 22, Color(1, 0.95, 0.8))
	_toast.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_toast.position = Vector2(-320, -230)
	_toast.custom_minimum_size = Vector2(640, 0)
	_toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(_toast)

	_hint_label = _label("", 20, Color(0.8, 0.86, 0.95))
	_hint_label.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_hint_label.position = Vector2(-400, -60)
	_hint_label.custom_minimum_size = Vector2(800, 0)
	_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(_hint_label)

	# --- boss panel ---
	_boss_panel = Control.new()
	_boss_panel.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_boss_panel.position = Vector2(-330, 96)
	_boss_panel.custom_minimum_size = Vector2(660, 84)
	_boss_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_boss_panel.visible = false
	root.add_child(_boss_panel)
	var bv := VBoxContainer.new()
	bv.custom_minimum_size = Vector2(660, 0)
	bv.add_theme_constant_override("separation", 6)
	bv.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_boss_panel.add_child(bv)
	_boss_name = _label("BOSS", 27, Color(1, 0.85, 0.8))
	_boss_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_boss_name.custom_minimum_size = Vector2(660, 0)
	bv.add_child(_boss_name)
	_boss_bar = _bar(BAD, 20)
	_boss_bar.custom_minimum_size = Vector2(660, 20)
	bv.add_child(_boss_bar)
	_boss_tele = _label("", 21, WARN)
	_boss_tele.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_boss_tele.custom_minimum_size = Vector2(660, 0)
	bv.add_child(_boss_tele)

	# --- damage flash ---
	_flash = ColorRect.new()
	_flash.set_anchors_preset(Control.PRESET_FULL_RECT)
	_flash.color = Color(0.9, 0.1, 0.1, 0.0)
	_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_flash)

	_build_help(root)
	_build_end(root)


func _build_help(root: Control) -> void:
	_help = Control.new()
	_help.set_anchors_preset(Control.PRESET_FULL_RECT)
	_help.visible = false
	root.add_child(_help)

	var dim := ColorRect.new()
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0, 0, 0, 0.78)
	_help.add_child(dim)

	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_CENTER)
	box.position = Vector2(-360, -230)
	box.custom_minimum_size = Vector2(720, 0)
	box.add_theme_constant_override("separation", 10)
	_help.add_child(box)

	box.add_child(_label("HOW TO PLAY", 40, GOLD))
	var lines := [
		"1.  Every golden star in the level must be found.",
		"     Some sit on the surface. Most are buried underground.",
		"2.  DIG straight down. Star Rock glows gold - break it open.",
		"3.  ZAP the little creatures. Each one drops a star.",
		"4.  RECALL lifts you back to the surface when you are stuck.",
		"5.  All stars found = the seal on the boss cavern breaks.",
		"6.  In the arena your stars are your lives. Every hit costs one.",
		"     Run out and the level restarts. Beat the boss to descend further.",
		"",
		"Touch:  MOVE pad on the middle-left,  drag anywhere else to look.",
		"           Hold the world to DIG,  tap it to ZAP.  UP / DOWN / SPRINT on the right.",
		"Keys:  WASD move,  Space jump,  Ctrl sprint,  Shift sneak.",
		"           LMB dig,  RMB zap,  R recall,  F descend,  H or Tab help.",
	]
	for line in lines:
		box.add_child(_label(line, 21, Color(0.88, 0.92, 1.0)))

	var close := _button("CLOSE", Color(0.2, 0.3, 0.45))
	close.pressed.connect(func() -> void: _help.visible = false)
	var centre := HBoxContainer.new()
	centre.alignment = BoxContainer.ALIGNMENT_CENTER
	centre.custom_minimum_size = Vector2(720, 0)
	centre.add_child(close)
	box.add_child(centre)


func _build_end(root: Control) -> void:
	_end_panel = Control.new()
	_end_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	_end_panel.visible = false
	root.add_child(_end_panel)

	var dim := ColorRect.new()
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0, 0, 0, 0.8)
	_end_panel.add_child(dim)

	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_CENTER)
	box.position = Vector2(-360, -150)
	box.custom_minimum_size = Vector2(720, 0)
	box.add_theme_constant_override("separation", 16)
	_end_panel.add_child(box)

	_end_title = _label("", 58, GOLD)
	_end_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_end_title.custom_minimum_size = Vector2(720, 0)
	box.add_child(_end_title)

	_end_body = _label("", 24, Color(0.9, 0.94, 1.0))
	_end_body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_end_body.custom_minimum_size = Vector2(720, 0)
	_end_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(_end_body)

	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.custom_minimum_size = Vector2(720, 0)
	row.add_theme_constant_override("separation", 22)
	box.add_child(row)

	_end_primary = _button("NEXT LEVEL", Color(0.2, 0.45, 0.28))
	_end_primary.pressed.connect(func() -> void: emit_signal("next_pressed"))
	row.add_child(_end_primary)

	var retry := _button("RETRY", Color(0.42, 0.26, 0.18))
	retry.pressed.connect(func() -> void: emit_signal("retry_pressed"))
	row.add_child(retry)

	var quit := _button("QUIT", Color(0.3, 0.16, 0.18))
	quit.pressed.connect(func() -> void: emit_signal("quit_pressed"))
	row.add_child(quit)


# --------------------------------------------------------------- drawing ---

static func star_points(centre: Vector2, outer: float, inner: float, phase: float = -PI / 2.0) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in 10:
		var r: float = outer if i % 2 == 0 else inner
		var a: float = phase + TAU * float(i) / 10.0
		pts.push_back(centre + Vector2(cos(a), sin(a)) * r)
	return pts


func _draw_lives() -> void:
	var font := ThemeDB.fallback_font
	var w := _lives_row.size.x
	_lives_row.draw_string(font, Vector2(w - 96, 16), "LIVES",
		HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color(1, 1, 1, 0.65))

	var shown: int = mini(_lives, _lives_cap)
	var r := 15.0
	var gap := 34.0
	var x := w - 110.0 - gap
	for i in shown:
		var c := Vector2(x - float(i) * gap, 22.0)
		_lives_row.draw_colored_polygon(star_points(c, r, r * 0.45), GOLD)
		_lives_row.draw_polyline(star_points(c, r, r * 0.45) + PackedVector2Array([star_points(c, r, r * 0.45)[0]]),
			Color(0.4, 0.28, 0.0, 0.9), 1.5, true)
	if _lives > _lives_cap:
		_lives_row.draw_string(font, Vector2(x - float(shown) * gap - 46.0, 30.0),
			"+%d" % (_lives - _lives_cap), HORIZONTAL_ALIGNMENT_LEFT, -1, 22, GOLD)
	if _lives <= 0:
		_lives_row.draw_string(font, Vector2(w - 190, 34), "NO STARS LEFT",
			HORIZONTAL_ALIGNMENT_LEFT, -1, 20, BAD)


func _draw_crosshair() -> void:
	var c := _crosshair.size * 0.5
	var col := Color(1, 1, 1, 0.75)
	_crosshair.draw_line(c + Vector2(-11, 0), c + Vector2(-4, 0), col, 2.0)
	_crosshair.draw_line(c + Vector2(4, 0), c + Vector2(11, 0), col, 2.0)
	_crosshair.draw_line(c + Vector2(0, -11), c + Vector2(0, -4), col, 2.0)
	_crosshair.draw_line(c + Vector2(0, 4), c + Vector2(0, 11), col, 2.0)
	_crosshair.draw_circle(c, 1.6, col)
	if _dig > 0.001:
		_crosshair.draw_arc(c, 22.0, 0, TAU, 40, Color(1, 1, 1, 0.18), 4.0, true)
		_crosshair.draw_arc(c, 22.0, -PI / 2.0, -PI / 2.0 + TAU * _dig, 40, GOLD, 4.0, true)


# ------------------------------------------------------------------- api ---

func set_level(level: int, boss: String) -> void:
	_level_label.text = "LEVEL %d   -   %s" % [level, boss]


func set_progress(found: int, total: int) -> void:
	_progress_label.text = "STARS FOUND   %d / %d" % [found, total]
	_progress_bar.max_value = maxf(1.0, float(total))
	_progress_bar.value = float(found)
	var done: bool = total > 0 and found >= total
	_progress_bar.add_theme_stylebox_override("fill", _sb(GOOD if done else GOLD, 5))


func set_lives(n: int) -> void:
	if n == _lives:
		return
	_lives = n
	_lives_row.queue_redraw()


func set_depth(metres: float) -> void:
	if metres < 1.0:
		_depth_label.text = "Surface"
		_depth_label.add_theme_color_override("font_color", Color(0.75, 0.85, 0.95))
	else:
		_depth_label.text = "Depth  %.0f m" % metres
		var t := clampf(metres / 40.0, 0.0, 1.0)
		_depth_label.add_theme_color_override("font_color",
			Color(0.75, 0.85, 0.95).lerp(Color(1.0, 0.7, 0.4), t))


func set_dig(progress: float) -> void:
	if absf(progress - _dig) < 0.005:
		return
	_dig = progress
	_crosshair.queue_redraw()


func set_hint(text: String) -> void:
	_hint_label.text = text


func set_finder(text: String) -> void:
	_finder_label.text = text


func banner(title: String, sub: String, seconds: float = 2.6) -> void:
	_banner.text = title
	_banner_sub.text = sub
	_banner_t = seconds
	_banner.modulate.a = 1.0
	_banner_sub.modulate.a = 1.0


func toast(text: String) -> void:
	_toast.text = text
	_toast_t = 2.2
	_toast.modulate.a = 1.0


func show_boss(name_text: String) -> void:
	_boss_name.text = name_text
	_boss_panel.visible = true
	_boss_tele.text = ""


func hide_boss() -> void:
	_boss_panel.visible = false


func set_boss_health(current: float, maximum: float) -> void:
	_boss_bar.max_value = maxf(1.0, maximum)
	_boss_bar.value = current
	var frac := current / maxf(1.0, maximum)
	_boss_bar.add_theme_stylebox_override("fill", _sb(BAD if frac > 0.35 else WARN, 5))


func boss_telegraph(text: String) -> void:
	_boss_tele.text = text
	_tele_t = 1.3


func flash_damage() -> void:
	_flash_t = 0.45


func toggle_help() -> void:
	_help.visible = not _help.visible


func help_visible() -> bool:
	return _help.visible


func show_end(title: String, body: String, primary: String, show_primary: bool) -> void:
	_end_title.text = title
	_end_body.text = body
	_end_primary.text = primary
	_end_primary.visible = show_primary
	_end_panel.visible = true


func hide_end() -> void:
	_end_panel.visible = false


func end_visible() -> bool:
	return _end_panel.visible


func set_touch_layout(on: bool) -> void:
	if _touch_layout == on:
		return
	_touch_layout = on
	# Touch buttons live bottom-right, so pull the floating text clear of them.
	# The lives row deliberately stays put; the help button is what moves out
	# of its way (see TouchControls._layout).
	_hint_label.position = Vector2(-400, -152) if on else Vector2(-400, -60)
	_toast.position = Vector2(-320, -300) if on else Vector2(-320, -230)


func _process(delta: float) -> void:
	if _banner_t > 0.0:
		_banner_t -= delta
		if _banner_t < 0.6:
			var a := clampf(_banner_t / 0.6, 0.0, 1.0)
			_banner.modulate.a = a
			_banner_sub.modulate.a = a
		if _banner_t <= 0.0:
			_banner.text = ""
			_banner_sub.text = ""
	if _toast_t > 0.0:
		_toast_t -= delta
		if _toast_t < 0.5:
			_toast.modulate.a = clampf(_toast_t / 0.5, 0.0, 1.0)
		if _toast_t <= 0.0:
			_toast.text = ""
	if _tele_t > 0.0:
		_tele_t -= delta
		if _tele_t <= 0.0:
			_boss_tele.text = ""
	if _flash_t > 0.0:
		_flash_t -= delta
		_flash.color = Color(0.9, 0.12, 0.12, clampf(_flash_t, 0.0, 0.45) * 0.72)
	elif _flash.color.a > 0.0:
		_flash.color = Color(0.9, 0.12, 0.12, 0.0)
