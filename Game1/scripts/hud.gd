# All UI is constructed in code so the project has no binary scene dependencies.
class_name HUD
extends CanvasLayer

signal restart_pressed()
signal quit_pressed()

const ACCENT := Color(0.42, 0.78, 1.0)
const WARN := Color(1.0, 0.55, 0.2)
const BAD := Color(0.95, 0.28, 0.24)
const GOOD := Color(0.45, 0.85, 0.42)

var atlas: Texture2D

var _crosshair: Control
var _phase_label: Label
var _timer_label: Label
var _hint_label: Label
var _banner: Label
var _banner_sub: Label
var _toast: Label
var _toast_t := 0.0

var _hp_bar: ProgressBar
var _hp_label: Label
var _credits_label: Label
var _integrity_bar: ProgressBar
var _integrity_label: Label
var _boss_panel: Control
var _boss_bar: ProgressBar
var _boss_name: Label
var _boss_tele: Label
var _boss_title := "SIEGE GOLEM"
var _tele_t := 0.0

var _slots: Array[Dictionary] = []
var _stats_box: VBoxContainer
var _hotbar_box: HBoxContainer
var _touch_layout := false
var _help: Control
var _end_panel: Control
var _end_title: Label
var _end_body: Label
var _damage_flash: ColorRect
var _flash_t := 0.0
var _click_prompt: PanelContainer


func _ready() -> void:
	layer = 10
	_build()


func _sb(color: Color, radius: int = 6, border: int = 0, border_col: Color = Color(0, 0, 0, 0)) -> StyleBoxFlat:
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


func _label(text: String, size: int, col: Color = Color.WHITE) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.75))
	l.add_theme_constant_override("shadow_offset_x", 1)
	l.add_theme_constant_override("shadow_offset_y", 2)
	l.add_theme_constant_override("outline_size", 5)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.65))
	return l


func _bar(fill: Color, height: int, width: int) -> ProgressBar:
	var p := ProgressBar.new()
	p.min_value = 0.0
	p.max_value = 1.0
	p.value = 1.0
	p.show_percentage = false
	p.custom_minimum_size = Vector2(width, height)
	p.add_theme_stylebox_override("background", _sb(Color(0.05, 0.06, 0.09, 0.8), 4, 2, Color(0, 0, 0, 0.6)))
	p.add_theme_stylebox_override("fill", _sb(fill, 3))
	return p


func _build() -> void:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	_damage_flash = ColorRect.new()
	_damage_flash.set_anchors_preset(Control.PRESET_FULL_RECT)
	_damage_flash.color = Color(0.8, 0.05, 0.05, 0.0)
	_damage_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_damage_flash)

	_build_crosshair(root)
	_build_click_prompt(root)
	_build_top(root)
	_build_bottom_left(root)
	_build_hotbar(root)
	_build_banner(root)
	_build_help(root)
	_build_end(root)


func _build_crosshair(root: Control) -> void:
	_crosshair = Control.new()
	_crosshair.set_anchors_preset(Control.PRESET_CENTER)
	_crosshair.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_crosshair.custom_minimum_size = Vector2(24, 24)
	root.add_child(_crosshair)
	_crosshair.draw.connect(func() -> void:
		var c := Color(1, 1, 1, 0.85)
		var g := 4.0
		var l := 9.0
		_crosshair.draw_line(Vector2(-l - g, 0), Vector2(-g, 0), c, 2.0)
		_crosshair.draw_line(Vector2(g, 0), Vector2(l + g, 0), c, 2.0)
		_crosshair.draw_line(Vector2(0, -l - g), Vector2(0, -g), c, 2.0)
		_crosshair.draw_line(Vector2(0, g), Vector2(0, l + g), c, 2.0)
		_crosshair.draw_circle(Vector2.ZERO, 1.6, c))


# Shown whenever the mouse is not captured. A browser will not grant pointer
# lock until the player clicks, so without this the game looks broken on load.
func _build_click_prompt(root: Control) -> void:
	_click_prompt = PanelContainer.new()
	_click_prompt.set_anchors_preset(Control.PRESET_CENTER)
	_click_prompt.anchor_left = 0.5
	_click_prompt.anchor_top = 0.5
	_click_prompt.anchor_right = 0.5
	_click_prompt.anchor_bottom = 0.5
	_click_prompt.offset_left = -190
	_click_prompt.offset_right = 190
	_click_prompt.offset_top = 60
	_click_prompt.offset_bottom = 118
	_click_prompt.add_theme_stylebox_override("panel", _sb(Color(0.04, 0.05, 0.08, 0.88), 8, 2, ACCENT))
	_click_prompt.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_click_prompt.visible = false
	root.add_child(_click_prompt)

	var l := _label("Click to play", 22, Color(1, 1, 1, 0.95))
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_click_prompt.add_child(l)


func set_click_prompt(show: bool) -> void:
	if _click_prompt.visible != show:
		_click_prompt.visible = show


func _build_top(root: Control) -> void:
	var top := VBoxContainer.new()
	top.set_anchors_preset(Control.PRESET_CENTER_TOP)
	top.anchor_left = 0.5
	top.anchor_right = 0.5
	top.offset_left = -320
	top.offset_right = 320
	top.offset_top = 14
	top.alignment = BoxContainer.ALIGNMENT_CENTER
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(top)

	_phase_label = _label("BUILD PHASE", 22, ACCENT)
	_phase_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top.add_child(_phase_label)

	_timer_label = _label("2:00", 40)
	_timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top.add_child(_timer_label)

	_hint_label = _label("", 15, Color(1, 1, 1, 0.75))
	_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top.add_child(_hint_label)

	_boss_panel = VBoxContainer.new()
	_boss_panel.alignment = BoxContainer.ALIGNMENT_CENTER
	_boss_panel.visible = false
	_boss_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(_boss_panel)

	_boss_name = _label("THE SIEGE GOLEM", 18, Color(1, 0.6, 0.35))
	_boss_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_boss_panel.add_child(_boss_name)

	var bcenter := CenterContainer.new()
	_boss_panel.add_child(bcenter)
	_boss_bar = _bar(Color(0.88, 0.24, 0.2), 20, 560)
	bcenter.add_child(_boss_bar)

	_boss_tele = _label("", 20, WARN)
	_boss_tele.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_boss_panel.add_child(_boss_tele)


func _build_bottom_left(root: Control) -> void:
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	box.offset_left = 22
	box.offset_top = -132
	box.offset_bottom = -22
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(box)
	_stats_box = box

	_hp_label = _label("HEALTH", 13, Color(1, 1, 1, 0.8))
	box.add_child(_hp_label)
	_hp_bar = _bar(GOOD, 18, 196)
	box.add_child(_hp_bar)

	_integrity_label = _label("FORT INTEGRITY", 13, Color(1, 1, 1, 0.8))
	box.add_child(_integrity_label)
	_integrity_bar = _bar(ACCENT, 14, 196)
	box.add_child(_integrity_bar)

	_credits_label = _label("CREDITS  350", 20, Color(1, 0.87, 0.4))
	box.add_child(_credits_label)


func _build_hotbar(root: Control) -> void:
	var bar := HBoxContainer.new()
	bar.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	bar.anchor_left = 0.5
	bar.anchor_right = 0.5
	bar.offset_left = -430
	bar.offset_right = 430
	bar.offset_top = -104
	bar.offset_bottom = -16
	bar.alignment = BoxContainer.ALIGNMENT_CENTER
	bar.add_theme_constant_override("separation", 6)
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(bar)
	_hotbar_box = bar

	for i in Blocks.HOTBAR.size():
		var id: int = Blocks.HOTBAR[i]
		var panel := PanelContainer.new()
		panel.custom_minimum_size = Vector2(78, 84)
		panel.add_theme_stylebox_override("panel", _sb(Color(0.06, 0.07, 0.1, 0.72), 6, 2, Color(0, 0, 0, 0.5)))
		bar.add_child(panel)

		var v := VBoxContainer.new()
		v.alignment = BoxContainer.ALIGNMENT_CENTER
		v.add_theme_constant_override("separation", 0)
		panel.add_child(v)

		var num := _label("%d" % (i + 1), 11, Color(1, 1, 1, 0.55))
		num.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(num)

		var icon := TextureRect.new()
		icon.custom_minimum_size = Vector2(32, 32)
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		v.add_child(icon)

		var nm := _label(Blocks.name_of(id), 11)
		nm.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(nm)

		var cost := _label("%d" % Blocks.cost(id), 13, Color(1, 0.87, 0.4))
		cost.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(cost)

		_slots.append({"panel": panel, "icon": icon, "cost": cost, "name": nm, "num": num, "id": id})

	_toast = _label("", 17, WARN)
	_toast.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_toast.anchor_left = 0.5
	_toast.anchor_right = 0.5
	_toast.offset_left = -400
	_toast.offset_right = 400
	_toast.offset_top = -140
	_toast.offset_bottom = -114
	_toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_toast)


func attach_atlas(tex: Texture2D) -> void:
	atlas = tex
	for s in _slots:
		var at := AtlasTexture.new()
		at.atlas = tex
		at.region = Blocks.atlas_region_px(Blocks.tile_for_face(int(s["id"]), 2))
		(s["icon"] as TextureRect).texture = at


func _build_banner(root: Control) -> void:
	var v := VBoxContainer.new()
	v.set_anchors_preset(Control.PRESET_CENTER)
	v.anchor_left = 0.5
	v.anchor_right = 0.5
	v.offset_left = -500
	v.offset_right = 500
	v.offset_top = -130
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(v)

	_banner = _label("", 54, Color(1, 0.95, 0.8))
	_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_banner)

	_banner_sub = _label("", 20, Color(1, 1, 1, 0.85))
	_banner_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_banner_sub)


func _build_help(root: Control) -> void:
	_help = PanelContainer.new()
	_help.set_anchors_preset(Control.PRESET_CENTER)
	_help.anchor_left = 0.5
	_help.anchor_top = 0.5
	_help.anchor_right = 0.5
	_help.anchor_bottom = 0.5
	_help.offset_left = -330
	_help.offset_right = 330
	_help.offset_top = -240
	_help.offset_bottom = 240
	_help.add_theme_stylebox_override("panel", _sb(Color(0.04, 0.05, 0.08, 0.93), 10, 2, ACCENT))
	_help.visible = false
	root.add_child(_help)

	var m := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		m.add_theme_constant_override("margin_" + side, 24)
	_help.add_child(m)

	var v := VBoxContainer.new()
	m.add_child(v)
	v.add_child(_label("BLOCKFORT — CONTROLS", 26, ACCENT))
	v.add_child(_label("", 8))
	var lines := [
		"WASD                      Move",
		"Space                     Jump   |   double-tap: fly",
		"Ctrl                      Sprint",
		"Shift                     Sneak   |   descend while flying",
		"Mouse                     Look   |   Wheel: change block",
		"1 - 9                     Pick block",
		"Right click               Place block",
		"Left click                Swing axe: mines blocks, wounds the boss",
		"                          Removing your own block refunds it",
		"Middle click              Pick block (eyedropper)",
		"F                         Toggle fly (build phase only)",
		"E                         Finish building, start the siege",
		"Tab                       This panel",
		"Esc                       Release / recapture mouse",
		"F9                        Toggle the touch overlay",
		"",
		"ON TOUCH (iPad)",
		"Move stick sits on the middle-left. Drag anywhere else to look.",
		"Tap the world to place, hold to mine or swing. UP / DOWN / SPRINT",
		"sit by your right thumb; double-tap UP to fly. Tap a hotbar tile
to pick a block. READY starts the siege.",
		"",
		"HOW TO WIN",
		"Spend credits raising a fort, then survive the golem.",
		"Damage it enough and the round is yours.",
		"",
		"Traps do the heavy lifting:",
		"  TNT     detonates when the golem closes in",
		"  Spike   wounds it while it stands nearby",
		"  Turret  auto-fires at it from your walls",
		"",
		"You lose if the golem wrecks 75% of what you built,",
		"or if it flattens you.",
	]
	for line in lines:
		var col := Color(1, 1, 1, 0.9)
		if line.begins_with("HOW TO WIN") or line.begins_with("Traps") or line.begins_with("ON TOUCH"):
			col = WARN
		v.add_child(_label(line, 15, col))


func _build_end(root: Control) -> void:
	_end_panel = PanelContainer.new()
	_end_panel.set_anchors_preset(Control.PRESET_CENTER)
	_end_panel.anchor_left = 0.5
	_end_panel.anchor_top = 0.5
	_end_panel.anchor_right = 0.5
	_end_panel.anchor_bottom = 0.5
	_end_panel.offset_left = -300
	_end_panel.offset_right = 300
	_end_panel.offset_top = -160
	_end_panel.offset_bottom = 160
	_end_panel.add_theme_stylebox_override("panel", _sb(Color(0.04, 0.05, 0.08, 0.95), 12, 3, BAD))
	_end_panel.visible = false
	root.add_child(_end_panel)

	var m := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		m.add_theme_constant_override("margin_" + side, 28)
	_end_panel.add_child(m)

	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 14)
	m.add_child(v)

	_end_title = _label("THE FORT HAS FALLEN", 34, BAD)
	_end_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_end_title)

	_end_body = _label("", 18)
	_end_body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_end_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(_end_body)

	var again := Button.new()
	again.text = "Build again  (Enter)"
	again.custom_minimum_size = Vector2(0, 44)
	again.pressed.connect(func() -> void: emit_signal("restart_pressed"))
	v.add_child(again)

	var quit := Button.new()
	quit.text = "Quit"
	quit.custom_minimum_size = Vector2(0, 36)
	quit.pressed.connect(func() -> void: emit_signal("quit_pressed"))
	v.add_child(quit)


# ------------------------------------------------------------- updates ----

func _process(delta: float) -> void:
	if _toast_t > 0.0:
		_toast_t -= delta
		_toast.modulate.a = clampf(_toast_t / 0.6, 0.0, 1.0)
		if _toast_t <= 0.0:
			_toast.text = ""
	if _tele_t > 0.0:
		_tele_t -= delta
		if _tele_t <= 0.0:
			_boss_tele.text = ""
	if _flash_t > 0.0:
		_flash_t -= delta * 2.2
		_damage_flash.color.a = clampf(_flash_t, 0.0, 1.0) * 0.4


func set_phase(text: String, colour: Color) -> void:
	_phase_label.text = text
	_phase_label.add_theme_color_override("font_color", colour)


func set_hint(text: String) -> void:
	_hint_label.text = text


func set_timer(seconds: float, show: bool = true) -> void:
	if not show:
		_timer_label.text = ""
		return
	var s: int = maxi(0, int(ceil(seconds)))
	_timer_label.text = "%d:%02d" % [s / 60, s % 60]
	_timer_label.add_theme_color_override("font_color", BAD if s <= 10 else Color.WHITE)


func set_health(cur: float, maxv: float) -> void:
	_hp_bar.value = cur / maxv
	_hp_label.text = "HEALTH  %d" % int(round(cur))
	var col := GOOD
	if cur / maxv < 0.3:
		col = BAD
	elif cur / maxv < 0.6:
		col = WARN
	_hp_bar.add_theme_stylebox_override("fill", _sb(col, 3))


func flash_damage() -> void:
	_flash_t = 1.0


func set_credits(v: int) -> void:
	_credits_label.text = "CREDITS  %d" % v
	for s in _slots:
		var affordable: bool = v >= Blocks.cost(int(s["id"]))
		(s["cost"] as Label).add_theme_color_override(
			"font_color", Color(1, 0.87, 0.4) if affordable else Color(0.9, 0.35, 0.3))


func set_selected(slot: int) -> void:
	for i in _slots.size():
		var panel: PanelContainer = _slots[i]["panel"]
		if i == slot:
			panel.add_theme_stylebox_override("panel", _sb(Color(0.16, 0.26, 0.36, 0.92), 6, 3, ACCENT))
		else:
			panel.add_theme_stylebox_override("panel", _sb(Color(0.06, 0.07, 0.1, 0.72), 6, 2, Color(0, 0, 0, 0.5)))


func set_integrity(v: float, remaining: int) -> void:
	_integrity_bar.value = v
	_integrity_label.text = "FORT  %d%%   %d blocks" % [int(round(v * 100.0)), remaining]
	var col := ACCENT
	if v < 0.35:
		col = BAD
	elif v < 0.6:
		col = WARN
	_integrity_bar.add_theme_stylebox_override("fill", _sb(col, 3))


func show_boss(visible_now: bool, title: String = "") -> void:
	_boss_panel.visible = visible_now
	if title != "":
		_boss_title = title
		_boss_name.text = title


func set_boss_health(cur: float, maxv: float) -> void:
	_boss_bar.value = cur / maxv if maxv > 0.0 else 0.0
	_boss_name.text = "%s   %d / %d" % [_boss_title, int(ceil(cur)), int(maxv)]


func boss_telegraph(kind: String) -> void:
	_boss_tele.text = "!! %s INCOMING !!" % kind
	_tele_t = 1.2


func banner(title: String, sub: String, hold: float = 2.4) -> void:
	_banner.text = title
	_banner_sub.text = sub
	_banner.modulate.a = 1.0
	_banner_sub.modulate.a = 1.0
	var tw := create_tween()
	tw.tween_interval(hold)
	tw.tween_property(_banner, "modulate:a", 0.0, 0.6)
	tw.parallel().tween_property(_banner_sub, "modulate:a", 0.0, 0.6)


func toast(text: String) -> void:
	_toast.text = text
	_toast.modulate.a = 1.0
	_toast_t = 2.0


func toggle_help() -> void:
	_help.visible = not _help.visible


func help_visible() -> bool:
	return _help.visible


func show_end(won: bool, rounds: int, blocks_placed: int) -> void:
	_end_panel.visible = true
	_end_title.text = "YOU HELD THE LINE" if won else "THE FORT HAS FALLEN"
	_end_title.add_theme_color_override("font_color", GOOD if won else BAD)
	_end_panel.add_theme_stylebox_override("panel", _sb(Color(0.04, 0.05, 0.08, 0.95), 12, 3, GOOD if won else BAD))
	var wave := "wave" if rounds == 1 else "waves"
	_end_body.text = "You survived %d %s and laid %d blocks." % [rounds, wave, blocks_placed]


func hide_end() -> void:
	_end_panel.visible = false


func set_crosshair_visible(v: bool) -> void:
	_crosshair.visible = v


# ---------------------------------------------------------- touch mode ----

# Compacts the hotbar and moves the stat column out of the thumb zone so the
# bottom-left corner is free for the movement stick.
func set_touch_layout(on: bool) -> void:
	if _touch_layout == on:
		return
	_touch_layout = on

	if on:
		_stats_box.set_anchors_preset(Control.PRESET_TOP_LEFT)
		_stats_box.offset_left = 18
		_stats_box.offset_top = 16
		_stats_box.offset_bottom = 150
		# Span the band between the movement pad and the action buttons, so the
		# hotbar never sits under either thumb. Canvas width is always >= 1280
		# (canvas_items stretch, 1280x720 base), so this band always fits.
		_hotbar_box.anchor_left = 0.0
		_hotbar_box.anchor_right = 1.0
		_hotbar_box.offset_left = 200
		_hotbar_box.offset_right = -320
		_hotbar_box.offset_top = -84
		_hotbar_box.offset_bottom = -16
		_hotbar_box.add_theme_constant_override("separation", 4)
	else:
		_stats_box.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
		_stats_box.offset_left = 22
		_stats_box.offset_top = -132
		_stats_box.offset_bottom = -22
		_hotbar_box.anchor_left = 0.5
		_hotbar_box.anchor_right = 0.5
		_hotbar_box.offset_top = -104
		_hotbar_box.offset_bottom = -16
		_hotbar_box.offset_left = -430
		_hotbar_box.offset_right = 430
		_hotbar_box.add_theme_constant_override("separation", 6)

	for s in _slots:
		var panel: PanelContainer = s["panel"]
		var icon: TextureRect = s["icon"]
		panel.custom_minimum_size = Vector2(58, 64) if on else Vector2(78, 84)
		icon.custom_minimum_size = Vector2(26, 26) if on else Vector2(32, 32)
		(s["name"] as Label).visible = not on
		(s["num"] as Label).visible = not on

	_help.offset_top = -230 if on else -240
	_help.offset_bottom = 230 if on else 240


# Index of the hotbar slot under a screen position, or -1.
func slot_at(pos: Vector2) -> int:
	for i in _slots.size():
		var panel: PanelContainer = _slots[i]["panel"]
		var r := panel.get_global_rect()
		# Generous vertical padding: fingers are imprecise.
		r = r.grow_individual(2, 14, 2, 14)
		if r.has_point(pos):
			return i
	return -1
