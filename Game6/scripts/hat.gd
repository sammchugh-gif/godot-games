# The thrown cap. Flies out, hovers if the button is held (so it can be
# jumped on) and boomerangs back. While it is out it tells the level what it
# touches: enemies, capturables, coins, crates, bells...
class_name Hat
extends Node3D

enum S { HOME, OUT, HOVER, BACK }

signal returned()

var state := S.HOME
var player: Node3D
var level: Node
var colour := Color(0.9, 0.16, 0.14)
var _from := Vector3.ZERO
var _to := Vector3.ZERO
var _t := 0.0
var _hover_t := 0.0
var _hold := false
var _model: Node3D
var _spin := 0.0

const RANGE := 7.0
const OUT_T := 0.32
const BACK_T := 0.3
const HOVER_MAX := 1.4


func _ready() -> void:
	_model = Models.cap(colour, true, 1.05)
	add_child(_model)
	visible = false


func set_colour(c: Color) -> void:
	colour = c
	if _model:
		_model.queue_free()
		_model = Models.cap(colour, true, 1.05)
		add_child(_model)


func is_out() -> bool:
	return state != S.HOME


func hover_point() -> Vector3:
	return global_position


func throw(from: Vector3, dir: Vector3) -> bool:
	if state != S.HOME:
		return false
	_from = from
	_to = from + dir.normalized() * RANGE
	_t = 0.0
	_hover_t = 0.0
	_hold = true
	state = S.OUT
	global_position = from
	visible = true
	Sfx.play("throw")
	return true


func release_hold() -> void:
	_hold = false


func recall() -> void:
	if state == S.OUT or state == S.HOVER:
		_begin_return()


func _begin_return() -> void:
	state = S.BACK
	_from = global_position
	_t = 0.0


func _physics_process(dt: float) -> void:
	if state == S.HOME:
		return
	_spin += dt * 18.0
	_model.rotation.y = _spin
	match state:
		S.OUT:
			_t += dt / OUT_T
			var e := 1.0 - (1.0 - minf(_t, 1.0)) * (1.0 - minf(_t, 1.0))
			global_position = _from.lerp(_to, e)
			if _t >= 1.0:
				state = S.HOVER
				_hover_t = 0.0
		S.HOVER:
			_hover_t += dt
			global_position.y = _to.y + sin(_hover_t * 6.0) * 0.08
			if not _hold or _hover_t > HOVER_MAX:
				_begin_return()
		S.BACK:
			_t += dt / BACK_T
			var home := player.global_position + Vector3(0, 1.4, 0)
			global_position = _from.lerp(home, minf(_t, 1.0))
			if _t >= 1.0:
				state = S.HOME
				visible = false
				returned.emit()
				Sfx.play("catch", -6.0)
				return
	if level and level.has_method("hat_touch"):
		if level.hat_touch(self, global_position):
			# The level says the hat did something that ends the throw.
			_begin_return()
