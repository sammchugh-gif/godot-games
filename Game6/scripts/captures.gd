# The four captures of Dino Ridge.
class_name Captures
extends RefCounted


# Hoppo the frog: a huge jump.
class Frog extends Capturable:
	var _hop_t := 1.0
	var _squash := 0.0
	var _was_floor := true

	func _ready() -> void:
		kind = "frog"
		focus_height = 0.9
		cam_distance = 7.5
		add_capsule(0.5, 0.6, 0.5)
		model = Models.frog()
		add_child(model)

	func ai(dt: float) -> void:
		if not is_on_floor():
			velocity.y -= 30.0 * dt
		else:
			velocity.x = move_toward(velocity.x, 0.0, 20.0 * dt)
			velocity.z = move_toward(velocity.z, 0.0, 20.0 * dt)
			_hop_t -= dt
			if _hop_t <= 0.0:
				_hop_t = rng.randf_range(1.5, 3.5)
				var d := (home - global_position)
				d.y = 0.0
				if d.length() < 5.0 or rng.randf() < 0.5:
					d = Vector3(rng.randf_range(-1, 1), 0, rng.randf_range(-1, 1))
				d = d.normalized()
				velocity = d * 3.5 + Vector3.UP * 7.0
				facing = atan2(-d.x, -d.z)
		move_and_slide()
		_landing()

	func drive(dt: float) -> void:
		var inp := player.move_input()
		var on_floor := is_on_floor()
		var acc := 40.0 if on_floor else 18.0
		velocity.x = move_toward(velocity.x, inp.x * 7.0, acc * dt)
		velocity.z = move_toward(velocity.z, inp.z * 7.0, acc * dt)
		if not on_floor:
			velocity.y -= (28.0 if (velocity.y > 0.0 and player.jump_held()) else 36.0) * dt
		elif player.jump_pressed():
			velocity.y = 27.0
			Sfx.play("boing")
		face(inp, dt)
		move_and_slide()
		_landing()

	func _landing() -> void:
		var f := is_on_floor()
		if f and not _was_floor:
			_squash = 1.0
			Sfx.play("land", -8.0)
		_was_floor = f

	func animate(dt: float) -> void:
		_squash = maxf(_squash - dt * 4.0, 0.0)
		var body: Node3D = model.get_node("body")
		var s := 1.0 + sin(_squash * PI) * 0.35
		body.scale = Vector3(s, 1.0 / s, s)
		var ll: Node3D = model.get_node("legL")
		var lr: Node3D = model.get_node("legR")
		var air := not is_on_floor()
		ll.rotation.x = -0.9 if air else 0.0
		lr.rotation.x = -0.9 if air else 0.0
		body.rotation.x = -0.35 if air and velocity.y > 0.0 else 0.0


# Rex the T-Rex: slow, huge, smashes boulders and squashes everything.
class Rex extends Capturable:
	var _roar := 0.0
	var _step := 0.0
	var _snore := 0.0

	func _ready() -> void:
		kind = "rex"
		focus_height = 3.2
		cam_distance = 13.0
		capture_radius = 2.8
		add_capsule(1.15, 1.6, 2.1)
		model = Models.rex(1.0)
		add_child(model)

	func release_point() -> Vector3:
		return global_position + Vector3(0, 4.6, 0)

	func ai(dt: float) -> void:
		_snore += dt
		if not is_on_floor():
			velocity.y -= 30.0 * dt
		velocity.x = 0.0
		velocity.z = 0.0
		move_and_slide()

	func drive(dt: float) -> void:
		var inp := player.move_input()
		var on_floor := is_on_floor()
		velocity.x = move_toward(velocity.x, inp.x * 8.0, 14.0 * dt)
		velocity.z = move_toward(velocity.z, inp.z * 8.0, 14.0 * dt)
		if not on_floor:
			velocity.y -= 30.0 * dt
		face(inp, dt, 4.0)
		_roar = maxf(_roar - dt, 0.0)
		if player.jump_pressed() and _roar <= 0.0:
			_roar = 0.9
			Sfx.play("roar")
			if player.cam:
				player.cam.shake = 1.0
		var hs := Vector2(velocity.x, velocity.z).length()
		var prev := _step
		_step += dt * hs * 0.55
		if int(prev * 2.0) != int(_step * 2.0) and on_floor and hs > 1.0:
			Sfx.play("land", -2.0)
			if player.cam:
				player.cam.shake = maxf(player.cam.shake, 0.25)
		move_and_slide()
		if level and level.has_method("rex_smash"):
			var r := 5.5 if _roar > 0.5 else 3.2
			if hs > 0.5 or _roar > 0.5:
				level.rex_smash(head_pos() + Vector3(-sin(facing), -1.5, -cos(facing)) * 1.6, r)

	func animate(dt: float) -> void:
		var body: Node3D = model.get_node("body")
		var head: Node3D = body.get_node("head")
		var jaw: Node3D = head.get_node("jaw")
		var ll: Node3D = model.get_node("legL")
		var lr: Node3D = model.get_node("legR")
		if not captured:
			# Asleep: lie low and breathe.
			body.position.y = 1.5 + sin(_snore * 1.5) * 0.06
			body.rotation.x = 0.0
			head.rotation.x = 0.35
			jaw.rotation.x = 0.08 + sin(_snore * 1.5) * 0.05
			ll.rotation.x = 1.3
			lr.rotation.x = 1.3
			return
		body.position.y = 2.1
		var hs := Vector2(velocity.x, velocity.z).length()
		var ph := _step * TAU
		var amt := clampf(hs / 8.0, 0.0, 1.0)
		ll.rotation.x = sin(ph) * 0.7 * amt
		lr.rotation.x = -sin(ph) * 0.7 * amt
		body.position.y += absf(sin(ph)) * 0.15 * amt
		body.rotation.x = 0.06 * amt
		if _roar > 0.0:
			head.rotation.x = -0.5 * sin(_roar / 0.9 * PI)
			jaw.rotation.x = 0.6 * sin(_roar / 0.9 * PI)
		else:
			head.rotation.x = sin(anim_t * 1.3) * 0.05
			jaw.rotation.x = 0.05


# Zoomer the rocket: fired from a cannon, flies until it hits something.
class Rocket extends Capturable:
	var dir := Vector3.FORWARD
	var life := 8.0
	var _pitch := 0.0
	var _exploded := false

	func _ready() -> void:
		kind = "rocket"
		focus_height = 0.0
		cam_distance = 9.0
		capture_radius = 1.6
		var col := CollisionShape3D.new()
		var s := SphereShape3D.new()
		s.radius = 0.55
		col.shape = s
		add_child(col)
		model = Models.rocket()
		add_child(model)

	func release_point() -> Vector3:
		return global_position + Vector3(0, 0.8, 0)

	func on_capture() -> void:
		life = 9.0
		_pitch = 0.0
		Sfx.play("rocket")

	func ai(dt: float) -> void:
		life -= dt
		velocity = dir * 14.0
		facing = atan2(-dir.x, -dir.z)
		move_and_slide()
		if get_slide_collision_count() > 0 or life <= 0.0:
			explode()
		elif player and not player.capture and global_position.distance_to(player.global_position + Vector3(0, 0.8, 0)) < 1.3:
			player.damage(global_position)

	func drive(dt: float) -> void:
		life -= dt
		var inp := player.move_input()
		var raw := player.raw_input()
		if inp.length() > 0.2:
			var want := atan2(-inp.x, -inp.z)
			var flat := Vector3(-sin(facing), 0, -cos(facing))
			var d := wrapf(want - facing, -PI, PI)
			# Turn toward the stick; sideways stick turns, forward/back climbs/dives.
			facing += clampf(d, -1.0, 1.0) * dt * 1.9
			var fb := clampf(-raw.y, -1.0, 1.0) * flat.dot(inp.normalized())
			_pitch = clampf(_pitch + fb * dt * 1.4, -0.9, 0.9)
		else:
			_pitch = move_toward(_pitch, 0.0, dt * 0.8)
		dir = Vector3(-sin(facing) * cos(_pitch), sin(_pitch), -cos(facing) * cos(_pitch)).normalized()
		velocity = dir * 21.0
		move_and_slide()
		var p := global_position
		var off_world := absf(p.x) > 124.0 or absf(p.z) > 124.0 or p.y > 70.0 or p.y < -8.0
		if get_slide_collision_count() > 0 or life <= 0.0 or off_world:
			explode()

	func can_release() -> bool:
		return true

	func explode() -> void:
		if _exploded:
			return
		_exploded = true
		Sfx.play("break")
		if level and level.has_method("explosion"):
			level.explosion(global_position, 3.5)
		if captured:
			player.release_capture()
		if player and player.cam:
			player.cam.shake = maxf(player.cam.shake, 0.8)
		queue_free()

	func animate(_dt: float) -> void:
		model.rotation.x = _pitch if captured else 0.0
		var fl: Node3D = model.get_node("body/flame")
		fl.scale = Vector3(1, 1, 0.8 + 0.4 * sin(anim_t * 40.0))


# Stretch the stilt plant: hold JUMP to grow long legs.
class Stilt extends Capturable:
	var leg := 0.0
	const MAX_LEG := 9.0

	func _ready() -> void:
		kind = "stilt"
		focus_height = 1.8
		cam_distance = 8.5
		capture_radius = 1.5
		add_capsule(0.5, 0.9, 0.75)
		model = Models.stilt()
		add_child(model)

	func release_point() -> Vector3:
		return head_pos() + Vector3(0, 0.6, 0)

	func head_pos() -> Vector3:
		return global_position + Vector3(0, 1.5 + leg + 0.3, 0)

	func on_release() -> void:
		leg = 0.0

	func ai(dt: float) -> void:
		if not is_on_floor():
			velocity.y -= 30.0 * dt
		velocity.x = 0.0
		velocity.z = 0.0
		move_and_slide()

	func drive(dt: float) -> void:
		var inp := player.move_input()
		if not is_on_floor():
			velocity.y -= 30.0 * dt
		var sp := 4.5 if leg < 0.5 else 2.5
		velocity.x = move_toward(velocity.x, inp.x * sp, 25.0 * dt)
		velocity.z = move_toward(velocity.z, inp.z * sp, 25.0 * dt)
		if player.jump_held():
			if leg < 0.1:
				Sfx.play("stretch")
			leg = minf(leg + dt * 7.0, MAX_LEG)
		else:
			leg = maxf(leg - dt * 14.0, 0.0)
		focus_height = 1.8 + leg * 0.9
		face(inp, dt, 6.0)
		move_and_slide()
		if level and level.has_method("stilt_head"):
			level.stilt_head(head_pos())

	func animate(_dt: float) -> void:
		var legs: Node3D = model.get_node("legs")
		var head: Node3D = model.get_node("head")
		legs.scale = Vector3(1, 1.0 + leg, 1)
		head.position.y = 1.5 + leg
		var wob := sin(anim_t * 3.0) * 0.03
		head.rotation.z = wob


# Cabbie the taxi: fast, drifts round corners, honks. Uncaptured it patrols
# a street and knocks the kid over.
class Taxi extends Capturable:
	var patrol_a := Vector3.ZERO
	var patrol_b := Vector3.ZERO
	var speed := 0.0
	var _to_b := true
	var _wheel := 0.0
	var _honk := 0.0
	var _tilt := 0.0

	func _ready() -> void:
		kind = "taxi"
		focus_height = 1.3
		cam_distance = 10.5
		capture_radius = 2.4
		add_capsule(1.05, 2.3, 1.05)
		floor_max_angle = deg_to_rad(50.0)
		model = Models.taxi()
		add_child(model)

	func release_point() -> Vector3:
		var right := Vector3(cos(facing), 0, -sin(facing))
		return global_position + right * 2.4 + Vector3(0, 0.6, 0)

	func on_capture() -> void:
		Sfx.play("boing", -4.0)

	func _forward() -> Vector3:
		return Vector3(-sin(facing), 0, -cos(facing))

	func ai(dt: float) -> void:
		if not is_on_floor():
			velocity.y -= 30.0 * dt
		var target := patrol_b if _to_b else patrol_a
		var d := target - global_position
		d.y = 0.0
		if d.length() < 3.0:
			_to_b = not _to_b
		else:
			face(d, dt, 3.0)
		speed = move_toward(speed, 7.0, 6.0 * dt)
		var f := _forward()
		velocity.x = f.x * speed
		velocity.z = f.z * speed
		move_and_slide()
		if is_on_wall():
			_to_b = not _to_b
		_wheel += speed * dt
		if player and not player.capture and not player.dead:
			var to_p := player.global_position - global_position
			to_p.y = 0.0
			if to_p.length() < 2.4 and absf(player.global_position.y - global_position.y) < 2.0:
				player.damage(global_position)

	func drive(dt: float) -> void:
		var inp := player.move_input()
		if not is_on_floor():
			velocity.y -= 30.0 * dt
		var f := _forward()
		var want := inp.length()
		if want > 0.1:
			var goal := atan2(-inp.x, -inp.z)
			var diff := wrapf(goal - facing, -PI, PI)
			var rate := 1.2 + 2.2 * clampf(speed / 18.0, 0.0, 1.0)
			facing += clampf(diff, -1.0, 1.0) * rate * dt
			_tilt = lerpf(_tilt, -clampf(diff, -1.0, 1.0) * 0.12 * clampf(speed / 18.0, 0.0, 1.0), dt * 6.0)
			# Only drive forward when the stick points roughly the way we face.
			var ahead := inp.normalized().dot(f)
			speed = move_toward(speed, 18.0 * want * maxf(ahead, 0.2), 13.0 * dt)
		else:
			speed = move_toward(speed, 0.0, 18.0 * dt)
			_tilt = lerpf(_tilt, 0.0, dt * 6.0)
		f = _forward()
		velocity.x = f.x * speed
		velocity.z = f.z * speed
		_honk = maxf(_honk - dt, 0.0)
		if player.jump_pressed() and _honk <= 0.0:
			_honk = 0.5
			Sfx.play("honk")
			if is_on_floor():
				velocity.y = 6.5
		move_and_slide()
		if is_on_wall() and speed > 8.0:
			speed *= 0.4
			Sfx.play("land", -4.0)
			if player.cam:
				player.cam.shake = 0.4
		_wheel += speed * dt
		if speed > 5.0 and level and level.has_method("taxi_bump"):
			level.taxi_bump(global_position + f * 2.4 + Vector3(0, 0.6, 0), 1.9)

	func animate(_dt: float) -> void:
		var body: Node3D = model.get_node("body")
		body.rotation.z = _tilt
		body.position.y = 0.45 + (0.12 if _honk > 0.35 else 0.0)
		for n in ["wheelFL", "wheelFR", "wheelBL", "wheelBR"]:
			(model.get_node(n) as Node3D).rotation.x = -_wheel / 0.42


# Sherman the tank: slow, and JUMP fires a shell that breaks metal.
class Tank extends Capturable:
	var _cool := 0.0
	var _recoil := 0.0
	var _scan := 0.0

	func _ready() -> void:
		kind = "tank"
		focus_height = 1.8
		cam_distance = 9.5
		capture_radius = 2.4
		add_capsule(1.3, 1.5, 1.1)
		model = Models.tank()
		add_child(model)

	func release_point() -> Vector3:
		return global_position + Vector3(-sin(facing), 0, -cos(facing)) * -2.8 + Vector3(0, 0.8, 0)

	func ai(dt: float) -> void:
		_scan += dt
		if not is_on_floor():
			velocity.y -= 30.0 * dt
		velocity.x = 0.0
		velocity.z = 0.0
		move_and_slide()

	func drive(dt: float) -> void:
		var inp := player.move_input()
		if not is_on_floor():
			velocity.y -= 30.0 * dt
		velocity.x = move_toward(velocity.x, inp.x * 4.5, 10.0 * dt)
		velocity.z = move_toward(velocity.z, inp.z * 4.5, 10.0 * dt)
		face(inp, dt, 2.5)
		_cool = maxf(_cool - dt, 0.0)
		_recoil = maxf(_recoil - dt * 3.0, 0.0)
		if player.jump_pressed() and _cool <= 0.0:
			_cool = 0.7
			_recoil = 1.0
			var f := Vector3(-sin(facing), 0, -cos(facing))
			if level and level.has_method("tank_fire"):
				level.tank_fire(global_position + Vector3(0, 1.85, 0) + f * 3.2, f + Vector3(0, -0.05, 0))
			if player.cam:
				player.cam.shake = 0.35
		move_and_slide()

	func animate(_dt: float) -> void:
		var turret: Node3D = model.get_node("body/turret")
		if captured:
			turret.rotation.y = 0.0
			turret.position.z = 0.2 + _recoil * 0.35
		else:
			turret.rotation.y = sin(_scan * 0.7) * 0.6


# Jaxi the stone lion: fast, keeps going, jumps, and walks on poison.
class Jaxi extends Capturable:
	var speed := 0.0
	var _step := 0.0

	func _ready() -> void:
		kind = "jaxi"
		focus_height = 2.0
		cam_distance = 11.0
		capture_radius = 2.6
		hazard_proof = true
		add_capsule(0.9, 2.2, 1.3)
		model = Models.jaxi()
		add_child(model)

	func release_point() -> Vector3:
		var right := Vector3(cos(facing), 0, -sin(facing))
		return global_position + right * 2.2 + Vector3(0, 1.0, 0)

	func on_capture() -> void:
		Sfx.play("roar", -8.0)

	func ai(dt: float) -> void:
		if not is_on_floor():
			velocity.y -= 30.0 * dt
		velocity.x = 0.0
		velocity.z = 0.0
		move_and_slide()

	func drive(dt: float) -> void:
		var inp := player.move_input()
		if not is_on_floor():
			velocity.y -= 30.0 * dt
		var want := inp.length()
		if want > 0.1:
			var goal := atan2(-inp.x, -inp.z)
			var diff := wrapf(goal - facing, -PI, PI)
			facing += clampf(diff, -1.0, 1.0) * dt * (2.2 + 1.2 * (1.0 - speed / 16.0))
			speed = move_toward(speed, 16.0 * want, 9.0 * dt)
		else:
			speed = move_toward(speed, 0.0, 10.0 * dt)
		var f := Vector3(-sin(facing), 0, -cos(facing))
		velocity.x = f.x * speed
		velocity.z = f.z * speed
		if player.jump_pressed() and is_on_floor():
			velocity.y = 13.0
			Sfx.play("jump2")
		var prev := _step
		_step += dt * speed * 0.35
		if int(prev * 2.0) != int(_step * 2.0) and is_on_floor() and speed > 4.0:
			Sfx.play("land", -12.0)
		move_and_slide()
		if speed > 6.0 and level and level.has_method("taxi_bump"):
			level.taxi_bump(global_position + f * 2.0 + Vector3(0, 0.8, 0), 1.8)

	func animate(_dt: float) -> void:
		var legs: Node3D = model.get_node("legs")
		var body: Node3D = model.get_node("body")
		var amt := clampf(speed / 16.0, 0.0, 1.0)
		legs.rotation.x = sin(_step * TAU) * 0.5 * amt
		body.position.y = 1.3 + absf(sin(_step * TAU)) * 0.12 * amt
		body.rotation.x = -0.08 * amt


# Skyla the bird: tap JUMP to flap, steer with the stick, land to rest.
class Bird extends Capturable:
	var flaps := 10
	var _wing := 0.0
	var _rest_t := 0.0

	func _ready() -> void:
		kind = "bird"
		focus_height = 1.0
		cam_distance = 9.0
		capture_radius = 1.6
		add_capsule(0.45, 0.5, 0.5)
		model = Models.bird()
		add_child(model)

	func release_point() -> Vector3:
		return global_position + Vector3(0, 0.8, 0)

	func on_capture() -> void:
		flaps = 10
		Sfx.play("boing", -6.0)

	func ai(dt: float) -> void:
		if not is_on_floor():
			velocity.y -= 20.0 * dt
		velocity.x = move_toward(velocity.x, 0.0, 10.0 * dt)
		velocity.z = move_toward(velocity.z, 0.0, 10.0 * dt)
		_rest_t -= dt
		if _rest_t <= 0.0 and is_on_floor():
			_rest_t = rng.randf_range(2.0, 4.0)
			velocity.y = 5.0
			var a := rng.randf() * TAU
			velocity.x = cos(a) * 2.0
			velocity.z = sin(a) * 2.0
			facing = atan2(-velocity.x, -velocity.z)
		move_and_slide()

	func drive(dt: float) -> void:
		var inp := player.move_input()
		var on_floor := is_on_floor()
		var sp := 11.0
		velocity.x = move_toward(velocity.x, inp.x * sp, 16.0 * dt)
		velocity.z = move_toward(velocity.z, inp.z * sp, 16.0 * dt)
		if on_floor:
			flaps = 10
		if player.jump_pressed() and flaps > 0:
			flaps -= 1
			velocity.y = 9.5
			_wing = 1.0
			Sfx.play("jump", -4.0)
			if flaps == 0 and level:
				level.message.emit("Out of flaps! Land to rest.")
		if not on_floor:
			velocity.y -= 14.0 * dt
			velocity.y = maxf(velocity.y, -7.0)
		face(inp, dt, 8.0)
		move_and_slide()

	func animate(dt: float) -> void:
		_wing = maxf(_wing - dt * 4.0, 0.0)
		var wl: Node3D = model.get_node("body/wingL")
		var wr: Node3D = model.get_node("body/wingR")
		var flap := sin(_wing * PI) * 0.9 if _wing > 0.0 else (sin(anim_t * 6.0) * 0.35 if not is_on_floor() else 0.0)
		wl.rotation.z = -flap
		wr.rotation.z = flap
		var body: Node3D = model.get_node("body")
		body.rotation.x = clampf(-velocity.y * 0.04, -0.4, 0.4) if not is_on_floor() else 0.0


# Blaze the lava fireball: swims in lava, hops on rock, JUMP is a big leap.
class Blaze extends Capturable:
	var _bob := 0.0

	func _ready() -> void:
		kind = "blaze"
		focus_height = 1.2
		cam_distance = 9.0
		capture_radius = 1.7
		hazard_proof = true
		add_capsule(0.55, 0.5, 0.6)
		model = Models.blaze()
		add_child(model)

	func release_point() -> Vector3:
		return global_position + Vector3(0, 1.2, 0)

	func on_capture() -> void:
		Sfx.play("rocket", -10.0)

	func _in_lava() -> bool:
		return level != null and level.has_method("lava_at") and level.lava_at(global_position)

	func ai(dt: float) -> void:
		_bob += dt
		if _in_lava():
			var ly: float = level.lava_level(global_position)
			global_position.y = ly + 0.1 + sin(_bob * 2.0) * 0.1
			velocity = Vector3.ZERO
		else:
			if not is_on_floor():
				velocity.y -= 30.0 * dt
			velocity.x = 0.0
			velocity.z = 0.0
			move_and_slide()

	func drive(dt: float) -> void:
		var inp := player.move_input()
		_bob += dt
		if _in_lava():
			var ly: float = level.lava_level(global_position)
			velocity.x = move_toward(velocity.x, inp.x * 9.0, 30.0 * dt)
			velocity.z = move_toward(velocity.z, inp.z * 9.0, 30.0 * dt)
			if velocity.y <= 0.0:
				global_position.y = ly + 0.1
				velocity.y = 0.0
				if player.jump_pressed():
					velocity.y = 17.0
					Sfx.play("boing")
			else:
				velocity.y -= 30.0 * dt
		else:
			if not is_on_floor():
				velocity.y -= 30.0 * dt
			velocity.x = move_toward(velocity.x, inp.x * 6.0, 20.0 * dt)
			velocity.z = move_toward(velocity.z, inp.z * 6.0, 20.0 * dt)
			if player.jump_pressed() and is_on_floor():
				velocity.y = 15.0
				Sfx.play("boing")
		face(inp, dt, 8.0)
		move_and_slide()
		if level and level.has_method("rex_smash"):
			var hs := Vector2(velocity.x, velocity.z).length()
			if hs > 3.0:
				level.rex_smash(global_position, 1.6)

	func animate(_dt: float) -> void:
		var body: Node3D = model.get_node("body")
		var s := 1.0 + sin(_bob * 5.0) * 0.06
		body.scale = Vector3(s, 1.0 / s, s)
		var fl: Node3D = body.get_node("flames")
		fl.rotation.y = _bob * 2.0
