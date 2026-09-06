# Third-person chase camera. Orbit with the right stick, the mouse or a
# finger on the right of the screen; when left alone it drifts round to sit
# behind whatever the player is moving as.
class_name CameraRig
extends Node3D

var target: Node3D:
	set(v):
		target = v
		if _arm:
			_arm.clear_excluded_objects()
			if v is CollisionObject3D:
				_arm.add_excluded_object((v as CollisionObject3D).get_rid())
var yaw := 0.0
var pitch := 0.32
var distance := 7.5
var focus_height := 1.3
var manual_t := 0.0
var shake := 0.0
var zone_distance := 0.0     # > 0 overrides distance (boss arena etc.)
var _pos := Vector3.ZERO
var _yaw_node: Node3D
var _pitch_node: Node3D
var _arm: SpringArm3D
var cam: Camera3D


func _ready() -> void:
	_yaw_node = Node3D.new()
	add_child(_yaw_node)
	_pitch_node = Node3D.new()
	_yaw_node.add_child(_pitch_node)
	_arm = SpringArm3D.new()
	_arm.spring_length = distance
	_arm.margin = 0.35
	_arm.collision_mask = 1
	_arm.shape = SphereShape3D.new()
	(_arm.shape as SphereShape3D).radius = 0.3
	_pitch_node.add_child(_arm)
	cam = Camera3D.new()
	cam.fov = 62.0
	cam.near = 0.15
	cam.far = 420.0
	_arm.add_child(cam)
	cam.current = true


func rotate_by(dx: float, dy: float) -> void:
	yaw -= dx
	pitch = clampf(pitch + dy, -0.35, 1.1)
	manual_t = 1.6


func forward() -> Vector3:
	return Vector3(-sin(yaw), 0, -cos(yaw))


func right() -> Vector3:
	return Vector3(cos(yaw), 0, -sin(yaw))


func snap() -> void:
	if target:
		_pos = target.global_position + Vector3(0, focus_height, 0)
	_apply(1.0)


func _process(dt: float) -> void:
	if target == null:
		return
	# Stick / keys.
	var jx := Input.get_joy_axis(0, JOY_AXIS_RIGHT_X)
	var jy := Input.get_joy_axis(0, JOY_AXIS_RIGHT_Y)
	var kx := 0.0
	if Input.is_action_pressed("cam_left"):
		kx -= 1.0
	if Input.is_action_pressed("cam_right"):
		kx += 1.0
	if absf(jx) > 0.2 or absf(jy) > 0.2 or kx != 0.0:
		rotate_by((jx * 2.2 + kx * 1.8) * dt, jy * 1.5 * dt)
	manual_t = maxf(manual_t - dt, 0.0)
	var goal := target.global_position + Vector3(0, focus_height, 0)
	var k := 1.0 - exp(-dt * 9.0)
	_pos = _pos.lerp(goal, k)
	# Auto-follow: drift behind the direction of travel.
	if manual_t <= 0.0 and target.has_method("travel_dir"):
		var v: Vector3 = target.travel_dir()
		if v.length() > 0.3:
			var want := atan2(-v.x, -v.z)
			var d := wrapf(want - yaw, -PI, PI)
			# Only follow when the target moves roughly away from or across the camera.
			var fw := forward()
			var side := 1.0 - clampf(fw.dot(v.normalized()), -1.0, 1.0) * 0.5
			yaw += d * clampf(dt * 1.4 * side, 0.0, 1.0)
		if pitch > 0.4:
			pitch = lerpf(pitch, 0.32, dt * 0.8)
	_apply(dt)


func _apply(dt: float) -> void:
	var want_d := zone_distance if zone_distance > 0.0 else distance
	_arm.spring_length = lerpf(_arm.spring_length, want_d, clampf(dt * 3.0, 0.0, 1.0))
	global_position = _pos
	_yaw_node.rotation.y = yaw
	_pitch_node.rotation.x = -pitch
	if shake > 0.0:
		shake = maxf(shake - dt * 2.5, 0.0)
		cam.h_offset = (randf() - 0.5) * shake * 0.5
		cam.v_offset = (randf() - 0.5) * shake * 0.5
	else:
		cam.h_offset = 0.0
		cam.v_offset = 0.0
