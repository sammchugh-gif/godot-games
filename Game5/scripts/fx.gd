# Speed presentation: screen-space speed lines, wind-trail ribbons, dust and
# grass kicked up from the ground, boost streaks and debris, drift skids,
# rail sparks, landing puffs and the spin-dash cloud. All CPU particles and
# ImmediateMesh ribbons so they run on the Compatibility renderer too.
class_name Fx
extends Node3D

var player: Player
var cam: CameraRig
var _lines: ColorRect
var _lines_mat: ShaderMaterial
var _dust: CPUParticles3D
var _boost: CPUParticles3D
var _debris: CPUParticles3D
var _drift: CPUParticles3D
var _sparks: CPUParticles3D
var _charge: CPUParticles3D
var _trails: Array = []
var _trail_hist: Array = []
var _intensity := 0.0
var _puff_t := 0.0
var _trail_active := false


func setup(p: Player, c: CameraRig) -> void:
	player = p
	cam = c
	# Speed lines overlay.
	var layer := CanvasLayer.new()
	layer.layer = 5
	add_child(layer)
	_lines = ColorRect.new()
	_lines.set_anchors_preset(Control.PRESET_FULL_RECT)
	_lines.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_lines_mat = ShaderMaterial.new()
	_lines_mat.shader = load("res://shaders/speedlines.gdshader")
	_lines_mat.set_shader_parameter("noise_tex", Mats.noise())
	_lines_mat.set_shader_parameter("intensity", 0.0)
	_lines.material = _lines_mat
	layer.add_child(_lines)

	_dust = _particles(Quality.scale(40, 20), 0.7, Color(0.9, 0.82, 0.62, 0.55), 0.7, false)
	_dust.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	_dust.emission_sphere_radius = 0.35
	_dust.gravity = Vector3(0, 1.2, 0)
	_dust.spread = 40.0
	_dust.scale_amount_min = 0.6
	_dust.scale_amount_max = 1.8
	_dust.color_ramp = Props._ramp([Color(1, 1, 1, 0.7), Color(1, 1, 1, 0.35), Color(1, 1, 1, 0)])

	_boost = _particles(Quality.scale(60, 30), 0.45, Color(0.45, 0.75, 1.0, 1.0), 0.6, true)
	_boost.spread = 18.0
	_boost.initial_velocity_min = 8.0
	_boost.initial_velocity_max = 14.0
	_boost.gravity = Vector3.ZERO
	_boost.scale_amount_min = 0.4
	_boost.scale_amount_max = 1.2
	_boost.color_ramp = Props._ramp([Color(1, 1, 1, 1), Color(0.6, 0.85, 1, 0.6), Color(0.3, 0.5, 1, 0)])

	_debris = CPUParticles3D.new()
	_debris.amount = Quality.scale(24, 10)
	_debris.lifetime = 1.1
	_debris.emitting = false
	var bm := BoxMesh.new()
	bm.size = Vector3(0.12, 0.05, 0.2)
	_debris.mesh = bm
	_debris.material_override = Mats.pbr(Color(0.35, 0.55, 0.2), 0.8)
	_debris.spread = 50.0
	_debris.direction = Vector3(0, 1, 0)
	_debris.initial_velocity_min = 5.0
	_debris.initial_velocity_max = 11.0
	_debris.gravity = Vector3(0, -22.0, 0)
	_debris.angular_velocity_min = -600.0
	_debris.angular_velocity_max = 600.0
	_debris.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	_debris.emission_sphere_radius = 1.2
	add_child(_debris)

	_drift = _particles(Quality.scale(50, 25), 0.9, Color(0.95, 0.9, 0.8, 0.5), 1.2, false)
	_drift.spread = 60.0
	_drift.gravity = Vector3(0, 1.5, 0)
	_drift.initial_velocity_min = 2.0
	_drift.initial_velocity_max = 5.0
	_drift.scale_amount_min = 0.8
	_drift.scale_amount_max = 2.2
	_drift.color_ramp = Props._ramp([Color(1, 1, 1, 0.6), Color(1, 1, 1, 0.3), Color(1, 1, 1, 0)])

	_sparks = _particles(Quality.scale(50, 24), 0.35, Color(1.0, 0.75, 0.3, 1.0), 0.18, true)
	_sparks.spread = 35.0
	_sparks.initial_velocity_min = 5.0
	_sparks.initial_velocity_max = 12.0
	_sparks.gravity = Vector3(0, -20.0, 0)
	_sparks.scale_amount_min = 0.5
	_sparks.scale_amount_max = 1.0

	_charge = _particles(Quality.scale(30, 14), 0.4, Color(0.9, 0.85, 0.7, 0.7), 0.6, false)
	_charge.spread = 30.0
	_charge.direction = Vector3(0, 0.3, 1)
	_charge.initial_velocity_min = 3.0
	_charge.initial_velocity_max = 7.0
	_charge.gravity = Vector3(0, 0.5, 0)
	_charge.scale_amount_min = 0.8
	_charge.scale_amount_max = 1.6
	_charge.color_ramp = Props._ramp([Color(1, 1, 1, 0.8), Color(1, 1, 1, 0.3), Color(1, 1, 1, 0)])

	# Wind trail ribbons: two ImmediateMeshes fed from a position history.
	for i in 2:
		var mi := MeshInstance3D.new()
		mi.mesh = ImmediateMesh.new()
		mi.material_override = Mats.trail(Color(0.55, 0.85, 1.0))
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		mi.top_level = true
		add_child(mi)
		_trails.append(mi)
		_trail_hist.append([])

	player.landed.connect(_on_land)
	player.jumped.connect(func(): _puff(0.5))
	player.spindash_released.connect(func(pw): _puff(0.6 + pw))
	player.took_hit.connect(func(): cam.shake(1.2))
	player.homing_hit.connect(func(_t): cam.shake(0.5))


func _particles(n: int, life: float, color: Color, size: float, additive: bool) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = n
	p.lifetime = life
	p.emitting = false
	p.mesh = QuadMesh.new()
	(p.mesh as QuadMesh).size = Vector2(size, size)
	p.material_override = Mats.particle_mat(color, additive)
	p.direction = Vector3.UP
	p.initial_velocity_min = 1.0
	p.initial_velocity_max = 3.0
	add_child(p)
	return p


func _puff(strength: float) -> void:
	# A one-shot cloud from the same emitter: burst a few frames of dust.
	_dust.global_position = player.global_position - player.gnorm * 0.4
	_dust.direction = player.gnorm
	_dust.initial_velocity_min = 2.0 + 3.0 * strength
	_dust.initial_velocity_max = 4.0 + 6.0 * strength
	if not _dust.emitting:
		_dust.amount = Quality.scale(36, 16)
		_dust.emitting = true
	_puff_t = 0.12


func _on_land(strength: float) -> void:
	_puff(0.6 + strength)
	cam.shake(strength * 0.6)


func _process(dt: float) -> void:
	if not player:
		return
	var spd := player.visual_speed()
	_puff_t = maxf(_puff_t - dt, 0.0)
	var grounded := player.st == Player.St.GROUND
	var onrail := player.st == Player.St.RAIL
	var p := player.global_position
	var back := -player.heading

	# Speed lines: only near boost speed, so plain running stays clean.
	var want := smoothstep(46.0, 68.0, spd) * 0.6
	if player.boosting:
		want = maxf(want, 0.45)
	if player.st == Player.St.HOMING:
		want = maxf(want, 0.5)
	_intensity = lerpf(_intensity, want, 1.0 - exp(-6.0 * dt))
	_lines_mat.set_shader_parameter("intensity", _intensity)
	_lines_mat.set_shader_parameter("boost", 1.0 if player.boosting else 0.0)

	# Ground dust: colour by surface.
	var dust_on := grounded and spd > 9.0 and player.st != Player.St.VICTORY
	if dust_on:
		if not _dust.emitting:
			_dust.amount = Quality.scale(36, 16)
			_dust.emitting = true
		_dust.global_position = p - player.gnorm * 0.4
		_dust.direction = back + player.gnorm * 0.4
		_dust.initial_velocity_min = spd * 0.08
		_dust.initial_velocity_max = spd * 0.2
		var mat := _dust.material_override as StandardMaterial3D
		match player.ground_kind:
			"grass":
				mat.albedo_color = Color(0.55, 0.8, 0.35, 0.5)
			"wood":
				mat.albedo_color = Color(0.7, 0.55, 0.35, 0.5)
			_:
				mat.albedo_color = Color(0.92, 0.84, 0.64, 0.55)
	elif not dust_on and _dust.emitting and _puff_t <= 0.0:
		_dust.emitting = false

	# Boost streaks + debris.
	_boost.emitting = player.boosting
	if player.boosting:
		_boost.global_position = p + back * 0.6
		_boost.direction = back
	var deb := player.boosting and grounded
	if deb != _debris.emitting:
		_debris.emitting = deb
	if deb:
		_debris.global_position = p - Vector3(0, 0.3, 0)
		_debris.direction = back * 0.6 + Vector3.UP
		var dm := _debris.material_override as StandardMaterial3D
		dm.albedo_color = Color(0.35, 0.55, 0.2) if player.ground_kind == "grass" else Color(0.7, 0.55, 0.35)

	# Drift skid.
	_drift.emitting = player.drifting and grounded
	if _drift.emitting:
		var right := player.heading.cross(player.gnorm).normalized()
		_drift.global_position = p - player.gnorm * 0.4 + right * (player.drift_side * 0.4)
		_drift.direction = back * 0.7 + right * player.drift_side * 0.6

	# Rail sparks.
	_sparks.emitting = onrail and spd > 6.0
	if _sparks.emitting:
		_sparks.global_position = p - Vector3(0, 0.45, 0)
		_sparks.direction = back * 0.8 + Vector3.UP * 0.3
		_sparks.initial_velocity_max = 6.0 + spd * 0.15

	# Spin dash cloud.
	_charge.emitting = player.spindash
	if player.spindash:
		_charge.global_position = p - player.gnorm * 0.35
		_charge.direction = back
		_charge.initial_velocity_max = 4.0 + player.charge * 10.0

	# Wind trails: boost speed only, with hysteresis so they do not flicker
	# around the threshold.
	if _trail_active:
		if (spd < 46.0 and not player.boosting) or player.st == Player.St.VICTORY:
			_trail_active = false
	elif (spd > 54.0 or player.boosting) and player.st != Player.St.VICTORY:
		_trail_active = true
	var trail_on := _trail_active
	var basis := player.model_basis
	for i in 2:
		var hist: Array = _trail_hist[i]
		var side := -1.0 if i == 0 else 1.0
		var anchor := p + basis.x * (side * 0.45) + basis.y * 0.15 - basis.z * -0.1
		if trail_on:
			hist.push_front(anchor)
			if hist.size() > 16:
				hist.pop_back()
		else:
			if hist.size() > 0:
				hist.pop_back()
			if hist.size() > 0:
				hist.pop_back()
		_draw_trail(i, hist, clampf((spd - 44.0) / 24.0, 0.25, 1.0) if trail_on else 0.4)


func _draw_trail(i: int, hist: Array, strength: float) -> void:
	var mi: MeshInstance3D = _trails[i]
	var im := mi.mesh as ImmediateMesh
	im.clear_surfaces()
	if hist.size() < 3:
		mi.visible = false
		return
	mi.visible = true
	(mi.material_override as ShaderMaterial).set_shader_parameter("strength", strength)
	im.surface_begin(Mesh.PRIMITIVE_TRIANGLE_STRIP)
	var cam_pos := cam.global_position
	for k in hist.size():
		var a: Vector3 = hist[k]
		var b: Vector3 = hist[min(k + 1, hist.size() - 1)]
		var t := float(k) / (hist.size() - 1)
		var dir := (b - a)
		if dir.length_squared() < 1e-6:
			dir = Vector3.FORWARD
		var to_cam := (cam_pos - a).normalized()
		var side := dir.normalized().cross(to_cam).normalized() * (0.07 + 0.16 * (1.0 - t))
		im.surface_set_uv(Vector2(0.0, t))
		im.surface_add_vertex(a - side)
		im.surface_set_uv(Vector2(1.0, t))
		im.surface_add_vertex(a + side)
	im.surface_end()
