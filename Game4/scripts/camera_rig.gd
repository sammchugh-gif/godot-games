# Chase camera. Sits behind and above Sonic with speed-dependent distance,
# look-ahead and FOV, banks into turns, follows the ground normal through
# loops and wall runs, and pulls wide for the scripted moments (cliff
# reveal, loop profile shots, rails, the waterfall). Collision-probed so it
# never clips into cliffs.
class_name CameraRig
extends Camera3D

var player: Player
var level: Level
var mode := ""
var _pos := Vector3.ZERO
var _look := Vector3.ZERO
var _off := Vector3.ZERO
var _look_off := Vector3.ZERO
var _up := Vector3.UP
var _fwd := Vector3.FORWARD
var _roll := 0.0
var _fov_cur := 72.0
var _shake := 0.0
var _shake_v := Vector3.ZERO
var _t := 0.0
var attract := false
var _attract_t := 0.0
var _mode_blend := 0.0
var _side := 0.0


func _ready() -> void:
	current = true
	near = 0.15
	far = 2600.0
	fov = 72.0


func snap() -> void:
	if not player:
		return
	_fwd = player.heading
	_up = Vector3.UP
	_pos = player.global_position - _fwd * 5.0 + Vector3(0, 1.8, 0)
	_look = player.global_position + Vector3(0, 1.0, 0)
	_off = _pos - player.global_position
	_look_off = _look - player.global_position
	global_position = _pos
	look_at(_look, _up)
	player.cam_basis = global_basis


func shake(amount: float) -> void:
	_shake = maxf(_shake, amount)


func _physics_process(dt: float) -> void:
	if not player:
		return
	_t += dt
	if attract:
		_attract(dt)
		return
	var p := player.global_position
	var spd := player.visual_speed()
	var sp_t := clampf(spd / Player.MAX_RUN, 0.0, 1.4)
	var new_mode := level.cam_zone_at(p) if level else ""
	if new_mode != mode:
		mode = new_mode
		_mode_blend = 0.0
	_mode_blend = minf(_mode_blend + dt * 0.8, 1.0)

	# Forward direction: heading on the ground, velocity in the air.
	var fwd := player.heading
	if player.st == Player.St.AIR or player.st == Player.St.HOMING or player.st == Player.St.HURT:
		var h := Vector3(player.velocity.x, 0, player.velocity.z)
		if h.length() > 3.0:
			fwd = h.normalized()
	var on_steep := player.st == Player.St.GROUND and player.gnorm.y < 0.8
	# Up vector: follow the surface normal on loops and walls.
	var want_up := Vector3.UP
	var follow := 0.0
	if mode == "loop":
		follow = 0.9
	elif mode == "wall":
		follow = 1.0
	elif on_steep:
		follow = 0.6
	if player.st == Player.St.GROUND and follow > 0.0:
		want_up = Vector3.UP.slerp(player.gnorm, follow).normalized()
	var fwd_h := fwd
	if want_up.dot(Vector3.UP) > 0.7:
		fwd_h = Vector3(fwd.x, 0, fwd.z)
		if fwd_h.length() < 0.1:
			fwd_h = _fwd
		fwd_h = fwd_h.normalized()
	else:
		fwd_h = (fwd - want_up * fwd.dot(want_up)).normalized()
	var turn_rate := lerpf(3.0, 6.5, sp_t)
	if player.st == Player.St.RAIL:
		turn_rate = 7.0
	if player.drifting:
		turn_rate = 2.4
	_fwd = MeshLib.safe_slerp(_fwd, fwd_h, 1.0 - exp(-turn_rate * dt))
	_up = MeshLib.safe_slerp(_up, want_up, 1.0 - exp(-4.0 * dt))
	var right := _fwd.cross(_up).normalized()
	if right.length_squared() < 1e-4:
		right = Vector3.RIGHT

	# Framing per mode.
	var dist := lerpf(4.2, 6.2, sp_t)
	var height := lerpf(1.6, 2.1, sp_t)
	var look_h := 1.0
	var ahead := lerpf(1.5, 5.0, sp_t)
	var fov_t := 70.0 + 10.0 * sp_t + (5.0 if player.boosting else 0.0)
	var side := 0.0
	match mode:
		"reveal":
			dist = 8.5
			height = 4.0
			ahead = 14.0
			look_h = -1.0
			fov_t += 8.0
		"loop":
			dist = 12.5
			height = 3.2
			side = 5.5
			ahead = 3.0
			fov_t += 4.0
		"rail":
			dist = lerpf(7.5, 10.0, sp_t)
			height = 2.2
			look_h = 0.6
			fov_t += 3.0
		"wall":
			dist = 9.0
			height = 2.6
			fov_t += 4.0
		"waterfall":
			dist = 12.0
			height = 4.5
			ahead = 10.0
			look_h = 0.0
			fov_t += 8.0
		"finale":
			dist = 8.0
			height = 1.5
			look_h = 1.2
			fov_t += 8.0
	if player.st == Player.St.AIR or player.st == Player.St.HOMING:
		height += 0.8
		ahead *= 0.6
	if player.st == Player.St.VICTORY:
		dist = 6.0
		height = 1.8
		side = 2.5
		ahead = 0.0
		look_h = 1.1
		fov_t = 62.0
	_side = lerpf(_side, side, 1.0 - exp(-2.0 * dt))

	var desired := p - _fwd * dist + _up * height + right * _side
	# Collision probe.
	if mode != "loop":
		var space := get_world_3d().direct_space_state
		var from := p + _up * 1.0
		var q := PhysicsRayQueryParameters3D.create(from, desired, 1, [player.get_rid()])
		var hit := space.intersect_ray(q)
		if not hit.is_empty():
			desired = hit.position + hit.normal * 0.4
	# Smooth the offset from Sonic rather than the world position, so the
	# camera has no speed-proportional lag and Sonic stays the same size.
	var follow_rate := lerpf(9.0, 16.0, sp_t)
	if player.st == Player.St.HOMING:
		follow_rate = 6.0
	_off = _off.lerp(desired - p, 1.0 - exp(-follow_rate * dt))
	_pos = p + _off
	var look_t := p + _fwd * ahead + _up * look_h
	_look_off = _look_off.lerp(look_t - p, 1.0 - exp(-14.0 * dt))
	_look = p + _look_off

	# Banking from turn input and drift.
	var lat := 0.0
	if player.st == Player.St.GROUND or player.st == Player.St.RAIL:
		lat = player.input_raw.x * sp_t
		if player.drifting:
			lat = player.drift_side * 1.6
	var roll_t := -lat * deg_to_rad(5.0)
	_roll = lerpf(_roll, roll_t, 1.0 - exp(-4.0 * dt))

	# Shake.
	_shake = maxf(_shake - dt * 2.5, 0.0)
	if _shake > 0.0:
		_shake_v = Vector3(randf_range(-1, 1), randf_range(-1, 1), 0) * _shake * 0.25
	else:
		_shake_v = Vector3.ZERO
	if player.boosting:
		_shake_v += Vector3(randf_range(-1, 1), randf_range(-1, 1), 0) * 0.03

	global_position = _pos
	var dir := (_look - _pos)
	if dir.length_squared() > 1e-4 and absf(dir.normalized().dot(_up)) < 0.995:
		look_at(_look, _up)
	rotate_object_local(Vector3.FORWARD, _roll)
	global_position += global_basis * _shake_v
	_fov_cur = lerpf(_fov_cur, fov_t, 1.0 - exp(-5.0 * dt))
	fov = _fov_cur
	player.cam_basis = global_basis


# Title screen: a slow orbit around Sonic on the plateau, looking down the island.
func _attract(dt: float) -> void:
	_attract_t += dt
	var p := player.global_position
	# Start in front of Sonic (he faces -Z) and drift slowly round to his side.
	var a := PI + 0.9 - _attract_t * 0.08
	var desired := p + Vector3(sin(a) * 4.0, 1.2 + sin(_attract_t * 0.3) * 0.25, cos(a) * 4.0)
	_pos = _pos.lerp(desired, 1.0 - exp(-2.0 * dt))
	_look = _look.lerp(p + Vector3(0.6, 0.7, 0), 1.0 - exp(-2.0 * dt))
	global_position = _pos
	look_at(_look, Vector3.UP)
	_fov_cur = lerpf(_fov_cur, 55.0, 1.0 - exp(-2.0 * dt))
	fov = _fov_cur
	player.cam_basis = global_basis
