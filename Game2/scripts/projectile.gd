# Shared bolt for the player's star blaster, the creatures and the boss.
# Terrain hits are resolved against the voxel grid directly (exact and cheap);
# actor hits use Area3D overlap.
extends Area3D

var direction := Vector3.FORWARD
var speed := 46.0
var damage := 10.0
var life := 4.0
var from_player := true
var terrain_damage := 0.0
var blast_radius := 0.0
var world: VoxelWorld
var debris: Debris

var _colour := Color(1.0, 0.85, 0.35)
var _radius := 0.16
var _dead := false


func setup(dmg: float, colour: Color, spd: float, player_side: bool, radius: float = 0.16) -> void:
	damage = dmg
	_colour = colour
	speed = spd
	from_player = player_side
	_radius = radius


func _ready() -> void:
	add_to_group("bolts")
	var shape := CollisionShape3D.new()
	var sph := SphereShape3D.new()
	sph.radius = maxf(_radius, 0.32)
	shape.shape = sph
	add_child(shape)

	if from_player:
		collision_layer = 16
		collision_mask = 8           # enemy hurtboxes
		area_entered.connect(_on_area)
	else:
		collision_layer = 32
		collision_mask = 2           # the player
		body_entered.connect(_on_body)
	monitoring = true
	monitorable = false

	var mi := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = _radius
	sm.height = _radius * 2.0
	sm.radial_segments = 8
	sm.rings = 4
	mi.mesh = sm
	var mat := StandardMaterial3D.new()
	mat.albedo_color = _colour
	mat.emission_enabled = true
	mat.emission = _colour
	mat.emission_energy_multiplier = 4.0
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mi.set_surface_override_material(0, mat)
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)

	# Bolts are the most numerous light source in a fight, and the mesh is
	# already unshaded-emissive, so this is the cheapest one to drop on mobile.
	if not Quality.lightweight():
		var lt := OmniLight3D.new()
		lt.light_color = _colour
		lt.light_energy = 1.6
		lt.omni_range = 5.0
		lt.shadow_enabled = false
		add_child(lt)


func _physics_process(delta: float) -> void:
	if _dead:
		return
	life -= delta
	if life <= 0.0:
		_finish(false)
		return

	var step := direction * speed * delta
	if world != null:
		var hit := world.raycast(global_position, direction, step.length() + _radius)
		if not hit.is_empty():
			global_position = hit["point"]
			_finish(true)
			return
	global_position += step


func _on_area(area: Area3D) -> void:
	if _dead:
		return
	var owner_node := area.get_parent()
	if owner_node != null and owner_node.has_method("take_damage"):
		owner_node.take_damage(damage, direction)
	_finish(false)


func _on_body(body: Node3D) -> void:
	if _dead:
		return
	if body.has_method("take_hit"):
		body.take_hit(direction)
	_finish(false)


func _finish(on_terrain: bool) -> void:
	if _dead:
		return
	_dead = true
	if debris != null:
		debris.emit_burst(global_position, _colour, 6, 3.2, 0.1)
	if on_terrain and terrain_damage > 0.0 and world != null:
		var broken := world.damage_sphere(global_position, maxf(blast_radius, 1.0), terrain_damage)
		if debris != null:
			for b in broken:
				debris.emit_burst(Vector3(b["pos"]) + Vector3(0.5, 0.5, 0.5),
					Blocks.color_of(b["id"]), 4, 4.0, 0.16)
	queue_free()
