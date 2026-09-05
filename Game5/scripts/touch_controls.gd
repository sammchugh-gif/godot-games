# On-screen controls for phones and tablets, laid out for two thumbs:
#
#   * left thumb: a floating stick. Touch anywhere on the left 45% of the
#     screen and drag; the origin is wherever the thumb landed.
#   * right thumb: JUMP (big, bottom-right), SPIN (left of it), BOOST
#     (above JUMP) and DRIFT (above SPIN).
#   * a small pause chip top-right.
#
# Buttons and the stick drive the normal input actions through
# Input.action_press / action_release, so the player code has one path.
class_name TouchControls
extends CanvasLayer

signal pause_pressed()

const STICK_RANGE := 70.0

var active := false
var _canvas: Control
var _size := Vector2(1280, 720)
var _stick_finger := -1
var _stick_origin := Vector2.ZERO
var _stick_pos := Vector2.ZERO
var _buttons := {}       # name -> {rect, action, finger, color, label, glow}
var _pause_rect := Rect2()
var _font: Font


func _ready() -> void:
	layer = 11
	_font = ThemeDB.fallback_font
	_canvas = Control.new()
	_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_canvas)
	_canvas.draw.connect(_draw_controls)
	get_viewport().size_changed.connect(_layout)
	_layout()
	visible = false
	set_process(false)


func enable(on: bool) -> void:
	active = on
	visible = on
	set_process(on)
	if not on:
		_release_all()


func _layout() -> void:
	_size = _canvas.size if _canvas.size.x > 10 else Vector2(1280, 720)
	var m := 26.0
	var jr := 62.0
	_buttons = {
		"jump": {"rect": Rect2(_size.x - m - jr * 2, _size.y - m - jr * 2, jr * 2, jr * 2), "action": "jump", "finger": -1,
			"color": Color(0.25, 0.6, 1.0), "label": "JUMP", "glow": 0.0},
		"spin": {"rect": Rect2(_size.x - m - jr * 2 - 16 - 100, _size.y - m - 100, 100, 100), "action": "spin", "finger": -1,
			"color": Color(1.0, 0.75, 0.2), "label": "SPIN", "glow": 0.0},
		"boost": {"rect": Rect2(_size.x - m - jr * 2 + 6, _size.y - m - jr * 2 - 16 - 96, 112, 96), "action": "boost", "finger": -1,
			"color": Color(0.5, 0.85, 1.0), "label": "BOOST", "glow": 0.0},
		"drift": {"rect": Rect2(_size.x - m - jr * 2 - 16 - 100, _size.y - m - 100 - 16 - 80, 100, 80), "action": "drift", "finger": -1,
			"color": Color(0.9, 0.5, 1.0), "label": "DRIFT", "glow": 0.0},
	}
	_pause_rect = Rect2(_size.x - 74, 16, 58, 40)
	_canvas.queue_redraw()


func _release_all() -> void:
	for k in _buttons:
		if _buttons[k]["finger"] >= 0:
			Input.action_release(_buttons[k]["action"])
			_buttons[k]["finger"] = -1
	_stick_finger = -1
	_set_stick(Vector2.ZERO)


func _set_stick(v: Vector2) -> void:
	Input.action_press("move_right", maxf(v.x, 0.0))
	Input.action_press("move_left", maxf(-v.x, 0.0))
	Input.action_press("move_down", maxf(v.y, 0.0))
	Input.action_press("move_up", maxf(-v.y, 0.0))
	if v == Vector2.ZERO:
		for a in ["move_right", "move_left", "move_down", "move_up"]:
			Input.action_release(a)


func _input(event: InputEvent) -> void:
	if not active:
		return
	if event is InputEventScreenTouch:
		var e := event as InputEventScreenTouch
		if e.pressed:
			_down(e.index, e.position)
		else:
			_up(e.index)
	elif event is InputEventScreenDrag:
		var d := event as InputEventScreenDrag
		if d.index == _stick_finger:
			_stick_pos = d.position
			_update_stick()


func _down(idx: int, pos: Vector2) -> void:
	if _pause_rect.has_point(pos):
		pause_pressed.emit()
		return
	for k in _buttons:
		var b: Dictionary = _buttons[k]
		if (b["rect"] as Rect2).grow(10).has_point(pos) and b["finger"] < 0:
			b["finger"] = idx
			b["glow"] = 1.0
			Input.action_press(b["action"])
			_canvas.queue_redraw()
			return
	if pos.x < _size.x * 0.45 and _stick_finger < 0:
		_stick_finger = idx
		_stick_origin = pos
		_stick_pos = pos
		_update_stick()


func _up(idx: int) -> void:
	for k in _buttons:
		var b: Dictionary = _buttons[k]
		if b["finger"] == idx:
			b["finger"] = -1
			Input.action_release(b["action"])
	if idx == _stick_finger:
		_stick_finger = -1
		_set_stick(Vector2.ZERO)
	_canvas.queue_redraw()


func _update_stick() -> void:
	var d := _stick_pos - _stick_origin
	if d.length() > STICK_RANGE:
		d = d.normalized() * STICK_RANGE
	var v := d / STICK_RANGE
	# Dead zone with a smooth ramp.
	var l := v.length()
	if l < 0.12:
		v = Vector2.ZERO
	else:
		v = v.normalized() * clampf((l - 0.12) / 0.88, 0.0, 1.0)
	_set_stick(v)
	_canvas.queue_redraw()


func _process(dt: float) -> void:
	var any := false
	for k in _buttons:
		if _buttons[k]["glow"] > 0.0:
			_buttons[k]["glow"] = maxf(_buttons[k]["glow"] - dt * 4.0, 0.0)
			any = true
	if any or _stick_finger >= 0:
		_canvas.queue_redraw()


func _draw_controls() -> void:
	# Stick.
	if _stick_finger >= 0:
		_canvas.draw_circle(_stick_origin, STICK_RANGE + 10.0, Color(1, 1, 1, 0.10))
		_canvas.draw_arc(_stick_origin, STICK_RANGE + 10.0, 0, TAU, 40, Color(1, 1, 1, 0.35), 2.0, true)
		var d := _stick_pos - _stick_origin
		if d.length() > STICK_RANGE:
			d = d.normalized() * STICK_RANGE
		_canvas.draw_circle(_stick_origin + d, 30.0, Color(1, 1, 1, 0.45))
	else:
		var hint := Vector2(_size.x * 0.16, _size.y * 0.72)
		_canvas.draw_arc(hint, 46.0, 0, TAU, 32, Color(1, 1, 1, 0.12), 2.0, true)
		_canvas.draw_circle(hint, 16.0, Color(1, 1, 1, 0.12))
	# Buttons.
	for k in _buttons:
		var b: Dictionary = _buttons[k]
		var r: Rect2 = b["rect"]
		var c: Color = b["color"]
		var pressed: bool = b["finger"] >= 0
		var glow: float = b["glow"]
		var a := 0.55 if pressed else 0.28
		if k == "jump":
			_canvas.draw_circle(r.get_center(), r.size.x * 0.5, Color(c.r, c.g, c.b, a + glow * 0.2))
			_canvas.draw_arc(r.get_center(), r.size.x * 0.5, 0, TAU, 48, Color(1, 1, 1, 0.5), 3.0, true)
		else:
			_canvas.draw_rect(r, Color(c.r, c.g, c.b, a + glow * 0.2))
			_canvas.draw_rect(r, Color(1, 1, 1, 0.45), false, 2.0)
		var txt: String = b["label"]
		var sz := 20
		var w := _font.get_string_size(txt, HORIZONTAL_ALIGNMENT_CENTER, -1, sz).x
		_canvas.draw_string(_font, r.get_center() + Vector2(-w * 0.5, 7), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, sz, Color(1, 1, 1, 0.9))
	# Pause chip.
	_canvas.draw_rect(_pause_rect, Color(0, 0, 0, 0.35))
	_canvas.draw_rect(_pause_rect, Color(1, 1, 1, 0.45), false, 2.0)
	_canvas.draw_rect(Rect2(_pause_rect.position + Vector2(20, 11), Vector2(6, 18)), Color(1, 1, 1, 0.9))
	_canvas.draw_rect(Rect2(_pause_rect.position + Vector2(32, 11), Vector2(6, 18)), Color(1, 1, 1, 0.9))
