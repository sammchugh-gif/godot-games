# Shared projectile for the turret blocks and the boss. The player fights in
# melee with the axe, so nothing on the player side spawns these any more.
# Terrain hits are resolved against the voxel grid directly (exact and cheap);
# actor hits use Area3D overlap.
extends Area3D

var direction := Vector3.FORWARD
var speed := 58.0
var damage := 9.0
var life := 4.0
var from_player := true
var terrain_damage := 0.0
var blast_radius := 0.0
var world: VoxelWorld

var _colour := Color(0.4, 0.9, 1.0)
var _dead := false


func setup(dmg: float, colour: Color, spd: float, player_side: bool, radius: float = 0.16) -> void:
	damage = dmg
	_colour = colour
	speed = spd
	from_player = player_side
	set_meta("visual_radius", radius)


func _ready() -> void:
	var radius: float = float(get_meta("visual_radius", 0.16))

	var shape := CollisionShape3D.new()
	var sph := SphereShape3D.new()
	sph.radius = maxf(radius, 0.3)
	shape.shape = sph
	add_child(shape)

	if from_player:
		collision_layer = 16
		collision_mask = 8          # boss hurtboxes
	else:
		collision_layer = 32
		collision_mask = 2          # the player
	monitoring = true
	monitorable = false

	var mi := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = radius
	sm.height = radius * 2.0
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
	add_child(mi)

	# Only the boss's boulder carries a real light. Turret bolts are numerous,
	# and a swarm of dynamic omni lights is exactly what tips mobile WebGL over
	# its per-object light limit. The unshaded emissive material still reads as
	# a glow without costing a light.
	if radius >= 0.4:
		var light := OmniLight3D.new()
		light.light_color = _colour
		light.light_energy = 1.6
		light.omni_range = 6.0
		add_child(light)

	area_entered.connect(_on_area_entered)
	body_entered.connect(_on_body_entered)


func _physics_process(delta: float) -> void:
	if _dead:
		return
	life -= delta
	if life <= 0.0:
		_expire()
		return

	var step := direction.normalized() * speed * delta
	if world != null:
		var hit := world.raycast(global_position, direction, step.length())
		if not hit.is_empty():
			global_position = hit["point"] - direction.normalized() * 0.05
			_impact_terrain(hit)
			return
	global_position += step


func _impact_terrain(hit: Dictionary) -> void:
	if terrain_damage > 0.0 and world != null:
		if blast_radius > 0.0:
			var broken := world.damage_sphere(global_position, blast_radius, terrain_damage)
			_notify_blast(broken)
		else:
			var b: Vector3i = hit["block"]
			world.damage_block(b.x, b.y, b.z, terrain_damage)
	_spawn_impact()
	_expire()


func _notify_blast(broken: Array) -> void:
	var game := get_tree().get_first_node_in_group("game")
	if game != null and game.has_method("on_blast"):
		game.on_blast(global_position, broken)


func _on_area_entered(area: Area3D) -> void:
	if _dead or not from_player:
		return
	if not area.has_meta("boss_hurtbox"):
		return
	var mult: float = float(area.get_meta("dmg_mult", 1.0))
	var boss := area.get_parent()
	if boss != null and boss.has_method("apply_damage"):
		boss.apply_damage(damage * mult, global_position, mult > 1.0)
	_spawn_impact()
	_expire()


func _on_body_entered(body: Node3D) -> void:
	if _dead or from_player:
		return
	if body.has_method("take_damage"):
		body.take_damage(damage)
		if body.has_method("knockback"):
			body.knockback(direction, 6.0)
	if terrain_damage > 0.0 and world != null and blast_radius > 0.0:
		_notify_blast(world.damage_sphere(global_position, blast_radius, terrain_damage))
	_spawn_impact()
	_expire()


func _spawn_impact() -> void:
	var game := get_tree().get_first_node_in_group("game")
	if game != null and game.has_method("spawn_spark_burst"):
		game.spawn_spark_burst(global_position, _colour, 10)


func _expire() -> void:
	if _dead:
		return
	_dead = true
	set_physics_process(false)
	queue_free()
