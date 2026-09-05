# Pooled cube debris drawn with a single MultiMesh, so a boss smash that
# shatters a hundred blocks still costs one draw call.
class_name Debris
extends MultiMeshInstance3D

const CAPACITY := 700

var _pos := PackedVector3Array()
var _vel := PackedVector3Array()
var _life := PackedFloat32Array()
var _size := PackedFloat32Array()
var _spin := PackedFloat32Array()
var _next := 0
var _live := 0


func _ready() -> void:
	var mesh := BoxMesh.new()
	mesh.size = Vector3.ONE

	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.roughness = 0.9
	mesh.material = mat

	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = mesh
	mm.instance_count = CAPACITY
	mm.visible_instance_count = CAPACITY
	multimesh = mm

	_pos.resize(CAPACITY)
	_vel.resize(CAPACITY)
	_life.resize(CAPACITY)
	_size.resize(CAPACITY)
	_spin.resize(CAPACITY)
	for i in CAPACITY:
		_life[i] = 0.0
		mm.set_instance_transform(i, Transform3D(Basis().scaled(Vector3.ZERO), Vector3.ZERO))
		mm.set_instance_color(i, Color.WHITE)

	# Debris is decorative and already in world space.
	top_level = true
	cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


func emit_burst(origin: Vector3, colour: Color, count: int, speed: float = 5.0, size: float = 0.16) -> void:
	for i in count:
		var s := _next
		_next = (_next + 1) % CAPACITY
		_pos[s] = origin + Vector3(randf() - 0.5, randf() - 0.5, randf() - 0.5) * 0.55
		_vel[s] = Vector3(randf() - 0.5, randf() * 0.9 + 0.25, randf() - 0.5).normalized() * speed * (0.5 + randf())
		_life[s] = 0.9 + randf() * 0.9
		_size[s] = size * (0.6 + randf() * 0.9)
		_spin[s] = (randf() - 0.5) * 12.0
		multimesh.set_instance_color(s, colour)
	_live = mini(_live + count, CAPACITY)


func _process(delta: float) -> void:
	if _live <= 0:
		return
	var mm := multimesh
	var still_live := 0
	for i in CAPACITY:
		var l := _life[i]
		if l <= 0.0:
			continue
		l -= delta
		_life[i] = l
		if l <= 0.0:
			mm.set_instance_transform(i, Transform3D(Basis().scaled(Vector3.ZERO), Vector3.ZERO))
			continue
		still_live += 1
		var v := _vel[i]
		v.y -= 22.0 * delta
		var p := _pos[i] + v * delta
		if p.y < 0.2:
			p.y = 0.2
			v = Vector3(v.x * 0.4, -v.y * 0.28, v.z * 0.4)
		_vel[i] = v
		_pos[i] = p
		var scale_now: float = _size[i] * clampf(l, 0.0, 1.0)
		var b := Basis().rotated(Vector3(0.5, 1, 0.3).normalized(), _spin[i] * (2.0 - l))
		mm.set_instance_transform(i, Transform3D(b.scaled(Vector3(scale_now, scale_now, scale_now)), p))
	_live = still_live
