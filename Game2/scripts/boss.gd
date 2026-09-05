# The level boss, fought in the sealed cavern at the bottom of the world.
# Movement is scripted rather than physics-driven: the arena floor gets chewed
# up by its own slams, and the boss should stride over rubble, not trip on it.
class_name Boss
extends Node3D

signal health_changed(current: float, maximum: float)
signal died()
signal telegraph(text: String)
signal slammed(pos: Vector3)
signal wants_minions(count: int)

enum State { SPAWNING, CHASE, WINDUP, SLAM, RECOVER, VOLLEY, DASH, DYING }

const ProjectileScript = preload("res://scripts/projectile.gd")

# name, colour, hp, speed, and which moves are unlocked at that level.
const PROFILE := [
	{"name": "STONE TITAN", "colour": Color(0.55, 0.5, 0.46), "hp": 260.0, "speed": 3.4,
		"volley": false, "dash": false, "summon": false},
	{"name": "MAGMA MAW", "colour": Color(0.72, 0.28, 0.16), "hp": 380.0, "speed": 3.8,
		"volley": true, "dash": false, "summon": false},
	{"name": "CRYSTAL WIDOW", "colour": Color(0.35, 0.62, 0.78), "hp": 520.0, "speed": 4.3,
		"volley": true, "dash": true, "summon": false},
	{"name": "FROST WARDEN", "colour": Color(0.62, 0.78, 0.9), "hp": 700.0, "speed": 4.2,
		"volley": true, "dash": true, "summon": true},
	{"name": "STAR DEVOURER", "colour": Color(0.62, 0.4, 0.85), "hp": 900.0, "speed": 5.0,
		"volley": true, "dash": true, "summon": true},
]

var world: VoxelWorld
var player: Node3D
var debris: Debris
var level := 1

var boss_name := "STONE TITAN"
var max_health := 260.0
var health := 260.0
var move_speed := 3.4
var slam_radius := 4.2
var can_volley := false
var can_dash := false
var can_summon := false
var bscale := 1.0

var state: int = State.SPAWNING
var alive := true

var _state_t := 0.0
var _cool := 1.6
var _vel_y := 0.0
var _walk := 0.0
var _flash := 0.0
var _raging := false
var _dash_dir := Vector3.ZERO
var _colour := Color(0.55, 0.5, 0.46)

var _root: Node3D
var _torso: MeshInstance3D
var _head: Node3D
var _core: MeshInstance3D
var _arms: Array[Node3D] = []
var _mats: Array[StandardMaterial3D] = []
var _base_colours: Array[Color] = []
var _blocker: AnimatableBody3D
var _hurtbox: Area3D


func configure(lvl: int) -> void:
	level = lvl
	var p: Dictionary = PROFILE[clampi(lvl - 1, 0, PROFILE.size() - 1)]
	boss_name = p["name"]
	_colour = p["colour"]
	max_health = p["hp"]
	health = max_health
	move_speed = p["speed"]
	can_volley = p["volley"]
	can_dash = p["dash"]
	can_summon = p["summon"]
	bscale = 1.0 + 0.09 * float(lvl - 1)


func _ready() -> void:
	_build_visual()

	_blocker = AnimatableBody3D.new()
	_blocker.collision_layer = 1
	_blocker.collision_mask = 0
	var bs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(2.0, 3.4, 2.0) * bscale
	bs.shape = box
	bs.position = Vector3(0, 1.7 * bscale, 0)
	_blocker.add_child(bs)
	_blocker.top_level = true
	add_child(_blocker)

	_hurtbox = Area3D.new()
	_hurtbox.collision_layer = 8
	_hurtbox.collision_mask = 0
	_hurtbox.monitoring = false
	_hurtbox.monitorable = true
	var hs := CollisionShape3D.new()
	var caps := CapsuleShape3D.new()
	caps.radius = 1.25 * bscale
	caps.height = 3.6 * bscale
	hs.shape = caps
	hs.position = Vector3(0, 1.8 * bscale, 0)
	_hurtbox.add_child(hs)
	add_child(_hurtbox)

	emit_signal("health_changed", health, max_health)


func _cube(parent: Node3D, size: Vector3, pos: Vector3, colour: Color, glow: float = 0.0) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	mi.mesh = bm
	var mat := StandardMaterial3D.new()
	mat.albedo_color = colour
	mat.roughness = 0.8
	if glow > 0.0:
		mat.emission_enabled = true
		mat.emission = colour
		mat.emission_energy_multiplier = glow
	mi.set_surface_override_material(0, mat)
	mi.position = pos
	parent.add_child(mi)
	_mats.append(mat)
	_base_colours.append(colour)
	return mi


func _build_visual() -> void:
	_root = Node3D.new()
	_root.scale = Vector3.ONE * bscale
	add_child(_root)

	var dark := _colour.darkened(0.3)
	var accent := _colour.lightened(0.25)

	_torso = _cube(_root, Vector3(2.1, 2.1, 1.5), Vector3(0, 2.0, 0), _colour)
	_cube(_root, Vector3(1.7, 0.9, 1.3), Vector3(0, 0.75, 0), dark)
	_cube(_root, Vector3(0.7, 1.0, 0.7), Vector3(-0.5, 0.3, 0), dark)
	_cube(_root, Vector3(0.7, 1.0, 0.7), Vector3(0.5, 0.3, 0), dark)

	# Exposed core: the obvious thing to shoot.
	_core = _cube(_root, Vector3(0.75, 0.75, 0.3), Vector3(0, 2.05, -0.72),
		Color(1.0, 0.82, 0.28), 3.0)

	_head = Node3D.new()
	_head.position = Vector3(0, 3.35, 0)
	_root.add_child(_head)
	_cube(_head, Vector3(1.25, 1.0, 1.15), Vector3.ZERO, dark)
	for s in [-1.0, 1.0]:
		_cube(_head, Vector3(0.26, 0.2, 0.12), Vector3(0.3 * s, 0.1, -0.62),
			Color(1.0, 0.45, 0.25), 4.0)
	_cube(_head, Vector3(0.3, 0.6, 0.3), Vector3(-0.62, 0.7, 0), accent)
	_cube(_head, Vector3(0.3, 0.6, 0.3), Vector3(0.62, 0.7, 0), accent)

	for s in [-1.0, 1.0]:
		var arm := Node3D.new()
		arm.position = Vector3(1.42 * s, 2.75, 0)
		_root.add_child(arm)
		_cube(arm, Vector3(0.75, 1.7, 0.75), Vector3(0, -0.85, 0), _colour)
		_cube(arm, Vector3(1.15, 1.0, 1.15), Vector3(0, -2.0, 0), accent)
		_arms.append(arm)

	var lt := OmniLight3D.new()
	lt.light_color = _colour.lightened(0.4)
	lt.light_energy = 1.9
	lt.omni_range = 15.0
	lt.shadow_enabled = false
	lt.position = Vector3(0, 2.4, 0)
	_root.add_child(lt)


# ------------------------------------------------------------------ tick ---

func _process(delta: float) -> void:
	if not alive or world == null:
		return
	_state_t += delta
	_cool = maxf(0.0, _cool - delta)

	if _flash > 0.0:
		_flash = maxf(0.0, _flash - delta * 4.0)
		for i in _mats.size():
			_mats[i].albedo_color = _base_colours[i].lerp(Color(1, 1, 1), _flash * 0.8)

	_fall(delta)

	match state:
		State.SPAWNING:
			_root.scale = Vector3.ONE * bscale * clampf(_state_t / 1.1, 0.15, 1.0)
			_root.position.y = lerpf(-3.0, 0.0, clampf(_state_t / 1.1, 0.0, 1.0))
			if _state_t >= 1.1:
				_root.position.y = 0.0
				_enter(State.CHASE)
		State.CHASE:
			_chase(delta)
		State.WINDUP:
			_windup(delta)
		State.SLAM:
			if _state_t > 0.12:
				_do_slam()
		State.RECOVER:
			if _state_t > (0.55 if _raging else 0.85):
				_enter(State.CHASE)
		State.VOLLEY:
			_volley(delta)
		State.DASH:
			_dash(delta)
		State.DYING:
			_dying(delta)

	if state != State.DYING and state != State.SPAWNING:
		_face_player(delta)
	if _blocker != null:
		_blocker.global_position = global_position


func _enter(s: int) -> void:
	state = s
	_state_t = 0.0


func _fall(delta: float) -> void:
	var gy := _ground_y()
	if global_position.y > gy + 0.02:
		_vel_y -= 30.0 * delta
		global_position.y = maxf(gy, global_position.y + _vel_y * delta)
		if global_position.y <= gy:
			_vel_y = 0.0
	else:
		global_position.y = gy
		_vel_y = 0.0


# First solid cell under the boss, so it walks over its own rubble.
func _ground_y() -> float:
	var x := floori(global_position.x)
	var z := floori(global_position.z)
	var y := mini(floori(global_position.y) + 1, VoxelWorld.SY - 1)
	while y > 0:
		if world.is_solid(x, y, z):
			return float(y + 1)
		y -= 1
	return float(VoxelWorld.ARENA_FLOOR + 1)


func _face_player(delta: float) -> void:
	if player == null:
		return
	var flat := player.global_position - global_position
	flat.y = 0.0
	if flat.length() < 0.05:
		return
	var want := atan2(-flat.x, -flat.z)
	rotation.y = lerp_angle(rotation.y, want, minf(1.0, delta * 4.0))


func _dist_to_player() -> float:
	if player == null:
		return INF
	return Vector3(global_position.x - player.global_position.x, 0.0,
		global_position.z - player.global_position.z).length()


func _chase(delta: float) -> void:
	if player == null:
		return
	var d := _dist_to_player()
	var to := player.global_position - global_position
	to.y = 0.0
	var spd := move_speed * (1.35 if _raging else 1.0)
	if d > 2.4:
		_step(to.normalized() * spd * delta)
	_walk += delta * spd * 1.5
	var swing := sin(_walk) * 0.5
	for i in _arms.size():
		_arms[i].rotation.x = swing * (1.0 if i == 0 else -1.0)
	_root.position.y = absf(sin(_walk)) * 0.09

	if _cool > 0.0:
		return
	if d < slam_radius + 1.0:
		_enter(State.WINDUP)
		emit_signal("telegraph", "SLAM INCOMING")
	elif can_dash and d > 7.0 and randf() < 0.55:
		_dash_dir = to.normalized()
		_enter(State.DASH)
		emit_signal("telegraph", "CHARGING")
	elif can_volley and d > 4.0:
		_enter(State.VOLLEY)
		emit_signal("telegraph", "VOLLEY")
	elif can_summon and randf() < 0.3:
		emit_signal("wants_minions", 2)
		emit_signal("telegraph", "CALLING SWARM")
		_cool = 5.0


func _windup(delta: float) -> void:
	var t := clampf(_state_t / (0.42 if _raging else 0.62), 0.0, 1.0)
	for arm in _arms:
		arm.rotation.x = lerpf(0.0, -2.1, t)
	if t >= 1.0:
		_enter(State.SLAM)


func _do_slam() -> void:
	for arm in _arms:
		arm.rotation.x = 0.6
	var centre := global_position + Vector3(0, 0.2, 0) - _forward() * 1.4 * bscale
	var broken: Array = world.damage_sphere(centre, slam_radius * bscale, 9.0)
	if debris != null:
		debris.emit_burst(centre, _colour, 22, 7.0, 0.2)
		for b in broken:
			debris.emit_burst(Vector3(b["pos"]) + Vector3(0.5, 0.5, 0.5),
				Blocks.color_of(b["id"]), 3, 5.5, 0.17)
	emit_signal("slammed", centre)
	if player != null and player.global_position.distance_to(centre) < slam_radius * bscale + 0.9:
		if player.has_method("take_hit"):
			player.take_hit((player.global_position - centre).normalized() + Vector3.UP * 0.4)
	_cool = (1.1 if _raging else 1.7)
	_enter(State.RECOVER)


func _volley(delta: float) -> void:
	var shots := 3 + level / 2
	var interval := 0.16
	var fired := int(_state_t / interval)
	var prev := int((_state_t - delta) / interval)
	if fired != prev and fired < shots and player != null:
		var to := (player.global_position + Vector3(0, 0.7, 0)) - _muzzle()
		var spread := Vector3(randf() - 0.5, randf() - 0.5, randf() - 0.5) * 0.1
		_fire(to.normalized() + spread)
	if _state_t > interval * float(shots) + 0.25:
		_cool = (1.2 if _raging else 1.9)
		_enter(State.CHASE)


func _dash(delta: float) -> void:
	var t := _state_t
	if t < 0.45:
		for arm in _arms:
			arm.rotation.x = lerpf(0.0, -0.9, t / 0.45)
		return
	_step(_dash_dir * move_speed * 2.9 * delta)
	if player != null and _dist_to_player() < 2.2 and player.has_method("take_hit"):
		player.take_hit(_dash_dir + Vector3.UP * 0.4)
		_cool = 1.6
		_enter(State.RECOVER)
		return
	if t > 1.5:
		_cool = (1.0 if _raging else 1.6)
		_enter(State.RECOVER)


func _dying(delta: float) -> void:
	var t := clampf(_state_t / 1.8, 0.0, 1.0)
	_root.scale = Vector3.ONE * bscale * (1.0 - t * 0.85)
	_root.rotation.z = sin(_state_t * 14.0) * 0.25 * (1.0 - t)
	if debris != null and fmod(_state_t, 0.12) < delta:
		debris.emit_burst(global_position + Vector3(0, 1.6 * bscale, 0), _colour, 8, 6.0, 0.22)
	if t >= 1.0:
		emit_signal("died")
		queue_free()


func _forward() -> Vector3:
	return -global_transform.basis.z


func _muzzle() -> Vector3:
	return global_position + Vector3(0, 2.1 * bscale, 0) + _forward() * 1.2 * bscale


func _fire(dir: Vector3) -> void:
	var b := Area3D.new()
	b.set_script(ProjectileScript)
	b.setup(1.0, _colour.lightened(0.35), 26.0, false, 0.24)
	b.direction = dir.normalized()
	b.world = world
	b.debris = debris
	b.life = 3.5
	b.terrain_damage = 3.0
	b.blast_radius = 1.4
	get_parent().add_child(b)
	b.global_position = _muzzle()


# Keeps the boss inside the arena disc, and out of walls it cannot break.
func _step(delta_pos: Vector3) -> void:
	var target := global_position + delta_pos
	var centre := world.arena_centre()
	var off := Vector2(target.x - centre.x, target.z - centre.z)
	var limit := float(VoxelWorld.ARENA_R) - 1.6 * bscale
	if off.length() > limit:
		off = off.normalized() * limit
		target.x = centre.x + off.x
		target.z = centre.z + off.y
	global_position.x = target.x
	global_position.z = target.z


# ---------------------------------------------------------------- damage ---

func take_damage(amount: float, _dir: Vector3 = Vector3.ZERO) -> void:
	if not alive or state == State.DYING:
		return
	health = maxf(0.0, health - amount)
	_flash = 1.0
	emit_signal("health_changed", health, max_health)
	if debris != null:
		debris.emit_burst(global_position + Vector3(0, 2.0 * bscale, 0), _colour, 4, 3.5, 0.13)
	if not _raging and health < max_health * 0.35:
		_raging = true
		emit_signal("telegraph", "ENRAGED")
		for i in _mats.size():
			_base_colours[i] = _base_colours[i].lerp(Color(1.0, 0.35, 0.2), 0.28)
	if health <= 0.0:
		alive = false
		# Damage usually arrives from inside an area_entered callback, and the
		# physics server refuses direct state changes during signal dispatch.
		_hurtbox.set_deferred("monitorable", false)
		if _blocker != null:
			_blocker.queue_free()
			_blocker = null
		_enter(State.DYING)
