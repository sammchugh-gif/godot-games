# A golden star pickup: the level's currency, its progress counter, and the
# player's lives once the boss fight starts.
class_name Star
extends Node3D

signal collected(star: Star)

const PICKUP_RADIUS := 1.7
const CORE := 0.09
const TIP := 0.3

var player: Node3D
var world: VoxelWorld
var from_creature := false

var _t := 0.0
var _base_y := 0.0
var _mesh: MeshInstance3D
var _light: OmniLight3D
var _vel := Vector3.ZERO
var _settled := true
var _taken := false


# Six spikes over a small cube core: reads as a star from every angle, which a
# flat billboard would not once the camera is under it in a cave.
static func build_star_mesh(core: float, tip: float) -> ArrayMesh:
	var axes := [Vector3.RIGHT, Vector3.LEFT, Vector3.UP, Vector3.DOWN, Vector3.BACK, Vector3.FORWARD]
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for a in axes:
		var av: Vector3 = a
		var u := Vector3.UP if absf(av.y) < 0.5 else Vector3.RIGHT
		u = (u - av * u.dot(av)).normalized()
		var v := av.cross(u)
		var apex := av * tip
		var corners := [
			av * core + (u + v) * core,
			av * core + (-u + v) * core,
			av * core + (-u - v) * core,
			av * core + (u - v) * core,
		]
		for i in 4:
			st.add_vertex(corners[i])
			st.add_vertex(corners[(i + 1) % 4])
			st.add_vertex(apex)
	st.generate_normals()
	var mesh := ArrayMesh.new()
	st.commit(mesh)
	return mesh


static func build_material(colour: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = colour
	mat.emission_enabled = true
	mat.emission = colour
	mat.emission_energy_multiplier = 2.2
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.roughness = 0.25
	return mat


func _ready() -> void:
	_mesh = MeshInstance3D.new()
	_mesh.mesh = build_star_mesh(CORE, TIP)
	_mesh.set_surface_override_material(0, build_material(Color(1.0, 0.82, 0.24)))
	_mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_mesh)

	# The star's own material is emissive, so it still reads in a pitch-black
	# cave without a light. On mobile the light is what costs us, not the look.
	if not Quality.lightweight():
		_light = OmniLight3D.new()
		_light.light_color = Color(1.0, 0.85, 0.4)
		_light.light_energy = 1.5
		_light.omni_range = 7.0
		_light.shadow_enabled = false
		add_child(_light)

	_base_y = position.y
	_t = randf() * TAU
	# Creature drops start mid-air and need to fall to a resting spot.
	_settled = not from_creature


func toss(dir: Vector3) -> void:
	_settled = false
	_vel = dir * 2.2 + Vector3.UP * 3.4


func _process(delta: float) -> void:
	if _taken:
		return
	_t += delta

	if not _settled and world != null:
		_vel.y -= 20.0 * delta
		var next := position + _vel * delta
		var below := Vector3i(floori(next.x), floori(next.y - 0.25), floori(next.z))
		if world.is_solidv(below) or next.y < 1.0:
			_settled = true
			position.y = float(below.y) + 1.35
			_base_y = position.y
			_vel = Vector3.ZERO
		else:
			position = next
			_base_y = position.y

	_mesh.rotation.y = _t * 1.8
	_mesh.rotation.x = sin(_t * 1.1) * 0.35
	var bob := sin(_t * 2.4) * 0.14
	position.y = _base_y + bob
	if _light != null:
		_light.light_energy = 1.3 + sin(_t * 3.0) * 0.35

	if player != null and position.distance_to(player.global_position) < PICKUP_RADIUS:
		_taken = true
		emit_signal("collected", self)
