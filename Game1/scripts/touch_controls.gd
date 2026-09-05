# On-screen controls for touch devices, laid out the way Minecraft Pocket
# Edition does it:
#
#   * movement stick on the middle-left,
#   * a small cluster of UP / DOWN / SPRINT buttons in the bottom-right,
#   * everywhere else is the look area, and you mine and place by touching
#     the world directly rather than through a dedicated button.
#
# Two rules keep it from fighting itself when several fingers are down:
#
#   1. Every finger is routed once, on touch-DOWN, to exactly one consumer.
#      A finger that started as a look-drag keeps looking even when it passes
#      straight over the stick or a button -- swiping through a control never
#      operates it.
#   2. Look deltas are measured against that finger's own last position, never
#      InputEventScreenDrag.relative. iOS recycles touch indices, so a finger
#      that lifts and is replaced elsewhere can otherwise report a "relative"
#      that is really the gap between two different fingers, which snaps the
#      camera across the world.
class_name TouchControls
extends CanvasLayer

signal action_pressed(id: String)
signal slot_selected(slot: int)
signal world_tap()

const STICK_RADIUS := 104.0
const KNOB_RADIUS := 46.0
const PAD_RADIUS := 132.0
const DEAD_ZONE := 0.16
const LOOK_SENS := 0.0032

# Tap vs hold vs drag, in the look area.
const TAP_SLOP := 22.0          # px of travel still counted as a tap
const TAP_MS := 260             # released sooner than this is a tap
const HOLD_MS := 180            # held longer than this starts mining

# Any single look step larger than this fraction of the screen is a recycled
# touch index, not a real swipe, and is thrown away.
const MAX_LOOK_STEP := 0.28

var active := false
var hud: HUD

var _canvas: Control
var _size := Vector2(1280, 720)

var _stick_finger := -1
var _stick_centre := Vector2.ZERO      # pad home, middle-left
var _stick_origin := Vector2.ZERO
var _stick_pos := Vector2.ZERO

var _look_finger := -1
var _look_accum := Vector2.ZERO
var _look_last := Vector2.ZERO
var _look_start := Vector2.ZERO
var _look_start_ms := 0
var _look_moved := false
var _holding := false

var _buttons := {}
var _order: Array[String] = []


func _ready() -> void:
	layer = 11
	_canvas = Control.new()
	_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_canvas)
	_canvas.draw.connect(_draw_controls)

	_define("jump", "up")
	_define("sneak", "down")
	_define("sprint", "sprint")
	_define("ready", "ready")
	_define("help", "help")

	get_viewport().size_changed.connect(_layout)
	_layout()
	visible = false


func _define(id: String, kind: String) -> void:
	_buttons[id] = {
		"rect": Rect2(), "kind": kind, "finger": -1,
		"visible": true, "glow": 0.0,
	}
	_order.append(id)


func enable(on: bool) -> void:
	active = on
	visible = on
	set_process(on)
	set_process_input(on)
	_release_all()
	if on:
		_layout()


func _release_all() -> void:
	_stick_finger = -1
	_look_finger = -1
	_holding = false
	_look_accum = Vector2.ZERO
	for id in _order:
		_buttons[id]["finger"] = -1


func _layout() -> void:
	_size = get_viewport().get_visible_rect().size
	var w := _size.x
	var h := _size.y

	# Movement pad: middle of the left edge, where a resting thumb lands.
	_stick_centre = Vector2(PAD_RADIUS + 26.0, h * 0.56)
	_stick_origin = _stick_centre
	_stick_pos = _stick_centre

	# Right cluster, kept tight in the corner so the look area stays large.
	_buttons["jump"]["rect"] = Rect2(w - 156.0, h - 268.0, 122, 112)
	_buttons["sneak"]["rect"] = Rect2(w - 156.0, h - 146.0, 122, 112)
	_buttons["sprint"]["rect"] = Rect2(w - 288.0, h - 208.0, 118, 100)
	# Chips along the top edge, clear of both thumbs.
	_buttons["ready"]["rect"] = Rect2(w - 196.0, 16.0, 178, 68)
	_buttons["help"]["rect"] = Rect2(w - 262.0, 16.0, 58, 68)
	if _canvas != null:
		_canvas.queue_redraw()


func set_context(_phase_is_siege: bool, can_fly: bool, flying: bool, show_ready: bool) -> void:
	# The down button means sneak on foot and descend while flying; the arrow
	# reads the same either way.
	_buttons["sprint"]["visible"] = not flying
	_buttons["ready"]["visible"] = show_ready
	if _canvas != null:
		_canvas.queue_redraw()


func is_down(id: String) -> bool:
	return active and _buttons.has(id) and int(_buttons[id]["finger"]) >= 0


# True while a finger is pressed and held on the world (not a control), which
# is Minecraft's "hold to mine".
func is_world_hold() -> bool:
	return active and _holding


func move_axis() -> Vector2:
	if _stick_finger < 0:
		return Vector2.ZERO
	var v := (_stick_pos - _stick_origin) / STICK_RADIUS
	if v.length() < DEAD_ZONE:
		return Vector2.ZERO
	return v.limit_length(1.0)


func take_look_delta() -> Vector2:
	var d := _look_accum
	_look_accum = Vector2.ZERO
	return d


# ---------------------------------------------------------------- input ---

func _input(event: InputEvent) -> void:
	if not active:
		return
	if event is InputEventScreenTouch:
		if event.pressed:
			_on_down(event.index, event.position)
		else:
			_on_up(event.index, event.position)
		get_viewport().set_input_as_handled()
	elif event is InputEventScreenDrag:
		_on_drag(event.index, event.position)
		get_viewport().set_input_as_handled()


func _on_down(finger: int, pos: Vector2) -> void:
	# A recycled index must never keep its old role.
	_forget(finger)

	if _stick_finger < 0 and pos.distance_to(_stick_centre) <= PAD_RADIUS:
		_stick_finger = finger
		_stick_origin = pos
		_stick_pos = pos
		_canvas.queue_redraw()
		return

	for id in _order:
		var b: Dictionary = _buttons[id]
		if not b["visible"]:
			continue
		if (b["rect"] as Rect2).has_point(pos):
			b["finger"] = finger
			b["glow"] = 1.0
			emit_signal("action_pressed", id)
			_canvas.queue_redraw()
			return

	if hud != null:
		var slot := hud.slot_at(pos)
		if slot >= 0:
			emit_signal("slot_selected", slot)
			return

	if _look_finger < 0:
		_look_finger = finger
		_look_last = pos
		_look_start = pos
		_look_start_ms = Time.get_ticks_msec()
		_look_moved = false
		_holding = false


func _on_drag(finger: int, pos: Vector2) -> void:
	if finger == _stick_finger:
		_stick_pos = pos
		# Let the origin trail the finger so the stick never runs out of travel.
		var off := _stick_pos - _stick_origin
		if off.length() > STICK_RADIUS:
			_stick_origin = _stick_pos - off.normalized() * STICK_RADIUS
		_canvas.queue_redraw()
		return

	if finger == _look_finger:
		var step := pos - _look_last
		_look_last = pos
		# Reject the teleport a recycled touch index produces.
		if step.length() <= _size.length() * MAX_LOOK_STEP:
			_look_accum += step
		if _look_start.distance_to(pos) > TAP_SLOP:
			_look_moved = true
			_holding = false
		return

	# A finger that started on a control keeps it until it lifts; dragging it
	# elsewhere does nothing, and dragging another finger over the control
	# does not operate it either.


func _on_up(finger: int, _pos: Vector2) -> void:
	if finger == _stick_finger:
		_stick_finger = -1
		_stick_origin = _stick_centre
		_stick_pos = _stick_centre
		_canvas.queue_redraw()

	if finger == _look_finger:
		var held := Time.get_ticks_msec() - _look_start_ms
		if not _look_moved and not _holding and held < TAP_MS:
			emit_signal("world_tap")
		_look_finger = -1
		_holding = false

	for id in _order:
		if int(_buttons[id]["finger"]) == finger:
			_buttons[id]["finger"] = -1
			_canvas.queue_redraw()


func _forget(finger: int) -> void:
	if finger == _stick_finger:
		_stick_finger = -1
	if finger == _look_finger:
		_look_finger = -1
		_holding = false
	for id in _order:
		if int(_buttons[id]["finger"]) == finger:
			_buttons[id]["finger"] = -1


func _process(delta: float) -> void:
	# A still finger resting on the world starts mining, Minecraft style.
	if _look_finger >= 0 and not _look_moved and not _holding:
		if Time.get_ticks_msec() - _look_start_ms >= HOLD_MS:
			_holding = true

	var redraw := false
	for id in _order:
		var g: float = _buttons[id]["glow"]
		if g > 0.0:
			_buttons[id]["glow"] = maxf(0.0, g - delta * 3.0)
			redraw = true
	if redraw or _holding:
		_canvas.queue_redraw()


# ----------------------------------------------------------------- draw ---

func _draw_controls() -> void:
	var font := ThemeDB.fallback_font
	_draw_stick(font)

	for id in _order:
		var b: Dictionary = _buttons[id]
		if not b["visible"]:
			continue
		var r: Rect2 = b["rect"]
		var held: bool = int(b["finger"]) >= 0
		var fill := Color(0.09, 0.11, 0.15, 0.46)
		var edge := Color(1, 1, 1, 0.34)
		if id == "ready":
			fill = Color(0.16, 0.4, 0.2, 0.6)
			edge = Color(0.5, 0.9, 0.5, 0.7)
		if held:
			fill = fill.lightened(0.4)
			edge = Color(1, 1, 1, 0.92)
		elif float(b["glow"]) > 0.0:
			edge = edge.lerp(Color(1, 1, 1, 0.9), float(b["glow"]))

		_canvas.draw_rect(r, fill, true)
		_canvas.draw_rect(r, edge, false, 3.0)
		_draw_glyph(font, r, String(b["kind"]))

	# A ring at the crosshair while a held touch is mining.
	if _holding:
		_canvas.draw_arc(_size * 0.5, 26.0, 0, TAU, 32, Color(1, 1, 1, 0.55), 3.0, true)


func _draw_stick(font: Font) -> void:
	var live := _stick_finger >= 0
	var home := _stick_origin if live else _stick_centre

	# The pad itself, so it reads as a place to put a thumb.
	_canvas.draw_circle(_stick_centre, PAD_RADIUS, Color(0.05, 0.07, 0.10, 0.24))
	_canvas.draw_arc(_stick_centre, PAD_RADIUS, 0, TAU, 56, Color(1, 1, 1, 0.16), 2.0, true)

	_canvas.draw_arc(home, STICK_RADIUS, 0, TAU, 48, Color(1, 1, 1, 0.34 if live else 0.24), 3.0, true)
	var knob := home + (_stick_pos - _stick_origin).limit_length(STICK_RADIUS) if live else _stick_centre
	_canvas.draw_circle(knob, KNOB_RADIUS, Color(0.42, 0.78, 1.0, 0.5) if live else Color(1, 1, 1, 0.14))
	_canvas.draw_arc(knob, KNOB_RADIUS, 0, TAU, 32, Color(1, 1, 1, 0.75 if live else 0.3), 2.5, true)
	if not live:
		var tw := font.get_string_size("MOVE", HORIZONTAL_ALIGNMENT_LEFT, -1, 19).x
		_canvas.draw_string(font, _stick_centre + Vector2(-tw * 0.5, 7), "MOVE",
			HORIZONTAL_ALIGNMENT_LEFT, -1, 19, Color(1, 1, 1, 0.45))


func _draw_glyph(font: Font, r: Rect2, kind: String) -> void:
	var c := r.get_center()
	var col := Color(1, 1, 1, 0.92)
	match kind:
		"up":
			_canvas.draw_colored_polygon(PackedVector2Array([
				c + Vector2(0, -26), c + Vector2(28, 14), c + Vector2(-28, 14)]), col)
		"down":
			_canvas.draw_colored_polygon(PackedVector2Array([
				c + Vector2(0, 26), c + Vector2(28, -14), c + Vector2(-28, -14)]), col)
		"sprint":
			# Two chevrons pointing forward.
			for i in 2:
				var ox := -12.0 + float(i) * 20.0
				_canvas.draw_colored_polygon(PackedVector2Array([
					c + Vector2(ox - 8, -20), c + Vector2(ox + 10, 0), c + Vector2(ox - 8, 20),
					c + Vector2(ox - 1, 0)]), col)
		_:
			var label := "READY" if kind == "ready" else "?"
			var fs := 24 if kind == "ready" else 26
			var tw := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
			_canvas.draw_string(font, c + Vector2(-tw * 0.5, fs * 0.36),
				label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, col)
