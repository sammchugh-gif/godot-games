# A flock of white seabirds resting near the path. When Sonic gets close
# they burst into the air, wheel over the sea and settle into a slow
# circling pattern. Drawn as a MultiMesh of simple V-shaped bodies; the
# flap is done by scaling each instance's wings through the transform.
class_name Birds
extends Node3D

var count := 14
var _mm: MultiMeshInstance3D
var _states: Array = []
var _fled := false
var _t := 0.0
var _radius := 6.0


static func make(pos: Vector3, n: int = 14, radius: float = 6.0) -> Birds:
	var b := Birds.new()
	b.position = pos
	b.count = n
	b._radius = radius
	return b


func _ready() -> void:
	var mb := MeshLib.Builder.new()
	mb.color = Color.WHITE
	# Body + two wings, in local space, facing -Z.
	mb.ellipsoid(Vector3(0, 0, 0), Vector3(0.12, 0.10, 0.28), 8, 6)
	mb.quad(Vector3(0, 0.02, -0.1), Vector3(-0.9, 0.12, 0.05), Vector3(-0.85, 0.12, 0.25), Vector3(0, 0.02, 0.15))
	mb.quad(Vector3(0, 0.02, 0.15), Vector3(0.85, 0.12, 0.25), Vector3(0.9, 0.12, 0.05), Vector3(0, 0.02, -0.1))
	mb.quad(Vector3(0, 0.02, 0.15), Vector3(-0.85, 0.12, 0.25), Vector3(-0.9, 0.12, 0.05), Vector3(0, 0.02, -0.1))
	mb.quad(Vector3(0, 0.02, -0.1), Vector3(0.9, 0.12, 0.05), Vector3(0.85, 0.12, 0.25), Vector3(0, 0.02, 0.15))
	var mesh := mb.commit_mesh()
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	mm.instance_count = count
	_mm = MultiMeshInstance3D.new()
	_mm.multimesh = mm
	_mm.material_override = Mats.pbr(Color(0.97, 0.97, 0.99), 0.7)
	_mm.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_mm)
	for i in count:
		var a := randf() * TAU
		var r := randf_range(0.5, _radius)
		_states.append({
			"pos": Vector3(cos(a) * r, 0.0, sin(a) * r),
			"yaw": randf() * TAU,
			"phase": randf() * TAU,
			"orbit": randf_range(6.0, 14.0),
			"speed": randf_range(0.6, 1.1),
			"height": randf_range(6.0, 14.0),
		})
	_apply()


func _apply() -> void:
	for i in count:
		var s: Dictionary = _states[i]
		var b := Basis(Vector3.UP, s["yaw"])
		if _fled:
			var flap := sin(_t * 14.0 * s["speed"] + s["phase"]) * 0.6
			b = b * Basis(Vector3.FORWARD, 0.0)
			b = Basis(b.x * (1.0 - absf(flap) * 0.35), b.y, b.z) * Basis(Vector3(0, 0, 1), flap * 0.3)
		_mm.multimesh.set_instance_transform(i, Transform3D(b, s["pos"]))


func _process(dt: float) -> void:
	_t += dt
	var player := get_tree().get_first_node_in_group("player") as Node3D
	if not _fled:
		if player and player.global_position.distance_to(global_position) < _radius + 8.0:
			_fled = true
			var lvl := get_tree().get_first_node_in_group("level")
			if lvl and lvl.has_method("birds_fx"):
				lvl.call("birds_fx", global_position)
		else:
			if fmod(_t, 0.5) < dt:
				_apply()
			return
	for i in count:
		var s: Dictionary = _states[i]
		var ft: float = s["phase"] + _t * 0.4 * s["speed"]
		var climb := clampf(_t * 0.5, 0.0, 1.0)
		var target := Vector3(cos(ft) * s["orbit"], s["height"] * climb + sin(ft * 2.0) * 1.2, sin(ft) * s["orbit"])
		var p: Vector3 = s["pos"]
		var np := p.lerp(target, 1.0 - exp(-2.5 * dt))
		var d := np - p
		if d.length() > 0.001:
			s["yaw"] = atan2(-d.x, -d.z)
		s["pos"] = np
	_apply()
