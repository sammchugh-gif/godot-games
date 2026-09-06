# King Raptor. Charges at the kid; when he crashes into the arena wall he
# sits dazed and his crown can be hit with the hat or a ground pound. Three
# hits win the multi moon.
class_name Boss
extends CharacterBody3D

signal defeated()
signal hit(hp: int)
signal woke()

enum S { SLEEP, INTRO, PREP, CHARGE, DAZED, HURT, DEAD }

var state := S.SLEEP
var hp := 3
var level: Node
var player: Player
var model: Node3D
var facing := 0.0
var center := Vector3.ZERO
var radius := 15.0
var anim_t := 0.0
var _t := 0.0
var _dir := Vector3.FORWARD
var _step := 0.0


func setup(lvl: Node, p: Player, c: Vector3, r: float, colour: Color = Color(0.85, 0.45, 0.2), metal: bool = false) -> void:
	level = lvl
	player = p
	center = c
	radius = r
	var col := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 1.5
	cap.height = 2.4
	col.shape = cap
	col.position = Vector3(0, 2.8, 0)
	add_child(col)
	model = Models.rex(1.35, colour, true, metal)
	add_child(model)
	floor_max_angle = deg_to_rad(50.0)


func active() -> bool:
	return state != S.SLEEP and state != S.DEAD


func _physics_process(dt: float) -> void:
	anim_t += dt
	if not is_on_floor():
		velocity.y -= 30.0 * dt
	var pp := player.actor_pos() if player else center
	var to_p := pp - global_position
	to_p.y = 0.0
	match state:
		S.SLEEP:
			velocity.x = 0.0
			velocity.z = 0.0
			if player and not player.dead and Vector2(pp.x - center.x, pp.z - center.z).length() < radius - 2.0 and absf(pp.y - center.y) < 6.0:
				state = S.INTRO
				_t = 0.0
				Sfx.play("roar")
				woke.emit()
				if player.cam:
					player.cam.shake = 1.0
		S.INTRO:
			velocity.x = 0.0
			velocity.z = 0.0
			_face(to_p, dt, 3.0)
			_t += dt
			if _t > 1.8:
				_prep()
		S.PREP:
			velocity.x = move_toward(velocity.x, 0.0, 20.0 * dt)
			velocity.z = move_toward(velocity.z, 0.0, 20.0 * dt)
			_face(to_p, dt, 5.0)
			_t += dt
			if _t > (1.3 if hp == 3 else 1.0):
				state = S.CHARGE
				_t = 0.0
				_dir = Vector3(-sin(facing), 0, -cos(facing))
				Sfx.play("roar", -4.0)
		S.CHARGE:
			var sp := 14.0 + (3 - hp) * 2.5
			velocity.x = _dir.x * sp
			velocity.z = _dir.z * sp
			_t += dt
			_step += dt * sp * 0.4
			var flat := Vector2(global_position.x - center.x, global_position.z - center.z)
			if flat.length() > radius - 2.2 or _t > 2.6 or is_on_wall():
				state = S.DAZED
				_t = 0.0
				Sfx.play("pound")
				if player and player.cam:
					player.cam.shake = 1.2
			if player and not player.dead and to_p.length() < 3.0 and absf(pp.y - global_position.y) < 4.0:
				player.damage(global_position)
		S.DAZED:
			velocity.x = move_toward(velocity.x, 0.0, 30.0 * dt)
			velocity.z = move_toward(velocity.z, 0.0, 30.0 * dt)
			_t += dt
			if _t > 3.8:
				_prep()
		S.HURT:
			velocity.x = move_toward(velocity.x, 0.0, 12.0 * dt)
			velocity.z = move_toward(velocity.z, 0.0, 12.0 * dt)
			_t += dt
			if _t > 1.2:
				_prep()
		S.DEAD:
			velocity.x = 0.0
			velocity.z = 0.0
	move_and_slide()
	# Keep him inside the arena whatever happens.
	var off := global_position - center
	off.y = 0.0
	if off.length() > radius - 1.0:
		global_position = center + off.normalized() * (radius - 1.0) + Vector3(0, global_position.y - center.y, 0)
	_animate(dt)


func _prep() -> void:
	state = S.PREP
	_t = 0.0


func _face(dir: Vector3, dt: float, rate: float) -> void:
	if dir.length() < 0.1:
		return
	facing = lerp_angle(facing, atan2(-dir.x, -dir.z), 1.0 - exp(-dt * rate))


func hat_hit() -> bool:
	if state == S.DAZED:
		_take_hit()
		return true
	return false


func pound_near(pos: Vector3) -> bool:
	if state == S.DAZED and pos.distance_to(global_position) < 5.0:
		_take_hit()
		return true
	return false


func _take_hit() -> void:
	hp -= 1
	hit.emit(hp)
	Sfx.play("bosshit")
	if player and player.cam:
		player.cam.shake = 0.8
	if hp <= 0:
		state = S.DEAD
		_t = 0.0
		Sfx.play("bossdown")
		defeated.emit()
	else:
		state = S.HURT
		_t = 0.0
		var away := global_position - player.actor_pos()
		away.y = 0.0
		velocity = away.normalized() * 8.0 + Vector3.UP * 6.0


func _animate(dt: float) -> void:
	model.rotation.y = facing
	var body: Node3D = model.get_node("body")
	var head: Node3D = body.get_node("head")
	var jaw: Node3D = head.get_node("jaw")
	var ll: Node3D = model.get_node("legL")
	var lr: Node3D = model.get_node("legR")
	body.position.y = 2.1
	body.rotation = Vector3.ZERO
	head.rotation = Vector3.ZERO
	match state:
		S.SLEEP:
			body.position.y = 1.5 + sin(anim_t * 1.2) * 0.05
			head.rotation.x = 0.35
			jaw.rotation.x = 0.1
			ll.rotation.x = 1.3
			lr.rotation.x = 1.3
		S.INTRO:
			head.rotation.x = -0.5 * absf(sin(_t * 3.0))
			jaw.rotation.x = 0.7 * absf(sin(_t * 3.0))
			ll.rotation.x = 0.0
			lr.rotation.x = 0.0
		S.PREP:
			body.rotation.z = sin(anim_t * 25.0) * 0.05
			head.rotation.x = 0.25
			jaw.rotation.x = 0.2
			ll.rotation.x = sin(anim_t * 14.0) * 0.2
			lr.rotation.x = -sin(anim_t * 14.0) * 0.2
		S.CHARGE:
			var ph := _step * TAU
			ll.rotation.x = sin(ph) * 0.9
			lr.rotation.x = -sin(ph) * 0.9
			body.position.y += absf(sin(ph)) * 0.2
			body.rotation.x = 0.25
			head.rotation.x = -0.1
			jaw.rotation.x = 0.5
		S.DAZED:
			body.rotation.z = sin(anim_t * 6.0) * 0.12
			body.position.y = 1.9
			head.rotation.x = 0.4
			head.rotation.z = sin(anim_t * 5.0) * 0.3
			jaw.rotation.x = 0.3
			ll.rotation.x = 0.8
			lr.rotation.x = 0.8
		S.HURT:
			body.rotation.x = -0.4
			head.rotation.x = -0.6
			jaw.rotation.x = 0.8
		S.DEAD:
			_t += dt
			var s := clampf(_t / 1.5, 0.0, 1.0)
			body.rotation.z = s * 1.4
			body.position.y = 2.1 - s * 1.2
			head.rotation.x = 0.5
			jaw.rotation.x = 0.6
