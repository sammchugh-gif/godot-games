# A run of planks / stone slabs that drop away behind Sonic once he is on
# them. The pieces are static bodies; they get a short delay each and fall
# with a tumble, then are disabled so nothing under the water gets hit.
class_name Collapse
extends Node3D

var pieces: Array = []
var _falling := {}
var armed := false


func add_piece(body: StaticBody3D, delay: float) -> void:
	pieces.append(body)
	body.set_meta("delay", delay)
	body.set_meta("start", body.position)
	add_child(body)


func trigger() -> void:
	if armed:
		return
	armed = true
	for p in pieces:
		_falling[p] = -float(p.get_meta("delay"))
	set_process(true)


func reset() -> void:
	armed = false
	_falling.clear()
	for p in pieces:
		p.position = p.get_meta("start")
		p.rotation = Vector3.ZERO
		p.visible = true
		p.process_mode = Node.PROCESS_MODE_INHERIT
		for c in p.get_children():
			if c is CollisionShape3D:
				c.disabled = false


func _ready() -> void:
	set_process(false)


func _process(dt: float) -> void:
	var any := false
	for p in _falling.keys():
		var t: float = _falling[p] + dt
		_falling[p] = t
		if t < 0.0:
			any = true
			continue
		if t < 0.12:
			# Shudder before letting go.
			p.position = p.get_meta("start") + Vector3(randf_range(-0.05, 0.05), 0, randf_range(-0.05, 0.05))
			any = true
			continue
		if t > 0.12 and t < 0.2:
			for c in p.get_children():
				if c is CollisionShape3D:
					c.disabled = true
		var f := t - 0.12
		p.position = p.get_meta("start") + Vector3(0, -0.5 * 30.0 * f * f, 0)
		p.rotation = Vector3(f * 1.2 * float(p.get_meta("tumble", 1.0)), 0, f * 0.6)
		if p.position.y < -30.0:
			p.visible = false
		else:
			any = true
	if not any:
		set_process(false)
