# A generic box trigger that calls back once (or every time) when Sonic
# enters. Used for checkpoints, the goal, camera moments, birds, collapses.
class_name Trigger
extends Area3D

signal fired(player: Player)

var once := true
var _done := false


static func make(pos: Vector3, size: Vector3, basis_: Basis = Basis.IDENTITY, once_: bool = true) -> Trigger:
	var t := Trigger.new()
	t.position = pos
	t.basis = basis_
	t.once = once_
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = size
	cs.shape = sh
	t.add_child(cs)
	return t


func _ready() -> void:
	collision_layer = 8
	collision_mask = 2
	body_entered.connect(_on_body)


func _on_body(b: Node3D) -> void:
	if b is Player:
		if once and _done:
			return
		_done = true
		fired.emit(b)


func reset() -> void:
	_done = false
