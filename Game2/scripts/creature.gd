# The little creatures. Movement is scripted against the voxel grid rather
# than physics-driven: a cave full of 1m ledges snags CharacterBody3D
# constantly, and these are meant to scuttle over rubble, not trip on it.
class_name Creature
extends Node3D

signal died(pos: Vector3, by_player: bool)

enum Kind { CRAWLER, FLOATER, SPITTER }

const ProjectileScript = preload("res://scripts/projectile.gd")

var world: VoxelWorld
var player: Node3D
var debris: Debris
var kind: int = Kind.CRAWLER

var health := 20.0
var max_health := 20.0
var speed := 3.2
var aggro := 15.0
var touch_range := 1.15
var alive := true

var _vel_y := 0.0
var _t := 0.0
var _hop := 0.0
var _cool := 0.0
var _flash := 0.0
var _wander := Vector3.ZERO
var _wander_t := 0.0
var _hurt_dir := Vector3.ZERO

var _body: MeshInstance3D
var _mat: StandardMaterial3D
var _base_colour := Color(0.75, 0.35, 0.5)
var _eyes: Array[MeshInstance3D] = []
var _hurtbox: Area3D


func configure(k: int, level: int) -> void:
	kind = k
	match kind:
		Kind.CRAWLER:
			health = 18.0 + 4.0 * float(level - 1)
			speed = 3.2 + 0.18 * float(level - 1)
			_base_colour = Color(0.82, 0.36, 0.42)
		Kind.FLOATER:
			health = 14.0 + 3.0 * float(level - 1)
			speed = 2.4 + 0.16 * float(level - 1)
			_base_colour = Color(0.55, 0.45, 0.9)
		Kind.SPITTER:
			health = 24.0 + 5.0 * float(level - 1)
			speed = 2.2 + 0.12 * float(level - 1)
			_base_colour = Color(0.4, 0.72, 0.5)
	max_health = health


func _ready() -> void:
	_build_visual()
	_t = randf() * TAU
	_wander = Vector3(randf() - 0.5, 0.0, randf() - 0.5).normalized()

	_hurtbox = Area3D.new()
	_hurtbox.collision_layer = 8
	_hurtbox.collision_mask = 0
	_hurtbox.monitoring = false
	_hurtbox.monitorable = true
	var cs := CollisionShape3D.new()
	var sph := SphereShape3D.new()
	sph.radius = 0.55
	cs.shape = sph
	cs.position = Vector3(0, 0.4, 0)
	_hurtbox.add_child(cs)
	add_child(_hurtbox)


func _build_visual() -> void:
	_body = MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(0.72, 0.6, 0.72) if kind != Kind.FLOATER else Vector3(0.66, 0.66, 0.66)
	_body.mesh = bm
	_mat = StandardMaterial3D.new()
	_mat.albedo_color = _base_colour
	_mat.roughness = 0.75
	_mat.emission_enabled = true
	_mat.emission = _base_colour
	_mat.emission_energy_multiplier = 0.35
	_body.set_surface_override_material(0, _mat)
	_body.position = Vector3(0, 0.36, 0)
	add_child(_body)

	for s in [-1.0, 1.0]:
		var eye := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.1
		sm.height = 0.2
		sm.radial_segments = 8
		sm.rings = 4
		eye.mesh = sm
		var em := StandardMaterial3D.new()
		em.albedo_color = Color(1, 0.95, 0.6)
		em.emission_enabled = true
		em.emission = Color(1, 0.9, 0.5)
		em.emission_energy_multiplier = 3.0
		em.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		eye.set_surface_override_material(0, em)
		eye.position = Vector3(0.17 * s, 0.12, -0.33)
		_body.add_child(eye)
		_eyes.append(eye)

	if kind == Kind.SPITTER:
		# A stubby snout so the ranged one is readable at a glance.
		var snout := MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = 0.07
		cm.bottom_radius = 0.13
		cm.height = 0.34
		cm.radial_segments = 8
		snout.mesh = cm
		var sm2 := StandardMaterial3D.new()
		sm2.albedo_color = Color(0.2, 0.32, 0.24)
		snout.set_surface_override_material(0, sm2)
		snout.rotation_degrees = Vector3(-90, 0, 0)
		snout.position = Vector3(0, -0.05, -0.42)
		_body.add_child(snout)

	# Floaters glow emissively either way; the halo light is desktop-only.
	if kind == Kind.FLOATER and not Quality.lightweight():
		var halo := OmniLight3D.new()
		halo.light_color = Color(0.6, 0.5, 1.0)
		halo.light_energy = 1.2
		halo.omni_range = 6.0
		halo.shadow_enabled = false
		add_child(halo)


# ------------------------------------------------------------------ tick ---

func _process(delta: float) -> void:
	if not alive or world == null:
		return
	_t += delta
	_cool = maxf(0.0, _cool - delta)
	if _flash > 0.0:
		_flash = maxf(0.0, _flash - delta * 3.5)
		_mat.albedo_color = _base_colour.lerp(Color(1, 1, 1), _flash)
		_mat.emission_energy_multiplier = 0.35 + _flash * 2.5

	var to_player := Vector3.ZERO
	var dist := INF
	if player != null:
		to_player = player.global_position - global_position
		dist = to_player.length()

	if kind == Kind.FLOATER:
		_tick_floater(delta, to_player, dist)
	else:
		_tick_walker(delta, to_player, dist)

	_face(to_player if dist < aggro else _wander)
	_animate(delta)

	if dist < touch_range and _cool <= 0.0 and player != null and player.has_method("take_hit"):
		player.take_hit(to_player.normalized())
		_cool = 1.4
		# Bounce apart so a single touch cannot chain into several.
		global_position -= to_player.normalized() * 0.8
		_vel_y = 4.0


func _tick_walker(delta: float, to_player: Vector3, dist: float) -> void:
	var dir := Vector3.ZERO
	if dist < aggro:
		dir = Vector3(to_player.x, 0, to_player.z)
		if kind == Kind.SPITTER:
			if dist < 7.0:
				dir = -dir            # keep its distance and shoot
			elif dist < 10.0:
				dir = Vector3.ZERO
			if _cool <= 0.0 and dist < 14.0:
				_spit(to_player)
				_cool = 2.1
	else:
		_wander_t -= delta
		if _wander_t <= 0.0:
			_wander_t = randf_range(1.4, 3.2)
			_wander = Vector3(randf() - 0.5, 0.0, randf() - 0.5).normalized()
		dir = _wander * 0.5
	if dir.length() > 0.001:
		dir = dir.normalized()

	var grounded := _solid_at(global_position + Vector3(0, -0.12, 0))
	if grounded and _vel_y <= 0.0:
		_vel_y = 0.0
	else:
		_vel_y -= 26.0 * delta
	global_position.y += _vel_y * delta
	if _vel_y < 0.0 and _solid_at(global_position + Vector3(0, -0.05, 0)):
		global_position.y = floorf(global_position.y) + 1.0
		_vel_y = 0.0

	var step := dir * speed * delta
	_try_move(step, grounded)


func _tick_floater(delta: float, to_player: Vector3, dist: float) -> void:
	var dir := _wander
	if dist < aggro and dist > 0.01:
		dir = to_player.normalized()
	else:
		_wander_t -= delta
		if _wander_t <= 0.0:
			_wander_t = randf_range(1.2, 2.8)
			_wander = Vector3(randf() - 0.5, (randf() - 0.5) * 0.6, randf() - 0.5).normalized()
		dir = _wander * 0.6
	var step := dir * speed * delta
	step.y += sin(_t * 2.2) * 0.5 * delta
	_try_move(step, true)


# Axis-separated so a creature slides along a wall instead of sticking to it.
func _try_move(step: Vector3, grounded: bool) -> void:
	var p := global_position
	if absf(step.x) > 0.0:
		var nx := p + Vector3(step.x, 0, 0)
		if _blocked(nx):
			if grounded and kind != Kind.FLOATER and not _blocked(nx + Vector3(0, 1.05, 0)):
				_vel_y = 7.8                # hop up a single ledge
		else:
			p = nx
	if absf(step.z) > 0.0:
		var nz := p + Vector3(0, 0, step.z)
		if _blocked(nz):
			if grounded and kind != Kind.FLOATER and not _blocked(nz + Vector3(0, 1.05, 0)):
				_vel_y = 7.8
		else:
			p = nz
	if kind == Kind.FLOATER and absf(step.y) > 0.0:
		var ny := p + Vector3(0, step.y, 0)
		if not _blocked(ny):
			p = ny
	global_position = p


func _solid_at(p: Vector3) -> bool:
	return world.is_solid(floori(p.x), floori(p.y), floori(p.z))


func _blocked(p: Vector3) -> bool:
	# Feet and head cells, so it will not squeeze into a one-block gap.
	return _solid_at(p + Vector3(0, 0.15, 0)) or _solid_at(p + Vector3(0, 0.85, 0))


func _face(dir: Vector3) -> void:
	var flat := Vector3(dir.x, 0, dir.z)
	if flat.length() < 0.02:
		return
	var want := atan2(-flat.x, -flat.z)
	rotation.y = lerp_angle(rotation.y, want, 0.16)


func _animate(delta: float) -> void:
	if kind == Kind.FLOATER:
		_body.rotation.x = sin(_t * 1.7) * 0.4
		_body.rotation.z = cos(_t * 1.3) * 0.4
		_body.position.y = 0.36 + sin(_t * 2.4) * 0.1
		return
	# Squash and stretch tied to a bounce, so walkers look like they scuttle.
	_hop = fmod(_hop + delta * 7.0, TAU)
	var s := absf(sin(_hop))
	_body.scale = Vector3(1.0 + s * 0.12, 1.0 - s * 0.16, 1.0 + s * 0.12)
	_body.position.y = 0.36 + s * 0.1


func _spit(to_player: Vector3) -> void:
	Sfx.play("spit", -10.0)
	var b := Area3D.new()
	b.set_script(ProjectileScript)
	b.setup(1.0, Color(0.5, 0.95, 0.6), 20.0, false, 0.18)
	b.direction = to_player.normalized()
	b.world = world
	b.debris = debris
	b.life = 3.0
	get_parent().add_child(b)
	b.global_position = global_position + Vector3(0, 0.5, 0) + to_player.normalized() * 0.6


# ---------------------------------------------------------------- damage ---

func take_damage(amount: float, dir: Vector3 = Vector3.ZERO) -> void:
	if not alive:
		return
	health -= amount
	_flash = 1.0
	_hurt_dir = dir
	if debris != null:
		debris.emit_burst(global_position + Vector3(0, 0.4, 0), _base_colour, 5, 3.0, 0.11)
	if health <= 0.0:
		_die(true)


func _die(by_player: bool) -> void:
	alive = false
	if debris != null:
		debris.emit_burst(global_position + Vector3(0, 0.4, 0), _base_colour, 16, 5.5, 0.15)
	emit_signal("died", global_position + Vector3(0, 0.5, 0), by_player)
	queue_free()
