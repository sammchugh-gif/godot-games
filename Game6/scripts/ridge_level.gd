# Kingdom 1: Dino Ridge. Sunny cliffs, a waterfall, a fossil cave, a rocket
# cannon over a gorge, and King Raptor on the ridge top.
class_name RidgeLevel
extends Level


func _init() -> void:
	Terrain.city = false
	kingdom_id = "ridge"
	kingdom_title = "DINO RIDGE"
	kingdom_index = 1
	loading_text = "BUILDING DINO RIDGE..."
	next_kingdom = "city"
	next_kingdom_title = "SKYLINE CITY"
	boss_name = "KING RAPTOR"
	boss_colour = Color(0.85, 0.45, 0.2)
	arena_center = Vector3(-6, 26, -108)
	arena_r = 16.0
	shop_pos = Vector3(14, 0, 12)
	balloon_pos = Vector3(0, 0, 27)
	timer_moon_pos = Vector3(-22.0, Terrain.height(-22.0, -62.0) + 1.3, -62.0)
	timer_msg = "Run! The moon is west along the plateau."
	timer_len = 16.0
	moon_names = {
		"welcome": "Welcome to Dino Ridge",
		"frog": "Frog Hop to the Ledge",
		"waterfall": "Top of the Waterfall",
		"slab": "Under the Cracked Slab",
		"rex": "T-Rex Rampage",
		"cave": "Deep in the Fossil Cave",
		"rocket": "Caught a Rocket",
		"stilt": "Stilt Stretch",
		"bonks": "Bonk Bash",
		"shop": "Moon from the Shop",
		"chest": "Hidden Treasure Chest",
		"timer": "Ridge Run Against the Clock",
		"peak": "Peak of the Ridge",
		"scarecrow": "Hat on the Scarecrow",
		"spot1": "Glowing Spot in the Meadow",
		"spot2": "Glowing Spot on the Ridge",
		"sleepy": "Sleepy Rex's Secret",
		"bell": "Ring the Bell Three Times",
		"chimney": "Wall Jump Chimney",
		"bluecoins": "Blue Coin Dash",
		"island": "Far Island Lookout",
		"boss": "King Raptor's Reign",
	}
	hints = [
		{"pos": Vector3(12, 0, -8), "r": 7.0, "text": "Jump three times in a row to go higher. Or throw your hat and jump on it!"},
		{"pos": Vector3(-34, 0, -6), "r": 12.0, "text": "Throw your HAT at a frog to become it!"},
		{"pos": Vector3(30, 12, -72), "r": 12.0, "text": "A sleeping T-Rex! Throw your HAT at it."},
		{"pos": Vector3(-55, 0, 34), "r": 10.0, "text": "Throw your HAT at the plant, then hold JUMP to stretch."},
		{"pos": Vector3(58, 0, 15), "r": 12.0, "text": "Climb the tower and throw your HAT at a passing rocket!"},
		{"pos": Vector3(55, 0, -15), "r": 9.0, "text": "Jump between the two walls to climb the chimney."},
		{"pos": Vector3(38, 12, -52), "r": 7.0, "text": "Ground POUND the red switch!"},
		{"pos": Vector3(20, 12, -60), "r": 6.0, "text": "That slab looks cracked. POUND it from the air!"},
		{"pos": Vector3(-20, 0, 30), "r": 6.0, "text": "A glowing spot: ground POUND it."},
		{"pos": Vector3(12, 26, -108), "r": 8.0, "text": "Something big is sleeping in there..."},
	]
	shot_scenes = [
		{"name": "01_title", "pos": Vector3(0, 0.3, 15), "yaw": 0.0, "pitch": 0.2, "title": true},
		{"name": "02_meadow", "pos": Vector3(0, 0.3, 10), "yaw": 0.0, "pitch": 0.3},
		{"name": "03_shop", "pos": Vector3(14, 0.3, 17), "yaw": PI, "pitch": 0.25},
		{"name": "04_frogs", "pos": Vector3(-30, 0.5, 0), "yaw": 0.6, "pitch": 0.3},
		{"name": "05_waterfall", "pos": Vector3(-4, 0.5, -12), "yaw": 0.2, "pitch": 0.25},
		{"name": "06_rex", "pos": Vector3(24, 12.5, -66), "yaw": 0.6, "pitch": 0.3},
		{"name": "07_cave", "pos": Vector3(10, 12.5, -72), "yaw": 0.0, "pitch": 0.25},
		{"name": "08_cannon", "pos": Vector3(50, 0.5, 15), "yaw": -PI * 0.5, "pitch": 0.3},
		{"name": "09_arena", "pos": Vector3(12, 26.5, -108), "yaw": PI * 0.5, "pitch": 0.3},
		{"name": "10_stilt", "pos": Vector3(-50, 0.5, 30), "yaw": 0.6, "pitch": 0.3},
		{"name": "11_overview", "pos": Vector3(44, 26.5, -100), "yaw": PI, "pitch": 0.55},
		{"name": "12_peak", "pos": Vector3(-30, 26.5, -104), "yaw": -0.8, "pitch": 0.35},
	]


func _blocked(x: float, z: float) -> bool:
	if absf(x + 10.0) < 8.0 and z > -36.0:
		return true
	if Vector2(x + 10.0, z + 28.0).length() < 15.0:
		return true
	if x > 62.0 and x < 92.0 and z > -34.0:
		return true
	if Terrain.ramp_mask(x) > 0.3 and z < -20.0 and z > -110.0:
		return true
	return false


func deep_water(pos: Vector3) -> bool:
	return pos.x > 64.0 and pos.x < 92.0 and pos.z > -34.0 and pos.y < Terrain.GORGE_WATER_Y + 0.3


func shallow_water(pos: Vector3) -> bool:
	var river := absf(pos.x + 10.0) < 5.5 and pos.z > -22.0
	var pond := Vector2(pos.x + 10.0, pos.z + 28.0).length() < 11.0
	return (river or pond) and pos.y < Terrain.WATER_Y + 0.25


func _kingdom_physics(dt: float) -> void:
	# Rocket cannon.
	cannon_t -= dt
	if cannon_t <= 0.0:
		cannon_t = 4.5
		if player.actor_pos().distance_to(cannon_pos) < 70.0:
			_fire_rocket()


func _environment() -> void:
	var env := Environment.new()
	var sky := Sky.new()
	var sm := ProceduralSkyMaterial.new()
	sm.sky_top_color = Color(0.3, 0.55, 0.95)
	sm.sky_horizon_color = Color(0.78, 0.88, 0.98)
	sm.ground_bottom_color = Color(0.3, 0.4, 0.3)
	sm.ground_horizon_color = Color(0.75, 0.85, 0.9)
	sm.sun_angle_max = 20.0
	sky.sky_material = sm
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.55, 0.65, 0.8)
	env.ambient_light_energy = 0.55
	env.fog_enabled = true
	env.fog_light_color = Color(0.72, 0.82, 0.95)
	env.fog_density = 0.0012
	env.fog_sky_affect = 0.15
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_white = 4.0
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52.0, 38.0, 0.0)
	sun.light_energy = 0.95
	sun.light_color = Color(1.0, 0.96, 0.88)
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 60.0 if Quality.lightweight() else 100.0
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS if Quality.lightweight() else DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sun.directional_shadow_split_1 = 0.2 if Quality.lightweight() else 0.08
	sun.directional_shadow_split_2 = 0.22
	sun.directional_shadow_split_3 = 0.5
	sun.directional_shadow_fade_start = 0.85
	sun.directional_shadow_blend_splits = true
	sun.shadow_bias = 0.04
	sun.shadow_normal_bias = 1.2
	add_child(sun)


func _water() -> void:
	_water_quad(-10.0, 50.0, 14.0, 165.0, Terrain.WATER_Y, Mats.water(), 12)
	_water_quad(-10.0, -28.0, 26.0, 26.0, Terrain.WATER_Y, Mats.water(), 6)
	_water_quad(78.0, 48.0, 30.0, 168.0, Terrain.GORGE_WATER_Y, Mats.water(true), 8)
	# The waterfall: a sheet from the cliff top into the pond.
	var b := MeshLib.Builder.new()
	var top := g(-10.0, -44.0) + 0.3
	var x0 := -13.5
	var x1 := -6.5
	var zc := -38.6
	b.quad_n(Vector3(x0, Terrain.WATER_Y - 0.5, zc + 0.8), Vector3(x0, top, zc), Vector3(x1, top, zc), Vector3(x1, Terrain.WATER_Y - 0.5, zc + 0.8),
		Vector3.BACK, Vector3.BACK, Vector3.BACK, Vector3.BACK,
		Vector2(0, 1), Vector2(0, 0), Vector2(1, 0), Vector2(1, 1))
	add_child(b.commit(Mats.waterfall(), "Waterfall"))
	var mist := CPUParticles3D.new()
	mist.position = Vector3(-10.0, Terrain.WATER_Y + 0.3, zc + 1.5)
	mist.amount = 30
	mist.lifetime = 1.6
	mist.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	mist.emission_box_extents = Vector3(3.5, 0.2, 0.8)
	mist.direction = Vector3.UP
	mist.spread = 40.0
	mist.initial_velocity_min = 1.5
	mist.initial_velocity_max = 3.5
	mist.gravity = Vector3(0, -1.5, 0)
	mist.scale_amount_min = 0.3
	mist.scale_amount_max = 0.8
	mist.mesh = SphereMesh.new()
	(mist.mesh as SphereMesh).radius = 0.5
	(mist.mesh as SphereMesh).height = 1.0
	mist.material_override = Mats.unshaded(Color(0.95, 0.98, 1.0, 0.45))
	add_child(mist)


func _dressing() -> void:
	# Trees, rocks, flowers and grass, scattered where nothing important is.
	var avoid := [Vector3(0, 0, 15), Vector3(14, 0, 12), Vector3(0, 0, 27), Vector3(12, 0, -8), Vector3(-36, 0, -8),
		Vector3(30, 0, -72), Vector3(10, 0, -82), Vector3(58, 0, 15), Vector3(-55, 0, 34), Vector3(-62, 0, 40),
		Vector3(20, 0, -60), Vector3(38, 0, -52), Vector3(-22, 0, -62), Vector3(30, 0, 40), Vector3(25, 0, 55),
		Vector3(55, 0, -15), Vector3(-20, 0, 30), Vector3(-40, 0, -95), Vector3(40, 0, -82), Vector3(-6, 0, -108),
		Vector3(-40, 0, -112), Vector3(44, 0, -58), Vector3(44, 0, -104), Vector3(104, 0, 12), Vector3(100, 0, 20)]
	var trees := 0
	var tries := 0
	var tree_n := Quality.scale(120, 85)
	while trees < tree_n and tries < 3000:
		tries += 1
		var x := rng.randf_range(-125.0, 125.0)
		var z := rng.randf_range(-125.0, 125.0)
		if not _clear_spot(x, z, avoid, 9.0, 0.8):
			continue
		var h := g(x, z)
		var kind := 0
		if h < 1.2 and x < 40.0:
			kind = 2
		elif h > 8.0:
			kind = 1 if rng.randf() < 0.7 else 0
		_tree(kind, Vector3(x, h - 0.2, z), rng.randf_range(0.8, 1.3))
		trees += 1
	for i in Quality.scale(80, 55):
		var x := rng.randf_range(-125.0, 125.0)
		var z := rng.randf_range(-125.0, 125.0)
		if not _clear_spot(x, z, avoid, 7.0, 0.5):
			continue
		_rock(Vector3(x, g(x, z) - 0.1, z), rng.randf_range(0.5, 1.6))
	# Flowers and grass tufts as one multimesh each.
	_scatter(Quality.scale(700, 380), 0.14, [Color(0.95, 0.85, 0.3), Color(0.95, 0.4, 0.5), Color(0.98, 0.98, 0.98), Color(0.6, 0.5, 0.95)], avoid)
	_scatter(Quality.scale(900, 500), 0.22, [Color(0.35, 0.7, 0.25), Color(0.5, 0.8, 0.3)], avoid, true)


func _rock_pile(center: Vector3, count: int, size: float) -> void:
	for i in count:
		var a := rng.randf() * TAU
		var d := rng.randf() * size * 0.8
		_rock(center + Vector3(cos(a) * d, 0, sin(a) * d), size * rng.randf_range(0.6, 1.1))


func _set_pieces() -> void:
	# 1. Welcome pillar: a stone column in the meadow.
	_cyl(Vector3(12.0, g(12.0, -8.0) - 0.5, -8.0), 1.6, 4.8, ROCK, 10, 1.4)
	# 2. Frog ledge: a tall rock with a flat top, next to the frog pond.
	_cyl(Vector3(-46.0, g(-46.0, -14.0) - 0.5, -14.0), 3.2, 9.5, ROCK, 12, 2.8)
	_cyl(Vector3(-40.0, g(-40.0, -18.0) - 0.5, -18.0), 1.8, 3.0, ROCK_DARK, 10)
	# 4. Cracked slab on plateau one.
	var slab := _box(Vector3(20.0, g(20.0, -60.0) + 0.2, -60.0), Vector3(3.0, 0.4, 3.0), Color(0.6, 0.6, 0.58))
	slab.name = "Slab"
	var cracks := MeshLib.Builder.new()
	cracks.box(Vector3(0, 0.21, 0), Vector3(2.2, 0.02, 0.15), Basis(Vector3.UP, 0.6))
	cracks.box(Vector3(0.3, 0.21, -0.2), Vector3(1.6, 0.02, 0.15), Basis(Vector3.UP, -0.9))
	slab.add_child(cracks.commit(Mats.pbr(Color(0.2, 0.2, 0.2)), "Cracks"))
	slabs.append(slab)
	# 5/6. The fossil cave: a stone hall against the ridge cliff, its mouth
	# sealed by boulders only Rex can smash. Inside, a high ledge.
	var cp := Vector3(10.0, g(10.0, -80.0), -80.0)
	var cave_floor := _box(cp + Vector3(0, -0.4, -4.0), Vector3(14.0, 1.0, 12.0), Color(0.42, 0.38, 0.36))
	cave_floor.name = "CaveFloor"
	_box(cp + Vector3(-7.0, 3.5, -4.0), Vector3(1.2, 8.0, 12.0), ROCK_DARK)
	_box(cp + Vector3(7.0, 3.5, -4.0), Vector3(1.2, 8.0, 12.0), ROCK_DARK)
	_box(cp + Vector3(0, 3.5, -10.0), Vector3(15.0, 8.0, 1.2), ROCK_DARK)
	_box(cp + Vector3(0, 7.6, -4.0), Vector3(15.0, 1.2, 12.5), ROCK_DARK)
	_box(cp + Vector3(-4.5, 4.4, 1.6), Vector3(4.2, 8.0, 1.2), ROCK_DARK)
	_box(cp + Vector3(4.5, 4.4, 1.6), Vector3(4.2, 8.0, 1.2), ROCK_DARK)
	_box(cp + Vector3(0, 6.6, 1.6), Vector3(5.0, 3.0, 1.2), ROCK_DARK)
	_box(cp + Vector3(-4.0, 3.2, -8.0), Vector3(4.0, 0.5, 3.0), ROCK)        # inner ledge
	_box(cp + Vector3(4.5, 1.6, -7.0), Vector3(2.5, 0.4, 2.5), ROCK)         # step
	_box(cp + Vector3(-5.5, 1.3, -1.5), Vector3(2.0, 0.4, 2.0), ROCK)        # step 2
	_rock_pile(cp + Vector3(-9.0, 0, 2.0), 5, 1.4)
	_rock_pile(cp + Vector3(9.0, 0, 2.0), 5, 1.4)
	for s in [-1.0, 1.0]:
		_boulder(cp + Vector3(1.3 * s, 0.0, 1.6), 1.7)
	var torch := OmniLight3D.new()
	torch.position = cp + Vector3(0, 5.0, -4.0)
	torch.light_color = Color(1.0, 0.75, 0.45)
	torch.light_energy = 2.5
	torch.omni_range = 14.0
	add_child(torch)
	# Fossil decoration: a rib cage of arcs on the back wall.
	var fb := MeshLib.Builder.new()
	for i in 5:
		fb.cylinder(cp + Vector3(-3.0 + i * 1.5, 0.5, -9.2), cp + Vector3(-3.0 + i * 1.5, 4.5 + sin(i * 1.3) * 0.5, -9.2), 0.18, 0.12, 6)
	add_child(fb.commit(Mats.pbr(Color(0.9, 0.88, 0.8)), "Fossil"))
	# 17. Rocks behind Rex's hollow, climbable.
	var rx := Vector3(40.0, g(40.0, -82.0), -82.0)
	_cyl(rx + Vector3(-3.0, -0.3, 0), 2.2, 2.0, ROCK, 10)
	_cyl(rx + Vector3(0.5, -0.3, -2.0), 2.0, 4.0, ROCK_DARK, 10)
	_cyl(rx + Vector3(3.5, -0.3, 0.5), 2.0, 6.2, ROCK, 10, 1.8)
	# 7. Rocket cannon tower.
	cannon_pos = Vector3(58.0, g(58.0, 15.0), 15.0)
	_cyl(cannon_pos, 2.4, 4.0, ROCK_DARK, 12, 2.0)
	var cannon := MeshLib.Builder.new()
	cannon.cylinder(Vector3(-1.0, 5.0, 0), Vector3(2.6, 5.4, 0), 0.9, 1.0, 12)
	cannon.ellipsoid(Vector3(-1.0, 5.0, 0), Vector3(1.1, 1.1, 1.1), 10, 8)
	var cm := cannon.commit(Mats.pbr(Color(0.25, 0.25, 0.3), 0.5, 0.4), "Cannon")
	cm.position = cannon_pos
	add_child(cm)
	# Island landing pad for the rocket moon, and a lookout rock for the stilt.
	_cyl(Vector3(104.0, g(104.0, 12.0) - 0.5, 12.0), 3.0, 1.2, Color(0.75, 0.7, 0.6), 12)
	_cyl(Vector3(108.0, g(108.0, 30.0) - 0.5, 30.0), 2.6, 9.6, ROCK, 12, 2.2)
	# 8. Stilt shelf.
	_cyl(Vector3(-63.0, g(-63.0, 42.0) - 0.5, 42.0), 2.8, 9.6, ROCK, 12, 2.4)
	# 11. Chest in a ring of trees.
	chest = _box(Vector3(-30.0, g(-30.0, 60.0) + 0.5, 60.0), Vector3(1.4, 1.0, 1.0), Color(0.55, 0.32, 0.15))
	chest.name = "Chest"
	var lid := MeshLib.Builder.new()
	lid.box(Vector3(0, 0.6, 0), Vector3(1.45, 0.25, 1.05))
	lid.box(Vector3(0, 0.3, -0.52), Vector3(0.3, 0.3, 0.06))
	chest.add_child(lid.commit(Mats.pbr(Color(0.85, 0.7, 0.25), 0.4, 0.6), "Lid"))
	for i in 7:
		var a := TAU * i / 7.0
		_tree(0, Vector3(-30.0 + cos(a) * 5.0, g(-30.0 + cos(a) * 5.0, 60.0 + sin(a) * 5.0) - 0.2, 60.0 + sin(a) * 5.0), 1.1)
	# 12. Pound switch near the top of the ramp.
	switch_node = _cyl(Vector3(38.0, g(38.0, -52.0), -52.0), 1.0, 0.5, Color(0.85, 0.15, 0.15), 12)
	switch_node.name = "Switch"
	_cyl(Vector3(38.0, g(38.0, -52.0) - 0.3, -52.0), 1.4, 0.3, Color(0.4, 0.4, 0.42), 12)
	# 13. Peak spire on the ridge with a spiral of ledges.
	var spx := Vector3(-40.0, g(-40.0, -112.0) - 0.5, -112.0)
	_cyl(spx, 3.0, 13.0, ROCK, 14, 2.2)
	for i in 7:
		var a := -i * 0.85
		var y := 1.5 + i * 1.75
		_box(spx + Vector3(cos(a) * 4.2, y, sin(a) * 4.2), Vector3(2.4, 0.5, 2.4), ROCK_DARK, 0.9, Basis(Vector3.UP, -a))
	# 14. Scarecrow in the south meadow.
	scarecrow = Node3D.new()
	scarecrow.position = Vector3(30.0, g(30.0, 40.0), 40.0)
	var scb := MeshLib.Builder.new()
	scb.cylinder(Vector3.ZERO, Vector3(0, 2.4, 0), 0.1, 0.1, 6)
	scb.cylinder(Vector3(-0.9, 1.7, 0), Vector3(0.9, 1.7, 0), 0.08, 0.08, 6)
	scb.box(Vector3(0, 1.5, 0), Vector3(0.7, 0.9, 0.4))
	scarecrow.add_child(scb.commit(Mats.pbr(Color(0.75, 0.6, 0.3)), "Body"))
	var sch := MeshLib.Builder.new()
	sch.ellipsoid(Vector3(0, 2.35, 0), Vector3(0.32, 0.36, 0.32), 10, 8)
	scarecrow.add_child(sch.commit(Mats.pbr(Color(0.95, 0.75, 0.3)), "Head"))
	Models.eyes(scarecrow, Vector3(0, 2.4, -0.24), 0.12, 0.06)
	add_child(scarecrow)
	# 15/16. Glowing spots.
	_spot(Vector3(-20.0, g(-20.0, 30.0) + 0.06, 30.0), "spot1")
	_spot(Vector3(-40.0, g(-40.0, -95.0) + 0.06, -95.0), "spot2")
	# 18. Bell tower.
	var bt := Vector3(25.0, g(25.0, 55.0), 55.0)
	for s in [-1.0, 1.0]:
		_cyl(bt + Vector3(1.0 * s, 0, 0), 0.15, 5.0, WOOD, 6)
	_box(bt + Vector3(0, 5.1, 0), Vector3(2.8, 0.3, 1.2), WOOD)
	bell = Node3D.new()
	bell.position = bt + Vector3(0, 4.2, 0)
	var bb := MeshLib.Builder.new()
	bb.lathe([Vector2(0.0, 0.8), Vector2(0.25, 0.8), Vector2(0.4, 0.4), Vector2(0.55, 0.0), Vector2(0.0, 0.0)], 14)
	bell.add_child(bb.commit(Mats.pbr(Color(0.85, 0.7, 0.3), 0.35, 0.7), "Bell"))
	add_child(bell)
	# 19. Wall-jump chimney: two tall pillars with a narrow gap.
	var ch := Vector3(55.0, g(55.0, -15.0) - 0.5, -15.0)
	_box(ch + Vector3(-1.9, 5.0, 0), Vector3(2.4, 10.5, 4.0), ROCK)
	_box(ch + Vector3(1.9, 5.0, 0), Vector3(2.4, 10.5, 4.0), ROCK)
	_box(ch + Vector3(0, 10.4, -2.2), Vector3(6.2, 0.6, 1.0), ROCK_DARK)
	# Boss arena: a ring of rock pillars with an entrance on the east side.
	for i in 16:
		var a := TAU * i / 16.0
		if absf(wrapf(a, -PI, PI)) < 0.45:
			continue
		var p := arena_center + Vector3(cos(a) * (arena_r + 1.5), -1.0, sin(a) * (arena_r + 1.5))
		_cyl(p, 2.6, 6.0 + sin(i * 2.0) * 1.2, ROCK if i % 2 == 0 else ROCK_DARK, 8, 2.0)
	# Crates around the place.
	for cpos in [Vector3(8.0, 0, 2.0), Vector3(-14.0, 0, 8.0), Vector3(22.0, 0, 28.0), Vector3(-6.0, 0, -66.0),
			Vector3(35.0, 0, -62.0), Vector3(50.0, 0, -6.0), Vector3(-30.0, 0, 20.0), Vector3(96.0, 0, 8.0),
			Vector3(-48.0, 0, -100.0), Vector3(-26.0, 0, -68.0)]:
		_crate(Vector3(cpos.x, g(cpos.x, cpos.z) + 0.5, cpos.z))


func _pickups() -> void:
	_coin_line(Vector3(-6, 0, 4), Vector3(6, 0, 4), 5)
	_coin_ring(Vector3(0, 0, -12), 4.0, 8)
	_coin_line(Vector3(20, 0, -16), Vector3(44, 0, -40), 8)
	_coin_line(Vector3(44, 0, -44), Vector3(44, 0, -70), 6)
	_coin_ring(Vector3(0, 0, -60), 5.0, 8)
	_coin_line(Vector3(44, 0, -86), Vector3(44, 0, -104), 6)
	_coin_line(Vector3(30, 0, -108), Vector3(14, 0, -108), 5)
	_coin_ring(Vector3(-28, 0, -12), 4.0, 6)
	_coin_line(Vector3(-20, 0, 20), Vector3(-44, 0, 34), 7)
	_coin_line(Vector3(10, 0, 24), Vector3(30, 0, 48), 7)
	_coin_ring(Vector3(40, 0, 62), 5.0, 8)
	_coin_line(Vector3(20, 0, -4), Vector3(52, 0, -10), 7)
	_coin_ring(Vector3(-52, 0, 72), 4.0, 6)
	_coin_ring(Vector3(-92, 0, -20), 6.0, 8)
	_coin_ring(Vector3(-60, 0, -60), 4.0, 6)
	_coin_line(Vector3(-20, 0, -90), Vector3(-36, 0, -100), 5)
	_coin_ring(Vector3(100, 0, 20), 5.0, 8)
	# Over the gorge on the rocket's line.
	var cy := g(58.0, 15.0) + 5.0
	for i in 8:
		_pickup("coin", Vector3(64.0 + i * 3.5, cy + sin(i * 0.8) * 1.5, 15.0))
	# Arcs over jumps.
	_coin_arc(Vector3(8.0, g(8, -8) + 1.0, -8.0), Vector3(16.0, g(16, -8) + 1.0, -8.0), 4.0, 5)
	# Purple coins in little clusters.
	var purples := [
		Vector3(-12, 0, -8), Vector3(-13, 0, -6), Vector3(-14, 0, -4),
		Vector3(16, 0, -66), Vector3(18, 0, -68), Vector3(20, 0, -70),
		Vector3(-38, 0, -8), Vector3(-36, 0, -10),
		Vector3(60, 0, -20), Vector3(62, 0, -22),
		Vector3(-58, 0, 30), Vector3(-60, 0, 32), Vector3(-62, 0, 34),
		Vector3(10, 0, -84), Vector3(12, 0, -86),
		Vector3(102, 0, 16), Vector3(104, 0, 18),
		Vector3(-30, 0, -100), Vector3(-32, 0, -102), Vector3(-46, 0, 56)]
	for i in purples.size():
		var p: Vector3 = purples[i]
		var y := g(p.x, p.z) + 1.0
		if i >= 13 and i <= 14:
			y = g(10.0, -80.0) + 1.1   # inside the cave, on its floor
		_pickup("purple", Vector3(p.x, y, p.z), i)
	# Hearts.
	for hp in [Vector3(-8, 0, 30), Vector3(36, 0, -76), Vector3(20, 0, -110), Vector3(-70, 0, 0)]:
		_pickup("heart", Vector3(hp.x, g(hp.x, hp.z) + 1.0, hp.z))
	# Blue coins along the river bank.
	for i in 8:
		var z := 30.0 + i * 6.0
		var x := -3.0 + sin(i * 1.1) * 2.0
		var b := _pickup("blue", Vector3(x, g(x, z) + 1.0, z))
		blue_coins.append(b)


func _creatures() -> void:
	for p in [Vector3(-15, 0, -10), Vector3(18, 0, -22), Vector3(30, 0, 30), Vector3(-30, 0, 30), Vector3(0, 0, -62),
			Vector3(22, 0, -50), Vector3(-25, 0, -55), Vector3(-45, 0, 60), Vector3(40, 0, 8), Vector3(-15, 0, -100)]:
		_enemy("bonk", p)
	for p in [Vector3(10, 0, 40), Vector3(-5, 0, -70), Vector3(50, 0, 0), Vector3(-30, 0, -108)]:
		_enemy("spiny", p)
	for p in [Vector3(-34, 0, -4), Vector3(-38, 0, -12), Vector3(-30, 0, -14)]:
		_capturable(Captures.Frog.new(), p)
	_capturable(Captures.Rex.new(), Vector3(30, 0, -72), PI * 0.5)
	_capturable(Captures.Stilt.new(), Vector3(-55, 0, 34))
	_capturable(Captures.Stilt.new(), Vector3(100, 0, 22))
	_spawn_boss()


func _fire_rocket() -> void:
	var r := Captures.Rocket.new()
	_dyn.add_child(r)
	r.global_position = cannon_pos + Vector3(3.0, 5.4, 0)
	r.setup(self, player)
	r.dir = Vector3.RIGHT
	r.facing = atan2(-1.0, 0.0)
	capturables.append(r)
	Sfx.play("rocket", -8.0)


func _moons() -> void:
	_place_moon("welcome", Vector3(12.0, g(12.0, -8.0) + 5.6, -8.0))
	_place_moon("frog", Vector3(-46.0, g(-46.0, -14.0) + 10.4, -14.0))
	_place_moon("waterfall", Vector3(-10.0, g(-10.0, -46.0) + 1.3, -46.0))
	_place_moon("rex", Vector3(10.0, g(10.0, -80.0) + 1.4, -85.0))
	_place_moon("cave", Vector3(6.0, g(10.0, -80.0) + 4.8, -88.0))
	_place_moon("rocket", Vector3(104.0, g(104.0, 12.0) + 2.2, 12.0))
	_place_moon("island", Vector3(108.0, g(108.0, 30.0) + 10.6, 30.0))
	_place_moon("stilt", Vector3(-63.0, g(-63.0, 42.0) + 10.6, 42.0))
	_place_moon("peak", Vector3(-40.0, g(-40.0, -112.0) + 13.9, -112.0))
	_place_moon("sleepy", Vector3(43.5, g(40.0, -82.0) + 7.4, -81.5))
	_place_moon("chimney", Vector3(55.0, g(55.0, -15.0) + 11.4, -17.2))


func _checkpoints() -> void:
	checkpoints = [
		{"pos": Vector3(0, 0.3, 15), "yaw": 0.0, "name": "Landing Meadow"},
		{"pos": Vector3(44, g(44, -58) + 0.3, -58), "yaw": 0.0, "name": "Ramp Top"},
		{"pos": Vector3(44, g(44, -104) + 0.3, -104), "yaw": PI * 0.5, "name": "Ridge Top"},
		{"pos": Vector3(16, g(16, -108) + 0.3, -108), "yaw": PI * 0.5, "name": "Arena Gate"},
		{"pos": Vector3(-40, g(-40, -2) + 0.3, -2), "yaw": 0.0, "name": "Frog Pond"},
		{"pos": Vector3(-52, g(-52, 30) + 0.3, 30), "yaw": 0.0, "name": "Stilt Field"},
		{"pos": Vector3(54, g(54, 12) + 0.3, 12), "yaw": -PI * 0.5, "name": "Cannon Tower"},
		{"pos": Vector3(98, g(98, 12) + 0.3, 12), "yaw": 0.0, "name": "Far Island"},
	]
	for i in checkpoints.size():
		var c: Dictionary = checkpoints[i]
		var p: Vector3 = c["pos"]
		var pole := _cyl(Vector3(p.x + 1.6, p.y - 0.3, p.z - 1.6), 0.08, 3.2, Color(0.9, 0.9, 0.9), 6)
		pole.name = "Flag%d" % i
		var fb := MeshLib.Builder.new()
		fb.tri(Vector3(0, 3.1, 0), Vector3(1.1, 2.8, 0), Vector3(0, 2.4, 0))
		fb.tri(Vector3(0, 2.4, 0), Vector3(1.1, 2.8, 0), Vector3(0, 3.1, 0))
		var flag := fb.commit(Mats.pbr(Color(0.4, 0.4, 0.45) if i > 0 else Color(1.0, 0.85, 0.2)), "Flag")
		flag.name = "FlagCloth"
		pole.add_child(flag)
