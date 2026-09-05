# The siege boss. Movement is scripted rather than physics-driven: a voxel
# arena full of 1m steps snags CharacterBody3D constantly, and the boss is
# meant to walk over rubble and stop at walls rather than climb them.
class_name Boss
extends Node3D

signal health_changed(current: float, maximum: float)
signal died()
signal smashed(pos: Vector3)
signal telegraph(kind: String)

enum State { SPAWNING, CHASE, WINDUP, SMASH, RECOVER, HURL, STOMP, DYING }

const ProjectileScript = preload("res://scripts/projectile.gd")

var world: VoxelWorld
var player: Player
var round_no := 1

var max_health := 220.0
var health := 220.0
var move_speed := 3.0
var smash_power := 8.0
var smash_radius := 2.6
var attack_cooldown := 1.6
var contact_damage := 18.0
var bscale := 1.0
var can_hurl := false
var can_stomp := false

var state: int = State.SPAWNING
var _state_t := 0.0
var _cool := 0.0
var _target_block = null
var _retarget_t := 0.0
var _spike_t := 0.0
var _stuck_t := 0.0
var _last_pos := Vector3.ZERO
var _walk_phase := 0.0
var _vel_y := 0.0
var _flash := 0.0
var _raging := false
var _target_is_player := false

var _root: Node3D
var _l_shoulder: Node3D
var _r_shoulder: Node3D
var _head: Node3D
var _core: MeshInstance3D
var _eyes: Array[MeshInstance3D] = []
var _mats: Array[StandardMaterial3D] = []
var _base_colors: Array[Color] = []
var _blocker: AnimatableBody3D
var _parts: Array[MeshInstance3D] = []


func configure(r: int) -> void:
	round_no = r
	var k := float(r - 1)
	max_health = 220.0 + 130.0 * k
	health = max_health
	move_speed = minf(3.0 + 0.28 * k, 6.2)
	smash_power = 8.0 + 2.2 * k
	smash_radius = minf(2.6 + 0.16 * k, 4.6)
	attack_cooldown = maxf(1.7 - 0.09 * k, 0.75)
	contact_damage = 16.0 + 2.6 * k
	bscale = minf(1.0 + 0.055 * k, 1.55)
	can_hurl = r >= 3
	can_stomp = r >= 5


func _ready() -> void:
	add_to_group("boss")
	_build_body()
	_last_pos = global_position
	emit_signal("health_changed", health, max_health)


# ---------------------------------------------------------------- body ----

func _mk(size: Vector3, col: Color, pos: Vector3, parent: Node3D) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size * bscale
	mi.mesh = bm
	mi.position = pos * bscale
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.roughness = 0.85
	mi.set_surface_override_material(0, mat)
	parent.add_child(mi)
	_mats.append(mat)
	_base_colors.append(col)
	_parts.append(mi)
	return mi


func _build_body() -> void:
	_root = Node3D.new()
	add_child(_root)

	var rock := Color(0.36, 0.34, 0.38)
	var rock_d := Color(0.28, 0.26, 0.3)
	var trim := Color(0.46, 0.28, 0.2)

	_mk(Vector3(0.95, 2.5, 0.95), rock_d, Vector3(-0.78, 1.25, 0), _root).name = "LegL"
	_mk(Vector3(0.95, 2.5, 0.95), rock_d, Vector3(0.78, 1.25, 0), _root).name = "LegR"
	_mk(Vector3(2.7, 0.6, 1.7), trim, Vector3(0, 2.6, 0), _root).name = "Belt"
	_mk(Vector3(2.9, 2.6, 1.7), rock, Vector3(0, 4.0, 0), _root).name = "Torso"
	_mk(Vector3(3.4, 0.7, 1.9), rock_d, Vector3(0, 5.2, 0), _root).name = "Shoulders"

	_head = Node3D.new()
	_head.position = Vector3(0, 5.9, 0) * bscale
	_root.add_child(_head)
	_mk(Vector3(1.7, 1.5, 1.6), rock, Vector3.ZERO, _head).name = "Head"
	_mk(Vector3(1.9, 0.35, 1.75), trim, Vector3(0, 0.55, 0), _head).name = "Brow"
	for sx in [-0.42, 0.42]:
		var eye := _mk(Vector3(0.34, 0.24, 0.12), Color(1.0, 0.5, 0.15), Vector3(sx, 0.05, -0.82), _head)
		var em: StandardMaterial3D = eye.get_surface_override_material(0)
		em.emission_enabled = true
		em.emission = Color(1.0, 0.45, 0.1)
		em.emission_energy_multiplier = 4.0
		_eyes.append(eye)

	_l_shoulder = Node3D.new()
	_l_shoulder.position = Vector3(-2.0, 5.0, 0) * bscale
	_root.add_child(_l_shoulder)
	_mk(Vector3(0.9, 3.0, 0.9), rock, Vector3(0, -1.5, 0), _l_shoulder).name = "ArmL"
	_mk(Vector3(1.5, 1.4, 1.5), rock_d, Vector3(0, -3.2, 0), _l_shoulder).name = "FistL"

	_r_shoulder = Node3D.new()
	_r_shoulder.position = Vector3(2.0, 5.0, 0) * bscale
	_root.add_child(_r_shoulder)
	_mk(Vector3(0.9, 3.0, 0.9), rock, Vector3(0, -1.5, 0), _r_shoulder).name = "ArmR"
	_mk(Vector3(1.5, 1.4, 1.5), rock_d, Vector3(0, -3.2, 0), _r_shoulder).name = "FistR"

	# Glowing core: the 3x damage weak point, only reachable from the front.
	_core = MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.52 * bscale
	sm.height = 1.04 * bscale
	_core.mesh = sm
	_core.position = Vector3(0, 4.1, -0.95) * bscale
	var cm := StandardMaterial3D.new()
	cm.albedo_color = Color(1.0, 0.75, 0.2)
	cm.emission_enabled = true
	cm.emission = Color(1.0, 0.6, 0.12)
	cm.emission_energy_multiplier = 6.0
	cm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_core.set_surface_override_material(0, cm)
	_root.add_child(_core)

	var core_light := OmniLight3D.new()
	core_light.light_color = Color(1.0, 0.6, 0.2)
	core_light.light_energy = 2.5
	core_light.omni_range = 12.0 * bscale
	_core.add_child(core_light)

	_add_hurtbox(Vector3(3.0, 3.2, 1.9), Vector3(0, 3.9, 0), 1.0)
	_add_hurtbox(Vector3(2.4, 2.6, 1.2), Vector3(0, 1.3, 0), 0.85)
	_add_hurtbox(Vector3(1.9, 1.7, 1.8), Vector3(0, 5.9, 0), 1.6)
	_add_hurtbox(Vector3(1.2, 1.2, 1.2), Vector3(0, 4.1, -1.0), 3.0)

	# Solid volume so the player cannot stand inside the boss.
	_blocker = AnimatableBody3D.new()
	_blocker.sync_to_physics = false
	_blocker.collision_layer = 1
	_blocker.collision_mask = 0
	var bs := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.height = 5.6 * bscale
	cap.radius = 1.3 * bscale
	bs.shape = cap
	bs.position = Vector3(0, 3.0, 0) * bscale
	_blocker.add_child(bs)
	add_child(_blocker)


func _add_hurtbox(size: Vector3, pos: Vector3, mult: float) -> void:
	var area := Area3D.new()
	area.collision_layer = 8
	area.collision_mask = 0
	area.monitoring = false
	area.monitorable = true
	area.set_meta("boss_hurtbox", true)
	area.set_meta("dmg_mult", mult)
	var cs := CollisionShape3D.new()
	var bx := BoxShape3D.new()
	bx.size = size * bscale
	cs.shape = bx
	cs.position = pos * bscale
	area.add_child(cs)
	add_child(area)


# -------------------------------------------------------------- update ----

func _physics_process(delta: float) -> void:
	if state == State.DYING:
		_update_death(delta)
		return

	_state_t += delta
	_cool = maxf(0.0, _cool - delta)
	_flash = maxf(0.0, _flash - delta * 6.0)
	_apply_flash()
	_check_rage()

	match state:
		State.SPAWNING:
			_update_spawning(delta)
		State.CHASE:
			_update_chase(delta)
		State.WINDUP:
			_update_windup(delta)
		State.SMASH:
			_update_smash()
		State.RECOVER:
			_update_recover(delta)
		State.HURL:
			_update_hurl(delta)
		State.STOMP:
			_update_stomp(delta)

	_apply_gravity_and_ground(delta)
	_tick_spikes(delta)


func _check_rage() -> void:
	var should := health < max_health * 0.35
	if should == _raging:
		return
	_raging = should
	for e in _eyes:
		var m: StandardMaterial3D = e.get_surface_override_material(0)
		m.emission = Color(1.0, 0.15, 0.05) if _raging else Color(1.0, 0.45, 0.1)
		m.emission_energy_multiplier = 8.0 if _raging else 4.0


func _speed() -> float:
	return move_speed * (1.35 if _raging else 1.0)


func _cool_scale() -> float:
	return 0.72 if _raging else 1.0


func _update_spawning(_delta: float) -> void:
	var t: float = clampf(_state_t / 2.0, 0.0, 1.0)
	_root.position.y = lerpf(-7.0 * bscale, 0.0, ease(t, 0.4))
	if t >= 1.0:
		_root.position.y = 0.0
		_set_state(State.CHASE)


func _update_chase(delta: float) -> void:
	_retarget_t -= delta
	if _retarget_t <= 0.0 or _target_block == null:
		_pick_target()
		_retarget_t = 0.6

	var goal := _goal_position()
	var to := goal - global_position
	to.y = 0.0
	var dist := to.length()

	_face(to, delta)

	var reach := 3.2 * bscale
	if dist > reach:
		var step := to.normalized() * _speed() * delta
		global_position += step
		_walk_phase += delta * _speed() * 1.5
		_animate_walk()
	else:
		_walk_phase = lerpf(_walk_phase, 0.0, delta * 4.0)
		_animate_walk()
		if _cool <= 0.0:
			_choose_attack()

	# A wall taller than the boss can step over also triggers a smash.
	if _wall_ahead() and _cool <= 0.0 and dist > reach:
		_choose_attack()

	_stuck_t += delta
	if _stuck_t >= 1.2:
		if global_position.distance_to(_last_pos) < 0.35 and _cool <= 0.0:
			_choose_attack()
		_last_pos = global_position
		_stuck_t = 0.0


func _choose_attack() -> void:
	if can_stomp and randf() < 0.2 and _player_dist() < 9.0 * bscale:
		_set_state(State.STOMP)
		emit_signal("telegraph", "STOMP")
	elif can_hurl and randf() < 0.28 and _dist_to_goal() > 9.0:
		_set_state(State.HURL)
		emit_signal("telegraph", "HURL")
	else:
		_set_state(State.WINDUP)


func _update_windup(delta: float) -> void:
	var t: float = clampf(_state_t / (0.62 * _cool_scale()), 0.0, 1.0)
	var a := lerpf(0.0, -2.5, ease(t, 0.5))
	_l_shoulder.rotation.x = a
	_r_shoulder.rotation.x = a
	var goal := _goal_position() - global_position
	goal.y = 0.0
	_face(goal, delta * 0.6)
	if t >= 1.0:
		_set_state(State.SMASH)


func _update_smash() -> void:
	_l_shoulder.rotation.x = 0.65
	_r_shoulder.rotation.x = 0.65

	var impact := _impact_point()
	if world != null:
		var broken := world.damage_sphere(impact, smash_radius, smash_power)
		var game := get_tree().get_first_node_in_group("game")
		if game != null and game.has_method("on_blast"):
			game.on_blast(impact, broken)
	emit_signal("smashed", impact)

	if player != null and player.alive:
		var pd := player.global_position.distance_to(impact)
		if pd < smash_radius + 1.8:
			player.take_damage(contact_damage)
			player.knockback(player.global_position - impact, 9.0)

	_cool = attack_cooldown * _cool_scale()
	_set_state(State.RECOVER)


func _update_recover(delta: float) -> void:
	var t: float = clampf(_state_t / 0.55, 0.0, 1.0)
	_l_shoulder.rotation.x = lerpf(0.65, 0.0, t)
	_r_shoulder.rotation.x = lerpf(0.65, 0.0, t)
	if t >= 1.0:
		_set_state(State.CHASE)
	_animate_walk()
	_walk_phase = lerpf(_walk_phase, 0.0, delta * 5.0)


func _update_hurl(delta: float) -> void:
	var t: float = clampf(_state_t / 1.0, 0.0, 1.0)
	_r_shoulder.rotation.x = lerpf(0.0, -2.7, ease(minf(t * 1.6, 1.0), 0.5))
	var goal := _goal_position() - global_position
	goal.y = 0.0
	_face(goal, delta)
	if t >= 1.0:
		_throw_boulder()
		_r_shoulder.rotation.x = 0.9
		_cool = (attack_cooldown + 0.6) * _cool_scale()
		_set_state(State.RECOVER)


func _throw_boulder() -> void:
	var proj := ProjectileScript.new()
	proj.setup(22.0 + round_no * 2.0, Color(0.85, 0.5, 0.2), 26.0, false, 0.7)
	proj.terrain_damage = smash_power * 1.4
	proj.blast_radius = smash_radius * 0.9
	proj.world = world
	proj.life = 6.0
	get_parent().add_child(proj)
	var origin := global_position + Vector3(0, 6.0 * bscale, 0) - global_transform.basis.z * 2.0 * bscale
	proj.global_position = origin
	var goal := _goal_position() + Vector3(0, 1.0, 0)
	# Lead the shot slightly upward so the arc clears the boss's own shoulders.
	proj.direction = ((goal - origin).normalized() + Vector3.UP * 0.12).normalized()


func _update_stomp(delta: float) -> void:
	var t: float = clampf(_state_t / 0.85, 0.0, 1.0)
	_root.position.y = sin(t * PI) * 1.6 * bscale
	if t >= 1.0:
		_root.position.y = 0.0
		var centre := global_position
		if world != null:
			var broken := world.damage_sphere(centre + Vector3(0, 0.5, 0), smash_radius * 1.7, smash_power * 0.7)
			var game := get_tree().get_first_node_in_group("game")
			if game != null and game.has_method("on_blast"):
				game.on_blast(centre, broken)
		emit_signal("smashed", centre)
		if player != null and player.alive:
			var pd := player.global_position.distance_to(centre)
			if pd < smash_radius * 2.2:
				player.take_damage(contact_damage * 0.8)
				player.knockback(player.global_position - centre, 12.0)
		_cool = attack_cooldown * _cool_scale()
		_set_state(State.RECOVER)
	_face((_goal_position() - global_position) * Vector3(1, 0, 1), delta * 0.5)


func _set_state(s: int) -> void:
	state = s
	_state_t = 0.0


func _animate_walk() -> void:
	var swing := sin(_walk_phase) * 0.55
	if state == State.CHASE or state == State.RECOVER:
		_l_shoulder.rotation.x = lerpf(_l_shoulder.rotation.x, swing, 0.4)
		_r_shoulder.rotation.x = lerpf(_r_shoulder.rotation.x, -swing, 0.4)
	_root.position.y = absf(sin(_walk_phase)) * 0.16 * bscale
	_head.rotation.y = sin(_walk_phase * 0.5) * 0.12


func _face(dir: Vector3, delta: float) -> void:
	if dir.length_squared() < 0.001:
		return
	var want := atan2(-dir.x, -dir.z)
	rotation.y = lerp_angle(rotation.y, want, clampf(delta * 4.0, 0.0, 1.0))


# ------------------------------------------------------- ground & aim ----

func _apply_gravity_and_ground(delta: float) -> void:
	if world == null:
		return
	var feet := global_position.y
	var ground := _sample_ground(feet)
	if feet > ground + 0.05:
		_vel_y -= 26.0 * delta
		global_position.y = maxf(ground, feet + _vel_y * delta)
		if global_position.y <= ground:
			_vel_y = 0.0
	else:
		_vel_y = 0.0
		# Climb rubble and gentle slopes smoothly instead of teleporting.
		global_position.y = move_toward(global_position.y, ground, delta * 6.0)

	global_position.x = clampf(global_position.x, 3.0, float(VoxelWorld.SX) - 3.0)
	global_position.z = clampf(global_position.z, 3.0, float(VoxelWorld.SZ) - 3.0)


# Highest surface under the boss footprint that it could actually stand on.
#
# A column only counts when it has open air directly above the solid block --
# otherwise the scan catches the *face* of a wall partway up, and the boss
# ratchets itself a block higher every frame, climbing player walls and tree
# trunks instead of smashing them. Anything taller than STEP_MAX is a wall.
func _sample_ground(feet: float) -> float:
	const STEP_MAX := 1.6
	var best := -1.0
	var r: float = 1.1 * bscale
	var ceiling: int = clampi(int(floor(feet + STEP_MAX)), 0, VoxelWorld.SY - 2)
	for oz in [-r, 0.0, r]:
		for ox in [-r, 0.0, r]:
			var gx := floori(global_position.x + ox)
			var gz := floori(global_position.z + oz)
			for y in range(ceiling, -1, -1):
				if not world.is_solid(gx, y, gz):
					continue
				if not world.is_solid(gx, y + 1, gz):
					best = maxf(best, float(y + 1))
				break
	# Boxed in on every side: hold station rather than dropping through the map.
	if best < 0.0:
		return global_position.y
	return best


func _wall_ahead() -> bool:
	if world == null:
		return false
	var fwd := -global_transform.basis.z
	var probe := global_position + fwd * (1.6 * bscale)
	var base: int = int(floor(global_position.y))
	for dy in range(2, 5):
		if world.is_solid(floori(probe.x), base + dy, floori(probe.z)):
			return true
	return false


func _pick_target() -> void:
	_target_is_player = false
	if world != null:
		var b = world.nearest_placed(global_position)
		if b != null:
			_target_block = b
			# If the player is right on top of it, swat them instead.
			if player != null and player.alive and _player_dist() < 5.0 * bscale and randf() < 0.4:
				_target_is_player = true
			return
	_target_block = null
	_target_is_player = true


func _goal_position() -> Vector3:
	if _target_is_player and player != null and player.alive:
		return player.global_position
	if _target_block != null:
		return Vector3(_target_block) + Vector3(0.5, 0.5, 0.5)
	if player != null:
		return player.global_position
	return global_position


func _dist_to_goal() -> float:
	var g := _goal_position()
	g.y = global_position.y
	return global_position.distance_to(g)


func _player_dist() -> float:
	if player == null:
		return INF
	return global_position.distance_to(player.global_position)


func _impact_point() -> Vector3:
	var goal := _goal_position()
	var fwd := -global_transform.basis.z
	var reach := global_position + fwd * 3.0 * bscale + Vector3(0, 1.2 * bscale, 0)
	# Smash where the fists actually land, but do not overshoot the target.
	if goal.distance_to(global_position) < reach.distance_to(global_position):
		return goal
	return reach


# --------------------------------------------------------- spikes/dmg ----

func _tick_spikes(delta: float) -> void:
	if world == null or world.spike_blocks.is_empty():
		return
	_spike_t -= delta
	if _spike_t > 0.0:
		return
	_spike_t = 0.5

	var r: int = int(ceil(1.5 * bscale))
	var fy: int = int(floor(global_position.y))
	var total := 0.0
	for dz in range(-r, r + 1):
		for dx in range(-r, r + 1):
			for dy in range(-1, 2):
				var gx := floori(global_position.x) + dx
				var gy := fy + dy
				var gz := floori(global_position.z) + dz
				if world.get_block(gx, gy, gz) == Blocks.SPIKE:
					total += 5.0
					# Spikes blunt themselves on the boss's hide.
					world.damage_block(gx, gy, gz, 0.35)
	if total > 0.0:
		apply_damage(minf(total, 24.0), global_position, false)


func apply_damage(amount: float, from_pos: Vector3, is_core: bool) -> void:
	if state == State.SPAWNING or state == State.DYING:
		return
	health = maxf(0.0, health - amount)
	_flash = 1.0
	emit_signal("health_changed", health, max_health)
	var game := get_tree().get_first_node_in_group("game")
	if game != null and game.has_method("on_boss_hit"):
		game.on_boss_hit(from_pos, amount, is_core)
	if health <= 0.0:
		_begin_death()


func _apply_flash() -> void:
	if _flash <= 0.0 and not _mats.is_empty():
		if _mats[0].albedo_color == _base_colors[0]:
			return
	# Keep the golem readable: a hot tint, not a white-out, or sustained turret
	# fire leaves it a featureless silhouette.
	for i in _mats.size():
		_mats[i].albedo_color = _base_colors[i].lerp(Color(1.0, 0.42, 0.34), _flash * 0.55)


func _begin_death() -> void:
	state = State.DYING
	_state_t = 0.0
	if is_instance_valid(_blocker):
		_blocker.queue_free()
	# Death is usually triggered from inside an area_entered callback, and the
	# physics server refuses direct state changes during signal dispatch.
	for a in get_children():
		if a is Area3D:
			a.set_deferred("monitorable", false)
	emit_signal("died")


func _update_death(delta: float) -> void:
	_state_t += delta
	# Parts drift apart and fade; the core flares before it goes out.
	for i in _parts.size():
		var p := _parts[i]
		if not is_instance_valid(p):
			continue
		var dir := Vector3(sin(float(i) * 2.1), 0.6 + fmod(float(i) * 0.37, 0.7), cos(float(i) * 1.7))
		p.position += dir * delta * 2.2
		p.rotation += Vector3(0.9, 1.4, 0.7) * delta * (0.4 + float(i % 4) * 0.2)
	var fade: float = clampf(1.0 - _state_t / 2.2, 0.0, 1.0)
	for m in _mats:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.albedo_color.a = fade
	if is_instance_valid(_core):
		var s: float = 1.0 + sin(_state_t * 12.0) * 0.25
		_core.scale = Vector3(s, s, s) * maxf(fade, 0.01)
	if _state_t > 2.4:
		queue_free()
