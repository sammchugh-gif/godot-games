# Dylan, the hero. A capsule with Odyssey's moveset: run, triple jump, long jump,
# ground pound, wall jump, hat throw and cap jump. When a capture is active
# the capture drives itself and this body just rides along invisibly.
class_name Player
extends CharacterBody3D

const HERO_NAME := "Dylan"

signal died()
signal pounded(pos: Vector3)
signal hearts_changed(n: int)
signal captured_changed(kind: String)

const RUN := 9.0
const ACC := 48.0
const AIR_ACC := 24.0
const JUMP_V := [12.5, 14.6, 17.6]
const GRAV := 30.0
const FALL_GRAV := 42.0
const POUND_V := -38.0
const LONG_H := 15.0
const LONG_V := 8.5
const WALL_AWAY := 7.5
const WALL_UP := 13.0
const CAP_BOUNCE := 16.5
const MAX_HEARTS := 3

var level: Node
var cam: CameraRig
var hat: Hat
var hearts := MAX_HEARTS
var capture: Capturable = null
var model: Node3D
var cap_colour := Models.CAP_COLOURS["red"]
var shirt_colour := Models.SHIRT_COLOURS["red"]
var facing := 0.0
var frozen := false
var dead := false
var invuln := 0.0
var pounding := false
var crouching := false
var wall_sliding := false
var long_jumping := false
var in_water := false
var _pound_pause := 0.0
var _crouch_t := 0.0
var _prev_vy := 0.0
var _jump_count := 0
var _chain_t := 99.0
var _coyote := 0.0
var _buffer := 0.0
var _was_floor := false
var _anim_t := 0.0
var _col: CollisionShape3D
var _hurt_flash := 0.0


func _ready() -> void:
	_col = CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.34
	cap.height = 1.45
	_col.shape = cap
	_col.position = Vector3(0, 0.75, 0)
	add_child(_col)
	floor_max_angle = deg_to_rad(47.0)
	floor_snap_length = 0.4
	wall_min_slide_angle = deg_to_rad(12.0)
	rebuild_model()


func rebuild_model() -> void:
	if model:
		model.queue_free()
	model = Models.hero(shirt_colour, cap_colour)
	add_child(model)
	if hat:
		hat.set_colour(cap_colour)


func actor() -> Node3D:
	return capture if capture else self


func actor_pos() -> Vector3:
	return capture.global_position if capture else global_position


func travel_dir() -> Vector3:
	return velocity


func raw_input() -> Vector2:
	if frozen:
		return Vector2.ZERO
	return Input.get_vector("move_left", "move_right", "move_up", "move_down")


# Camera-relative move vector on the ground plane, length <= 1.
func move_input() -> Vector3:
	var v := raw_input()
	if v.length() > 1.0:
		v = v.normalized()
	if cam == null:
		return Vector3(v.x, 0, v.y)
	return cam.right() * v.x + cam.forward() * (-v.y)


func jump_pressed() -> bool:
	return not frozen and Input.is_action_just_pressed("jump")


func jump_held() -> bool:
	return not frozen and Input.is_action_pressed("jump")


func hat_pressed() -> bool:
	return not frozen and Input.is_action_just_pressed("hat")


func pound_pressed() -> bool:
	return not frozen and Input.is_action_just_pressed("pound")


func pound_held() -> bool:
	return not frozen and Input.is_action_pressed("pound")


# ------------------------------------------------------------ captures ---

func capture_into(c: Capturable) -> void:
	if capture or dead:
		return
	capture = c
	c.capture()
	model.visible = false
	_col.set_deferred("disabled", true)
	velocity = Vector3.ZERO
	pounding = false
	hat.recall()
	if cam:
		cam.target = c
		cam.focus_height = c.focus_height
		cam.distance = c.cam_distance
	Sfx.play("capture")
	captured_changed.emit(c.kind)


func release_capture(hop: bool = true) -> void:
	if capture == null:
		return
	var c := capture
	capture = null
	var at := c.release_point()
	c.release()
	global_position = at
	velocity = Vector3(0, 8.0 if hop else 0.0, 0)
	facing = c.facing
	model.visible = true
	_col.set_deferred("disabled", false)
	invuln = maxf(invuln, 0.6)
	if cam:
		cam.target = self
		cam.focus_height = 1.3
		cam.distance = 7.5
	Sfx.play("release")
	captured_changed.emit("")


# -------------------------------------------------------------- damage ---

func damage(from: Vector3) -> void:
	if invuln > 0.0 or dead or frozen:
		return
	hearts -= 1
	hearts_changed.emit(hearts)
	invuln = 1.6
	_hurt_flash = 0.3
	if capture:
		capture.hurt(from)
	else:
		var away := (global_position - from)
		away.y = 0.0
		away = away.normalized() if away.length() > 0.01 else -cam.forward()
		velocity = away * 7.0 + Vector3.UP * 7.5
		pounding = false
	Sfx.play("hurt")
	if cam:
		cam.shake = 0.6
	if hearts <= 0:
		die()


func heal(n: int = 1) -> void:
	hearts = mini(hearts + n, MAX_HEARTS)
	hearts_changed.emit(hearts)


func die() -> void:
	if dead:
		return
	dead = true
	if capture:
		release_capture(false)
	velocity = Vector3(0, 9.0, 0)
	pounding = false
	Sfx.play("die")
	died.emit()


func respawn(pos: Vector3, look_yaw: float) -> void:
	dead = false
	hearts = MAX_HEARTS
	hearts_changed.emit(hearts)
	global_position = pos
	velocity = Vector3.ZERO
	facing = look_yaw
	invuln = 1.0
	pounding = false
	_jump_count = 0
	model.visible = true
	if hat:
		hat.state = Hat.S.HOME
		hat.visible = false
	if cam:
		cam.target = self
		cam.yaw = look_yaw
		cam.snap()


func bounce(vy: float) -> void:
	velocity.y = vy
	pounding = false
	_jump_count = 0


func is_stomping() -> bool:
	return not is_on_floor() and (velocity.y < -1.0 or pounding)


# -------------------------------------------------------------- physics --

func _physics_process(dt: float) -> void:
	invuln = maxf(invuln - dt, 0.0)
	_hurt_flash = maxf(_hurt_flash - dt, 0.0)
	if capture:
		global_position = capture.global_position
		velocity = capture.velocity
		if hat_pressed() and capture.can_release():
			release_capture()
		return
	if dead:
		velocity.y -= GRAV * dt
		move_and_slide()
		_animate(dt)
		return
	if frozen:
		velocity.x = move_toward(velocity.x, 0.0, ACC * dt)
		velocity.z = move_toward(velocity.z, 0.0, ACC * dt)
		if not is_on_floor():
			velocity.y -= GRAV * dt
		move_and_slide()
		_animate(dt)
		return

	var inp := move_input()
	var on_floor := is_on_floor()
	_chain_t += dt
	_buffer = maxf(_buffer - dt, 0.0)
	_coyote = maxf(_coyote - dt, 0.0)
	if on_floor:
		_coyote = 0.12
	if jump_pressed():
		_buffer = 0.12

	# Ground pound.
	if not on_floor and pound_pressed() and not pounding and not wall_sliding:
		pounding = true
		_pound_pause = 0.16
		velocity = Vector3.ZERO
		Sfx.play("jump2", -8.0)
	if pounding:
		if _pound_pause > 0.0:
			_pound_pause -= dt
			velocity = Vector3.ZERO
		else:
			velocity = Vector3(0, POUND_V, 0)
		move_and_slide()
		if is_on_floor():
			pounding = false
			Sfx.play("pound")
			if cam:
				cam.shake = 0.7
			pounded.emit(global_position)
			_was_floor = true
			_chain_t = 99.0
		_animate(dt)
		_hazards()
		return

	# A tap of POUND on the ground leaves a short crouch window, so JUMP right
	# after it is a long jump without holding two buttons at once.
	_crouch_t = maxf(_crouch_t - dt, 0.0)
	if on_floor and pound_pressed():
		_crouch_t = 0.45
	crouching = on_floor and (pound_held() or _crouch_t > 0.0)
	var speed_mul := 1.0
	if crouching:
		speed_mul = 0.4
	if in_water:
		speed_mul *= 0.65
	var target := inp * RUN * speed_mul
	var acc := ACC if on_floor else AIR_ACC
	if long_jumping and not on_floor:
		acc = 6.0
	velocity.x = move_toward(velocity.x, target.x, acc * dt)
	velocity.z = move_toward(velocity.z, target.z, acc * dt)

	if not on_floor:
		var g := GRAV if (velocity.y > 0.0 and jump_held()) else FALL_GRAV
		velocity.y -= g * dt
		velocity.y = maxf(velocity.y, -45.0)

	# Wall slide and wall jump.
	wall_sliding = false
	if not on_floor and is_on_wall_only() and velocity.y < 0.0:
		var wn := get_wall_normal()
		if inp.length() > 0.3 and inp.normalized().dot(-wn) > 0.4:
			wall_sliding = true
			velocity.y = maxf(velocity.y, -3.5)
			facing = atan2(-wn.x, -wn.z) + PI
			if _buffer > 0.0:
				velocity = wn * WALL_AWAY + Vector3.UP * WALL_UP
				_buffer = 0.0
				_jump_count = 0
				wall_sliding = false
				facing = atan2(-wn.x, -wn.z)
				Sfx.play("jump2")

	# Jumps from the ground.
	if _buffer > 0.0 and _coyote > 0.0 and not wall_sliding:
		var hspeed := Vector2(velocity.x, velocity.z).length()
		if crouching and hspeed > 2.5:
			_crouch_t = 0.0
			var d := Vector3(velocity.x, 0, velocity.z).normalized()
			velocity = d * LONG_H + Vector3.UP * LONG_V
			long_jumping = true
			_jump_count = 0
			Sfx.play("jump3", -4.0)
		else:
			var idx := 0
			if _chain_t < 0.28 and hspeed > 2.0:
				idx = _jump_count
			velocity.y = JUMP_V[idx]
			_jump_count = 0 if idx == 2 else idx + 1
			Sfx.play(["jump", "jump2", "jump3"][idx])
		_buffer = 0.0
		_coyote = 0.0
		crouching = false

	# Cap jump: land on the hovering hat for a big bounce.
	if hat and hat.state == Hat.S.HOVER and velocity.y < 0.0:
		var hp := hat.global_position
		var dxz := Vector2(global_position.x - hp.x, global_position.z - hp.z).length()
		if dxz < 1.0 and global_position.y > hp.y - 0.6 and global_position.y < hp.y + 0.5:
			velocity.y = CAP_BOUNCE
			_jump_count = 0
			hat.recall()
			Sfx.play("capjump")

	# Facing.
	if inp.length() > 0.1 and not wall_sliding:
		var want := atan2(-inp.x, -inp.z)
		facing = lerp_angle(facing, want, 1.0 - exp(-dt * 14.0))

	# Hat.
	var in_shop: bool = level != null and level.get("shop_inside") == true
	if hat_pressed() and hat and not in_shop:
		if hat.is_out():
			hat.recall()
		else:
			var d := Vector3(-sin(facing), 0, -cos(facing))
			if inp.length() > 0.2:
				d = inp.normalized()
			hat.throw(global_position + Vector3(0, 1.15, 0), d)

	_prev_vy = velocity.y
	move_and_slide()
	var now_floor := is_on_floor()
	if now_floor and not _was_floor:
		_chain_t = 0.0
		long_jumping = false
		_crouch_t = 0.0
		Sfx.play("land", -10.0)
		if _prev_vy < -16.0 and level and level.has_method("burst"):
			level.burst(global_position, Color(0.95, 0.9, 0.75))
	_was_floor = now_floor
	_hazards()
	_animate(dt)


func _hazards() -> void:
	if level and level.has_method("check_hazards"):
		level.check_hazards(self)


# ----------------------------------------------------------- animation ---

func _animate(dt: float) -> void:
	_anim_t += dt
	model.rotation.y = facing
	var body: Node3D = model.get_node("body")
	var head: Node3D = body.get_node("head")
	var arm_l: Node3D = body.get_node("armL")
	var arm_r: Node3D = body.get_node("armR")
	var leg_l: Node3D = model.get_node("legL")
	var leg_r: Node3D = model.get_node("legR")
	var capn: Node3D = head.get_node("Cap")
	capn.visible = not (hat and hat.is_out())
	# Hurt blink.
	if invuln > 0.0 and not dead:
		model.visible = fmod(invuln, 0.16) > 0.08
	elif capture == null:
		model.visible = true
	var on_floor := is_on_floor()
	var hs := Vector2(velocity.x, velocity.z).length()
	body.scale = Vector3.ONE
	body.position.y = 0.62
	body.rotation = Vector3.ZERO
	head.rotation = Vector3.ZERO
	if dead:
		body.rotation.x = -0.4
		arm_l.rotation.x = -2.6
		arm_r.rotation.x = -2.6
		leg_l.rotation.x = 0.4
		leg_r.rotation.x = -0.4
		return
	if pounding:
		if _pound_pause > 0.0:
			var s := 1.0 - _pound_pause / 0.16
			body.rotation.x = -TAU * s
		else:
			body.rotation.x = 0.0
		leg_l.rotation.x = -0.9
		leg_r.rotation.x = -0.9
		arm_l.rotation.x = -2.8
		arm_r.rotation.x = -2.8
		return
	if wall_sliding:
		arm_l.rotation.x = -2.0
		arm_r.rotation.x = -2.0
		leg_l.rotation.x = 0.5
		leg_r.rotation.x = 0.2
		body.rotation.x = 0.15
		return
	if not on_floor:
		var rising := velocity.y > 1.0
		if long_jumping:
			body.rotation.x = 0.55
			arm_l.rotation.x = 1.2
			arm_r.rotation.x = 1.2
			leg_l.rotation.x = -0.6
			leg_r.rotation.x = 0.9
		elif rising:
			var spin := _jump_count == 0 and velocity.y > 12.0
			arm_l.rotation.x = -2.6
			arm_r.rotation.x = -2.6
			leg_l.rotation.x = -0.8
			leg_r.rotation.x = 0.3
			if spin:
				body.rotation.y = _anim_t * 16.0
		else:
			arm_l.rotation.x = -1.4
			arm_r.rotation.x = -1.4
			leg_l.rotation.x = 0.3
			leg_r.rotation.x = -0.3
		return
	if crouching:
		body.scale = Vector3(1.15, 0.65, 1.15)
		body.position.y = 0.32
		leg_l.rotation.x = 1.2
		leg_r.rotation.x = 1.2
		arm_l.rotation.x = 0.6
		arm_r.rotation.x = 0.6
		return
	if hs > 0.6:
		var amt := clampf(hs / RUN, 0.2, 1.0)
		var ph := _anim_t * (7.0 + hs * 1.1)
		leg_l.rotation.x = sin(ph) * 0.9 * amt
		leg_r.rotation.x = -sin(ph) * 0.9 * amt
		arm_l.rotation.x = -sin(ph) * 1.0 * amt
		arm_r.rotation.x = sin(ph) * 1.0 * amt
		body.position.y = 0.62 + absf(sin(ph)) * 0.05 * amt
		body.rotation.x = 0.18 * amt
		head.rotation.x = -0.12 * amt
	else:
		var br := sin(_anim_t * 2.2) * 0.02
		body.scale = Vector3(1.0 - br, 1.0 + br, 1.0 - br)
		leg_l.rotation.x = 0.0
		leg_r.rotation.x = 0.0
		arm_l.rotation.x = sin(_anim_t * 2.2) * 0.06
		arm_r.rotation.x = -sin(_anim_t * 2.2) * 0.06
		arm_l.rotation.z = 0.12
		arm_r.rotation.z = -0.12
