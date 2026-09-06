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
