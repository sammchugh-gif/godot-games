# Sonic's controller. Momentum first: the body is a sphere in "floating"
# motion mode, and all ground logic is ours. On the ground we keep a scalar
# speed, a heading tangent to the surface and the surface normal, so slopes,
# loops, corkscrews and wall runs are all just "ground with a different
# normal". Detaching happens when the surface is steep and speed is low, or
# when the surface simply ends (ramps launch you with your velocity intact).
class_name Player
extends CharacterBody3D

signal jumped()
signal landed(strength: float)
signal boost_changed(on: bool)
signal spindash_released(power: float)
signal homing_hit(target: Node3D)
signal rail_changed(on: bool)
signal ring_collected(total: int)
signal took_hit()
signal died()
signal splashed(pos: Vector3)
signal victory_started()
signal drift_changed(on: bool)
signal sprang()
signal dashed()

enum St { GROUND, AIR, RAIL, HOMING, HURT, DEAD, VICTORY }

const RADIUS := 0.45
const WATER_Y := 0.25
const MODEL_SCALE := 1.3
const MAX_RUN := 40.0
const MAX_BOOST := 68.0
const ACCEL := 26.0
const BRAKE := 48.0
const FRICTION := 5.5
const ROLL_FRICTION := 1.3
const GRAVITY := 38.0
const JUMP := 15.5
const AIR_ACCEL := 20.0
const TURN_SLOW := 7.5
const TURN_FAST := 1.5
const DRIFT_TURN := 2.6
const STEEP_Y := 0.55
const MIN_STEEP_SPEED := 11.0
const SNAP := 1.0
const HOMING_SPEED := 62.0
const HOMING_RANGE := 22.0
const BOOST_DRAIN := 20.0
const RAIL_MAX := 58.0

var st := St.GROUND
var speed := 0.0
var heading := Vector3.FORWARD
var gnorm := Vector3.UP
var rolling := false
var spindash := false
var charge := 0.0
var boosting := false
var boost_gauge := 45.0
var rings := 0
var drifting := false
var drift_side := 0.0
var air_dash_used := false
var homing_target: Node3D
var homing_t := 0.0
var rail: Rail
var rail_offset := 0.0
var rail_dir := 1.0
var rail_cooldown := 0.0
var rail_time := 0.0
var spring_t := 0.0
var hurt_t := 0.0
var invuln_t := 0.0
var stumble_t := 0.0
var jump_hold_t := 0.0
var air_time := 0.0
var victory_t := 0.0
var last_ground_pos := Vector3.ZERO
var input_dir := Vector3.ZERO
var input_raw := Vector2.ZERO
var cam_basis := Basis.IDENTITY
var model: SonicModel
var model_basis := Basis.IDENTITY
var frozen := false
var was_boosting_air := false
var landing_boost_t := 0.0
var anim_state := "idle"
var rail_balance := 0.0
var _jump_buffer := 0.0
var _coyote := 0.0
var _spin_was := false
var _boost_was := false
var _prev_pos := Vector3.ZERO
var ground_kind := "road"
var wall_run_t := 0.0
var leave_reason := ""
var _rescue_t := 0.0
var track: Track
static var debug_probe := false
var track_s := 0.0
var track_i := -1
var _stall := 0


func _ready() -> void:
	collision_layer = 2
	collision_mask = 1
	motion_mode = CharacterBody3D.MOTION_MODE_FLOATING
	wall_min_slide_angle = 0.0
	safe_margin = 0.01
	var cs := CollisionShape3D.new()
	var sh := SphereShape3D.new()
	sh.radius = RADIUS
	cs.shape = sh
	add_child(cs)
	model = SonicModel.new()
	model.position = Vector3(0, -RADIUS, 0)
	model.scale = Vector3.ONE * MODEL_SCALE
	add_child(model)
	add_to_group("player")
	_prev_pos = global_position


func reset_at(pos: Vector3, dir: Vector3) -> void:
	global_position = pos
	heading = dir.normalized()
	gnorm = Vector3.UP
	velocity = Vector3.ZERO
	speed = 0.0
	st = St.GROUND
	rolling = false
	spindash = false
	charge = 0.0
	boosting = false
	drifting = false
	hurt_t = 0.0
	stumble_t = 0.0
	spring_t = 0.0
	invuln_t = 1.0
	rail = null
	model_basis = MeshLib.basis_forward(heading, Vector3.UP)
	model.global_transform = Transform3D(model_basis.scaled(Vector3.ONE * MODEL_SCALE), global_position + Vector3(0, -RADIUS, 0))
	_prev_pos = pos
	frozen = false


func is_attacking() -> bool:
	return rolling or spindash or st == St.HOMING or (st == St.AIR and _in_ball()) or boosting


func _in_ball() -> bool:
	if st == St.HOMING or spindash or rolling:
		return true
	if st == St.AIR:
		return anim_state == "ball"
	return false


func visual_speed() -> float:
	if st == St.GROUND or st == St.RAIL:
		return speed
	return velocity.length()


func horizontal_speed() -> float:
	return Vector2(velocity.x, velocity.z).length()


func add_rings(n: int) -> void:
	rings += n
	boost_gauge = minf(boost_gauge + 3.0 * n, 100.0)
	ring_collected.emit(rings)


func add_boost(v: float) -> void:
	boost_gauge = clampf(boost_gauge + v, 0.0, 100.0)


# ---------------------------------------------------------------------------

func _physics_process(dt: float) -> void:
	if frozen:
		invuln_t = maxf(invuln_t - dt, 0.0)
		_update_model(dt)
		return
	_read_input()
	invuln_t = maxf(invuln_t - dt, 0.0)
	rail_cooldown = maxf(rail_cooldown - dt, 0.0)
	stumble_t = maxf(stumble_t - dt, 0.0)
	spring_t = maxf(spring_t - dt, 0.0)
	landing_boost_t = maxf(landing_boost_t - dt, 0.0)
	_jump_buffer = maxf(_jump_buffer - dt, 0.0)
	if Input.is_action_just_pressed("jump"):
		_jump_buffer = 0.12

	match st:
		St.GROUND:
			_ground(dt)
		St.AIR:
			_air(dt)
		St.RAIL:
			_rail(dt)
		St.HOMING:
			_homing(dt)
		St.HURT:
			_hurt(dt)
		St.VICTORY:
			_victory(dt)
		St.DEAD:
			pass

	# Water: Sonic never drowns. Touching the sea (or the lagoon) fires him
	# back onto the route ahead in a high arc; only the void below kills.
	if global_position.y < WATER_Y and st != St.DEAD and st != St.VICTORY and _rescue_t <= 0.0:
		_water_rescue()
	_rescue_t = maxf(_rescue_t - dt, 0.0)
	if global_position.y < -40.0 and st != St.DEAD:
		_die()
	_update_model(dt)
	RenderingServer.global_shader_parameter_set("player_pos", global_position)
	RenderingServer.global_shader_parameter_set("player_speed", visual_speed())
	_prev_pos = global_position


func _read_input() -> void:
	# Smooth the stick over a few frames: thumbs and keys both jitter, and
	# at speed a one-frame twitch should not become a swerve.
	var raw := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	input_raw = input_raw.lerp(raw, 1.0 - exp(-18.0 * get_physics_process_delta_time()))
	if input_raw.length() < 0.03 and raw == Vector2.ZERO:
		input_raw = Vector2.ZERO
	var f := -cam_basis.z
	f.y = 0.0
	f = f.normalized() if f.length_squared() > 0.001 else Vector3.FORWARD
	var r := cam_basis.x
	r.y = 0.0
	r = r.normalized() if r.length_squared() > 0.001 else Vector3.RIGHT
	input_dir = f * -input_raw.y + r * input_raw.x
	if input_dir.length() > 1.0:
		input_dir = input_dir.normalized()


func _project(v: Vector3, n: Vector3) -> Vector3:
	return v - n * v.dot(n)


func _boost_common(dt: float, on_ground: bool) -> void:
	var want := Input.is_action_pressed("boost") and boost_gauge > 0.0 and stumble_t <= 0.0 and spring_t <= 0.0
	if want and not boosting:
		boosting = true
		if on_ground:
			speed = maxf(speed, 42.0)
		else:
			var h := Vector3(velocity.x, 0, velocity.z)
			var dir := h.normalized() if h.length() > 1.0 else heading
			velocity = dir * maxf(h.length(), 42.0) + Vector3(0, maxf(velocity.y, 0.0) * 0.5, 0)
		boost_changed.emit(true)
	elif not want and boosting:
		boosting = false
		boost_changed.emit(false)
	if boosting:
		boost_gauge = maxf(boost_gauge - BOOST_DRAIN * dt, 0.0)
		if boost_gauge <= 0.0:
			boosting = false
			boost_changed.emit(false)


func _ground(dt: float) -> void:
	air_time = 0.0
	_coyote = 0.12
	_boost_common(dt, true)
	var mag := input_dir.length()
	var steep := gnorm.y < STEEP_Y
	var wall := gnorm.y < 0.25
	wall_run_t = wall_run_t + dt if wall else 0.0

	# Desired direction on the surface. Auto-run engages on steep ground and
	# anywhere the route is a loop / corkscrew / wall (including their
	# gently banked entries and exits, so the exit does not fling you off).
	var d := _project(input_dir, gnorm)
	var near := {}
	if track and speed > 6.0:
		near = _nearest_frame()
	# Ramps auto-aim too, so a launch always lines up with what it targets.
	var auto_run: bool = steep or (not near.is_empty() and str(near["kind"]) in ["loop", "ramp"])
	if auto_run and speed > 6.0:
		# On loops and walls we only allow accelerating / braking along the
		# heading, so a nudge on the stick cannot walk Sonic off the track,
		# and the heading follows the road: loops are helices, so keeping a
		# fixed heading would walk you off the outer edge by the top.
		var along := d.dot(heading)
		d = heading * along
		mag = absf(along)
		if not near.is_empty():
			var fr := near
			if true:
				var rf := _project(fr["f"], gnorm)
				if rf.length_squared() > 1e-4:
					rf = rf.normalized()
					if rf.dot(heading) < 0.0:
						rf = -rf
					# Auto-run: the heading is the road's direction (a helix
					# climbs along its own forward vector), and Sonic is drawn
					# back to the centre line quickly enough to beat any drift
					# at boost speed.
					heading = MeshLib.safe_slerp(heading, rf, 1.0 - exp(-30.0 * dt))
					var lat := (global_position - (fr["p"] as Vector3)).dot(fr["r"])
					var rr := _project(fr["r"], gnorm)
					if rr.length_squared() > 1e-4:
						rr = rr.normalized()
						global_position -= rr * lat * minf(6.0 * dt, 1.0)
	if d.length_squared() > 1e-4:
		d = d.normalized()

	# Spin dash: crouch and rev while nearly still.
	var spin_held := Input.is_action_pressed("spin")
	if spindash:
		speed = move_toward(speed, 0.0, 60.0 * dt)
		charge = minf(charge + dt / 0.85, 1.0)
		if not spin_held:
			spindash = false
			rolling = true
			speed = 30.0 + 26.0 * charge
			var dir := d if mag > 0.3 else heading
			heading = dir
			spindash_released.emit(charge)
			charge = 0.0
		_finish_ground_move(dt)
		return
	if spin_held and not _spin_was and speed < 9.0 and not steep:
		spindash = true
		charge = 0.0
		rolling = false
		_spin_was = spin_held
		_finish_ground_move(dt)
		return
	_spin_was = spin_held

	# Rolling: hold spin while moving.
	rolling = spin_held and speed > 3.0 and stumble_t <= 0.0
	if rolling and speed < 3.0:
		rolling = false

	# Drift: hold the drift button while running fast.
	var want_drift := Input.is_action_pressed("drift") and speed > 14.0 and not rolling and not steep
	if want_drift != drifting:
		drifting = want_drift
		drift_changed.emit(drifting)
	if drifting:
		drift_side = lerpf(drift_side, input_raw.x, 1.0 - exp(-8.0 * dt))

	# Steering.
	var sp_t := clampf(speed / MAX_RUN, 0.0, 1.0)
	var turn_rate := lerpf(TURN_SLOW, TURN_FAST, sqrt(sp_t))
	if rolling:
		turn_rate *= 0.55
	if drifting:
		turn_rate *= DRIFT_TURN
	if boosting:
		turn_rate *= 1.35
	if mag > 0.1 and d.length_squared() > 0.5 and stumble_t <= 0.0:
		var cosang := clampf(heading.dot(d), -1.0, 1.0)
		if speed < 1.0:
			heading = d
			if not rolling:
				speed += ACCEL * mag * dt
		elif cosang < -0.35 and speed > 4.0 and not rolling and not steep:
			# Turn-around brake: skid to a stop then flip.
			speed = move_toward(speed, 0.0, BRAKE * dt)
			if speed < 1.0:
				heading = d
		elif cosang < -0.35 and steep:
			pass  # no braking on loops and walls: momentum carries you round
		else:
			var ang := acos(cosang)
			# Turn speed follows how far the stick is pushed, not just whether.
			var step := minf(ang, turn_rate * dt * (0.15 + mag * 0.85))
			var axis := heading.cross(d)
			if axis.length_squared() > 1e-6 and step > 0.0:
				heading = heading.rotated(axis.normalized(), step).normalized()
			heading = _project(heading, gnorm).normalized()
			# Speed lost through sharp turns, less while drifting.
			var loss := ang * speed * (0.10 if drifting else 0.28) * dt
			speed = maxf(speed - loss, 0.0)
			if not rolling:
				var target := MAX_RUN * mag
				if speed < target:
					var curve := 1.0 - 0.72 * pow(speed / MAX_RUN, 1.4)
					speed = minf(speed + ACCEL * curve * mag * dt, target)
				elif not boosting:
					speed = move_toward(speed, target, FRICTION * 0.6 * dt)
	else:
		var fr := ROLL_FRICTION if rolling else FRICTION
		if stumble_t > 0.0:
			fr = FRICTION * 1.6
		speed = move_toward(speed, 0.0, fr * dt)

	# Boost overrides acceleration.
	if boosting:
		speed = move_toward(speed, MAX_BOOST, 95.0 * dt)
		if speed > MAX_BOOST:
			speed = move_toward(speed, MAX_BOOST, 20.0 * dt)
	elif speed > MAX_RUN and not rolling:
		speed = move_toward(speed, MAX_RUN, 9.0 * dt)
	if drifting:
		speed = move_toward(speed, 0.0, 2.5 * dt)

	# Slopes: gravity along the heading. Rolling feels the full hill.
	var slope := 1.05 if rolling else 0.6
	if steep:
		slope *= 0.55
	speed += -heading.y * GRAVITY * slope * dt
	if speed < 0.0:
		# Sliding back down a hill: flip the heading and carry on.
		speed = -speed
		heading = -heading

	# Detach when too slow on a steep surface.
	if steep and speed < MIN_STEEP_SPEED and gnorm.y < 0.7:
		leave_reason = "too slow on steep"
		_leave_ground(true)
		return

	# Jump (buffered).
	if _jump_buffer > 0.0 and stumble_t <= 0.0:
		_jump_buffer = 0.0
		_do_jump()
		return

	_finish_ground_move(dt)


# Nearest route frame within a window of the last known distance (loops
# stack geometry vertically, so a global nearest search is ambiguous).
func _nearest_frame() -> Dictionary:
	var best := 1e18
	var bi := -1
	var frames := track.frames
	var n := frames.size()
	# First call (or after a respawn): global search; then a window of
	# frame indices around the last hit.
	var lo := 0
	var hi := n - 1
	if track_i >= 0:
		lo = maxi(track_i - 60, 0)
		hi = mini(track_i + 60, n - 1)
	for i in range(lo, hi + 1):
		var d2: float = (frames[i]["p"] as Vector3).distance_squared_to(global_position)
		if d2 < best:
			best = d2
			bi = i
	if bi < 0 or best > 30.0 * 30.0:
		track_i = -1
		return {}
	track_i = bi
	track_s = frames[bi]["s"]
	return frames[bi]


func _finish_ground_move(dt: float) -> void:
	velocity = heading * speed
	var pre_pos := global_position
	move_and_slide()
	# Wall hits.
	var hit_wall := false
	for i in get_slide_collision_count():
		var c := get_slide_collision(i)
		var n := c.get_normal()
		if n.dot(gnorm) > 0.6:
			continue
		var into := -heading.dot(n)
		if into > 0.82 and speed > 22.0 and stumble_t <= 0.0:
			# Head-on into a wall at speed: stumble.
			speed *= 0.25
			stumble_t = 0.7
			rolling = false
			if boosting:
				boosting = false
				boost_changed.emit(false)
			hit_wall = true
		elif into > 0.0:
			var side := _project(heading, n)
			side = _project(side, gnorm)
			if side.length_squared() > 1e-4:
				heading = side.normalized()
			speed *= 1.0 - into * 0.55
			hit_wall = true
	# Stall guard: at speed, with only ground-like contacts, and yet no
	# motion, the sphere has caught a trimesh edge (this happens at the end
	# of a ramp). Pop off with the current momentum rather than freeze.
	var moved := global_position.distance_to(pre_pos)
	if speed > 8.0 and not hit_wall and moved < speed * dt * 0.15:
		_stall += 1
		if _stall >= 2:
			_stall = 0
			global_position += gnorm * 0.12
			leave_reason = "stall pop"
			_leave_ground(false)
			return
	else:
		_stall = 0
	# Ground probe: from the centre, along -normal, a little ahead too.
	var space := get_world_3d().direct_space_state
	var best: Dictionary = {}
	var probes := [Vector3.ZERO, heading * 0.35, -heading * 0.2]
	var accum_n := Vector3.ZERO
	var count := 0
	var above := RADIUS + 0.6
	for off in probes:
		var from: Vector3 = global_position + off
		# Start well above the centre: at boost speed the sphere can sink
		# half a metre into a loop wall between frames, and a ray that starts
		# inside the road shell sees nothing. Hits further above than that
		# are ceilings and are ignored.
		var q := PhysicsRayQueryParameters3D.create(from + gnorm * above, from - gnorm * (RADIUS + SNAP + speed * dt * 1.2), 1, [get_rid()])
		var hit := space.intersect_ray(q)
		if hit.is_empty():
			continue
		if (hit.position - from).dot(gnorm) > above - 0.02:
			continue
		accum_n += hit.normal
		count += 1
		if best.is_empty() or off == Vector3.ZERO:
			best = hit
	if best.is_empty():
		leave_reason = "no ground under %s gn=%s" % [global_position, gnorm]
		if debug_probe:
			var q2 := PhysicsRayQueryParameters3D.create(global_position + gnorm * 3.0, global_position - gnorm * 4.0, 1, [get_rid()])
			q2.hit_back_faces = true
			var excl: Array[RID] = [get_rid()]
			for k in 6:
				q2.exclude = excl
				var h2 := space.intersect_ray(q2)
				if h2.is_empty():
					break
				leave_reason += "\n      backface-ray hit %s at %s (along gn %.2f) n=%s" % [h2.collider.name, h2.position, (h2.position - global_position).dot(gnorm), h2.normal]
				excl.append(h2.rid)
		_leave_ground(false)
		return
	var new_n: Vector3 = (accum_n / count).normalized()
	# Reject "ground" that is really a wall we just bumped.
	if new_n.dot(gnorm) < -0.2:
		leave_reason = "normal flipped %s -> %s" % [gnorm, new_n]
		_leave_ground(false)
		return
	# Sudden upward kinks (ramp lips) become launches: keep going.
	var kink := gnorm.angle_to(new_n)
	if kink > 0.9 and speed > 18.0 and new_n.y > gnorm.y:
		leave_reason = "kink %.2f %s -> %s" % [kink, gnorm, new_n]
		_leave_ground(false)
		return
	gnorm = new_n
	var hp: Vector3 = best.position
	# Snap to the surface, but never drop more than a step in one frame: a
	# ray that passed through a rising surface and found the ground under
	# the road must not pull Sonic inside the road shell.
	var target_pos := hp + gnorm * RADIUS
	var drop := (global_position - target_pos).dot(gnorm)
	var max_drop := 0.12 + speed * dt * 0.7
	if drop > max_drop:
		target_pos = global_position - gnorm * max_drop
	global_position = target_pos
	heading = _project(heading, gnorm)
	if heading.length_squared() < 1e-4:
		heading = _project(-cam_basis.z, gnorm)
	heading = heading.normalized()
	if hit_wall and speed < 0.5:
		speed = 0.0
	if not hit_wall:
		last_ground_pos = global_position
	var col: Variant = best.get("collider")
	if col and col.has_meta("ground_kind"):
		ground_kind = col.get_meta("ground_kind")
	else:
		ground_kind = "road"


func _leave_ground(slow_detach: bool) -> void:
	velocity = heading * speed
	if slow_detach:
		velocity += gnorm * 1.5
	st = St.AIR
	air_time = 0.0
	air_dash_used = false
	_coyote = 0.1
	spindash = false
	if drifting:
		drifting = false
		drift_changed.emit(false)
	anim_state = "ball" if rolling else "air"
	rolling = false
	gnorm = Vector3.UP


func _do_jump() -> void:
	var up := gnorm
	# Bias the jump toward world up when standing on gentle slopes so the arc
	# always reads as "up", but keep the surface normal on walls and loops.
	if gnorm.y > 0.5:
		up = (gnorm + Vector3.UP * 0.6).normalized()
	velocity = heading * speed + up * JUMP
	st = St.AIR
	air_time = 0.0
	air_dash_used = false
	jump_hold_t = 0.22
	anim_state = "ball"
	rolling = false
	spindash = false
	if drifting:
		drifting = false
		drift_changed.emit(false)
	gnorm = Vector3.UP
	model.trigger_jump()
	jumped.emit()


func _air(dt: float) -> void:
	air_time += dt
	_coyote = maxf(_coyote - dt, 0.0)
	_boost_common(dt, false)
	# Variable jump height.
	if jump_hold_t > 0.0:
		jump_hold_t -= dt
		if not Input.is_action_pressed("jump") and velocity.y > 4.0:
			velocity.y *= 0.55
			jump_hold_t = 0.0
	velocity.y -= GRAVITY * dt
	velocity.y = maxf(velocity.y, -60.0)

	# Air control keeps the launch speed; you can steer but not gain much.
	if spring_t <= 0.0 and stumble_t <= 0.0:
		var h := Vector3(velocity.x, 0, velocity.z)
		var hs := h.length()
		var cap := maxf(hs, 14.0)
		if boosting:
			cap = maxf(cap, MAX_BOOST * 0.95)
			var dir := h.normalized() if hs > 1.0 else heading
			h = h.move_toward(dir * MAX_BOOST * 0.95, 60.0 * dt)
		if input_dir.length() > 0.1:
			h += input_dir * AIR_ACCEL * dt
			if h.length() > cap:
				h = h.normalized() * cap
		velocity.x = h.x
		velocity.z = h.z
		if hs > 1.0:
			heading = h.normalized()

	# Homing attack / air dash on a second jump press.
	if _jump_buffer > 0.0 and spring_t <= 0.0 and stumble_t <= 0.0:
		if _coyote > 0.0 and air_time < 0.12:
			_jump_buffer = 0.0
			_do_jump()
			return
		_jump_buffer = 0.0
		var target := _find_homing_target()
		if target:
			_start_homing(target)
			return
		elif not air_dash_used:
			air_dash_used = true
			var f := heading
			f.y = 0.0
			f = f.normalized() if f.length() > 0.1 else -cam_basis.z
			var h := Vector3(velocity.x, 0, velocity.z)
			var hs2 := maxf(h.length() + 9.0, 20.0)
			velocity = f * hs2 + Vector3(0, maxf(velocity.y, 2.0), 0)
			anim_state = "ball"
			dashed.emit()

	# Rails: grab one when falling onto it.
	if rail_cooldown <= 0.0 and spring_t <= 0.0:
		if _try_grab_rail():
			return

	var pre := velocity
	move_and_slide()
	_check_landing(pre)
	if st == St.AIR and velocity.y < 0.0:
		# Short probe so we never skim across a surface without landing.
		var space := get_world_3d().direct_space_state
		var q := PhysicsRayQueryParameters3D.create(global_position, global_position - Vector3(0, RADIUS + 0.25, 0), 1, [get_rid()])
		var hit := space.intersect_ray(q)
		if not hit.is_empty() and hit.normal.y > 0.3:
			_land(hit.normal, pre, hit.get("collider"))


func _check_landing(pre: Vector3) -> void:
	for i in get_slide_collision_count():
		var c := get_slide_collision(i)
		var n := c.get_normal()
		var into := -pre.normalized().dot(n) if pre.length() > 0.1 else 0.0
		var hs := Vector2(pre.x, pre.z).length()
		var can_wall := hs > 17.0 and n.y > -0.25 and (anim_state != "spring") and into < 0.85 and st == St.AIR
		if n.y > 0.35 or can_wall:
			_land(n, pre, c.get_collider())
			return
		elif into > 0.75 and hs > 20.0:
			# Face-first into a wall: stumble fall.
			velocity = n * 4.0 + Vector3(0, 3.0, 0)
			stumble_t = 0.6
			if boosting:
				boosting = false
				boost_changed.emit(false)


func _land(n: Vector3, pre: Vector3, collider = null) -> void:
	var impact := clampf(-pre.dot(n) / 22.0, 0.0, 1.0)
	gnorm = n
	var v := _project(pre, n)
	speed = v.length()
	if speed > 0.5:
		heading = v.normalized()
	else:
		heading = _project(heading, n)
		heading = heading.normalized() if heading.length_squared() > 1e-4 else Vector3.FORWARD
	st = St.GROUND
	# Keep the ball rolling if spin is held, otherwise land on your feet.
	rolling = Input.is_action_pressed("spin") and speed > 4.0
	if anim_state == "ball" and speed > 8.0 and not rolling:
		# Momentum carries through a jump landing: a small forward push.
		speed += 1.5
	if stumble_t > 0.0 and speed > 12.0:
		speed *= 0.5
	spring_t = 0.0
	model.trigger_land(impact)
	landed.emit(impact)
	global_position += n * 0.02
	if collider and collider.has_meta("ground_kind"):
		ground_kind = collider.get_meta("ground_kind")


func _find_homing_target() -> Node3D:
	var best: Node3D = null
	var best_score := 1e9
	var fwd := heading
	fwd.y = 0.0
	if fwd.length() < 0.1:
		fwd = -cam_basis.z
	fwd = fwd.normalized()
	for t in get_tree().get_nodes_in_group("homing_target"):
		if not is_instance_valid(t) or not (t as Node3D).is_inside_tree():
			continue
		if t.has_method("is_targetable") and not t.is_targetable():
			continue
		var to: Vector3 = t.global_position - global_position
		var dist := to.length()
		if dist > HOMING_RANGE or dist < 0.3:
			continue
		var dirn := to / dist
		var facing := dirn.dot(fwd)
		if facing < -0.1 and dist > 6.0:
			continue
		var score := dist * (1.6 - facing)
		if score < best_score:
			best_score = score
			best = t
	return best


func _start_homing(target: Node3D) -> void:
	homing_target = target
	st = St.HOMING
	homing_t = 0.0
	anim_state = "ball"
	var to := (target.global_position - global_position).normalized()
	velocity = to * HOMING_SPEED
	heading = to
	dashed.emit()


func _homing(dt: float) -> void:
	homing_t += dt
	if not is_instance_valid(homing_target) or homing_t > 0.9:
		st = St.AIR
		velocity = velocity.normalized() * 22.0
		return
	var to := homing_target.global_position - global_position
	var dist := to.length()
	var dirn := to / maxf(dist, 0.001)
	velocity = MeshLib.safe_slerp(velocity.normalized(), dirn, 1.0 - exp(-14.0 * dt)) * HOMING_SPEED
	heading = velocity.normalized()
	move_and_slide()
	to = homing_target.global_position - global_position
	if to.length() < 1.35 or get_slide_collision_count() > 0:
		var t := homing_target
		homing_target = null
		if t.has_method("on_homing_hit"):
			t.call("on_homing_hit", self)
		homing_hit.emit(t)
		# Bounce up and keep the chain alive.
		var h := Vector3(velocity.x, 0, velocity.z)
		var hf := h.normalized() if h.length() > 1.0 else heading
		velocity = hf * 8.0 + Vector3(0, 13.5, 0)
		st = St.AIR
		air_time = 0.0
		air_dash_used = false
		anim_state = "ball"
		boost_gauge = minf(boost_gauge + 12.0, 100.0)


# --- Rails ------------------------------------------------------------------

func _try_grab_rail() -> bool:
	for r in get_tree().get_nodes_in_group("rail"):
		var rl := r as Rail
		if rl == null:
			continue
		if not rl.aabb.grow(2.5).has_point(global_position):
			continue
		var local := rl.to_local(global_position)
		var off := rl.curve.get_closest_offset(local)
		var p := rl.to_global(rl.curve.sample_baked(off, true))
		var dv := global_position - p
		var dh := Vector2(dv.x, dv.z).length()
		if dh < 2.2 and dv.y > -0.5 and dv.y < 1.8 and velocity.y < 6.0:
			_attach_rail(rl, off)
			return true
		# Magnetism: falling toward a rail within a few metres, drift onto it.
		if dh < 7.0 and dv.y > 0.0 and dv.y < 10.0 and velocity.y < 2.0:
			var pull := Vector3(-dv.x, 0, -dv.z)
			global_position += pull * minf(5.0 * get_physics_process_delta_time(), 1.0)
	return false


func _attach_rail(r: Rail, off: float) -> void:
	rail = r
	rail_offset = off
	var tan := r.tangent_at(off)
	var v := velocity
	rail_dir = 1.0 if v.dot(tan) >= 0.0 else -1.0
	speed = maxf(absf(v.dot(tan)), 14.0)
	speed = maxf(speed, Vector2(v.x, v.z).length() * 0.9)
	st = St.RAIL
	rail_time = 0.0
	rolling = false
	spindash = false
	anim_state = "rail"
	rail_changed.emit(true)
	model.trigger_land(0.4)
	landed.emit(0.35)


func _rail(dt: float) -> void:
	rail_time += dt
	_boost_common(dt, true)
	var tan := rail.tangent_at(rail_offset) * rail_dir
	# Gravity along the rail, a little friction, crouch to push.
	speed += -tan.y * GRAVITY * 0.85 * dt
	speed = move_toward(speed, 0.0, 0.6 * dt)
	var crouch := Input.is_action_pressed("spin")
	if crouch:
		speed = minf(speed + 7.0 * dt, RAIL_MAX)
	if boosting:
		speed = move_toward(speed, MAX_BOOST, 80.0 * dt)
	elif speed > RAIL_MAX:
		speed = move_toward(speed, RAIL_MAX, 8.0 * dt)
	if speed < 3.0:
		# Too slow: slide back the other way.
		rail_dir = -rail_dir
		speed = 4.0
		tan = -tan
	rail_balance = lerpf(rail_balance, input_raw.x, 1.0 - exp(-6.0 * dt))
	rail_offset += speed * rail_dir * dt
	var length := rail.curve.get_baked_length()
	if rail_offset <= 0.0 or rail_offset >= length:
		rail_offset = clampf(rail_offset, 0.0, length)
		_leave_rail(tan * speed + Vector3(0, 3.0, 0), false)
		return
	var p := rail.to_global(rail.curve.sample_baked(rail_offset, true))
	global_position = p + Vector3(0, RADIUS + 0.05, 0)
	velocity = tan * speed
	heading = tan
	if _jump_buffer > 0.0:
		_jump_buffer = 0.0
		var side := Vector3.ZERO
		if absf(input_raw.x) > 0.5:
			var right := tan.cross(Vector3.UP).normalized()
			side = right * input_raw.x * 6.0
		_leave_rail(tan * speed + Vector3.UP * JUMP * 0.95 + side, true)
		jump_hold_t = 0.2
		model.trigger_jump()
		jumped.emit()


func _leave_rail(v: Vector3, is_jump: bool) -> void:
	velocity = v
	rail = null
	rail_cooldown = 0.35
	st = St.AIR
	air_time = 0.0
	air_dash_used = false
	anim_state = "ball" if is_jump else "air"
	gnorm = Vector3.UP
	rail_changed.emit(false)


# --- Springs, dash pads, damage --------------------------------------------

func launch(v: Vector3, control_delay: float = 0.35) -> void:
	velocity = v
	heading = Vector3(v.x, 0, v.z).normalized() if Vector2(v.x, v.z).length() > 0.5 else heading
	speed = 0.0
	st = St.AIR
	air_time = 0.0
	air_dash_used = false
	spring_t = control_delay
	rolling = false
	spindash = false
	rail = null
	rail_cooldown = 0.25
	anim_state = "spring"
	gnorm = Vector3.UP
	model.trigger_jump()
	sprang.emit()


func dash_pad(dir: Vector3, spd: float) -> void:
	if st == St.GROUND:
		var d := _project(dir, gnorm)
		if d.length_squared() > 1e-4:
			heading = d.normalized()
		speed = maxf(speed, spd)
		stumble_t = 0.0
	elif st == St.AIR:
		velocity = dir.normalized() * maxf(spd, velocity.length())
		heading = dir.normalized()
	dashed.emit()


func take_hit(from: Vector3) -> void:
	if invuln_t > 0.0 or st == St.HURT or st == St.DEAD or st == St.VICTORY:
		return
	var away := global_position - from
	away.y = 0.0
	away = away.normalized() if away.length() > 0.1 else -heading
	velocity = away * 7.0 + Vector3(0, 9.0, 0)
	st = St.HURT
	hurt_t = 0.0
	invuln_t = 2.2
	rolling = false
	spindash = false
	rail = null
	if boosting:
		boosting = false
		boost_changed.emit(false)
	if drifting:
		drifting = false
		drift_changed.emit(false)
	speed = 0.0
	gnorm = Vector3.UP
	anim_state = "hurt"
	took_hit.emit()
	rings = 0
	ring_collected.emit(rings)


func _hurt(dt: float) -> void:
	hurt_t += dt
	velocity.y -= GRAVITY * dt
	var pre := velocity
	move_and_slide()
	for i in get_slide_collision_count():
		var n := get_slide_collision(i).get_normal()
		if n.y > 0.4 and hurt_t > 0.15:
			gnorm = n
			speed = 0.0
			heading = _project(heading, n).normalized()
			st = St.GROUND
			model.trigger_land(0.6)
			landed.emit(0.6)
			return
	if hurt_t > 2.5:
		st = St.AIR


func _die() -> void:
	st = St.DEAD
	velocity = Vector3.ZERO
	died.emit()


# Fired out of the water toward the next stretch of route. The target is the
# first ground frame ahead of the last place Sonic was running (so a fall
# from the rails aims at the landing platform, a lagoon dunk at the beach).
func _water_rescue() -> void:
	_rescue_t = 2.0
	splashed.emit(global_position)
	var target := Vector3.ZERO
	var found := false
	if track:
		# Nearest solid stretch of route, with a preference for the road
		# ahead of where Sonic was last running. A fall from the rails goes
		# back to the launch cliff; a lagoon dunk goes on to the beach.
		var frames := track.frames
		var best := 1e18
		var bi := -1
		for i in frames.size():
			var fr: Dictionary = frames[i]
			if fr["kind"] != "ground" or (fr["p"] as Vector3).y < 2.0:
				continue
			var d: float = (fr["p"] as Vector3).distance_to(global_position)
			if d < 8.0:
				continue
			var score := d * (0.6 if (track_i >= 0 and i > track_i) else 1.0)
			if score < best:
				best = score
				bi = i
		if bi >= 0:
			# A few metres along the stretch so the landing is on the road.
			var j := mini(bi + 4, frames.size() - 1)
			target = frames[j]["p"] if frames[j]["kind"] == "ground" else frames[bi]["p"]
			found = true
	if not found:
		target = last_ground_pos if last_ground_pos.y > 2.0 else global_position + Vector3(0, 20, -20)
	# Ballistic launch that lands on the target with a comfortable arc.
	var d := target - global_position
	var flat := Vector2(d.x, d.z).length()
	var t := clampf(flat / 34.0, 1.1, 3.2)
	var v := Vector3(d.x / t, (d.y + 0.5 * GRAVITY * t * t) / t + 2.0, d.z / t)
	global_position.y = WATER_Y + 0.6
	launch(v, t - 0.2)
	rail_cooldown = 0.0
	rings = maxi(rings - 5, 0)
	ring_collected.emit(rings)


func start_victory() -> void:
	if st == St.VICTORY:
		return
	st = St.VICTORY
	victory_t = 0.0
	if boosting:
		boosting = false
		boost_changed.emit(false)
	rolling = false
	spindash = false
	victory_started.emit()


func _victory(dt: float) -> void:
	victory_t += dt
	# Run out the remaining speed on the ground, then pose.
	if speed > 0.0:
		speed = move_toward(speed, 0.0, 30.0 * dt)
		velocity = heading * speed
		move_and_slide()
		var space := get_world_3d().direct_space_state
		var q := PhysicsRayQueryParameters3D.create(global_position, global_position - Vector3(0, RADIUS + 1.0, 0), 1, [get_rid()])
		var hit := space.intersect_ray(q)
		if not hit.is_empty():
			global_position = hit.position + hit.normal * RADIUS
			gnorm = hit.normal
	else:
		velocity = Vector3.ZERO


# --- Visuals ---------------------------------------------------------------

func _update_model(dt: float) -> void:
	var up := Vector3.UP
	var fwd := heading
	var anim := "idle"
	var sp := visual_speed()
	var turn := 0.0
	match st:
		St.GROUND:
			up = gnorm
			if spindash:
				anim = "spindash"
			elif rolling:
				anim = "roll"
			elif stumble_t > 0.0:
				anim = "stumble"
			elif speed < 0.4 and input_dir.length() < 0.1:
				anim = "idle"
			elif drifting:
				anim = "drift"
			else:
				anim = "run"
			# Lateral input relative to heading gives the lean.
			var right := heading.cross(gnorm).normalized()
			turn = clampf(input_dir.dot(right), -1.0, 1.0)
			if drifting:
				turn = clampf(drift_side * 1.2, -1.0, 1.0)
		St.AIR:
			var h := Vector3(velocity.x, 0, velocity.z)
			if h.length() > 1.0:
				fwd = h.normalized()
			anim = anim_state if anim_state in ["ball", "spring", "air", "hurt"] else "air"
			if anim == "air" and velocity.y < -3.0:
				anim = "fall"
			if stumble_t > 0.0 and anim != "ball":
				anim = "hurt"
			turn = clampf(input_raw.x, -1.0, 1.0) * 0.5
		St.RAIL:
			anim = "rail"
			fwd = heading
		St.HOMING:
			anim = "homing"
			fwd = velocity.normalized()
		St.HURT:
			anim = "hurt"
			fwd = -Vector3(velocity.x, 0, velocity.z).normalized() if Vector2(velocity.x, velocity.z).length() > 0.5 else heading
		St.VICTORY:
			anim = "victory" if speed <= 0.01 else "run"
			up = gnorm
		St.DEAD:
			anim = "fall"
	if fwd.length_squared() < 1e-4:
		fwd = Vector3.FORWARD
	fwd = _project(fwd, up)
	if fwd.length_squared() < 1e-4:
		fwd = Vector3.FORWARD
	var target := MeshLib.basis_forward(fwd.normalized(), up)
	var rate := 22.0 if st == St.GROUND else 12.0
	if st == St.HOMING:
		rate = 40.0
	var q0 := model_basis.get_rotation_quaternion()
	var q1 := target.get_rotation_quaternion()
	model_basis = Basis(q0.slerp(q1, 1.0 - exp(-rate * dt)))
	model.global_transform = Transform3D(model_basis.scaled(Vector3.ONE * MODEL_SCALE), global_position - up * RADIUS)
	# Blink while invulnerable.
	if invuln_t > 0.0 and st != St.VICTORY:
		model.visible = fmod(invuln_t, 0.16) > 0.06
	else:
		model.visible = true
	model.animate({
		"state": anim,
		"speed": sp,
		"max_run": MAX_RUN,
		"max_boost": MAX_BOOST,
		"boost": boosting,
		"turn": turn,
		"air_vy": velocity.y,
		"dt": dt,
		"charge": charge,
		"balance": rail_balance,
		"crouch": 1.0 if (st == St.RAIL and Input.is_action_pressed("spin")) else 0.0,
		"victory_t": victory_t,
	})
	anim_state = anim if st != St.AIR else anim_state
