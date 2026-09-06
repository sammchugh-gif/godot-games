# The act boss: an Egg Mobile with a wrecking ball, fought on the beach in
# front of the goal. It hovers over the arena, swoops at Sonic, and swings
# the ball. Hit the pod eight times with a jump, homing attack, roll or boost.
# The ball always hurts. Built from primitives like everything else.
class_name Boss
extends Area3D

signal hit(hp_left: int)
signal defeated()
signal activated()

enum Ph { IDLE, HOVER, SWOOP, BALL, HIT, DEAD }

const MAX_HP := 8

var hp := MAX_HP
var phase := Ph.IDLE
var active := false
var _t := 0.0
var _phase_t := 0.0
var _origin := Vector3.ZERO
var _fwd := Vector3.FORWARD
var _right := Vector3.RIGHT
var _pod: Node3D
var _ball: Node3D
var _ball_area: Area3D
var _chain: Array = []
var _ball_len := 0.0
var _ball_ang := 0.0
var _swoop_from := Vector3.ZERO
var _swoop_to := Vector3.ZERO
var _inv_t := 0.0
var _flash_mats: Array = []
var _player: Player
var _dead_t := 0.0
var _hover_seed := 0.0
var _mustache: Node3D
var _prop: Node3D


static func make(pos: Vector3, fwd: Vector3) -> Boss:
	var b := Boss.new()
	b.position = pos
	b._fwd = Vector3(fwd.x, 0, fwd.z).normalized()
	b._right = b._fwd.cross(Vector3.UP).normalized()
	return b


func _ready() -> void:
	collision_layer = 4
	collision_mask = 2
	_origin = global_position
	add_to_group("enemy")
	var cs := CollisionShape3D.new()
	var sh := SphereShape3D.new()
	sh.radius = 2.2
	cs.shape = sh
	add_child(cs)
	body_entered.connect(_on_body)
	_ball_area = Area3D.new()
	_ball_area.collision_layer = 4
	_ball_area.collision_mask = 2
	var bcs := CollisionShape3D.new()
	var bsh := SphereShape3D.new()
	bsh.radius = 1.4
	bcs.shape = bsh
	_ball_area.add_child(bcs)
	_ball_area.body_entered.connect(_on_ball_body)
	add_child(_ball_area)
	_ball_area.position = Vector3(0, -2.0, 0)
	_build()
	visible = false
	set_process(false)


func _build() -> void:
	var grey := Mats.pbr(Color(0.62, 0.64, 0.68), 0.35, 0.8)
	var dark := Mats.pbr(Color(0.12, 0.12, 0.14), 0.5, 0.4)
	var red := Mats.pbr(Color(0.85, 0.12, 0.10), 0.45)
	var skin := Mats.skin(Color(0.98, 0.82, 0.62), 0.55, 0.2)
	var yellow := Mats.pbr(Color(0.95, 0.78, 0.15), 0.4, 0.5)
	var glass := Mats.pbr(Color(0.5, 0.8, 1.0, 0.5), 0.1, 0.2)
	glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_pod = Node3D.new()
	add_child(_pod)
	# Pod: a bowl with a rim and a flat top, engine at the back.
	var b := MeshLib.Builder.new()
	b.lathe([Vector2(0.0, -1.6), Vector2(1.2, -1.5), Vector2(2.0, -0.6), Vector2(2.2, 0.2), Vector2(2.0, 0.5), Vector2(1.8, 0.5), Vector2(1.7, 0.0), Vector2(0.0, 0.0)], 24)
	_pod.add_child(b.commit(grey, "Pod"))
	_flash_mats.append(grey)
	b = MeshLib.Builder.new()
	b.lathe([Vector2(2.0, 0.3), Vector2(2.35, 0.3), Vector2(2.35, 0.65), Vector2(2.0, 0.65)], 24, Vector3.ZERO, Basis.IDENTITY, false)
	_pod.add_child(b.commit(dark, "Rim"))
	# Engines and claws underneath.
	b = MeshLib.Builder.new()
	for s in [-1.0, 1.0]:
		b.cylinder(Vector3(1.4 * s, -1.0, 0.9), Vector3(1.4 * s, -1.0, 2.4), 0.45, 0.35, 12)
		b.lathe([Vector2(0.0, 0.0), Vector2(0.4, 0.0), Vector2(0.3, 0.6), Vector2(0.0, 0.6)], 8, Vector3(0.9 * s, -2.0, -0.4))
	_pod.add_child(b.commit(dark, "Engines"))
	b = MeshLib.Builder.new()
	for s in [-1.0, 1.0]:
		b.ellipsoid(Vector3(1.5 * s, -1.7, -0.2), Vector3(0.35, 0.3, 0.55), 8, 6)
	_pod.add_child(b.commit(yellow, "Claws"))
	# Eggman: round red body, bald head, goggles, big mustache.
	b = MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 0.7, -0.2), Vector3(1.05, 0.95, 0.95), 18, 12)
	_pod.add_child(b.commit(red, "Body"))
	b = MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 1.85, -0.25), Vector3(0.62, 0.6, 0.6), 18, 12)
	# Nose.
	b.ellipsoid(Vector3(0, 1.75, -0.85), Vector3(0.18, 0.15, 0.2), 8, 6)
	_pod.add_child(b.commit(skin, "Head"))
	b = MeshLib.Builder.new()
	b.lathe([Vector2(0.0, 2.05), Vector2(0.66, 2.05), Vector2(0.62, 2.25), Vector2(0.0, 2.25)], 18, Vector3(0, 0, -0.25))
	_pod.add_child(b.commit(dark, "Goggles"))
	b = MeshLib.Builder.new()
	b.ellipsoid(Vector3(-0.28, 2.0, -0.78), Vector3(0.2, 0.14, 0.08), 8, 6)
	b.ellipsoid(Vector3(0.28, 2.0, -0.78), Vector3(0.2, 0.14, 0.08), 8, 6)
	_pod.add_child(b.commit(glass, "Lenses"))
	_mustache = Node3D.new()
	_mustache.position = Vector3(0, 1.6, -0.75)
	_pod.add_child(_mustache)
	b = MeshLib.Builder.new()
	b.spike(Vector3(0, 0, 0), Vector3(-1.1, 0.25, -0.1), 0.2, 8, 5, Vector3(0, -0.15, 0))
	b.spike(Vector3(0, 0, 0), Vector3(1.1, 0.25, -0.1), 0.2, 8, 5, Vector3(0, -0.15, 0))
	_mustache.add_child(b.commit(Mats.pbr(Color(0.55, 0.28, 0.08), 0.6), "Mustache"))
	# Propeller on top of a mast.
	b = MeshLib.Builder.new()
	b.cylinder(Vector3(0, 0.4, 1.2), Vector3(0, 3.4, 1.2), 0.08, 0.08, 6)
	_pod.add_child(b.commit(dark, "Mast"))
	_prop = Node3D.new()
	_prop.position = Vector3(0, 3.4, 1.2)
	_pod.add_child(_prop)
	b = MeshLib.Builder.new()
	b.box(Vector3(0, 0, 0), Vector3(3.2, 0.05, 0.3))
	b.box(Vector3(0, 0, 0), Vector3(0.3, 0.05, 3.2))
	_prop.add_child(b.commit(grey, "Blades"))
	# Wrecking ball on a chain.
	_ball = Node3D.new()
	add_child(_ball)
	b = MeshLib.Builder.new()
	b.ellipsoid(Vector3.ZERO, Vector3(1.0, 1.0, 1.0), 14, 10)
	for i in 14:
		var a := TAU * float(i) / 7.0
		var el := (-0.5 + float(i / 7)) * 1.0
		var dir := Vector3(cos(a) * cos(el), sin(el), sin(a) * cos(el)).normalized()
		b.spike(dir * 0.85, dir * 1.55, 0.22, 6, 3)
	_ball.add_child(b.commit(dark, "Ball"))
	for i in 6:
		var link := MeshLib.Builder.new()
		link.lathe([Vector2(0.18, -0.12), Vector2(0.28, 0.0), Vector2(0.18, 0.12)], 8, Vector3.ZERO, Basis.IDENTITY, false)
		var lm := link.commit(grey, "Link")
		add_child(lm)
		_chain.append(lm)
	_set_ball(0.0)


func _set_ball(len: float) -> void:
	_ball_len = len
	var dir := Vector3(sin(_ball_ang), -1.2, cos(_ball_ang)).normalized()
	var p := Vector3(0, -1.6, 0) + dir * len
	_ball.position = p
	_ball_area.position = p
	_ball.rotation.y += 0.05
	for i in _chain.size():
		var lm: Node3D = _chain[i]
		lm.position = Vector3(0, -1.6, 0) + dir * (len * float(i + 1) / (_chain.size() + 1))
		lm.visible = len > 0.5


func activate(p: Player) -> void:
	if active:
		return
	active = true
	_player = p
	visible = true
	call_deferred("add_to_group", "homing_target")
	set_process(true)
	phase = Ph.HOVER
	_phase_t = 0.0
	activated.emit()


func is_targetable() -> bool:
	return active and phase != Ph.DEAD and _inv_t <= 0.0


func on_homing_hit(p: Player) -> void:
	_take_hit(p)


func _on_body(b: Node3D) -> void:
	if not active or phase == Ph.DEAD or not (b is Player):
		return
	var p := b as Player
	if p.is_attacking() and _inv_t <= 0.0:
		_take_hit(p)
	elif _inv_t <= 0.0:
		p.take_hit(global_position)


func _on_ball_body(b: Node3D) -> void:
	if not active or phase == Ph.DEAD or _ball_len < 0.5 or not (b is Player):
		return
	(b as Player).take_hit(_ball.global_position)


func _take_hit(p: Player) -> void:
	hp -= 1
	_inv_t = 1.2
	var lvl := get_tree().get_first_node_in_group("level")
	if lvl and lvl.has_method("enemy_pop"):
		lvl.call("enemy_pop", global_position + Vector3(0, 0.5, 0))
	# Bounce Sonic away and up so the chain continues.
	var away := (p.global_position - global_position)
	away.y = 0.0
	away = away.normalized() if away.length() > 0.1 else -_fwd
	p.velocity = away * 9.0 + Vector3(0, 14.0, 0)
	p.st = Player.St.AIR
	p.air_dash_used = false
	p.add_boost(10.0)
	if hp <= 0:
		phase = Ph.DEAD
		_dead_t = 0.0
		call_deferred("remove_from_group", "homing_target")
		defeated.emit()
	else:
		phase = Ph.HIT
		_phase_t = 0.0
	hit.emit(hp)


func _process(dt: float) -> void:
	_t += dt
	_phase_t += dt
	_inv_t = maxf(_inv_t - dt, 0.0)
	_prop.rotation.y += dt * 30.0
	_mustache.rotation.x = sin(_t * 3.0) * 0.05
	# Flash while invulnerable.
	var flash := _inv_t > 0.0 and fmod(_inv_t, 0.12) > 0.06
	for m in _flash_mats:
		(m as StandardMaterial3D).emission_enabled = flash
		(m as StandardMaterial3D).emission = Color(1.0, 0.4, 0.3)
		(m as StandardMaterial3D).emission_energy_multiplier = 2.0
	if _player == null:
		return
	var pp := _player.global_position
	match phase:
		Ph.HOVER:
			# Oval patrol over the arena, tilting into the motion.
			var a := _t * 0.9
			var target := _origin + _right * (sin(a) * 14.0) + _fwd * (cos(a * 0.5) * 6.0) + Vector3(0, 6.5 + sin(_t * 1.7) * 0.8, 0)
			global_position = global_position.lerp(target, 1.0 - exp(-2.5 * dt))
			_pod.rotation.z = -cos(a) * 0.25
			_pod.rotation.x = 0.0
			_set_ball(maxf(_ball_len - 6.0 * dt, 0.0))
			if hp <= 4 and fmod(_phase_t, 7.0) > 6.0 and _ball_len <= 0.0 and _phase_t > 2.0:
				phase = Ph.BALL
				_phase_t = 0.0
			elif _phase_t > (5.0 if hp > 4 else 3.5):
				phase = Ph.SWOOP
				_phase_t = 0.0
				_swoop_from = global_position
				var to := pp + Vector3(0, 1.6, 0)
				var d := to - global_position
				_swoop_to = global_position + d + Vector3(d.x, 0, d.z).normalized() * 10.0
		Ph.SWOOP:
			# Dive through Sonic's position and climb out the other side.
			var u := clampf(_phase_t / 1.6, 0.0, 1.0)
			var arc := sin(u * PI)
			var p := _swoop_from.lerp(_swoop_to, smoothstep(0.0, 1.0, u))
			p.y = lerpf(_swoop_from.y, _swoop_to.y, u) - arc * (_swoop_from.y - 1.7)
			global_position = p
			_pod.rotation.x = lerpf(0.5, -0.5, u)
			if u >= 1.0:
				phase = Ph.HOVER
				_phase_t = 0.0
				_hover_seed = _t
		Ph.BALL:
			# Drop to head height and swing the wrecking ball around.
			var target := _origin + Vector3(0, 3.6, 0)
			global_position = global_position.lerp(target, 1.0 - exp(-2.0 * dt))
			_ball_ang += dt * 3.2
			_set_ball(minf(_ball_len + 5.0 * dt, 7.0))
			_pod.rotation.z = sin(_ball_ang) * 0.12
			_pod.rotation.x = cos(_ball_ang) * 0.12
			if _phase_t > 6.0:
				phase = Ph.HOVER
				_phase_t = 0.0
		Ph.HIT:
			# Knocked up and back, then resume.
			global_position += Vector3(0, 6.0 * dt, 0) - _fwd * 3.0 * dt
			_pod.rotation.z = sin(_phase_t * 25.0) * 0.3
			_set_ball(maxf(_ball_len - 8.0 * dt, 0.0))
			if _phase_t > 0.8:
				phase = Ph.HOVER
				_phase_t = 0.0
		Ph.DEAD:
			# Smoke, wobble, fall to the sand, then Eggman limps away skyward.
			_dead_t += dt
			var lvl := get_tree().get_first_node_in_group("level")
			if fmod(_dead_t, 0.3) < dt and _dead_t < 2.5 and lvl and lvl.has_method("enemy_pop"):
				lvl.call("enemy_pop", global_position + Vector3(randf_range(-2, 2), randf_range(-1, 2), randf_range(-2, 2)))
			if _dead_t < 2.5:
				global_position += Vector3(0, -2.0 * dt, 0)
				_pod.rotation.z = sin(_dead_t * 20.0) * 0.4
			else:
				global_position += (Vector3(0, 14.0, 0) + _fwd * 22.0) * dt
				_pod.rotation.z = sin(_dead_t * 6.0) * 0.3
				_pod.rotation.x = -0.4
			if _dead_t > 8.0:
				queue_free()
		_:
			pass
	# Face the player loosely.
	var look := pp - global_position
	look.y = 0.0
	if look.length() > 0.5 and phase != Ph.DEAD:
		var yaw := atan2(-look.x, -look.z)
		_pod.rotation.y = lerp_angle(_pod.rotation.y, yaw, 1.0 - exp(-3.0 * dt))
