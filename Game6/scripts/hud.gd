# Everything drawn over the 3D view: hearts, coin and moon counters, the
# moon banner, toasts, and the full-screen panels (title, pause, shop,
# moon list, kingdom cleared). All Control nodes, big enough for thumbs.
class_name Hud
extends CanvasLayer

signal ui(action: String, arg: String)

var touch := false
var _root: Control
var _font: Font
var _hearts := 3
var _coins := 0
var _purple := 0
var _moons := 0
var _moons_total := 24
var _timer := 0.0
var _banner_t := 0.0
var _banner_text := ""
var _banner_sub := ""
var _toast_t := 0.0
var _toast := ""
var _prompt := ""
var _boss_hp := -1
var _boss_name := "KING RAPTOR"
var _kingdom_index := 1
var _kingdom_title := "DINO RIDGE"
var _total_moons := 0
var _panel: Control
var _panel_kind := ""
var _dot := 0.0
var _title_t := 0.0


func _ready() -> void:
	layer = 10
	_font = ThemeDB.fallback_font
	_root = Control.new()
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_root)
	_root.draw.connect(_draw_hud)


func set_touch(on: bool) -> void:
	touch = on


func set_counts(coins: int, purple: int) -> void:
	_coins = coins
	_purple = purple
	_root.queue_redraw()


func set_moons(n: int, total: int) -> void:
	_moons = n
	_moons_total = total


func set_hearts(n: int) -> void:
	_hearts = n


func set_timer(t: float) -> void:
	_timer = t


func set_boss(hp: int, name: String = "") -> void:
	_boss_hp = hp
	if name != "":
		_boss_name = name


func set_kingdom(index: int, title: String, total_moons: int) -> void:
	_kingdom_index = index
	_kingdom_title = title
	_total_moons = total_moons


func banner(text: String, sub: String = "", t: float = 2.6) -> void:
	_banner_text = text
	_banner_sub = sub
	_banner_t = t


func toast(text: String, t: float = 3.0) -> void:
	_toast = text
	_toast_t = t


func prompt(text: String) -> void:
	_prompt = text


func _process(dt: float) -> void:
	_banner_t = maxf(_banner_t - dt, 0.0)
	_toast_t = maxf(_toast_t - dt, 0.0)
	_dot += dt
	_title_t += dt
	_root.queue_redraw()


func _text(pos: Vector2, s: String, size: int, col: Color = Color.WHITE, align: int = HORIZONTAL_ALIGNMENT_LEFT, outline: int = 4) -> void:
	var w := _font.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	var x := pos.x
	if align == HORIZONTAL_ALIGNMENT_CENTER:
		x -= w * 0.5
	elif align == HORIZONTAL_ALIGNMENT_RIGHT:
		x -= w
	if outline > 0:
		_root.draw_string_outline(_font, Vector2(x, pos.y), s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, outline, Color(0.05, 0.05, 0.12, 0.85))
	_root.draw_string(_font, Vector2(x, pos.y), s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, col)


func _heart(c: Vector2, r: float, col: Color) -> void:
	var pts := PackedVector2Array()
	for i in 24:
		var t := TAU * i / 24.0
		var x := 16.0 * pow(sin(t), 3.0)
		var y := 13.0 * cos(t) - 5.0 * cos(2 * t) - 2.0 * cos(3 * t) - cos(4 * t)
		pts.append(c + Vector2(x, -y) * r / 16.0)
	_root.draw_colored_polygon(pts, col)


func _moon_icon(c: Vector2, r: float, col: Color) -> void:
	_root.draw_circle(c, r, col)
	_root.draw_circle(c + Vector2(r * 0.55, -r * 0.2), r * 0.85, Color(0.05, 0.05, 0.12, 0.0))
	# Crescent by overdrawing with the background colour is not possible on a
	# transparent layer, so draw an arc-shaped polygon instead.
	var pts := PackedVector2Array()
	for i in 20:
		var a := -1.2 + 2.4 * i / 19.0
		pts.append(c + Vector2(cos(a), sin(a)) * r * 0.55 + Vector2(r * 0.35, 0))
	for i in 20:
		var a := 1.2 - 2.4 * i / 19.0
		pts.append(c + Vector2(cos(a), sin(a)) * r * 1.02)
	_root.draw_colored_polygon(pts, Color(0.05, 0.05, 0.12, 0.0))


func _draw_hud() -> void:
	var size := _root.size
	if touch and size.y > size.x * 1.02:
		_root.draw_rect(Rect2(Vector2.ZERO, size), Color(0.08, 0.2, 0.45, 0.96))
		_text(Vector2(size.x * 0.5, size.y * 0.45), "TURN YOUR iPAD", 44, Color(1.0, 0.85, 0.25), HORIZONTAL_ALIGNMENT_CENTER)
		_text(Vector2(size.x * 0.5, size.y * 0.45 + 50), "SIDEWAYS TO PLAY", 44, Color(1.0, 0.85, 0.25), HORIZONTAL_ALIGNMENT_CENTER)
		_root.draw_rect(Rect2(size.x * 0.5 - 60, size.y * 0.6, 120, 80), Color(1, 1, 1, 0.9), false, 5.0)
		return
	if _panel_kind == "title":
		_draw_title(size)
		return
	# Hearts.
	for i in 3:
		var c := Vector2(36 + i * 40, 40)
		_heart(c, 17.0, Color(1.0, 0.25, 0.35) if i < _hearts else Color(0.2, 0.2, 0.25, 0.7))
	# Moons, coins, purple: top right.
	var x := size.x - 24
	_text(Vector2(x, 48), "%d / %d" % [_moons, _moons_total], 26, Color(1.0, 0.92, 0.4), HORIZONTAL_ALIGNMENT_RIGHT)
	var w := _font.get_string_size("%d / %d" % [_moons, _moons_total], HORIZONTAL_ALIGNMENT_LEFT, -1, 26).x
	_root.draw_circle(Vector2(x - w - 26, 40), 14.0, Color(1.0, 0.9, 0.3))
	_root.draw_circle(Vector2(x - w - 20, 36), 11.0, Color(0.08, 0.1, 0.2, 0.0))
	_text(Vector2(x, 84), str(_coins), 24, Color(1.0, 0.85, 0.3), HORIZONTAL_ALIGNMENT_RIGHT)
	w = _font.get_string_size(str(_coins), HORIZONTAL_ALIGNMENT_LEFT, -1, 24).x
	_root.draw_circle(Vector2(x - w - 22, 76), 10.0, Color(1.0, 0.8, 0.2))
	_root.draw_arc(Vector2(x - w - 22, 76), 10.0, 0, TAU, 20, Color(0.6, 0.4, 0.1), 2.0)
	_text(Vector2(x, 116), str(_purple), 24, Color(0.85, 0.6, 1.0), HORIZONTAL_ALIGNMENT_RIGHT)
	w = _font.get_string_size(str(_purple), HORIZONTAL_ALIGNMENT_LEFT, -1, 24).x
	var pc := Vector2(x - w - 22, 108)
	var hex := PackedVector2Array()
	for i in 6:
		hex.append(pc + Vector2(cos(TAU * i / 6.0), sin(TAU * i / 6.0)) * 11.0)
	_root.draw_colored_polygon(hex, Color(0.7, 0.35, 0.95))
	# Timer.
	if _timer > 0.0:
		_text(Vector2(size.x * 0.5, 60), "%.1f" % _timer, 40, Color(1.0, 0.5, 0.4) if _timer < 5.0 else Color(1, 1, 1), HORIZONTAL_ALIGNMENT_CENTER)
	# Boss health.
	if _boss_hp >= 0:
		_text(Vector2(size.x * 0.5, size.y - 46), _boss_name, 22, Color(1.0, 0.75, 0.4), HORIZONTAL_ALIGNMENT_CENTER)
		for i in 3:
			var c := Vector2(size.x * 0.5 - 40 + i * 40, size.y - 24)
			_root.draw_circle(c, 12.0, Color(1.0, 0.35, 0.2) if i < _boss_hp else Color(0.25, 0.2, 0.2, 0.7))
	# Banner.
	if _banner_t > 0.0:
		var a := clampf(_banner_t / 0.4, 0.0, 1.0)
		var pop := 1.0 + 0.15 * clampf((_banner_t - 2.2) / 0.4, 0.0, 1.0)
		_root.draw_rect(Rect2(0, size.y * 0.3, size.x, 120), Color(0.05, 0.05, 0.15, 0.55 * a))
		_text(Vector2(size.x * 0.5, size.y * 0.3 + 52), _banner_text, int(44 * pop), Color(1.0, 0.92, 0.4, a), HORIZONTAL_ALIGNMENT_CENTER, 6)
		if _banner_sub != "":
			_text(Vector2(size.x * 0.5, size.y * 0.3 + 98), _banner_sub, 26, Color(1, 1, 1, a), HORIZONTAL_ALIGNMENT_CENTER)
	# Toast.
	if _toast_t > 0.0:
		var a := clampf(_toast_t / 0.5, 0.0, 1.0)
		var y := size.y - (150.0 if touch else 60.0)
		_text(Vector2(size.x * 0.5, y), _toast, 24, Color(1, 1, 1, a), HORIZONTAL_ALIGNMENT_CENTER)
	if _prompt != "":
		var y := size.y - (190.0 if touch else 96.0)
		_text(Vector2(size.x * 0.5, y), _prompt, 22, Color(0.9, 0.95, 1.0), HORIZONTAL_ALIGNMENT_CENTER)


func _draw_title(size: Vector2) -> void:
	var cy := size.y * 0.34
	_root.draw_rect(Rect2(0, cy - 90, size.x, 210), Color(0.05, 0.05, 0.15, 0.45))
	var bob := sin(_title_t * 2.0) * 6.0
	var ts := 84 if size.x > 1100 else 68
	_text(Vector2(size.x * 0.5 + 4, cy + 4 + bob), "DYLAN'S ODYSSEY", ts, Color(0.1, 0.05, 0.05), HORIZONTAL_ALIGNMENT_CENTER, 0)
	_text(Vector2(size.x * 0.5, cy + bob), "DYLAN'S ODYSSEY", ts, Color(1.0, 0.85, 0.25), HORIZONTAL_ALIGNMENT_CENTER, 8)
	_text(Vector2(size.x * 0.5, cy + 56), "KINGDOM %d: %s" % [_kingdom_index, _kingdom_title], 30, Color(0.9, 0.95, 1.0), HORIZONTAL_ALIGNMENT_CENTER)
	_text(Vector2(size.x * 0.5, cy + 100), "Sophia, Rory and Dylan Games, Inc", 18, Color(0.8, 0.85, 0.95), HORIZONTAL_ALIGNMENT_CENTER)
	if fmod(_dot, 1.0) < 0.65:
		_text(Vector2(size.x * 0.5, size.y * 0.78), "TAP TO PLAY" if touch else "PRESS SPACE TO PLAY", 34, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER)
	var help1 := "Left thumb: move.  JUMP: tap again as you land for bigger jumps." if touch else "WASD move   SPACE jump   X hat   C pound / crouch"
	var help2 := "HAT: throw it, jump on it, tap again to call it back.  POUND: tap, then JUMP for a long jump. In the air: slam." if touch else "Q / E or mouse drag: camera   P pause"
	var hs := 17 if size.x > 1100 else 15
	_text(Vector2(size.x * 0.5, size.y * 0.88), help1, hs, Color(0.85, 0.9, 1.0), HORIZONTAL_ALIGNMENT_CENTER)
	_text(Vector2(size.x * 0.5, size.y * 0.88 + hs + 8), help2, hs, Color(0.85, 0.9, 1.0), HORIZONTAL_ALIGNMENT_CENTER)
	if _total_moons > 0:
		_text(Vector2(size.x * 0.5, size.y * 0.66), "Saved game: %d moons in this kingdom, %d in all, %d coins" % [_moons, _total_moons, _coins], 20, Color(1.0, 0.92, 0.5), HORIZONTAL_ALIGNMENT_CENTER)


# ------------------------------------------------------------- panels ----

func show_panel(kind: String, data: Dictionary = {}) -> void:
	hide_panel()
	_panel_kind = kind
	if kind == "title":
		return
	_panel = Control.new()
	_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_panel)
	var bg := ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.03, 0.04, 0.1, 0.72)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_panel.add_child(bg)
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_CENTER)
	box.grow_horizontal = Control.GROW_DIRECTION_BOTH
	box.grow_vertical = Control.GROW_DIRECTION_BOTH
	box.add_theme_constant_override("separation", 10)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	_panel.add_child(box)
	match kind:
		"pause":
			_label(box, "PAUSED", 46, Color(1.0, 0.85, 0.25))
			_button(box, "RESUME", "resume")
			_button(box, "MOON LIST", "moons")
			_button(box, "SOUND: " + ("OFF" if data.get("muted", false) else "ON"), "mute")
			_button(box, "RESET SAVE", "reset")
		"shop":
			_label(box, "CRAZY CAP", 42, Color(1.0, 0.85, 0.25))
			_label(box, "Coins: %d    Purple coins: %d" % [data.get("coins", 0), data.get("purple", 0)], 22, Color(1, 1, 1))
			var items: Array = data.get("items", [])
			var grid := GridContainer.new()
			grid.columns = 2
			grid.add_theme_constant_override("h_separation", 10)
			grid.add_theme_constant_override("v_separation", 8)
			box.add_child(grid)
			for it in items:
				var label: String = it["label"]
				if it.get("owned", false):
					label += "   (owned)" if not it.get("equipped", false) else "   (wearing)"
				else:
					label += "   %d %s" % [it["price"], "purple" if it.get("purple", false) else "coins"]
				_button(grid, label, "buy:" + it["id"], 20)
			_button(box, "CLOSE", "close")
		"moons":
			_label(box, "POWER MOONS  %d / %d" % [data.get("count", 0), data.get("total", 0)], 34, Color(1.0, 0.85, 0.25))
			var scroll := ScrollContainer.new()
			scroll.custom_minimum_size = Vector2(620, 380)
			box.add_child(scroll)
			var list := VBoxContainer.new()
			scroll.add_child(list)
			for m in data.get("list", []):
				var got: bool = m["got"]
				_label(list, ("  *  " if got else "  -  ") + str(m["name"]), 20, Color(1.0, 0.92, 0.5) if got else Color(0.7, 0.72, 0.8))
			_button(box, "BACK", "resume")
		"cleared":
			_label(box, "KINGDOM CLEARED!", 52, Color(1.0, 0.85, 0.25))
			_label(box, "The balloon is powered up. %s is yours, %s!" % [data.get("title", "This kingdom"), Player.HERO_NAME], 24, Color(1, 1, 1))
			if data.get("final", false):
				_label(box, "You have finished Dylan's Odyssey... for now. More kingdoms are coming!", 20, Color(1.0, 0.92, 0.5))
			_label(box, "Keep exploring: %d moons are still out there." % data.get("left", 0), 20, Color(0.9, 0.93, 1.0))
			if data.get("next", "") != "":
				_button(box, "FLY TO " + str(data["next"]), "fly")
			_button(box, "KEEP EXPLORING", "resume")
		"travel":
			_label(box, "THE BALLOON", 46, Color(1.0, 0.85, 0.25))
			_label(box, "Fly to %s?" % data.get("next", "the next kingdom"), 26, Color(1, 1, 1))
			_button(box, "FLY TO " + str(data.get("next", "")), "fly")
			_button(box, "STAY HERE", "resume")
		"dead":
			_label(box, "OUCH, " + Player.HERO_NAME.to_upper() + "!", 46, Color(1.0, 0.5, 0.4))
			_label(box, "Back to the last checkpoint. Lost 10 coins.", 22, Color(1, 1, 1))


func _label(parent: Control, text: String, size: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	var ls := LabelSettings.new()
	ls.font = _font
	ls.font_size = size
	ls.font_color = col
	ls.outline_size = 5
	ls.outline_color = Color(0.05, 0.05, 0.12)
	l.label_settings = ls
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	parent.add_child(l)
	return l


func _button(parent: Control, text: String, action: String, size: int = 26) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(300, 52)
	b.add_theme_font_size_override("font_size", size)
	b.pressed.connect(func(): ui.emit(action, ""))
	parent.add_child(b)
	return b


func hide_panel() -> void:
	_panel_kind = ""
	if _panel:
		_panel.queue_free()
		_panel = null


func panel_kind() -> String:
	return _panel_kind
