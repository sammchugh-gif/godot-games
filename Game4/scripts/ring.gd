# A gold ring. Spins, glows, and bursts into sparkles when collected.
class_name Ring
extends Area3D

static var _mesh: ArrayMesh
static var _mat: StandardMaterial3D

var collected := false
var _spin := 0.0
var _mi: MeshInstance3D
var lost := false      # scattered from Sonic after a hit: bounces, then can be re-collected
var _vel := Vector3.ZERO
var _life := 0.0


static func mesh() -> ArrayMesh:
	if _mesh == null:
		var b := MeshLib.Builder.new()
		var prof := []
		for i in 9:
			var a := TAU * float(i) / 8.0
			prof.append(Vector2(0.75 + cos(a) * 0.11, sin(a) * 0.11))
		b.lathe(prof, 24, Vector3.ZERO, Basis(Vector3.RIGHT, PI * 0.5), false)
		_mesh = b.commit_mesh()
	return _mesh


static func material() -> StandardMaterial3D:
	if _mat == null:
		_mat = StandardMaterial3D.new()
		_mat.albedo_color = Color(1.0, 0.78, 0.2)
		_mat.metallic = 1.0
		_mat.roughness = 0.18
		_mat.emission_enabled = true
		_mat.emission = Color(1.0, 0.6, 0.1)
		_mat.emission_energy_multiplier = 0.9
	return _mat


func _ready() -> void:
	collision_layer = 8
	collision_mask = 2
	set_deferred("monitorable", false)
	var cs := CollisionShape3D.new()
	var sh := SphereShape3D.new()
	sh.radius = 1.4
	cs.shape = sh
	add_child(cs)
	_mi = MeshInstance3D.new()
	_mi.mesh = mesh()
	_mi.material_override = material()
	_mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_mi)
	body_entered.connect(_on_body)
	_spin = randf() * TAU
	add_to_group("ring")


func _process(dt: float) -> void:
	_spin += dt * 3.2
	_mi.rotation.y = _spin
	if lost:
		_life += dt
		_vel.y -= 30.0 * dt
		global_position += _vel * dt
		if global_position.y < get_meta("floor_y", 0.0) + 0.6:
			global_position.y = get_meta("floor_y", 0.0) + 0.6
			_vel.y = absf(_vel.y) * 0.45
			_vel.x *= 0.7
			_vel.z *= 0.7
		if _life > 5.0:
			var f := 1.0 - (_life - 5.0) / 1.5
			if f <= 0.0:
				queue_free()
				return
			_mi.scale = Vector3.ONE * maxf(f, 0.01)


func scatter(v: Vector3, floor_y: float) -> void:
	lost = true
	_vel = v
	set_meta("floor_y", floor_y)


func _on_body(b: Node3D) -> void:
	if collected or not (b is Player):
		return
	if lost and _life < 0.6:
		return
	collected = true
	(b as Player).add_rings(1)
	var lvl := get_tree().get_first_node_in_group("level")
	if lvl and lvl.has_method("ring_burst"):
		lvl.call("ring_burst", global_position)
	queue_free()
