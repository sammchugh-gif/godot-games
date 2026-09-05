# On-screen controls for the iPad, laid out for two thumbs in landscape:
#
#   * left thumb: a floating steering slider. Touch anywhere on the left
#     side and drag left / right; the origin is wherever the thumb landed.
#   * right thumb: FIRE (big round button, bottom-right) and AIRBRAKE
#     (wide button just left of it). Hold AIRBRAKE through hairpins.
#   * a small pause chip top-left.
#
# Every finger is routed once, on touch-down, to exactly one control, so
# a thumb that slides over a button never operates it. Throttle is automatic.
class_name TouchControls
extends CanvasLayer

signal fire_pressed()
signal pause_pressed()

const STEER_RANGE := 80.0
const FIRE_R := 68.0

var active := false
var _canvas: Control
var _size := Vector2(1280, 720)
var _steer_finger := -1
var _steer_origin := Vector2.ZERO
var _steer_pos := Vector2.ZERO
var _fire_finger := -1
var _brake_finger := -1
var _fire_rect := Rect2()
var _brake_rect := Rect2()
var _pause_rect := Rect2()
var _fire_glow := 0.0
var _brake_glow := 0.0
var _hint_t := 6.0
var _font: Font
# Diagnostics (shown by the ?debug overlay).
var stat_downs := 0
var stat_drags := 0
var stat_ups := 0
var stat_last := Vector2.ZERO
var stat_last_kind := ""
var stat_js_moves := 0
var _js := false


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
	_install_js_touch()


# iPhone Safari sometimes stops delivering touchmove to the engine (it
# treats the moving finger as a page pan) while taps still arrive. As a
# second source of truth we track finger positions ourselves in the page
# with non-passive listeners that also cancel the pan, and poll them every
# frame for the steering finger. Where the engine's drags work the two agree.
func _install_js_touch() -> void:
	if not OS.has_feature("web"):
		return
	JavaScriptBridge.eval("""
(function () {
	if (window.__vz) { return; }
	var t = {};
	window.__vz = { t: t, moves: 0 };
	function canvasPos(k) {
		var c = document.getElementById('canvas') || document.querySelector('canvas');
		if (!c) { return null; }
		var r = c.getBoundingClientRect();
		return [(k.clientX - r.left) * c.width / r.width, (k.clientY - r.top) * c.height / r.height];
	}
	function upd(e) {
		for (var i = 0; i < e.changedTouches.length; i++) {
			var k = e.changedTouches[i];
			var p = canvasPos(k);
			if (p) { t[k.identifier] = p; }
		}
	}
	function rem(e) {
		for (var i = 0; i < e.changedTouches.length; i++) { delete t[e.changedTouches[i].identifier]; }
	}
	window.addEventListener('touchstart', upd, { passive: false, capture: true });
	window.addEventListener('touchmove', function (e) {
		upd(e);
		window.__vz.moves++;
		if (e.cancelable) { e.preventDefault(); }
	}, { passive: false, capture: true });
	window.addEventListener('touchend', rem, { capture: true });
	window.addEventListener('touchcancel', rem, { capture: true });
})();
""", true)
	_js = true


func _poll_js_touch() -> void:
	if not _js or _steer_finger < 0:
		return
	var raw = JavaScriptBridge.eval("JSON.stringify([window.__vz.moves, window.__vz.t])", true)
	if raw == null:
		return
	var data = JSON.parse_string(str(raw))
	if not (data is Array) or data.size() != 2:
		return
	stat_js_moves = int(data[0])
	var touches: Dictionary = data[1]
	var win := Vector2(DisplayServer.window_get_size())
	if win.x <= 0.0 or win.y <= 0.0:
		return
	var to_design := _size / win
	for key in touches.keys():
		# The engine reports the browser identifier wrapped to a signed 32-bit int.
		var id := int(str(key).to_float())
		if id > 2147483647:
			id -= 4294967296
		if id == _steer_finger:
			var p: Array = touches[key]
			var pos := Vector2(float(p[0]), float(p[1])) * to_design
			if pos.distance_to(_steer_pos) > 0.5:
				_on_drag(_steer_finger, pos)
			return


func enable(on: bool) -> void:
	active = on
	visible = on
	set_process(on)
	_release_all()
	if on:
		_layout()
		_hint_t = 6.0


func _release_all() -> void:
	_steer_finger = -1
	_fire_finger = -1
	_brake_finger = -1


func _layout() -> void:
	_size = get_viewport().get_visible_rect().size
	var w := _size.x
	var h := _size.y
	var bottom := 52.0
	_fire_rect = Rect2(w - 2.0 * FIRE_R - 34.0, h - 2.0 * FIRE_R - bottom, 2.0 * FIRE_R, 2.0 * FIRE_R)
	_brake_rect = Rect2(w - 2.0 * FIRE_R - 34.0 - 24.0 - 200.0, h - 130.0 - bottom, 200.0, 130.0)
	_pause_rect = Rect2(18.0, 18.0, 62.0, 62.0)
	if _canvas != null:
		_canvas.queue_redraw()


func steer() -> float:
	if _steer_finger < 0:
		return 0.0
	return clampf((_steer_pos.x - _steer_origin.x) / STEER_RANGE, -1.0, 1.0)


func brake() -> float:
	return 1.0 if _brake_finger >= 0 else 0.0


func fire_held() -> bool:
	return _fire_finger >= 0


func _input(event: InputEvent) -> void:
	if not active:
		return
	if event is InputEventScreenTouch:
		if event.pressed:
			_on_down(event.index, event.position)
		else:
			_on_up(event.index)
	elif event is InputEventScreenDrag:
		_on_drag(event.index, event.position)


func _on_down(finger: int, pos: Vector2) -> void:
	_forget(finger)
	stat_downs += 1
	stat_last = pos
	stat_last_kind = "down"
	if _pause_rect.grow(10.0).has_point(pos):
		pause_pressed.emit()
		return
	if _fire_rect.grow(14.0).has_point(pos):
		_fire_finger = finger
		_fire_glow = 1.0
		fire_pressed.emit()
		_canvas.queue_redraw()
		return
	if _brake_rect.grow(10.0).has_point(pos):
		_brake_finger = finger
		_brake_glow = 1.0
		_canvas.queue_redraw()
		return
	# Floating slider. The newest touch always takes over, so a finger
	# resting on the screen edge can never block steering.
	if pos.x < _size.x * 0.5 or pos.y < _brake_rect.position.y - 20.0:
		_steer_finger = finger
		_steer_origin = pos
		_steer_pos = pos
		_hint_t = 0.0
		_canvas.queue_redraw()


func _on_drag(finger: int, pos: Vector2) -> void:
	stat_drags += 1
	stat_last = pos
	stat_last_kind = "drag"
	if finger == _steer_finger:
		_steer_pos = pos
		# Let the origin follow if the thumb runs off the range, so the
		# slider never feels stuck at full lock.
		var dx := _steer_pos.x - _steer_origin.x
		if absf(dx) > STEER_RANGE * 1.35:
			_steer_origin.x = _steer_pos.x - signf(dx) * STEER_RANGE * 1.35
		_steer_origin.y = lerpf(_steer_origin.y, pos.y, 0.2)
		_canvas.queue_redraw()


func _on_up(finger: int) -> void:
	stat_ups += 1
	stat_last_kind = "up"
	_forget(finger)
	_canvas.queue_redraw()


func _forget(finger: int) -> void:
	if finger == _steer_finger:
		_steer_finger = -1
	if finger == _fire_finger:
		_fire_finger = -1
	if finger == _brake_finger:
		_brake_finger = -1


func _process(delta: float) -> void:
	_poll_js_touch()
	_fire_glow = maxf(_fire_glow - delta * 3.0, 0.0)
	_brake_glow = maxf(_brake_glow - delta * 3.0, 0.0)
	_hint_t = maxf(_hint_t - delta, 0.0)
	_canvas.queue_redraw()


func _draw_controls() -> void:
	var c := _canvas
	var cyan := Color(0.0, 0.95, 1.0)
	var pink := Color(1.0, 0.3, 0.8)
	# Steering slider.
	if _steer_finger >= 0:
		var o := _steer_origin
		var bar := Rect2(o.x - STEER_RANGE - 16.0, o.y - 12.0, STEER_RANGE * 2.0 + 32.0, 24.0)
		c.draw_rect(bar, Color(0, 0, 0, 0.35))
		c.draw_rect(bar, Color(cyan, 0.8), false, 2.0)
		var kx := clampf(_steer_pos.x, o.x - STEER_RANGE, o.x + STEER_RANGE)
		c.draw_circle(Vector2(kx, o.y), 30.0, Color(cyan, 0.35))
		c.draw_circle(Vector2(kx, o.y), 30.0, Color(cyan, 0.9), false, 3.0)
		c.draw_line(Vector2(o.x, o.y - 18.0), Vector2(o.x, o.y + 18.0), Color(1, 1, 1, 0.6), 2.0)
	elif _hint_t > 0.0:
		var a := clampf(_hint_t, 0.0, 1.0) * 0.8
		var p := Vector2(_size.x * 0.22, _size.y * 0.62)
		c.draw_circle(p, 34.0, Color(cyan, 0.15 * a))
		c.draw_circle(p, 34.0, Color(cyan, 0.6 * a), false, 3.0)
		_label(c, "<  STEER  >", p + Vector2(0, 66), 22, Color(1, 1, 1, a), true)
		_label(c, "touch and drag anywhere here", p + Vector2(0, 92), 16, Color(1, 1, 1, a * 0.8), true)
	# Airbrake.
	var br := _brake_rect
	var held := _brake_finger >= 0
	c.draw_rect(br, Color(pink, 0.42 if held else 0.16 + _brake_glow * 0.2))
	c.draw_rect(br, Color(pink, 0.95 if held else 0.7), false, 3.0)
	_label(c, "AIRBRAKE", br.get_center() + Vector2(0, -6), 26, Color(1, 1, 1, 0.95), true)
	_label(c, "hold in tight turns", br.get_center() + Vector2(0, 26), 14, Color(1, 1, 1, 0.7), true)
	# Fire.
	var fc := _fire_rect.get_center()
	var fheld := _fire_finger >= 0
	c.draw_circle(fc, FIRE_R, Color(cyan, 0.42 if fheld else 0.16 + _fire_glow * 0.25))
	c.draw_circle(fc, FIRE_R, Color(cyan, 0.95 if fheld else 0.75), false, 3.0)
	_label(c, "FIRE", fc + Vector2(0, 2), 30, Color(1, 1, 1, 0.95), true)
	# Pause.
	var pr := _pause_rect
	c.draw_rect(pr, Color(0, 0, 0, 0.35))
	c.draw_rect(pr, Color(1, 1, 1, 0.55), false, 2.0)
	c.draw_rect(Rect2(pr.position + Vector2(18, 16), Vector2(9, 30)), Color(1, 1, 1, 0.9))
	c.draw_rect(Rect2(pr.position + Vector2(35, 16), Vector2(9, 30)), Color(1, 1, 1, 0.9))


func _label(c: Control, text: String, at: Vector2, size: int, col: Color, centered: bool) -> void:
	var w := _font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	var p := at + Vector2(-w * 0.5 if centered else 0.0, size * 0.35)
	c.draw_string_outline(_font, p, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, 4, Color(0, 0, 0, col.a * 0.8))
	c.draw_string(_font, p, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, col)
