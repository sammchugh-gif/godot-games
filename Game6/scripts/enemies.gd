# Bonks (stompable) and Spinies (not). Both wander near home and chase the
# kid when he is close. Stomps, hat hits, ground-pound shockwaves and Rex
# all deal with them in their own ways.
class_name Enemy
extends CharacterBody3D

var kind := "bonk"
var alive := true
var level: Node
var player: Player
var model: Node3D
var facing := 0.0
var home := Vector3.ZERO
var anim_t := 0.0
var _dir := Vector3.FORWARD
var _wander_t := 0.0
var _die_t := 0.0
var _stun := 0.0
var rng := RandomNumberGenerator.new()


func setup(k: String, lvl: Node, p: Player) -> void:
	kind = k
	level = lvl
	player = p
	home = global_position
	rng.seed = int(global_position.x * 31.0 + global_position.z * 17.0) & 0x7fffffff
	var col := CollisionShape3D.new()
	var c := CapsuleShape3D.new()
	c.radius = 0.42
	c.height = 0.9
	col.shape = c
	col.position = Vector3(0, 0.45, 0)
	add_child(col)
	floor_max_angle = deg_to_rad(50.0)
	model = Models.bonk() if kind == "bonk" else Models.spiny()
	add_child(model)
	_wander_t = rng.randf_range(0.5, 2.0)


func radius() -> float:
	return 0.55


func top() -> float:
	return global_position.y + 0.9


func _physics_process(dt: float) -> void:
	anim_t += dt
	if not alive:
		_die_t += dt
		var body: Node3D = model.get_node("body")
		body.scale = Vector3(1.4, 0.25, 1.4)
		body.position.y = 0.12
		if _die_t > 0.55:
			queue_free()
		return
	_stun = maxf(_stun - dt, 0.0)
	if not is_on_floor():
		velocity.y -= 30.0 * dt
	var speed := 0.0
	if _stun <= 0.0 and player and not player.dead:
		var to_p := player.actor_pos() - global_position
		to_p.y = 0.0
		var dist := to_p.length()
		var chase := dist < 11.0 and (player.capture == null or player.capture.kind != "rex")
		if chase and dist > 0.1:
			_dir = to_p / dist
			speed = 3.6 if kind == "bonk" else 3.0
		else:
			_wander_t -= dt
			if _wander_t <= 0.0:
				_wander_t = rng.randf_range(1.5, 3.5)
				var back := home - global_position
				back.y = 0.0
				if back.length() > 12.0:
					_dir = back.normalized()
				else:
					var a := rng.randf() * TAU
					_dir = Vector3(cos(a), 0, sin(a))
			speed = 1.4
	velocity.x = move_toward(velocity.x, _dir.x * speed, 12.0 * dt)
	velocity.z = move_toward(velocity.z, _dir.z * speed, 12.0 * dt)
	if speed > 0.0:
		facing = lerp_angle(facing, atan2(-_dir.x, -_dir.z), 1.0 - exp(-dt * 6.0))
	move_and_slide()
	model.rotation.y = facing
	var body: Node3D = model.get_node("body")
	var ll: Node3D = model.get_node("legL")
	var lr: Node3D = model.get_node("legR")
	var ph := anim_t * (4.0 + speed * 2.5)
	ll.rotation.x = sin(ph) * 0.6 * (0.3 + speed * 0.2)
	lr.rotation.x = -sin(ph) * 0.6 * (0.3 + speed * 0.2)
	body.position.y = 0.45 + absf(sin(ph)) * 0.03
	body.rotation.z = sin(ph) * 0.06
	if _stun > 0.0:
		body.rotation.z = sin(anim_t * 30.0) * 0.2


func stomp() -> bool:
	if kind == "spiny":
		return false
	_kill("stomp")
	return true


func hat_hit() -> bool:
	if kind == "bonk":
		_kill("stomp")
		return true
	_stun = 1.2
	return false


func smash() -> void:
	_kill("break")


func _kill(sound: String) -> void:
	if not alive:
		return
	alive = false
	Sfx.play(sound)
	if level and level.has_method("enemy_killed"):
		level.enemy_killed(self)
