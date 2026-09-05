# Badniks. Two kinds: MOTOBUG (a red beetle on a single wheel that patrols
# the ground) and BUZZ (a hovering wasp used for airborne homing chains).
# Both are homing targets; touching one while not attacking hurts.
class_name Enemy
extends Area3D

enum Kind { MOTOBUG, BUZZ }

var kind := Kind.MOTOBUG
var patrol := 0.0
var alive := true
var _t := 0.0
var _origin := Vector3.ZERO
var _body: Node3D
var _wheel: Node3D
var _wings: Array = []
var _dir := 1.0
var _spin := 0.0


static func make(pos: Vector3, k: Kind, facing: Vector3 = Vector3.FORWARD, patrol_len: float = 0.0) -> Enemy:
	var e := Enemy.new()
	e.kind = k
	e.position = pos
	e.patrol = patrol_len
	e.basis = MeshLib.basis_forward(facing, Vector3.UP)
	return e


func _ready() -> void:
	collision_layer = 4
	collision_mask = 2
	_origin = global_position
	var cs := CollisionShape3D.new()
	var sh := SphereShape3D.new()
	sh.radius = 1.0
	cs.shape = sh
	cs.position = Vector3(0, 0.7, 0)
	add_child(cs)
	_body = Node3D.new()
	add_child(_body)
	add_to_group("homing_target")
	add_to_group("enemy")
	body_entered.connect(_on_body)
	var red := Mats.pbr(Color(0.85, 0.12, 0.10), 0.35, 0.3)
	var grey := Mats.pbr(Color(0.55, 0.58, 0.62), 0.45, 0.8)
	var dark := Mats.pbr(Color(0.08, 0.08, 0.1), 0.5, 0.3)
	var yellow := Mats.pbr(Color(0.95, 0.8, 0.2), 0.4, 0.3)
	var eye := Mats.glow(Color(0.3, 0.9, 1.0), 2.0, 0.2)
	if kind == Kind.MOTOBUG:
		var b := MeshLib.Builder.new()
		b.ellipsoid(Vector3(0, 0.85, 0), Vector3(0.75, 0.42, 0.95), 18, 12)
		_body.add_child(b.commit(red, "Shell"))
		b = MeshLib.Builder.new()
		b.ellipsoid(Vector3(0, 0.7, -0.75), Vector3(0.45, 0.35, 0.4), 14, 10)
		# Antennae.
		b.cylinder(Vector3(-0.2, 0.95, -1.0), Vector3(-0.45, 1.35, -1.25), 0.035, 0.02, 6)
		b.cylinder(Vector3(0.2, 0.95, -1.0), Vector3(0.45, 1.35, -1.25), 0.035, 0.02, 6)
		_body.add_child(b.commit(grey, "Head"))
		b = MeshLib.Builder.new()
		b.ellipsoid(Vector3(-0.2, 0.78, -1.08), Vector3(0.09, 0.09, 0.06), 8, 6)
		b.ellipsoid(Vector3(0.2, 0.78, -1.08), Vector3(0.09, 0.09, 0.06), 8, 6)
		_body.add_child(b.commit(eye, "Eyes"))
		_wheel = Node3D.new()
		_wheel.position = Vector3(0, 0.45, 0.1)
		_body.add_child(_wheel)
		b = MeshLib.Builder.new()
		b.lathe([Vector2(0.0, -0.2), Vector2(0.45, -0.2), Vector2(0.45, 0.2), Vector2(0.0, 0.2)], 16, Vector3.ZERO, Basis(Vector3.FORWARD, PI * 0.5))
		_wheel.add_child(b.commit(dark, "Wheel"))
		b = MeshLib.Builder.new()
		b.lathe([Vector2(0.0, -0.22), Vector2(0.18, -0.22), Vector2(0.18, 0.22), Vector2(0.0, 0.22)], 8, Vector3.ZERO, Basis(Vector3.FORWARD, PI * 0.5))
		_wheel.add_child(b.commit(grey, "Hub"))
		# Exhaust pipes.
		b = MeshLib.Builder.new()
		b.cylinder(Vector3(-0.4, 0.75, 0.6), Vector3(-0.5, 0.95, 1.2), 0.08, 0.1, 8)
		b.cylinder(Vector3(0.4, 0.75, 0.6), Vector3(0.5, 0.95, 1.2), 0.08, 0.1, 8)
		_body.add_child(b.commit(grey, "Pipes"))
	else:
		var b := MeshLib.Builder.new()
		b.ellipsoid(Vector3(0, 0.7, 0.2), Vector3(0.38, 0.32, 0.8), 16, 12)
		_body.add_child(b.commit(yellow, "Abdomen"))
		b = MeshLib.Builder.new()
		for i in 3:
			b.lathe([Vector2(0.30, -0.06), Vector2(0.40, 0.0), Vector2(0.30, 0.06)], 16, Vector3(0, 0.7, 0.05 + i * 0.28), Basis(Vector3.RIGHT, PI * 0.5), false)
		_body.add_child(b.commit(dark, "Stripes"))
		b = MeshLib.Builder.new()
		b.ellipsoid(Vector3(0, 0.75, -0.7), Vector3(0.36, 0.34, 0.36), 14, 10)
		b.spike(Vector3(0, 0.65, 0.95), Vector3(0, 0.45, 1.5), 0.12, 8, 4)
		_body.add_child(b.commit(grey, "Head"))
		b = MeshLib.Builder.new()
		b.ellipsoid(Vector3(-0.18, 0.8, -0.98), Vector3(0.12, 0.12, 0.08), 8, 6)
		b.ellipsoid(Vector3(0.18, 0.8, -0.98), Vector3(0.12, 0.12, 0.08), 8, 6)
		_body.add_child(b.commit(eye, "Eyes"))
		for s in [-1.0, 1.0]:
			var w := Node3D.new()
			w.position = Vector3(0.2 * s, 1.0, 0.0)
			_body.add_child(w)
			var wb := MeshLib.Builder.new()
			var wm := Mats.unshaded(Color(0.85, 0.95, 1.0, 0.45))
			wm.cull_mode = BaseMaterial3D.CULL_DISABLED
			wb.quad(Vector3(0, 0, -0.25), Vector3(1.4 * s, 0.05, -0.4), Vector3(1.5 * s, 0.05, 0.3), Vector3(0, 0, 0.25))
			w.add_child(wb.commit(wm, "Wing"))
			_wings.append(w)


func is_targetable() -> bool:
	return alive


func _process(dt: float) -> void:
	if not alive:
		return
	_t += dt
	if kind == Kind.MOTOBUG:
		if patrol > 0.0:
			var along := sin(_t * 0.9) * patrol
			global_position = _origin + global_basis.z * -along
			_body.rotation.y = 0.0 if cos(_t * 0.9) > 0.0 else PI
			_spin += dt * 6.0
			_wheel.rotation.x = -_spin
		else:
			_body.position.y = sin(_t * 3.0) * 0.02
	else:
		var bob := sin(_t * 2.1) * 0.35
		var sway := sin(_t * 0.8) * (patrol if patrol > 0.0 else 0.8)
		global_position = _origin + Vector3(0, bob, 0) + global_basis.x * sway
		for i in _wings.size():
			var w: Node3D = _wings[i]
			w.rotation.z = sin(_t * 45.0) * 0.5 * (1.0 if i == 0 else -1.0)


func on_homing_hit(p: Player) -> void:
	_destroy(p)


func _on_body(b: Node3D) -> void:
	if not alive or not (b is Player):
		return
	var p := b as Player
	if p.is_attacking():
		_destroy(p)
	else:
		p.take_hit(global_position)


func _destroy(p: Player) -> void:
	if not alive:
		return
	alive = false
	remove_from_group("homing_target")
	var lvl := get_tree().get_first_node_in_group("level")
	if lvl and lvl.has_method("enemy_pop"):
		lvl.call("enemy_pop", global_position + Vector3(0, 0.7, 0))
	p.add_boost(14.0)
	if p.st == Player.St.AIR and p.velocity.y < 6.0:
		p.velocity.y = 11.0
	queue_free()
