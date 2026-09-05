# Sonic, built entirely from code: cobalt quills, connected eyes, tan muzzle
# and torso, white gloves with cuffs, oversized red shoes with the white
# strap and gold buckle. The rig is a plain Node3D hierarchy of pivots
# (hips, head, shoulders, elbows, hips, knees, ankles, quill root) and every
# animation is procedural: pose targets are computed each frame from the
# player's state and blended with per-joint smoothing, so jog flows into the
# forward-leaning sprint, then into the figure-8 leg blur at boost speed.
class_name SonicModel
extends Node3D

const BLUE := Color(0.10, 0.32, 0.92)
const BLUE_DARK := Color(0.06, 0.20, 0.70)
const TAN := Color(0.96, 0.80, 0.58)
const WHITE := Color(0.97, 0.97, 0.97)
const RED := Color(0.90, 0.10, 0.10)
const GREEN := Color(0.15, 0.65, 0.20)
const BLACK := Color(0.03, 0.03, 0.04)
const GOLD := Color(1.0, 0.82, 0.25)

const HIP_Y := 0.46
const HEAD_Y := 0.82

var body: Node3D
var head: Node3D
var quills: Node3D
var shoulder := {}
var elbow := {}
var hip := {}
var knee := {}
var ankle := {}
var ball: Node3D
var blur: MeshInstance3D
var figure: Node3D
var aura: MeshInstance3D
var _limbs: Array = []

# Animation state.
var _run_phase := 0.0
var _ball_spin := 0.0
var _cur := {}       # joint -> Vector3 rotation (current)
var _body_off := Vector3.ZERO
var _body_scale := Vector3.ONE
var _squash := 0.0
var _stretch := 0.0
var _blink_t := 2.0
var _blink := 0.0
var _idle_t := 0.0
var _eyelids: Array = []
var _last_state := ""


func _ready() -> void:
	_build()


func _pivot(parent: Node3D, pname: String, world_pos: Vector3) -> Node3D:
	var p := Node3D.new()
	p.name = pname
	var parent_world: Vector3 = parent.get_meta("wpos", Vector3.ZERO)
	p.position = world_pos - parent_world
	p.set_meta("wpos", world_pos)
	parent.add_child(p)
	_cur[pname] = Vector3.ZERO
	return p


func _attach(parent: Node3D, b: MeshLib.Builder, mat: Material, mname: String) -> MeshInstance3D:
	var mi := b.commit(mat, mname)
	var parent_world: Vector3 = parent.get_meta("wpos", Vector3.ZERO)
	mi.position = -parent_world
	parent.add_child(mi)
	_limbs.append(mi)
	return mi


func _build() -> void:
	set_meta("wpos", Vector3.ZERO)
	var blue := Mats.skin(BLUE, 0.42, 0.4)
	var tan := Mats.skin(TAN, 0.55, 0.2)
	var white := Mats.skin(WHITE, 0.5, 0.2)
	var red := Mats.skin(RED, 0.35, 0.3)
	var black := Mats.pbr(BLACK, 0.3, 0.0, 0.6)
	var green := Mats.pbr(GREEN, 0.25, 0.0, 0.7)
	var gold := Mats.pbr(GOLD, 0.3, 0.8, 0.8)
	var eye_white := Mats.pbr(WHITE, 0.25, 0.0, 0.7)

	body = _pivot(self, "Body", Vector3(0, HIP_Y, 0))

	# Torso: blue ball with the tan belly patch and two small back quills.
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 0.62, 0), Vector3(0.235, 0.245, 0.235), 18, 14)
	b.spike(Vector3(0, 0.70, 0.16), Vector3(0, 0.62, 0.50), 0.075, 8, 5, Vector3(0, -0.02, 0))
	b.spike(Vector3(0, 0.57, 0.17), Vector3(0, 0.40, 0.44), 0.07, 8, 5, Vector3(0, -0.02, 0))
	_attach(body, b, blue, "Torso")
	b = MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 0.585, -0.095), Vector3(0.165, 0.195, 0.16), 16, 12)
	_attach(body, b, tan, "Belly")

	# Head.
	head = _pivot(body, "Head", Vector3(0, HEAD_Y, 0))
	b = MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 1.0, 0.0), Vector3(0.36, 0.345, 0.36), 24, 18)
	# Ears: outer blue cones.
	for s in [-1.0, 1.0]:
		var ear_base := Vector3(0.20 * s, 1.26, 0.04)
		var ear_tip := ear_base + Vector3(0.09 * s, 0.19, -0.02)
		b.spike(ear_base, ear_tip, 0.075, 10, 3)
	_attach(head, b, blue, "HeadMesh")
	# Inner ears.
	b = MeshLib.Builder.new()
	for s in [-1.0, 1.0]:
		var ear_base := Vector3(0.20 * s, 1.27, 0.01)
		var ear_tip := ear_base + Vector3(0.075 * s, 0.14, -0.02)
		b.spike(ear_base, ear_tip, 0.04, 8, 3)
	_attach(head, b, tan, "InnerEars")
	# Muzzle.
	b = MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 0.915, -0.235), Vector3(0.235, 0.15, 0.215), 18, 12)
	_attach(head, b, tan, "Muzzle")
	# Connected eyes: two tall white ovals that overlap at the bridge.
	b = MeshLib.Builder.new()
	for s in [-1.0, 1.0]:
		var eb := Basis(Vector3.UP, -0.42 * s) * Basis(Vector3.RIGHT, 0.10)
		b.ellipsoid(Vector3(0.10 * s, 1.07, -0.285), Vector3(0.125, 0.19, 0.115), 16, 12, eb)
	_attach(head, b, eye_white, "Eyes")
	# Irises and pupils, slightly toed-in.
	b = MeshLib.Builder.new()
	for s in [-1.0, 1.0]:
		var eb := Basis(Vector3.UP, -0.42 * s)
		b.ellipsoid(Vector3(0.125 * s, 1.05, -0.385), Vector3(0.055, 0.085, 0.035), 12, 8, eb)
	_attach(head, b, green, "Irises")
	b = MeshLib.Builder.new()
	for s in [-1.0, 1.0]:
		var eb := Basis(Vector3.UP, -0.42 * s)
		b.ellipsoid(Vector3(0.13 * s, 1.045, -0.412), Vector3(0.028, 0.045, 0.02), 10, 6, eb)
		# Catchlight.
		b.ellipsoid(Vector3(0.14 * s, 1.075, -0.425), Vector3(0.011, 0.013, 0.008), 6, 4, eb)
	_attach(head, b, black, "Pupils")
	# Eyelids: blue caps that drop over the eyes for blinks (scaled in Y).
	for s in [-1.0, 1.0]:
		b = MeshLib.Builder.new()
		var eb := Basis(Vector3.UP, -0.42 * s) * Basis(Vector3.RIGHT, 0.10)
		b.ellipsoid(Vector3.ZERO, Vector3(0.132, 0.192, 0.12), 14, 10, eb)
		var lid := b.commit(blue, "Lid")
		lid.position = Vector3(0.10 * s, 1.07, -0.285) - Vector3(0, HEAD_Y, 0)
		lid.scale = Vector3(1, 0.02, 1)
		head.add_child(lid)
		_eyelids.append(lid)
	# Nose.
	b = MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 0.935, -0.46), Vector3(0.05, 0.042, 0.045), 12, 8)
	_attach(head, b, black, "Nose")
	# Mouth: a thin dark smile line under the muzzle.
	b = MeshLib.Builder.new()
	for i in 6:
		var a0 := -0.5 + float(i) / 6.0
		var a1 := -0.5 + float(i + 1) / 6.0
		var p0 := Vector3(a0 * 0.26, 0.845 - abs(a0) * 0.05, -0.40 - (0.06 - abs(a0) * 0.06))
		var p1 := Vector3(a1 * 0.26, 0.845 - abs(a1) * 0.05, -0.40 - (0.06 - abs(a1) * 0.06))
		b.quad(p0 + Vector3(0, 0.012, 0), p1 + Vector3(0, 0.012, 0), p1 - Vector3(0, 0.012, 0), p0 - Vector3(0, 0.012, 0))
	_attach(head, b, black, "Mouth")

	# Quills: six swept-back spikes from the back of the head.
	quills = _pivot(head, "Quills", Vector3(0, 1.08, 0.12))
	b = MeshLib.Builder.new()
	var qdefs := [
		[Vector3(0, 1.22, 0.05), Vector3(0, 1.30, 0.76), 0.15, Vector3(0, -0.06, 0)],
		[Vector3(-0.13, 1.12, 0.12), Vector3(-0.24, 1.02, 0.80), 0.135, Vector3(0, -0.07, 0)],
		[Vector3(0.13, 1.12, 0.12), Vector3(0.24, 1.02, 0.80), 0.135, Vector3(0, -0.07, 0)],
		[Vector3(-0.11, 0.98, 0.18), Vector3(-0.17, 0.72, 0.72), 0.12, Vector3(0, -0.05, 0)],
		[Vector3(0.11, 0.98, 0.18), Vector3(0.17, 0.72, 0.72), 0.12, Vector3(0, -0.05, 0)],
		[Vector3(0, 0.88, 0.2), Vector3(0, 0.52, 0.62), 0.11, Vector3(0, -0.04, 0)],
	]
	for q in qdefs:
		b.spike(q[0], q[1], q[2], 12, 7, q[3], 1.35)
	_attach(quills, b, blue, "QuillMesh")

	# Arms: tan, with white gloves and cuffs.
	for s in [-1.0, 1.0]:
		var key := "L" if s < 0 else "R"
		var sh := _pivot(body, "Shoulder" + key, Vector3(0.235 * s, 0.665, 0))
		shoulder[key] = sh
		var el_pos := Vector3(0.30 * s, 0.48, 0.0)
		b = MeshLib.Builder.new()
		b.cylinder(Vector3(0.22 * s, 0.665, 0), el_pos, 0.05, 0.045, 10)
		b.ellipsoid(el_pos, Vector3(0.048, 0.048, 0.048), 10, 8)
		_attach(sh, b, tan, "UpperArm")
		var el := _pivot(sh, "Elbow" + key, el_pos)
		elbow[key] = el
		var wr_pos := Vector3(0.31 * s, 0.30, 0.0)
		b = MeshLib.Builder.new()
		b.cylinder(el_pos, wr_pos, 0.045, 0.045, 10)
		_attach(el, b, tan, "Forearm")
		b = MeshLib.Builder.new()
		var cuff_b := MeshLib.basis_from_y((wr_pos - el_pos).normalized())
		b.lathe([Vector2(0.06, -0.02), Vector2(0.078, -0.02), Vector2(0.078, 0.05), Vector2(0.06, 0.05)], 12, wr_pos + Vector3(0, 0.02, 0), cuff_b)
		b.ellipsoid(wr_pos - Vector3(0, 0.075, 0), Vector3(0.105, 0.095, 0.11), 14, 10)
		# Thumb bump.
		b.ellipsoid(wr_pos + Vector3(-0.07 * s, -0.06, -0.06), Vector3(0.04, 0.035, 0.05), 8, 6)
		_attach(el, b, white, "Glove")

	# Legs: blue, with the big red shoes.
	for s in [-1.0, 1.0]:
		var key := "L" if s < 0 else "R"
		var hp := _pivot(body, "Hip" + key, Vector3(0.10 * s, HIP_Y, 0))
		hip[key] = hp
		var kn_pos := Vector3(0.115 * s, 0.27, 0.0)
		b = MeshLib.Builder.new()
		b.cylinder(Vector3(0.10 * s, HIP_Y, 0), kn_pos, 0.055, 0.05, 10)
		b.ellipsoid(kn_pos, Vector3(0.05, 0.05, 0.05), 10, 8)
		_attach(hp, b, blue, "Thigh")
		var kn := _pivot(hp, "Knee" + key, kn_pos)
		knee[key] = kn
		var an_pos := Vector3(0.12 * s, 0.11, 0.0)
		b = MeshLib.Builder.new()
		b.cylinder(kn_pos, an_pos, 0.05, 0.048, 10)
		_attach(kn, b, blue, "Shin")
		var an := _pivot(kn, "Ankle" + key, an_pos)
		ankle[key] = an
		# Shoe body.
		b = MeshLib.Builder.new()
		var sc := Vector3(0.12 * s, 0.075, -0.05)
		b.ellipsoid(sc, Vector3(0.115, 0.078, 0.215), 16, 10)
		b.ellipsoid(sc + Vector3(0, -0.005, -0.16), Vector3(0.10, 0.07, 0.08), 12, 8)
		_attach(an, b, red, "Shoe")
		# Sole.
		b = MeshLib.Builder.new()
		b.ellipsoid(sc - Vector3(0, 0.05, 0), Vector3(0.118, 0.028, 0.222), 16, 6)
		_attach(an, b, white, "Sole")
		# Strap: a white band over the instep, plus gold buckle.
		b = MeshLib.Builder.new()
		b.lathe([Vector2(0.118, -0.02), Vector2(0.122, -0.02), Vector2(0.122, 0.04), Vector2(0.118, 0.04)], 18, sc + Vector3(0, 0.0, 0.0), Basis(Vector3.RIGHT, PI * 0.5))
		_attach(an, b, white, "Strap")
		b = MeshLib.Builder.new()
		b.box(sc + Vector3(0, 0.085, 0.0), Vector3(0.07, 0.03, 0.05))
		_attach(an, b, gold, "Buckle")
		# Cuff between shoe and shin (white sock line).
		b = MeshLib.Builder.new()
		b.lathe([Vector2(0.055, 0.0), Vector2(0.068, 0.0), Vector2(0.068, 0.045), Vector2(0.055, 0.045)], 12, an_pos + Vector3(0, 0.005, 0))
		_attach(an, b, white, "Sock")

	# Spin ball: a blue sphere with darker streak bands that spins about X.
	ball = Node3D.new()
	ball.name = "Ball"
	ball.position = Vector3(0, 0.5, 0)
	add_child(ball)
	b = MeshLib.Builder.new()
	b.ellipsoid(Vector3.ZERO, Vector3(0.44, 0.44, 0.44), 20, 14)
	var bm := b.commit(blue, "BallMesh")
	ball.add_child(bm)
	b = MeshLib.Builder.new()
	for i in 5:
		var y := -0.32 + i * 0.16
		var r := sqrt(maxf(0.0, 0.45 * 0.45 - y * y))
		b.lathe([Vector2(r, y - 0.025), Vector2(r + 0.012, y), Vector2(r, y + 0.025)], 24, Vector3.ZERO, Basis(Vector3.FORWARD, PI * 0.5), false)
	var bands := b.commit(Mats.skin(BLUE_DARK, 0.4, 0.3), "Bands")
	ball.add_child(bands)
	# Blur disc: a translucent lighter ring that sells the spin.
	b = MeshLib.Builder.new()
	b.lathe([Vector2(0.30, -0.02), Vector2(0.50, 0.0), Vector2(0.30, 0.02)], 28, Vector3.ZERO, Basis(Vector3.FORWARD, PI * 0.5), false)
	var blur_mat := Mats.unshaded(Color(0.6, 0.85, 1.0, 0.35))
	blur_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	blur = b.commit(blur_mat, "SpinBlur")
	ball.add_child(blur)
	ball.visible = false

	# Figure-8 leg blur for sprinting: two flattened red loops that spin.
	figure = Node3D.new()
	figure.name = "Figure8"
	figure.position = Vector3(0, 0.22, 0)
	add_child(figure)
	b = MeshLib.Builder.new()
	b.lathe([Vector2(0.06, -0.04), Vector2(0.26, 0.0), Vector2(0.06, 0.04)], 20, Vector3(0, 0, 0.02), Basis(Vector3.FORWARD, PI * 0.5), false)
	var fm := Mats.unshaded(Color(0.95, 0.2, 0.15, 0.55))
	fm.cull_mode = BaseMaterial3D.CULL_DISABLED
	var f1 := b.commit(fm, "Loop")
	figure.add_child(f1)
	figure.visible = false

	# Boost aura shell around the body.
	b = MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 0.62, 0), Vector3(0.62, 0.72, 0.68), 18, 12)
	aura = b.commit(Mats.boost_aura(), "Aura")
	aura.visible = false
	add_child(aura)

	for mi in _limbs:
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON


# ---------------------------------------------------------------------------
# Animation

func _joint(name: String, target: Vector3, rate: float, dt: float) -> void:
	var c: Vector3 = _cur[name]
	var k := 1.0 - exp(-rate * dt)
	c = c.lerp(target, k)
	_cur[name] = c
	var n: Node3D = _find(name)
	if n:
		n.rotation = c


func _find(name: String) -> Node3D:
	match name:
		"Body": return body
		"Head": return head
		"Quills": return quills
		"ShoulderL": return shoulder["L"]
		"ShoulderR": return shoulder["R"]
		"ElbowL": return elbow["L"]
		"ElbowR": return elbow["R"]
		"HipL": return hip["L"]
		"HipR": return hip["R"]
		"KneeL": return knee["L"]
		"KneeR": return knee["R"]
		"AnkleL": return ankle["L"]
		"AnkleR": return ankle["R"]
	return null


func trigger_land(strength: float) -> void:
	_squash = clampf(strength, 0.0, 1.0)


func trigger_jump() -> void:
	_stretch = 1.0


# a: {state, speed, max_run, max_boost, boost, turn (-1..1), air_vy, dt,
#     charge (spindash 0..1), ground (bool), lean (extra pitch), balance}
func animate(a: Dictionary) -> void:
	var dt: float = a.get("dt", 0.016)
	var state: String = a.get("state", "idle")
	var speed: float = a.get("speed", 0.0)
	var max_run: float = a.get("max_run", 38.0)
	var boost: bool = a.get("boost", false)
	var turn: float = a.get("turn", 0.0)
	var t := float(Time.get_ticks_msec()) / 1000.0
	var ball_states := ["ball", "roll", "spindash", "homing"]
	var in_ball := state in ball_states
	if state != _last_state:
		_last_state = state

	# Blink.
	_blink_t -= dt
	if _blink_t < 0.0:
		_blink = 1.0
		_blink_t = randf_range(2.0, 5.0)
	_blink = maxf(_blink - dt * 8.0, 0.0)
	var lid_amt := 1.0 if (_blink > 0.5) else 0.02
	if state == "hurt":
		lid_amt = 0.6
	for lid in _eyelids:
		lid.scale.y = lerpf(lid.scale.y, lid_amt, 1.0 - exp(-30.0 * dt))

	# Ball / body swap.
	ball.visible = in_ball
	for mi in _limbs:
		mi.visible = not in_ball
	for lid in _eyelids:
		lid.visible = not in_ball
	if in_ball:
		var spin_rate := clampf(speed, 8.0, 70.0) * 1.6 + 12.0
		_ball_spin += spin_rate * dt
		ball.rotation = Vector3(-_ball_spin, 0, 0)
		blur.scale = Vector3.ONE * (1.0 + 0.15 * sin(t * 40.0))
		var charge: float = a.get("charge", 0.0)
		if state == "spindash":
			ball.rotation = Vector3(-_ball_spin * (1.0 + charge * 2.0), 0, 0)
			ball.position = Vector3(0, 0.46 + sin(t * 60.0) * 0.015 * charge, 0.0)
			ball.scale = Vector3(1.0 + charge * 0.08, 1.0 - charge * 0.06, 1.0 + charge * 0.08)
		else:
			ball.position = Vector3(0, 0.5, 0)
			ball.scale = Vector3.ONE
		aura.visible = false
		figure.visible = false
		return

	# Squash & stretch on the whole body.
	_squash = maxf(_squash - dt * 3.5, 0.0)
	_stretch = maxf(_stretch - dt * 4.0, 0.0)
	var sq := sin(_squash * PI) * 0.22
	var stx := sin(_stretch * PI) * 0.14
	_body_scale = Vector3(1.0 + sq - stx * 0.5, 1.0 - sq + stx, 1.0 + sq - stx * 0.5)

	var run_amt := clampf(speed / 6.0, 0.0, 1.0)
	var sprint := clampf((speed - 12.0) / (max_run - 12.0), 0.0, 1.0)
	var over := clampf((speed - max_run) / 22.0, 0.0, 1.0)

	var tgt := {}
	var body_pos := Vector3.ZERO
	var rate := 14.0
	var aura_on := false
	var figure_on := false

	match state:
		"idle":
			_idle_t += dt
			var breathe := sin(t * 2.2) * 0.012
			body_pos = Vector3(0, breathe, 0)
			tgt["Body"] = Vector3(0.04, 0, 0)
			tgt["Head"] = Vector3(-0.05 + sin(t * 0.7) * 0.05, sin(t * 0.45) * 0.25, 0)
			tgt["Quills"] = Vector3(sin(t * 2.2) * 0.02, 0, 0)
			tgt["ShoulderL"] = Vector3(0.15, 0, 0.35)
			tgt["ShoulderR"] = Vector3(0.15, 0, -0.35)
			tgt["ElbowL"] = Vector3(-0.4, 0, 0.0)
			tgt["ElbowR"] = Vector3(-0.4, 0, 0.0)
			tgt["HipL"] = Vector3(0.0, 0, 0.05)
			tgt["HipR"] = Vector3(0.0, 0, -0.05)
			tgt["KneeL"] = Vector3(0.0, 0, 0)
			tgt["KneeR"] = Vector3(0.0, 0, 0)
			# Impatient foot tap after a while.
			var tap := 0.0
			if _idle_t > 4.0:
				tap = maxf(sin((_idle_t - 4.0) * 9.0), 0.0) * 0.35
			tgt["AnkleL"] = Vector3(-tap, 0, 0)
			tgt["AnkleR"] = Vector3(0, 0, 0)
			rate = 6.0
		"run", "drift":
			_idle_t = 0.0
			# Stride length grows with speed; the phase drives both legs.
			var stride := lerpf(1.1, 2.6, sprint)
			_run_phase += (speed / stride) * TAU * dt / 2.0
			var ph := _run_phase
			var amp := lerpf(0.55, 1.05, sprint)
			var lean := lerpf(0.12, 0.62, sprint) + over * 0.25
			var bob := absf(sin(ph * 2.0)) * lerpf(0.02, 0.05, sprint) * (1.0 - over)
			body_pos = Vector3(0, bob - lerpf(0.0, 0.10, sprint), 0)
			var bank := -turn * lerpf(0.15, 0.45, sprint)
			var drift_amt := 1.0 if state == "drift" else 0.0
			tgt["Body"] = Vector3(lean, -turn * 0.35 * drift_amt, bank)
			tgt["Head"] = Vector3(-lean * 0.8, turn * 0.25 + turn * 0.5 * drift_amt, -bank * 0.3)
			tgt["Quills"] = Vector3(-lerpf(0.05, 0.35, sprint) + sin(ph * 2.0) * 0.05, 0, 0)
			var hl := sin(ph) * amp
			var hr := sin(ph + PI) * amp
			tgt["HipL"] = Vector3(hl - lean * 0.2, 0, 0.03)
			tgt["HipR"] = Vector3(hr - lean * 0.2, 0, -0.03)
			tgt["KneeL"] = Vector3(-maxf(sin(ph + 0.5), 0.0) * amp * 1.4 - 0.1, 0, 0)
			tgt["KneeR"] = Vector3(-maxf(sin(ph + PI + 0.5), 0.0) * amp * 1.4 - 0.1, 0, 0)
			tgt["AnkleL"] = Vector3(maxf(-sin(ph), 0.0) * 0.5, 0, 0)
			tgt["AnkleR"] = Vector3(maxf(-sin(ph + PI), 0.0) * 0.5, 0, 0)
			# Arms: pumping at a jog, swept back and rigid at sprint.
			var pump := (1.0 - sprint * 0.75)
			var back := sprint * 1.9
			tgt["ShoulderL"] = Vector3(sin(ph + PI) * 0.9 * pump + back, 0, 0.25 + sprint * 0.35)
			tgt["ShoulderR"] = Vector3(sin(ph) * 0.9 * pump + back, 0, -0.25 - sprint * 0.35)
			tgt["ElbowL"] = Vector3(-1.4 * pump - 0.5 * sprint, 0, 0.0)
			tgt["ElbowR"] = Vector3(-1.4 * pump - 0.5 * sprint, 0, 0.0)
			if state == "drift":
				tgt["ShoulderL"] = Vector3(0.6, 0, 1.2)
				tgt["ShoulderR"] = Vector3(0.6, 0, -1.2)
			rate = lerpf(16.0, 28.0, sprint)
			aura_on = boost
			figure_on = over > 0.15
		"jump_up", "air", "fall":
			_idle_t = 0.0
			var vy: float = a.get("air_vy", 0.0)
			var fall := clampf(-vy / 20.0, 0.0, 1.0)
			body_pos = Vector3(0, 0.03, 0)
			tgt["Body"] = Vector3(0.25 - fall * 0.35, 0, -turn * 0.25)
			tgt["Head"] = Vector3(-0.25 + fall * 0.15, 0, 0)
			tgt["Quills"] = Vector3(-0.35 + fall * 0.5 + sin(t * 9.0) * 0.04, 0, 0)
			tgt["ShoulderL"] = Vector3(-1.6 + fall * 0.8, 0, 1.3 - fall * 0.6)
			tgt["ShoulderR"] = Vector3(-1.6 + fall * 0.8, 0, -1.3 + fall * 0.6)
			tgt["ElbowL"] = Vector3(-0.5, 0, 0)
			tgt["ElbowR"] = Vector3(-0.5, 0, 0)
			tgt["HipL"] = Vector3(0.5 - fall * 0.2, 0, 0.1)
			tgt["HipR"] = Vector3(-0.5 + fall * 0.9, 0, -0.1)
			tgt["KneeL"] = Vector3(-1.2 + fall * 0.5, 0, 0)
			tgt["KneeR"] = Vector3(-0.6, 0, 0)
			tgt["AnkleL"] = Vector3(0.4, 0, 0)
			tgt["AnkleR"] = Vector3(0.2, 0, 0)
			rate = 9.0
		"spring":
			# Stretched, arms up, legs together.
			body_pos = Vector3(0, 0.08, 0)
			tgt["Body"] = Vector3(-0.15, 0, 0)
			tgt["Head"] = Vector3(-0.3, 0, 0)
			tgt["Quills"] = Vector3(0.45, 0, 0)
			tgt["ShoulderL"] = Vector3(-2.7, 0, 0.4)
			tgt["ShoulderR"] = Vector3(-2.7, 0, -0.4)
			tgt["ElbowL"] = Vector3(-0.2, 0, 0)
			tgt["ElbowR"] = Vector3(-0.2, 0, 0)
			tgt["HipL"] = Vector3(0.1, 0, 0.02)
			tgt["HipR"] = Vector3(0.1, 0, -0.02)
			tgt["KneeL"] = Vector3(-0.15, 0, 0)
			tgt["KneeR"] = Vector3(-0.15, 0, 0)
			tgt["AnkleL"] = Vector3(0.6, 0, 0)
			tgt["AnkleR"] = Vector3(0.6, 0, 0)
			rate = 18.0
		"rail":
			var balance: float = a.get("balance", 0.0)
			var crouch: float = a.get("crouch", 0.0)
			body_pos = Vector3(0, -0.06 - crouch * 0.12, 0)
			tgt["Body"] = Vector3(0.18 + crouch * 0.3, 0.9, balance * 0.3)
			tgt["Head"] = Vector3(-0.15, -0.9, -balance * 0.2)
			tgt["Quills"] = Vector3(-0.15 + sin(t * 14.0) * 0.06, 0, 0)
			tgt["ShoulderL"] = Vector3(-0.2, 0, 1.5 + balance * 0.5)
			tgt["ShoulderR"] = Vector3(-0.2, 0, -1.5 + balance * 0.5)
			tgt["ElbowL"] = Vector3(-0.3, 0, 0)
			tgt["ElbowR"] = Vector3(-0.3, 0, 0)
			tgt["HipL"] = Vector3(-0.35 - crouch * 0.4, 0, 0.1)
			tgt["HipR"] = Vector3(0.45 - crouch * 0.2, 0, -0.1)
			tgt["KneeL"] = Vector3(-0.5 - crouch * 0.6, 0, 0)
			tgt["KneeR"] = Vector3(-0.9 - crouch * 0.6, 0, 0)
			tgt["AnkleL"] = Vector3(0.7, 0, 0)
			tgt["AnkleR"] = Vector3(0.5, 0, 0)
			rate = 12.0
		"hurt":
			body_pos = Vector3(0, 0.05, 0)
			tgt["Body"] = Vector3(-0.5, 0, sin(t * 25.0) * 0.15)
			tgt["Head"] = Vector3(-0.3, 0, 0)
			tgt["Quills"] = Vector3(0.6, 0, 0)
			tgt["ShoulderL"] = Vector3(-2.2, 0, 1.0)
			tgt["ShoulderR"] = Vector3(-2.2, 0, -1.0)
			tgt["ElbowL"] = Vector3(-0.8, 0, 0)
			tgt["ElbowR"] = Vector3(-0.8, 0, 0)
			tgt["HipL"] = Vector3(-0.6, 0, 0.3)
			tgt["HipR"] = Vector3(0.4, 0, -0.3)
			tgt["KneeL"] = Vector3(-0.6, 0, 0)
			tgt["KneeR"] = Vector3(-1.0, 0, 0)
			tgt["AnkleL"] = Vector3(0.3, 0, 0)
			tgt["AnkleR"] = Vector3(0.3, 0, 0)
			rate = 20.0
		"stumble":
			_run_phase += (speed / 1.2) * TAU * dt / 2.0
			var ph := _run_phase
			body_pos = Vector3(0, -0.04, 0)
			tgt["Body"] = Vector3(0.75, sin(t * 18.0) * 0.2, sin(t * 13.0) * 0.2)
			tgt["Head"] = Vector3(-0.4, 0, 0)
			tgt["Quills"] = Vector3(-0.1, 0, 0)
			tgt["ShoulderL"] = Vector3(-1.2 + sin(t * 20.0) * 0.5, 0, 1.4)
			tgt["ShoulderR"] = Vector3(-1.2 - sin(t * 20.0) * 0.5, 0, -1.4)
			tgt["ElbowL"] = Vector3(-0.7, 0, 0)
			tgt["ElbowR"] = Vector3(-0.7, 0, 0)
			tgt["HipL"] = Vector3(sin(ph) * 0.9 - 0.2, 0, 0.1)
			tgt["HipR"] = Vector3(sin(ph + PI) * 0.9 - 0.2, 0, -0.1)
			tgt["KneeL"] = Vector3(-0.8, 0, 0)
			tgt["KneeR"] = Vector3(-0.8, 0, 0)
			tgt["AnkleL"] = Vector3(0.2, 0, 0)
			tgt["AnkleR"] = Vector3(0.2, 0, 0)
			rate = 20.0
		"victory":
			var vt: float = a.get("victory_t", 0.0)
			var wag := sin(vt * 8.0) * 0.35 if vt > 0.6 else 0.0
			body_pos = Vector3(0, 0.0, 0)
			tgt["Body"] = Vector3(-0.08, 0.0, 0.05)
			tgt["Head"] = Vector3(-0.2, 0.3 + wag * 0.3, 0.1)
			tgt["Quills"] = Vector3(0.1, 0, 0)
			tgt["ShoulderL"] = Vector3(0.2, 0, 0.5)
			tgt["ShoulderR"] = Vector3(-2.3, 0, -1.0 + wag)
			tgt["ElbowL"] = Vector3(-0.3, 0, 0)
			tgt["ElbowR"] = Vector3(-1.2, 0, 0)
			tgt["HipL"] = Vector3(0.0, 0, 0.15)
			tgt["HipR"] = Vector3(-0.3, 0, -0.1)
			tgt["KneeL"] = Vector3(0.0, 0, 0)
			tgt["KneeR"] = Vector3(-0.2, 0, 0)
			tgt["AnkleL"] = Vector3(0, 0, 0)
			tgt["AnkleR"] = Vector3(0, 0, 0)
			rate = 10.0
		_:
			pass

	for k in tgt:
		_joint(k, tgt[k], rate, dt)
	_body_off = _body_off.lerp(body_pos, 1.0 - exp(-rate * dt))
	body.position = Vector3(0, HIP_Y, 0) + _body_off
	body.scale = _body_scale
	aura.visible = aura_on
	if aura_on:
		aura.scale = Vector3.ONE * (1.0 + 0.06 * sin(t * 30.0))
	# Figure-8 blur replaces the legs above running speed.
	if figure_on:
		figure.visible = true
		figure.rotation = Vector3(-t * 60.0, 0, 0)
		figure.scale = Vector3(1, 1, 1.0 + over * 0.6)
		var leg_alpha := 1.0 - clampf((over - 0.15) / 0.35, 0.0, 1.0)
		for key in ["L", "R"]:
			hip[key].visible = leg_alpha > 0.05
	else:
		figure.visible = false
		for key in ["L", "R"]:
			hip[key].visible = true
