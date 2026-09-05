# One racer, player or AI. Simulated in track space (see Track): s along
# the lap, x across (+ right), h above the surface. Arcade anti-gravity
# handling: instant heading response, centrifugal slide on bends that you
# steer against, airbrakes for tight turns, walls that scrape or bounce,
# hover suspension that can go light over crests.
class_name Ship
extends Node3D

enum Weapon { NONE, ROCKETS, MISSILE, MINES, SHIELD, TURBO }

signal fired(ship: Ship, weapon: int)
signal wall_hit(ship: Ship, impact: float)
signal landed(ship: Ship, impact: float)
signal pad_taken(ship: Ship, kind: String)
signal lap_done(ship: Ship)
signal damaged(ship: Ship, amount: float)

const HOVER := 1.0
const WEAPON_NAMES := ["", "ROCKETS", "MISSILE", "MINES", "SHIELD", "TURBO"]

var track: Track
var team: Dictionary
var index := 0
var is_player := false
var team_name := ""

# Track-space state.
var s := 0.0
var x := 0.0
var h := HOVER
var v := 0.0
var slide := 0.0
var yaw := 0.0
var h_vel := 0.0
var lap := 0
var progress := 0.0
var finished := false
var finish_time := 0.0
var lap_times: Array = []
var lap_start := 0.0
var best_lap := 0.0
var energy := 100.0
var weapon := Weapon.NONE
var ammo := 0
var shield_t := 0.0
var boost_t := 0.0
var spin_t := 0.0
var spin_dir := 1.0
var spin_angle := 0.0
var hit_flash := 0.0
var hit_cool := 0.0
var airborne := false
var scraping := false
var scrape_side := 0.0
var controls_locked := true
var last_pad: Dictionary = {}
var pad_cool := 0.0
var pickups := 0
var wall_hits := 0

# Stats.
var max_speed := 70.0
var accel := 28.0
var turn_rate := 2.4
var half_w := 1.75
var shield_mult := 1.0

# AI.
var ai_skill := 0.8
var ai_lane := 0.0
var ai_lane_t := 0.0
var ai_fire_t := 4.0
var rubber := 1.0

# Inputs for this frame.
var in_steer := 0.0
var in_brake := 0.0
var in_thrust := 1.0
var in_fire := false

# Visuals.
var model: Node3D
var roll_v := 0.0
var pitch_v := 0.0
var _sparks: CPUParticles3D
var _flames_l: Array = []
var _flames_r: Array = []
var _shadow: MeshInstance3D
var _shield_mesh: MeshInstance3D
var _trail_l := PackedVector3Array()
var _trail_r := PackedVector3Array()
var _trail_mesh: ImmediateMesh
var _trail_mi: MeshInstance3D
var _trail_t := 0.0
var _clock := 0.0
var _flash_mats: Array = []


func setup(tr: Track, tm: Dictionary, idx: int, player: bool) -> void:
	track = tr
	team = tm
	index = idx
	is_player = player
	team_name = tm["name"]
	name = "Ship_" + team_name
	max_speed = 64.0 + 14.0 * float(tm["speed"])
	accel = 24.0 + 12.0 * float(tm["thrust"])
	turn_rate = 2.0 + 1.3 * float(tm["handling"])
	shield_mult = 0.7 + 0.5 * float(tm["shield"])
	model = ShipModel.build(tm)
	add_child(model)
	_flames_l = model.get_meta("flame_l")
	_flames_r = model.get_meta("flame_r")
	_shadow = model.get_meta("shadow")
	_shadow.get_parent().remove_child(_shadow)
	add_child(_shadow)
	_build_effects()


func _build_effects() -> void:
	_sparks = CPUParticles3D.new()
	_sparks.emitting = false
	_sparks.one_shot = true
	_sparks.amount = 28 if not Quality.lightweight() else 18
	_sparks.lifetime = 0.4
	_sparks.explosiveness = 0.9
	_sparks.direction = Vector3(0, 0.6, 1)
	_sparks.spread = 45.0
	_sparks.initial_velocity_min = 9.0
	_sparks.initial_velocity_max = 20.0
	_sparks.gravity = Vector3(0, -25, 0)
	_sparks.scale_amount_min = 0.5
	_sparks.scale_amount_max = 1.2
	var qm := QuadMesh.new()
	qm.size = Vector2(0.35, 0.35)
	_sparks.mesh = qm
	_sparks.mesh.surface_set_material(0, Mats.sprite("spark", Color(1.0, 0.85, 0.5), true, true))
	model.add_child(_sparks)
	# Shield bubble.
	_shield_mesh = MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 3.2
	sm.height = 4.2
	sm.radial_segments = 20
	sm.rings = 10
	_shield_mesh.mesh = sm
	var shm := Mats.glow(Color(0.4, 0.8, 1.0, 0.35), 1.5, true)
	_shield_mesh.material_override = shm
	_shield_mesh.scale = Vector3(1.0, 0.45, 1.1)
	_shield_mesh.visible = false
	_shield_mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	model.add_child(_shield_mesh)
	# Exhaust trails live in world space.
	_trail_mesh = ImmediateMesh.new()
	_trail_mi = MeshInstance3D.new()
	_trail_mi.mesh = _trail_mesh
	var tm := StandardMaterial3D.new()
	tm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	tm.vertex_color_use_as_albedo = true
	tm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	tm.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	tm.cull_mode = BaseMaterial3D.CULL_DISABLED
	tm.no_depth_test = false
	_trail_mi.material_override = tm
	_trail_mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_trail_mi.top_level = true
	add_child(_trail_mi)


func place_on_grid(slot: Vector2) -> void:
	s = track.wrap_s(slot.x)
	x = slot.y
	h = HOVER
	v = 0.0
	slide = 0.0
	yaw = 0.0
	lap = -1
	progress = s - track.length
	_update_transform(0.0)


# ------------------------------------------------------------------ sim ---

func sim(dt: float, race_time: float, running: bool, ships: Array, player: Ship) -> void:
	_clock += dt
	if (not is_player or finished) and running:
		_ai_think(dt, ships, player)
	if not running:
		in_steer = 0.0
		in_brake = 0.0
		in_thrust = 0.0
		in_fire = false
	elif finished:
		in_thrust = 0.6
		in_fire = false
	var steer := clampf(in_steer, -1.0, 1.0)
	var brake := clampf(in_brake, 0.0, 1.0)
	var thrust := clampf(in_thrust, 0.0, 1.0)
	if spin_t > 0.0:
		steer = 0.0
		thrust = 0.3
		spin_t -= dt
		spin_angle += spin_dir * 11.0 * dt
	else:
		spin_angle = lerpf(spin_angle, roundf(spin_angle / TAU) * TAU, 1.0 - exp(-8.0 * dt))
	var top := max_speed * (1.28 if boost_t > 0.0 else 1.0) * (0.85 if energy <= 0.0 else 1.0) * rubber
	# Heading: immediate arcade response, sharper with the airbrake.
	var max_yaw := 0.5 + 0.35 * brake
	var target_yaw := steer * max_yaw
	yaw = move_toward(yaw, target_yaw, turn_rate * (1.0 + 0.9 * brake) * dt)
	# Speed with linear drag so top speed is reached asymptotically.
	var drag := accel / top
	v += (accel * thrust * cos(yaw) - drag * v) * dt
	if brake > 0.0:
		v -= v * 0.85 * brake * dt
	v = clampf(v, 0.0, top * 1.35)
	# Centrifugal slide on bends; grip pulls it back.
	var k := track.curvature_at(s)
	slide += (-k * v * v * 0.33) * dt
	slide *= exp(-(2.6 + 2.5 * brake) * dt)
	var vx := v * sin(yaw) + slide
	x += vx * dt
	var ds := v * cos(yaw) * dt
	s += ds
	# Walls.
	var lim := track.limit_at(s, half_w)
	scraping = false
	if absf(x) > lim:
		var sg := signf(x)
		x = sg * lim
		var into := vx * sg
		if into > 6.5:
			var loss := clampf(into / 60.0, 0.08, 0.32)
			v *= (1.0 - loss)
			energy = maxf(energy - into * 0.45 / shield_mult, 0.0)
			yaw = -sg * 0.14
			slide = -sg * absf(slide) * 0.35 - sg * 2.0
			hit_flash = maxf(hit_flash, 0.35)
			wall_hits += 1
			wall_hit.emit(self, into)
			_burst_sparks(sg)
		elif into > -0.5:
			scraping = true
			scrape_side = sg
			v *= (1.0 - 0.5 * dt)
			energy = maxf(energy - 3.0 * dt, 0.0)
			if slide * sg > 0.0:
				slide = 0.0
			if yaw * sg > 0.0:
				yaw = move_toward(yaw, -sg * 0.05, 1.5 * dt)
	# Vertical: hover suspension, and lift over crests.
	var vk := track.vcurvature_at(s)
	var acc := clampf(-vk * v * v, -40.0, 22.0)
	if h < 2.4:
		acc += (HOVER - h) * 42.0 - h_vel * 9.0
	else:
		acc -= 30.0
	h_vel += acc * dt
	h += h_vel * dt
	if h < 0.3:
		h = 0.3
		if h_vel < -5.0:
			landed.emit(self, -h_vel)
			v *= 0.94
		h_vel = 0.0
	airborne = h > 2.0
	# Laps.
	if s >= track.length:
		s -= track.length
		lap += 1
		if lap > 0 and running:
			var lt := race_time - lap_start
			lap_times.append(lt)
			if best_lap <= 0.0 or lt < best_lap:
				best_lap = lt
			lap_start = race_time
			lap_done.emit(self)
	elif s < 0.0:
		s += track.length
		lap -= 1
	progress = lap * track.length + s
	# Pads.
	pad_cool = maxf(pad_cool - dt, 0.0)
	var p := track.pad_at(s, x)
	if not p.is_empty() and h < 2.0 and pad_cool <= 0.0:
		if p["type"] == "boost":
			boost_t = 1.7
			v = maxf(v, top * 1.02) + 6.0
			pad_cool = 2.5
			pad_taken.emit(self, "boost")
		elif weapon == Weapon.NONE:
			_give_random_weapon()
			pickups += 1
			pad_cool = 1.5
			pad_taken.emit(self, "weapon")
	# Timers.
	shield_t = maxf(shield_t - dt, 0.0)
	boost_t = maxf(boost_t - dt, 0.0)
	hit_flash = maxf(hit_flash - dt, 0.0)
	hit_cool = maxf(hit_cool - dt, 0.0)
	energy = minf(energy + 1.6 * dt, 100.0)
	# Fire.
	if in_fire and weapon != Weapon.NONE and running and not finished and spin_t <= 0.0:
		_fire()
	in_fire = false
	_update_transform(dt)


func _give_random_weapon() -> void:
	var roll := randf()
	if roll < 0.28:
		weapon = Weapon.ROCKETS; ammo = 3
	elif roll < 0.5:
		weapon = Weapon.MISSILE; ammo = 1
	elif roll < 0.68:
		weapon = Weapon.MINES; ammo = 3
	elif roll < 0.84:
		weapon = Weapon.SHIELD; ammo = 1
	else:
		weapon = Weapon.TURBO; ammo = 1


func _fire() -> void:
	var w := weapon
	match w:
		Weapon.SHIELD:
			shield_t = 7.0
			weapon = Weapon.NONE
		Weapon.TURBO:
			boost_t = 2.4
			v = maxf(v, max_speed * 1.1) + 12.0
			weapon = Weapon.NONE
		_:
			ammo -= 1
			if ammo <= 0:
				weapon = Weapon.NONE
	fired.emit(self, w)


func weapon_name() -> String:
	if weapon == Weapon.NONE:
		return ""
	var nm: String = WEAPON_NAMES[weapon]
	if ammo > 1:
		nm += " x%d" % ammo
	return nm


# Returns true when the hit landed (not shielded).
func hit(dmg: float, dir: float = 1.0, spin: bool = true) -> bool:
	if shield_t > 0.0 or hit_cool > 0.0:
		return false
	hit_cool = 4.0
	energy = maxf(energy - dmg / shield_mult, 0.0)
	v *= 0.62
	if spin:
		spin_t = 0.75
		spin_dir = dir
	hit_flash = 0.5
	damaged.emit(self, dmg)
	return true


func speed_kmh() -> int:
	return int(v * 3.6 * 1.9)


# ------------------------------------------------------------------- ai ---

func _ai_think(dt: float, ships: Array, player: Ship) -> void:
	ai_lane_t -= dt
	if ai_lane_t <= 0.0:
		ai_lane_t = randf_range(3.0, 7.0)
		ai_lane = randf_range(-4.0, 4.0)
	var look := 22.0 + v * 0.55
	var k1 := track.curvature_at(s + look)
	var k2 := track.curvature_at(s + look * 2.0)
	var lim := track.limit_at(s + look, half_w) * 0.82
	var target_x := clampf((k1 * 1.2 + k2 * 0.6) * 700.0, -lim, lim) + ai_lane
	target_x = clampf(target_x, -lim, lim)
	# Avoid the ship directly ahead.
	var brake := 0.0
	for o in ships:
		if o == self:
			continue
		var d := track.wrap_s(o.s - s)
		if d > track.length * 0.5:
			d -= track.length
		if d > 0.0 and d < 16.0 + v * 0.1 and absf(o.x - x) < 3.6:
			var away := 1.0 if x >= o.x else -1.0
			target_x = clampf(o.x + away * 5.0, -lim, lim)
			if d < 7.0 and o.v < v:
				brake = 0.5
	var vx := v * sin(yaw) + slide
	var steer := clampf((target_x - x) * 0.11 - vx * 0.05, -1.0, 1.0)
	# Airbrake for corners that are too fast.
	var need := absf(k1) * v * v
	if need > 24.0 - 6.0 * ai_skill:
		brake = maxf(brake, clampf((need - 18.0) / 14.0, 0.3, 1.0))
	if absf(x) > lim * 0.95 and absf(vx) > 6.0 and signf(vx) == signf(x):
		brake = maxf(brake, 0.6)
	in_steer = steer
	in_brake = brake
	in_thrust = 1.0
	# Rubber band against the player so races stay close.
	rubber = 0.88 + 0.12 * ai_skill
	if player != null:
		var gap := player.progress - progress
		if gap > 120.0:
			rubber *= 1.09
		elif gap > 40.0:
			rubber *= 1.04
		elif gap < -160.0:
			rubber *= 0.9
		elif gap < -60.0:
			rubber *= 0.95
	# Weapons.
	ai_fire_t -= dt
	if weapon != Weapon.NONE and ai_fire_t <= 0.0:
		var target_ahead := false
		var target_behind := false
		for o in ships:
			if o == self:
				continue
			var d := track.wrap_s(o.s - s)
			if d > track.length * 0.5:
				d -= track.length
			if d > 8.0 and d < 140.0 and absf(o.x - x) < 7.0:
				target_ahead = true
			if d < -4.0 and d > -40.0:
				target_behind = true
		var go := false
		match weapon:
			Weapon.ROCKETS, Weapon.MISSILE:
				go = target_ahead
			Weapon.MINES:
				go = target_behind
			Weapon.SHIELD:
				go = target_behind or randf() < 0.01
			Weapon.TURBO:
				go = absf(k1) < 0.004
		if go:
			in_fire = true
			ai_fire_t = randf_range(2.5, 6.0)


# -------------------------------------------------------------- visuals ---

func _update_transform(dt: float) -> void:
	var steer := clampf(in_steer, -1.0, 1.0)
	var bob := sin(_clock * 3.1 + index * 1.3) * 0.05
	var xf := track.xform(s, x, h + bob)
	var target_roll := -(steer * 0.42 + slide * 0.018)
	var target_pitch := 0.0
	if airborne or h > 1.6:
		target_pitch = clampf(h_vel * 0.05, -0.35, 0.35)
	if boost_t > 0.0:
		target_pitch += 0.05
	if dt > 0.0:
		roll_v = lerpf(roll_v, target_roll, 1.0 - exp(-7.0 * dt))
		pitch_v = lerpf(pitch_v, target_pitch, 1.0 - exp(-5.0 * dt))
	var local := Basis.from_euler(Vector3(pitch_v, -yaw * 0.85 + spin_angle, roll_v))
	transform = Transform3D(xf.basis * local, xf.origin)
	_shadow.global_transform = track.xform(s, x, 0.06)
	_shadow.rotate_object_local(Vector3.RIGHT, -PI * 0.5)
	var sh := clampf(1.0 - (h - 0.3) * 0.25, 0.25, 1.0)
	_shadow.scale = Vector3(sh, sh, sh)
	# Flames.
	var thrust := clampf(in_thrust, 0.0, 1.0)
	var fl := 0.35 + thrust * 0.55 + (1.4 if boost_t > 0.0 else 0.0) + randf() * 0.15
	for f in _flames_l + _flames_r:
		f.scale = Vector3(1.0 + (0.6 if boost_t > 0.0 else 0.0), fl, 1.0)
	_shield_mesh.visible = shield_t > 0.0
	if shield_t > 0.0:
		var pulse := 0.8 + 0.2 * sin(_clock * 14.0)
		_shield_mesh.scale = Vector3(pulse, 0.45 * pulse, 1.1 * pulse)
	if dt > 0.0:
		_update_trail(dt)


func _burst_sparks(side: float) -> void:
	_sparks.position = Vector3(side * 1.9, 0.0, 0.3)
	_sparks.direction = Vector3(-side * 0.5, 0.6, 1.0)
	_sparks.restart()
	_sparks.emitting = true


func spark_scrape() -> void:
	if not _sparks.emitting:
		_burst_sparks(scrape_side)


func _update_trail(dt: float) -> void:
	_trail_t -= dt
	var lp := model.to_global(Vector3(-1.65, 0.02, 2.2))
	var rp := model.to_global(Vector3(1.65, 0.02, 2.2))
	if _trail_t <= 0.0:
		_trail_t = 0.03
		_trail_l.append(lp)
		_trail_r.append(rp)
		var maxn := 14 if not Quality.lightweight() else 10
		while _trail_l.size() > maxn:
			_trail_l.remove_at(0)
			_trail_r.remove_at(0)
	_trail_mesh.clear_surfaces()
	if _trail_l.size() < 2 or v < 4.0:
		return
	var col: Color = team["accent"].lerp(Color.WHITE, 0.3)
	var strength := clampf(v / max_speed, 0.0, 1.2) * (1.2 if boost_t > 0.0 else 0.45)
	var up := global_transform.basis.y
	for pts in [_trail_l, _trail_r]:
		_trail_mesh.surface_begin(Mesh.PRIMITIVE_TRIANGLE_STRIP)
		var cnt: int = pts.size()
		for i in cnt:
			var a: float = float(i) / (cnt - 1)
			var p: Vector3 = pts[i] if i < cnt - 1 else (lp if pts == _trail_l else rp)
			var w: float = 0.06 + 0.16 * a
			var c := Color(col.r, col.g, col.b, a * a * strength * 0.7)
			_trail_mesh.surface_set_color(c)
			_trail_mesh.surface_add_vertex(p + up * w)
			_trail_mesh.surface_set_color(c)
			_trail_mesh.surface_add_vertex(p - up * w)
		_trail_mesh.surface_end()
