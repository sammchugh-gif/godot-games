# Emerald Coast-style tropical level, built entirely in code.
#
# Moments, in order along the route:
#   1. Cliffside opening on a plateau 120 m up, looking down the whole island
#   2. Long downhill with a collapsing rope bridge over a gorge
#   3. Giant loop, then a corkscrew
#   4. Ramp launch onto rails grinding out over the bay (high rail shortcut)
#   5. Airborne homing chain across a gap of Buzz Bombers
#   6. Torch-lit tunnel into a ruined courtyard
#   7. Vertical wall run along a cliff
#   8. Ridge climb and a ramp over a huge waterfall into the lagoon
#   9. Final beach sprint to the goal ring
class_name Level
extends Node3D

signal goal_reached()
signal checkpoint_reached(index: int)

const FWD := Vector3(0, 0, -1)

var track := Track.new()
var terrain := Terrain.new()
var player: Player
var checkpoints: Array = []      # {pos, dir}
var cam_zones: Array = []        # {aabb, mode}
var collapse: Collapse
var sun: DirectionalLight3D
var env: WorldEnvironment
var _bursts: Array = []
var _sfx: Sfx
var rails: Array = []
var stats := {"rings_total": 0}
var _ring_parent: Node3D
var _obj_parent: Node3D


func build(p: Player, sfx: Sfx) -> void:
	player = p
	_sfx = sfx
	add_to_group("level")
	seed(12)
	var pts := _route()
	track.bake(pts)
	_shape_terrain()
	terrain.prepare(track)
	var tnode := Node3D.new()
	tnode.name = "Terrain"
	add_child(tnode)
	terrain.build(tnode)
	Terrain.build_ocean(self, Vector3(-300, 0.0, -850), Vector2(1800, 2600))
	var rnode := Node3D.new()
	rnode.name = "Road"
	add_child(rnode)
	track.build(rnode)
	_sky()
	_obj_parent = Node3D.new()
	_obj_parent.name = "Objects"
	add_child(_obj_parent)
	_ring_parent = Node3D.new()
	_ring_parent.name = "Rings"
	add_child(_ring_parent)
	_set_pieces()
	_objects()
	_vegetation()
	add_child(p)
	respawn(0)


# ---------------------------------------------------------------------------
# Route

func _route() -> Array:
	var P := []
	# 1. Plateau start.
	P.append(Track.cp(Vector3(0, 120, 40), 14))
	P.append(Track.cp(Vector3(0, 120, 0), 14))
	P.append(Track.cp(Vector3(0, 120, -40), 14))
	P.append(Track.cp(Vector3(0, 119, -60), 13))
	# 2. Downhill.
	P.append(Track.cp(Vector3(-4, 114, -90), 13))
	P.append(Track.cp(Vector3(-14, 105, -125), 12))
	P.append(Track.cp(Vector3(-16, 96, -160), 12))
	P.append(Track.cp(Vector3(-6, 86, -195), 12))
	P.append(Track.cp(Vector3(-2, 84.5, -205), 12, "collapse"))
	P.append(Track.cp(Vector3(-2, 82.5, -230), 12, "collapse"))
	P.append(Track.cp(Vector3(-4, 81, -240), 12))
	P.append(Track.cp(Vector3(-16, 70, -275), 12))
	P.append(Track.cp(Vector3(-34, 58, -305), 12))
	P.append(Track.cp(Vector3(-40, 48, -335), 12))
	P.append(Track.cp(Vector3(-40, 41, -360), 12))
	P.append(Track.cp(Vector3(-40, 40, -385), 12))
	# 3. Loop and corkscrew.
	P.append(Track.cp(Vector3(-40, 40, -400), 12))
	P.append_array(Track.loop_points(Vector3(-40, 40, -400), FWD, 14.0, 15.0, 12.0))
	P.append(Track.cp(Vector3(-25, 40, -400), 12))
	P.append(Track.cp(Vector3(-25, 40, -422), 12))
	P.append(Track.cp(Vector3(-25, 40, -440), 12))
	P.append_array(Track.corkscrew_points(Vector3(-25, 40, -440), FWD, 70.0, 5.0, 11.0))
	P.append(Track.cp(Vector3(-25, 40, -510), 12))
	P.append(Track.cp(Vector3(-25, 40, -530), 12))
	# 4. Ramp to the rails.
	P.append(Track.cp(Vector3(-25, 40, -548), 12))
	P.append(Track.cp(Vector3(-25, 42, -556), 12, "ramp", null, 3.0))
	P.append(Track.cp(Vector3(-25, 46, -564), 12, "ramp", null, 3.0))
	P.append(Track.cp(Vector3(-25, 49, -570), 12, "ramp", null, 3.0))
	# (gap: rails)
	P.append(Track.cp(Vector3(-25, 56, -585), 1, "gap"))
	P.append(Track.cp(Vector3(-25, 20, -700), 1, "gap"))
	P.append(Track.cp(Vector3(-96, 25, -854), 1, "gap"))
	# Landing platform.
	P.append(Track.cp(Vector3(-98, 25, -860), 16))
	P.append(Track.cp(Vector3(-102, 25, -878), 15))
	P.append(Track.cp(Vector3(-105, 25.5, -888), 14, "ramp", null, 3.0))
	P.append(Track.cp(Vector3(-106, 26.5, -893), 14, "ramp", null, 3.0))
	# 5. (gap: homing chain)
	P.append(Track.cp(Vector3(-112, 30, -930), 1, "gap"))
	P.append(Track.cp(Vector3(-118, 27, -968), 14))
	P.append(Track.cp(Vector3(-120, 26, -990), 14))
	# 6. Tunnel and ruins.
	P.append(Track.cp(Vector3(-122, 25, -1005), 12, "tunnel"))
	P.append(Track.cp(Vector3(-126, 24, -1030), 12, "tunnel"))
	P.append(Track.cp(Vector3(-136, 22, -1055), 12, "tunnel"))
	P.append(Track.cp(Vector3(-150, 20, -1078), 12, "tunnel"))
	P.append(Track.cp(Vector3(-162, 18, -1095), 13))
	P.append(Track.cp(Vector3(-178, 16, -1112), 18))
	P.append(Track.cp(Vector3(-196, 15, -1130), 18))
	P.append(Track.cp(Vector3(-212, 15, -1142), 14))
	# 7. Wall run.
	P.append(Track.cp(Vector3(-226, 15, -1147), 12))
	P.append_array(Track.wall_points(Vector3(-232, 15, -1147), Vector3(-1, 0, 0), 28.0, 44.0, 9.0, 12.0, -1.0))
	P.append(Track.cp(Vector3(-340, 15, -1147), 12))
	# 8. Ridge and waterfall ramp.
	P.append(Track.cp(Vector3(-352, 16, -1156), 12))
	P.append(Track.cp(Vector3(-364, 20, -1178), 12))
	P.append(Track.cp(Vector3(-372, 26, -1205), 12))
	P.append(Track.cp(Vector3(-372, 34, -1232), 12))
	P.append(Track.cp(Vector3(-372, 42, -1252), 12))
	P.append(Track.cp(Vector3(-372, 45, -1262), 12, "ramp", null, 3.0))
	P.append(Track.cp(Vector3(-372, 49, -1270), 12, "ramp", null, 3.0))
	# (gap: waterfall jump)
	P.append(Track.cp(Vector3(-372, 57, -1286), 1, "gap"))
	P.append(Track.cp(Vector3(-372, 30, -1310), 1, "gap"))
	P.append(Track.cp(Vector3(-372, 3.5, -1322), 1, "gap"))
	P.append(Track.cp(Vector3(-372, 3.5, -1332), 24))
	# 9. Beach sprint.
	P.append(Track.cp(Vector3(-372, 4, -1370), 22))
	P.append(Track.cp(Vector3(-368, 4, -1410), 20))
	P.append(Track.cp(Vector3(-352, 4, -1450), 20))
	P.append(Track.cp(Vector3(-338, 4, -1490), 20))
	P.append(Track.cp(Vector3(-352, 4, -1530), 20))
	P.append(Track.cp(Vector3(-372, 4, -1570), 20))
	P.append(Track.cp(Vector3(-380, 4, -1610), 20))
	P.append(Track.cp(Vector3(-372, 4, -1650), 20))
	P.append(Track.cp(Vector3(-372, 4, -1700), 20))
	P.append(Track.cp(Vector3(-372, 4, -1740), 20))
	P.append(Track.cp(Vector3(-372, 4, -1775), 20))
	return P


func _shape_terrain() -> void:
	var t := terrain
	# Coast line: [z, x] from the start heading -z. West (-x) of it is sea.
	t.coast = [
		[200.0, -170.0], [-300.0, -150.0], [-480.0, -120.0], [-560.0, 40.0], [-840.0, 40.0],
		[-880.0, -150.0], [-960.0, -190.0], [-1000.0, -430.0], [-1260.0, -440.0],
		[-1330.0, -400.0], [-1400.0, -402.0], [-1900.0, -405.0],
	]
	# Gorge under the collapsing bridge.
	t.dig(Vector3(-2, 0, -198), Vector3(-2, 0, -238), 9.0, 60.0, 12.0)
	# Keep the ground clear under the loop and corkscrew.
	t.dig(Vector3(-33, 0, -395), Vector3(-33, 0, -418), 18.0, 38.5, 22.0)
	t.dig(Vector3(-25, 0, -445), Vector3(-25, 0, -505), 12.0, 38.5, 20.0)
	# The bay under the rails.
	t.dig(Vector3(-25, 0, -600), Vector3(-95, 0, -850), 48.0, -12.0, 34.0)
	# Beach under the homing chain.
	t.dig(Vector3(-108, 0, -900), Vector3(-118, 0, -960), 22.0, 4.0, 18.0)
	# Hill the tunnel bores through.
	t.raise(Vector3(-120, 0, -1000), Vector3(-160, 0, -1092), 14.0, 52.0, 14.0)
	# Flat ground under the wall run, the cliff behind it, and the ridge
	# that carries the river to the waterfall lip.
	t.dig(Vector3(-236, 0, -1150), Vector3(-330, 0, -1150), 16.0, 14.5, 8.0)
	t.raise(Vector3(-240, 0, -1198), Vector3(-330, 0, -1198), 10.0, 60.0, 20.0)
	t.raise(Vector3(-330, 0, -1262), Vector3(-420, 0, -1262), 8.0, 46.5, 6.0)
	# Lagoon and its beach: a sheer drop from the lip.
	t.dig(Vector3(-372, 0, -1300), Vector3(-372, 0, -1330), 22.0, -2.5, 6.0)
	# Ruin courtyard: flat.
	t.raise(Vector3(-178, 0, -1112), Vector3(-200, 0, -1132), 20.0, 14.6, 20.0)


# ---------------------------------------------------------------------------
# Sky, sun, environment

func _sky() -> void:
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color(0.16, 0.42, 0.92)
	sky_mat.sky_horizon_color = Color(0.70, 0.86, 0.98)
	sky_mat.sky_curve = 0.12
	sky_mat.ground_bottom_color = Color(0.12, 0.35, 0.55)
	sky_mat.ground_horizon_color = Color(0.70, 0.86, 0.98)
	sky_mat.sun_angle_max = 22.0
	sky_mat.sun_curve = 0.12
	var sky := Sky.new()
	sky.sky_material = sky_mat
	sky.radiance_size = Sky.RADIANCE_SIZE_128 if Quality.lightweight() else Sky.RADIANCE_SIZE_256
	var e := Environment.new()
	e.background_mode = Environment.BG_SKY
	e.sky = sky
	e.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	e.ambient_light_sky_contribution = 1.0
	e.ambient_light_energy = 1.0
	e.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	e.tonemap_mode = Environment.TONE_MAPPER_ACES
	e.tonemap_exposure = 1.0
	e.tonemap_white = 1.6
	e.adjustment_enabled = true
	e.adjustment_saturation = 1.12
	e.adjustment_contrast = 1.03
	e.fog_enabled = true
	e.fog_light_color = Color(0.78, 0.88, 1.0)
	e.fog_light_energy = 1.0
	e.fog_density = 0.0009
	e.fog_aerial_perspective = 0.45
	e.fog_sky_affect = 0.15
	e.fog_height = -20.0
	e.fog_height_density = 0.0
	e.glow_enabled = true
	e.glow_intensity = 0.45
	e.glow_strength = 0.9
	e.glow_bloom = 0.05
	e.glow_hdr_threshold = 1.05
	e.glow_blend_mode = Environment.GLOW_BLEND_MODE_SOFTLIGHT
	e.set_glow_level(2, 0.6)
	e.set_glow_level(4, 0.8)
	if Quality.forward_plus():
		e.ssao_enabled = true
		e.ssao_radius = 1.6
		e.ssao_intensity = 1.8
		e.ssao_power = 1.6
		e.ssao_detail = 0.5
		e.ssil_enabled = false
		e.volumetric_fog_enabled = true
		e.volumetric_fog_density = 0.006
		e.volumetric_fog_albedo = Color(0.85, 0.92, 1.0)
		e.volumetric_fog_emission_energy = 0.0
		e.volumetric_fog_length = 260.0
		e.volumetric_fog_detail_spread = 2.5
		e.volumetric_fog_ambient_inject = 0.3
	env = WorldEnvironment.new()
	env.environment = e
	add_child(env)
	sun = DirectionalLight3D.new()
	sun.light_color = Color(1.0, 0.96, 0.88)
	sun.light_energy = 1.45
	sun.rotation_degrees = Vector3(-48.0, 38.0, 0.0)
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sun.directional_shadow_max_distance = 140.0 if Quality.lightweight() else 260.0
	sun.directional_shadow_split_1 = 0.06
	sun.directional_shadow_split_2 = 0.18
	sun.directional_shadow_split_3 = 0.45
	sun.directional_shadow_blend_splits = true
	sun.directional_shadow_fade_start = 0.85
	sun.shadow_normal_bias = 1.6
	sun.shadow_bias = 0.04
	sun.light_indirect_energy = 1.2
	sun.light_volumetric_fog_energy = 1.0
	add_child(sun)


# ---------------------------------------------------------------------------
# Set pieces

func _s(p: Vector3) -> float:
	return track.dist_of(p)


func _ground_y(x: float, z: float) -> float:
	return terrain.height_at(x, z)


func _set_pieces() -> void:
	var rp := _obj_parent
	# --- 2. Collapsing rope bridge over the gorge.
	collapse = Collapse.new()
	collapse.name = "Bridge"
	rp.add_child(collapse)
	var s0 := _s(Vector3(-2, 84.5, -205))
	var s1 := _s(Vector3(-2, 82.5, -230))
	var i := 0
	var rail_l := []
	var rail_r := []
	var step := 1.5
	var s := s0
	while s <= s1 + 0.01:
		var fr := track.frame_at(s)
		var f: Vector3 = fr["f"]
		var r: Vector3 = fr["r"]
		var u: Vector3 = fr["u"]
		var w: float = fr["w"]
		var plank := Props.plank((fr["p"] as Vector3) - u * 0.16, Basis(r, u, -f), Vector3(w, 0.3, step * 0.96))
		plank.set_meta("tumble", 1.0 if i % 2 == 0 else -1.0)
		collapse.add_piece(plank, 0.55 + i * 0.045)
		rail_l.append((fr["p"] as Vector3) - r * (w * 0.5 - 0.2))
		rail_r.append((fr["p"] as Vector3) + r * (w * 0.5 - 0.2))
		s += step
		i += 1
	Props.rope_rail(rp, rail_l)
	Props.rope_rail(rp, rail_r)
	var bt := Trigger.make(track.pos_at(s0 + 3.0, 0, 1.5), Vector3(14, 5, 3), MeshLib.basis_forward(track.fwd_at(s0)))
	bt.fired.connect(func(_p):
		collapse.trigger()
		_sfx.play("crumble", 0.0, 0.9))
	rp.add_child(bt)
	# Recovery spring at the bottom of the gorge.
	_add(Spring.make(Vector3(-2, _ground_y(-2, -224) + 0.2, -224), Vector3(0, 0.96, -0.28), 52.0))
	_ring_line(Vector3(-2, 61, -218), Vector3(0, 0, -1), 4, 2.0, 1.2)

	# --- 4. Rails over the bay.
	var rail_a := Rail.make([
		Vector3(-25, 52, -585), Vector3(-25, 42, -625), Vector3(-26, 31, -668), Vector3(-31, 22, -708),
		Vector3(-41, 17, -745), Vector3(-56, 15.5, -780), Vector3(-72, 17, -806), Vector3(-84, 21, -826),
		Vector3(-92, 24.5, -841), Vector3(-96, 26.5, -852),
	], true, -14.0)
	_add(rail_a)
	rails.append(rail_a)
	var rail_b := Rail.make([
		Vector3(-38, 63, -556), Vector3(-36, 61, -600), Vector3(-35, 52, -650), Vector3(-41, 38, -700),
		Vector3(-56, 27, -750), Vector3(-76, 24, -800), Vector3(-90, 26.5, -836), Vector3(-93, 28.5, -846),
	], true, -14.0)
	_add(rail_b)
	rails.append(rail_b)
	_rings_on_rail(rail_a, 9.0)
	_rings_on_rail(rail_b, 9.0)
	# Shortcut spring to the high rail, on the left verge before the ramp.
	_add(Spring.make(Vector3(-34, 40.3, -520), Vector3(-0.08, 0.80, -0.59), 40.0))
	# Sea stacks in the bay for scale.
	for st in [[-60.0, -640.0, 22.0], [10.0, -700.0, 30.0], [-130.0, -760.0, 18.0], [-20.0, -790.0, 26.0]]:
		_sea_stack(Vector3(st[0], 0, st[1]), st[2])

	# --- 5. Homing chain over the beach gap.
	var chain := [Vector3(-108, 30, -905), Vector3(-110, 32, -918), Vector3(-112, 33, -931), Vector3(-114, 33, -944), Vector3(-116, 32, -957)]
	for c in chain:
		_add(Enemy.make(c, Enemy.Kind.BUZZ, Vector3(0, 0, 1), 0.0))
	for k in chain.size() - 1:
		var mid: Vector3 = (chain[k] + chain[k + 1]) * 0.5 + Vector3(0, 2.5, 0)
		_ring(mid)
	# Recovery spring on the beach below.
	_add(Spring.make(Vector3(-112, _ground_y(-112, -936) + 0.2, -936), Vector3(-0.1, 0.93, -0.35), 44.0))
	_ring_line(Vector3(-110, 5.5, -915), Vector3(-0.1, 0, -1), 6, 3.0, 0.0)

	# --- 6. Tunnel mouths, torches, ruins.
	var s_in := _s(Vector3(-122, 25, -1005))
	var s_out := _s(Vector3(-162, 18, -1095))
	Props.arch(rp, track.pos_at(s_in - 2.0), track.fwd_at(s_in), 13.0, 8.5)
	Props.arch(rp, track.pos_at(s_out + 2.0), track.fwd_at(s_out), 14.0, 8.5)
	var ts := s_in + 8.0
	var torch_i := 0
	while ts < s_out - 6.0:
		var side := -1.0 if torch_i % 2 == 0 else 1.0
		var fr := track.frame_at(ts)
		Props.torch(rp, (fr["p"] as Vector3) + (fr["r"] as Vector3) * (side * ((fr["w"] as float) * 0.5 - 0.9)), torch_i < 6)
		ts += 12.0
		torch_i += 1
	_ring_along(s_in + 6.0, s_out - 4.0, 5.0, 0.0, 1.2)
	# Courtyard.
	var cc := Vector3(-190, 15, -1124)
	for k in 8:
		var a := TAU * float(k) / 8.0
		var cpos := cc + Vector3(cos(a) * 24.0, 0, sin(a) * 24.0)
		if absf(cos(a)) > 0.9 and absf(sin(a)) < 0.4:
			continue  # leave the road in / out clear
		cpos.y = _ground_y(cpos.x, cpos.z) - 0.2
		Props.column(rp, cpos, 9.0 if k % 3 != 1 else 5.0, k % 3 == 1)
	for k in 6:
		var a := TAU * float(k) / 6.0 + 0.3
		var bpos := cc + Vector3(cos(a) * 31.0, 0, sin(a) * 31.0)
		bpos.y = _ground_y(bpos.x, bpos.z) + 0.8
		Props.block(rp, bpos, Vector3(3.2, 1.8, 2.4), a)
	Props.column(rp, cc + Vector3(-8, -0.2, -3), 12.0, false, 1.1)
	Props.column(rp, cc + Vector3(8, -0.2, -3), 12.0, false, 1.1)
	Props.block(rp, cc + Vector3(0, 13.0, -3), Vector3(20.0, 1.6, 3.0), 0.0, Props.stone(), false)
	_ring_circle(cc + Vector3(0, 1.3, 0), 9.0, 10)
	_add(Enemy.make(cc + Vector3(-14, 0.2, 8), Enemy.Kind.MOTOBUG, Vector3(1, 0, 0), 8.0))
	_add(Enemy.make(cc + Vector3(14, 0.2, -10), Enemy.Kind.MOTOBUG, Vector3(-1, 0, 0), 8.0))
	_add(Enemy.make(cc + Vector3(0, 6.5, 12), Enemy.Kind.BUZZ, Vector3(0, 0, 1), 6.0))

	# --- 7. Wall run backdrop.
	Props.cliff(rp, Vector3(-286, 24, -1176), Vector3(120, 62, 28))
	_ring_along(_s(Vector3(-240, 15, -1147)) + 10.0, _s(Vector3(-340, 15, -1147)) - 8.0, 6.0, 0.0, 1.3)

	# --- 8. Ridge, river, waterfalls, lagoon.
	Props.pool(rp, Vector3(-372, 47.2, -1258), Vector2(90, 36))
	Props.waterfall(rp, Vector3(-372, 47.4, -1279), 38.0, 50.0, FWD)
	Props.waterfall(rp, Vector3(-410, 47.0, -1279), 16.0, 49.5, FWD)
	Props.waterfall(rp, Vector3(-336, 46.5, -1279), 12.0, 49.0, FWD)
	Props.pool(rp, Vector3(-372, 0.05, -1310), Vector2(110, 70))
	_ring_arc(Vector3(-372, 50, -1272), Vector3(0, 0, -1), 46.0, 24.0, 10)

	# --- 9. Goal.
	var gs := _s(Vector3(-372, 4, -1700))
	Props.goal_gate(rp, track.pos_at(gs), track.fwd_at(gs))
	var gt := Trigger.make(track.pos_at(gs, 0, 4.0), Vector3(16, 12, 3), MeshLib.basis_forward(track.fwd_at(gs)))
	gt.fired.connect(func(_p): goal_reached.emit())
	rp.add_child(gt)

	# Birds.
	for b in [Vector3(14, 120.5, -22), Vector3(-104, 25.5, -880), Vector3(-408, 1.5, -1430), Vector3(-345, 1.5, -1500), Vector3(-404, 1.5, -1600), Vector3(-340, 4.5, -1655)]:
		_add(Birds.make(b, Quality.scale(16, 10), 6.0))

	# Camera zones.
	_zone(Vector3(0, 125, -25), Vector3(60, 30, 70), "reveal")
	_zone(Vector3(-33, 55, -400), Vector3(60, 60, 50), "loop")
	_zone(Vector3(-25, 46, -475), Vector3(40, 40, 76), "loop")
	_zone(Vector3(-60, 40, -710), Vector3(160, 90, 300), "rail")
	_zone(Vector3(-286, 25, -1150), Vector3(110, 50, 40), "wall")
	_zone(Vector3(-372, 30, -1290), Vector3(120, 90, 110), "waterfall")
	_zone(Vector3(-372, 8, -1720), Vector3(80, 30, 90), "finale")

	# Checkpoints.
	_checkpoint(Vector3(0, 120, 0), FWD, false)
	_checkpoint(Vector3(-40, 41, -372), FWD)
	_checkpoint(Vector3(-25, 40, -533), FWD)
	_checkpoint(Vector3(-100, 25, -868), Vector3(-0.2, 0, -0.98))
	_checkpoint(Vector3(-170, 17, -1104), Vector3(-0.7, 0, -0.7))
	_checkpoint(Vector3(-350, 16, -1155), Vector3(-0.5, 0, -0.85))
	_checkpoint(Vector3(-372, 4, -1372), FWD)


func _sea_stack(base: Vector3, h: float) -> void:
	var b := MeshLib.Builder.new()
	b.color = Color(1, 0, 0)
	var prof := [Vector2(0.0, -16.0), Vector2(11.0, -16.0), Vector2(9.0, h * 0.3), Vector2(10.0, h * 0.6), Vector2(6.0, h * 0.9), Vector2(0.0, h)]
	b.lathe(prof, 12, base)
	_obj_parent.add_child(b.commit(Mats.checker(), "SeaStack"))
	# A tuft of palms on top.
	var xf := []
	for k in 3:
		var a := TAU * k / 3.0
		xf.append(Transform3D(Basis(Vector3.UP, a) * Basis.IDENTITY.scaled(Vector3.ONE * 0.7), base + Vector3(cos(a) * 2.5, h - 0.4, sin(a) * 2.5)))
	Props.palms(_obj_parent, xf)


func _zone(center: Vector3, size: Vector3, mode: String) -> void:
	cam_zones.append({"aabb": AABB(center - size * 0.5, size), "mode": mode})


func cam_zone_at(p: Vector3) -> String:
	for z in cam_zones:
		if (z["aabb"] as AABB).has_point(p):
			return z["mode"]
	return ""


func _checkpoint(pos: Vector3, dir: Vector3, post: bool = true) -> void:
	var idx := checkpoints.size()
	checkpoints.append({"pos": pos + Vector3(0, 1.0, 0), "dir": dir.normalized()})
	if post:
		var fr := track.frame_at(_s(pos))
		var pp := (fr["p"] as Vector3) + (fr["r"] as Vector3) * ((fr["w"] as float) * 0.5 + 1.2)
		var post_node := Props.star_post(_obj_parent, pp)
		var t := Trigger.make(pos, Vector3(22, 8, 3), MeshLib.basis_forward(dir))
		t.fired.connect(func(_p):
			checkpoint_reached.emit(idx)
			_sfx.play("checkpoint")
			var head := post_node.get_node("Head") as Node3D
			var tw := create_tween()
			tw.tween_property(head, "rotation:y", head.rotation.y + TAU * 3.0, 1.2).set_ease(Tween.EASE_OUT))
		_obj_parent.add_child(t)


# ---------------------------------------------------------------------------
# Rings, enemies, pads

func _add(n: Node3D) -> void:
	_obj_parent.add_child(n)


func _ring(p: Vector3) -> void:
	var r := Ring.new()
	r.position = p
	_ring_parent.add_child(r)
	stats["rings_total"] += 1


func _ring_along(s0: float, s1: float, spacing: float, lat: float, h: float, lat_wave: float = 0.0) -> void:
	var s := s0
	var i := 0
	while s <= s1:
		var l := lat + (sin(float(i) * 0.9) * lat_wave)
		_ring(track.pos_at(s, l, h))
		s += spacing
		i += 1


func _ring_line(start: Vector3, dir: Vector3, n: int, spacing: float, h: float) -> void:
	for k in n:
		_ring(start + dir.normalized() * (spacing * k) + Vector3(0, h, 0))


func _ring_circle(c: Vector3, r: float, n: int) -> void:
	for k in n:
		var a := TAU * float(k) / n
		_ring(c + Vector3(cos(a) * r, 0, sin(a) * r))


# A parabolic arc of rings for a jump: launch from `start` along `dir` with
# speed v0 at pitch given by dir, sampled `n` times.
func _ring_arc(start: Vector3, dir: Vector3, v: float, pitch_deg: float, n: int) -> void:
	var f := Vector3(dir.x, 0, dir.z).normalized()
	var vy := v * sin(deg_to_rad(pitch_deg))
	var vh := v * cos(deg_to_rad(pitch_deg))
	for k in range(1, n + 1):
		var t := 0.22 * k
		var p := start + f * (vh * t) + Vector3(0, vy * t - 0.5 * 38.0 * t * t, 0)
		_ring(p)


func _rings_on_rail(r: Rail, spacing: float) -> void:
	var l := r.curve.get_baked_length()
	var off := 6.0
	while off < l - 4.0:
		_ring(r.to_global(r.curve.sample_baked(off, true)) + Vector3(0, 1.3, 0))
		off += spacing


func _objects() -> void:
	# 1. Plateau: a welcome line and the first dash pad at the lip.
	_ring_along(_s(Vector3(0, 120, -10)), _s(Vector3(0, 119, -58)), 6.0, 0.0, 1.2, 2.5)
	# 2. Downhill lines and a couple of Motobugs.
	_ring_along(_s(Vector3(-4, 114, -90)), _s(Vector3(-6, 86, -195)) - 4.0, 7.0, 0.0, 1.2, 3.5)
	_add(Enemy.make(track.pos_at(_s(Vector3(-14, 105, -125)), 3.0, 0.1), Enemy.Kind.MOTOBUG, Vector3(0, 0, -1), 4.0))
	_add(Enemy.make(track.pos_at(_s(Vector3(-16, 96, -160)), -3.0, 0.1), Enemy.Kind.MOTOBUG, Vector3(0, 0, -1), 0.0))
	_ring_along(_s(Vector3(-4, 81, -240)) + 4.0, _s(Vector3(-40, 41, -360)), 7.0, 0.0, 1.2, 3.0)
	_add(Enemy.make(track.pos_at(_s(Vector3(-34, 58, -305)), 0.0, 0.1), Enemy.Kind.MOTOBUG, Vector3(0, 0, -1), 5.0))
	_add(Enemy.make(track.pos_at(_s(Vector3(-40, 48, -335)), 0.0, 6.0), Enemy.Kind.BUZZ, Vector3(0, 0, -1), 4.0))
	# 3. Loop entry pad, rings through the loop and corkscrew.
	var s_loop := _s(Vector3(-40, 40, -385))
	_pad(s_loop - 3.0, 50.0)
	_ring_along(s_loop + 12.0, _s(Vector3(-25, 40, -400)) - 4.0, 5.0, 0.0, 1.2)
	var s_ck := _s(Vector3(-25, 40, -440))
	_pad(s_ck - 12.0, 52.0)
	_ring_along(s_ck + 5.0, _s(Vector3(-25, 40, -510)) - 3.0, 5.0, 0.0, 1.2)
	# 4. Ramp pad.
	_pad(_s(Vector3(-25, 40, -548)) - 6.0, 54.0)
	# Landing platform.
	_ring_along(_s(Vector3(-98, 25, -860)) + 2.0, _s(Vector3(-102, 25, -878)), 4.0, 0.0, 1.2)
	_pad(_s(Vector3(-102, 25, -878)) + 2.0, 50.0)
	# 5 -> 6. Rings to the tunnel.
	_ring_along(_s(Vector3(-118, 27, -968)) + 2.0, _s(Vector3(-122, 25, -1005)) - 3.0, 5.0, 0.0, 1.2, 2.0)
	# 7. Wall run pad.
	_pad(_s(Vector3(-226, 15, -1147)) - 2.0, 52.0)
	_ring_along(_s(Vector3(-212, 15, -1142)), _s(Vector3(-226, 15, -1147)), 4.0, 0.0, 1.2)
	# 8. Ridge pads and rings.
	_ring_along(_s(Vector3(-352, 16, -1156)), _s(Vector3(-372, 42, -1252)), 6.0, 0.0, 1.2, 2.5)
	_pad(_s(Vector3(-372, 42, -1252)) + 1.0, 54.0)
	# 9. Beach.
	var s_b := _s(Vector3(-372, 4, -1370))
	_pad(s_b + 6.0, 50.0)
	_ring_along(s_b + 14.0, _s(Vector3(-372, 4, -1650)), 6.0, 0.0, 1.2, 5.0)
	_pad(_s(Vector3(-372, 4, -1570)) - 4.0, 54.0)
	_add(Enemy.make(track.pos_at(_s(Vector3(-352, 4, -1450)), 4.0, 0.1), Enemy.Kind.MOTOBUG, Vector3(0, 0, -1), 6.0))
	_add(Enemy.make(track.pos_at(_s(Vector3(-338, 4, -1490)), -4.0, 0.1), Enemy.Kind.MOTOBUG, Vector3(0, 0, -1), 6.0))
	_add(Enemy.make(track.pos_at(_s(Vector3(-352, 4, -1530)), 0.0, 6.0), Enemy.Kind.BUZZ, Vector3(0, 0, -1), 7.0))
	_add(Enemy.make(track.pos_at(_s(Vector3(-380, 4, -1610)), 0.0, 6.5), Enemy.Kind.BUZZ, Vector3(0, 0, -1), 5.0))
	_add(Enemy.make(track.pos_at(_s(Vector3(-372, 4, -1650)), 5.0, 0.1), Enemy.Kind.MOTOBUG, Vector3(0, 0, -1), 7.0))
	_ring_along(_s(Vector3(-372, 4, -1650)) + 4.0, _s(Vector3(-372, 4, -1700)) - 6.0, 5.0, 0.0, 1.2)


func _pad(s: float, spd: float) -> void:
	var fr := track.frame_at(s)
	_add(DashPad.make((fr["p"] as Vector3) + (fr["u"] as Vector3) * 0.05, fr["f"], spd, fr["u"]))


# ---------------------------------------------------------------------------
# Vegetation

func _vegetation() -> void:
	var veg := Node3D.new()
	veg.name = "Vegetation"
	add_child(veg)
	var palms := []
	var flowers_a := []
	var flowers_b := []
	var grass := []
	var rocks := []
	var lw := Quality.lightweight()
	var rng := RandomNumberGenerator.new()
	rng.seed = 77
	# Along the road verges.
	var s := 0.0
	while s < track.length:
		var fr := track.frame_at(s)
		if fr["kind"] == "ground":
			var p: Vector3 = fr["p"]
			var r: Vector3 = fr["r"]
			var half: float = fr["w"] * 0.5
			for side in [-1.0, 1.0]:
				if rng.randf() < (0.22 if lw else 0.34):
					var lat := side * (half + rng.randf_range(4.0, 13.0))
					var q := p + Vector3(r.x, 0, r.z).normalized() * lat
					var gy := terrain.height_at(q.x, q.z)
					if gy > 1.5 and absf(gy - p.y) < 12.0:
						palms.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.8, 1.35)), Vector3(q.x, gy - 0.3, q.z)))
				for k in (2 if lw else 4):
					if rng.randf() < 0.7:
						var lat2 := side * (half + rng.randf_range(0.4, 7.0))
						var q2 := p + Vector3(r.x, 0, r.z).normalized() * lat2
						var gy2 := terrain.height_at(q2.x, q2.z)
						if gy2 > 1.0:
							grass.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.7, 1.4)), Vector3(q2.x, gy2 - 0.05, q2.z)))
				if rng.randf() < 0.55:
					var lat3 := side * (half + rng.randf_range(0.8, 5.0))
					var q3 := p + Vector3(r.x, 0, r.z).normalized() * lat3
					var gy3 := terrain.height_at(q3.x, q3.z)
					if gy3 > 1.0:
						var xf := Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.8, 1.3)), Vector3(q3.x, gy3, q3.z))
						if rng.randf() < 0.5:
							flowers_a.append(xf)
						else:
							flowers_b.append(xf)
				if rng.randf() < 0.10:
					var lat4 := side * (half + rng.randf_range(9.0, 26.0))
					var q4 := p + Vector3(r.x, 0, r.z).normalized() * lat4
					var gy4 := terrain.height_at(q4.x, q4.z)
					if gy4 > 1.0:
						rocks.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.6, 2.2)), Vector3(q4.x, gy4 - 0.4, q4.z)))
		s += 3.0 if lw else 2.0
	# Across the island.
	var gx := terrain.x0 + 10.0
	while gx < terrain.x1:
		var gz := terrain.z0 + 10.0
		while gz < terrain.z1:
			var jx := gx + rng.randf_range(-10.0, 10.0)
			var jz := gz + rng.randf_range(-10.0, 10.0)
			var gy := terrain.height_at(jx, jz)
			var n := terrain.normal_at(jx, jz)
			if gy > 2.0 and gy < 118.0 and n.y > 0.75 and terrain.road_weight_at(jx, jz) < 0.02 and rng.randf() < (0.30 if lw else 0.5):
				palms.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.8, 1.5)), Vector3(jx, gy - 0.3, jz)))
			gz += 30.0 if lw else 22.0
		gx += 30.0 if lw else 22.0
	Props.palms(veg, palms)
	Props.flowers(veg, flowers_a, Color(0.95, 0.75, 0.1), Color(1.0, 0.95, 0.4), "FlowersYellow")
	Props.flowers(veg, flowers_b, Color(0.95, 0.35, 0.6), Color(1.0, 0.85, 0.95), "FlowersPink")
	Props.grass(veg, grass)
	Props.rocks(veg, rocks)


# ---------------------------------------------------------------------------
# Runtime

func respawn(idx: int) -> void:
	var c: Dictionary = checkpoints[clampi(idx, 0, checkpoints.size() - 1)]
	player.reset_at(c["pos"], c["dir"])
	if collapse:
		collapse.reset()
	for t in _obj_parent.get_children():
		if t is Trigger:
			t.reset()


func rails_all() -> Array:
	return rails


# --- Effects called by objects ------------------------------------------------

func _burst(pos: Vector3, color: Color, n: int, spd: float, life: float, size: float, gravity: float = -8.0, additive: bool = true) -> void:
	var p := CPUParticles3D.new()
	p.amount = n
	p.lifetime = life
	p.one_shot = true
	p.explosiveness = 1.0
	p.mesh = QuadMesh.new()
	(p.mesh as QuadMesh).size = Vector2(size, size)
	p.material_override = Mats.particle_mat(color, additive)
	p.position = pos
	p.direction = Vector3.UP
	p.spread = 180.0
	p.initial_velocity_min = spd * 0.4
	p.initial_velocity_max = spd
	p.gravity = Vector3(0, gravity, 0)
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.2
	p.color_ramp = Props._ramp([Color(1, 1, 1, 1), Color(1, 1, 1, 0.8), Color(1, 1, 1, 0)])
	p.emitting = true
	add_child(p)
	get_tree().create_timer(life + 0.2).timeout.connect(p.queue_free)


func ring_burst(pos: Vector3) -> void:
	_burst(pos, Color(1.0, 0.85, 0.3, 1.0), 10, 5.0, 0.45, 0.35, -4.0)
	_sfx.play("ring", 0.0, randf_range(0.97, 1.05))


func enemy_pop(pos: Vector3) -> void:
	_burst(pos, Color(1.0, 0.6, 0.2, 1.0), 26, 12.0, 0.6, 0.7, -10.0)
	_burst(pos, Color(0.4, 0.4, 0.45, 0.7), 12, 4.0, 1.0, 1.6, 1.0, false)
	_sfx.play("pop")


func spring_fx(pos: Vector3, dir: Vector3) -> void:
	_burst(pos + dir * 1.0, Color(1.0, 0.9, 0.5, 1.0), 12, 6.0, 0.35, 0.5, 0.0)
	_sfx.play("spring")


func dash_fx(pos: Vector3, dir: Vector3) -> void:
	_burst(pos + Vector3(0, 0.5, 0), Color(0.5, 0.8, 1.0, 1.0), 14, 9.0, 0.35, 0.5, 0.0)
	_sfx.play("dash")


func birds_fx(pos: Vector3) -> void:
	_sfx.play("birds", -6.0)


func splash(pos: Vector3) -> void:
	_burst(Vector3(pos.x, 0.3, pos.z), Color(0.9, 0.98, 1.0, 0.9), 40, 14.0, 1.1, 1.2, -14.0, false)
	_sfx.play("splash")
