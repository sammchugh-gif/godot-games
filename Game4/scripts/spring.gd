# Springs: a red drum with a yellow coil top. `dir` is the launch direction,
# `power` the launch speed. Angled springs fling you along the level.
class_name Spring
extends Area3D

var dir := Vector3.UP
var power := 28.0
var _top: Node3D
var _bounce := 0.0


static func make(pos: Vector3, direction: Vector3, pow: float, yaw_dir: Vector3 = Vector3.FORWARD) -> Spring:
	var s := Spring.new()
	s.dir = direction.normalized()
	s.power = pow
	s.position = pos
	var up := s.dir
	var fwd := yaw_dir
	if absf(up.dot(fwd)) > 0.95:
		fwd = Vector3.RIGHT
	s.basis = MeshLib.basis_from_y(up)
	return s


func _ready() -> void:
	collision_layer = 8
	collision_mask = 2
	var cs := CollisionShape3D.new()
	var sh := CylinderShape3D.new()
	sh.radius = 1.1
	sh.height = 1.2
	cs.shape = sh
	cs.position = Vector3(0, 0.6, 0)
	add_child(cs)
	var b := MeshLib.Builder.new()
	b.lathe([Vector2(0.0, 0.0), Vector2(1.0, 0.0), Vector2(1.05, 0.12), Vector2(0.95, 0.5), Vector2(0.0, 0.5)], 20)
	add_child(b.commit(Mats.pbr(Color(0.85, 0.12, 0.10), 0.35, 0.2), "Base"))
	_top = Node3D.new()
	add_child(_top)
	var t := MeshLib.Builder.new()
	# Coil: three flattened rings.
	for i in 3:
		var y := 0.5 + i * 0.13
		t.lathe([Vector2(0.55, y - 0.04), Vector2(0.72, y), Vector2(0.55, y + 0.04)], 16, Vector3.ZERO, Basis.IDENTITY, false)
	t.lathe([Vector2(0.0, 0.88), Vector2(0.92, 0.88), Vector2(0.92, 1.02), Vector2(0.0, 1.02)], 20)
	_top.add_child(t.commit(Mats.glow(Color(1.0, 0.85, 0.2), 0.6, 0.35), "Coil"))
	# Star stamp on the pad top.
	var s := MeshLib.Builder.new()
	for k in 5:
		var a0 := TAU * float(k) / 5.0 - PI * 0.5
		var a1 := a0 + TAU / 10.0
		var a2 := a0 + TAU / 5.0
		s.tri(Vector3(0, 1.03, 0), Vector3(cos(a1) * 0.25, 1.03, sin(a1) * 0.25), Vector3(cos(a0) * 0.6, 1.03, sin(a0) * 0.6))
		s.tri(Vector3(0, 1.03, 0), Vector3(cos(a2) * 0.6, 1.03, sin(a2) * 0.6), Vector3(cos(a1) * 0.25, 1.03, sin(a1) * 0.25))
	_top.add_child(s.commit(Mats.pbr(Color(0.9, 0.15, 0.12), 0.4), "Star"))
	body_entered.connect(_on_body)
	add_to_group("homing_target")


func is_targetable() -> bool:
	return true


func on_homing_hit(p: Player) -> void:
	_fire(p)


func _process(dt: float) -> void:
	_bounce = maxf(_bounce - dt * 4.0, 0.0)
	var s := sin(_bounce * PI)
	_top.position = Vector3(0, -0.25 * s, 0)
	_top.scale = Vector3(1.0 + 0.15 * s, 1.0 - 0.3 * s, 1.0 + 0.15 * s)


func _on_body(b: Node3D) -> void:
	if b is Player:
		_fire(b as Player)


func _fire(p: Player) -> void:
	_bounce = 1.0
	p.launch(dir * power, 0.3)
	p.global_position = global_position + dir * 1.4
	var lvl := get_tree().get_first_node_in_group("level")
	if lvl and lvl.has_method("spring_fx"):
		lvl.call("spring_fx", global_position, dir)
