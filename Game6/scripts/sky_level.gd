# Kingdom 6: Cloud Islands. Floating islands over nothing but sky. Moving
# clouds carry you between them, springs and wind columns throw you up, a
# cannon and a bird reach the far ones. Storm Raptor on the highest island.
class_name SkyLevel
extends Level

const CLOUD := Color(0.97, 0.97, 1.0)
const STONE := Color(0.85, 0.88, 0.95)
const STONE_DARK := Color(0.7, 0.74, 0.85)


func _init() -> void:
	Terrain.mode = "sky"
	kingdom_id = "sky"
	kingdom_title = "CLOUD ISLANDS"
	kingdom_index = 6
	loading_text = "BUILDING THE CLOUD ISLANDS..."
	next_kingdom = "ghost"
	next_kingdom_title = "GHOST MANOR"
	boss_name = "STORM RAPTOR"
	boss_colour = Color(0.5, 0.55, 0.7)
	boss_extra_hp = 2
	arena_center = Vector3(-20, 24, -108)
	arena_r = 14.0
	shop_pos = Vector3(12, 0, 6)
	balloon_pos = Vector3(-8, 0, 22)
	timer_moon_pos = Vector3(62.0, 19.5, -74.0)
	timer_msg = "Ride the cloud east, fast!"
	timer_len = 14.0
	moon_names = {
		"welcome": "Welcome to the Cloud Islands",
		"cloud1": "Ride the Cloud",
		"cloud2": "Second Cloud Ride",
		"spring": "Spring to the Sky Ring",
		"updraft": "Ride the Wind",
		"rocket": "Rocket to the West Isle",
		"bird": "Skyla Flies East",
		"far": "The Southern Isle",
		"lonely": "The Lonely Cloud",
		"peak": "Cloud Ride to the Peak",
		"timer": "Cloud Dash Against the Clock",
		"stilt": "Stilt Stretch on High",
		"spot1": "Glowing Spot on the Landing Isle",
		"spot2": "Glowing Spot on the Storm Isle",
		"chest": "Chest on the Southern Isle",
		"bell": "Ring the Sky Bell",
		"scarecrow": "Hat on the Cloud Statue",
		"slab": "Under the Cracked Cloudstone",
		"bonks": "Bonk Bash in the Clouds",
		"bluecoins": "Blue Coins Round the Isle",
		"shop": "Moon from the Shop",
		"boss": "Storm Raptor's Isle",
	}
	hints = [
		{"pos": Vector3(0, 0, -14), "r": 8.0, "text": "Clouds drift between the islands. Step on and ride."},
		{"pos": Vector3(-18, 0, 8), "r": 6.0, "text": "A wind column! Stand in it and it lifts you."},
		{"pos": Vector3(-14, 0, -2), "r": 6.0, "text": "Throw your HAT at the bird to fly. Tap JUMP to flap."},
		{"pos": Vector3(20, 0, 20), "r": 7.0, "text": "Jump onto the spring to launch up to the ring."},
		{"pos": Vector3(0, 12, -84), "r": 6.0, "text": "That cloud floats up to the storm island."},
		{"pos": Vector3(-6, 24, -108), "r": 8.0, "text": "Something rumbles in the clouds up here..."},
	]
	shot_scenes = [
		{"name": "01_title", "pos": Vector3(0, 0.3, 15), "yaw": 0.0, "pitch": 0.2, "title": true},
		{"name": "02_landing", "pos": Vector3(0, 0.3, 4), "yaw": 0.0, "pitch": 0.3},
		{"name": "03_edge", "pos": Vector3(6, 0.5, -10), "yaw": -0.6, "pitch": 0.4},
		{"name": "04_wind", "pos": Vector3(-10, 0.5, 12), "yaw": 1.0, "pitch": 0.3},
		{"name": "05_island_c", "pos": Vector3(10, 12.5, -60), "yaw": 0.0, "pitch": 0.4},
		{"name": "06_storm", "pos": Vector3(-4, 24.5, -100), "yaw": PI * 0.5, "pitch": 0.3},
		{"name": "07_overview", "pos": Vector3(-20, 24.5, -96), "yaw": PI, "pitch": 0.6},
	]


func _blocked(x: float, z: float) -> bool:
	return g(x, z) < -5.0


func _environment() -> void:
	_env_setup({"top": Color(0.2, 0.45, 0.95), "horizon": Color(0.8, 0.9, 1.0), "ground": Color(0.65, 0.75, 0.9), "ground_h": Color(0.85, 0.9, 1.0),
		"sun": Color(1.0, 0.98, 0.92), "sun_energy": 1.0, "sun_rot": Vector3(-58.0, 30.0, 0.0), "ambient": Color(0.6, 0.7, 0.9), "ambient_energy": 0.6,
		"fog": Color(0.8, 0.88, 1.0), "fog_density": 0.0008})
	# Background clouds below and around.
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3.ZERO, Vector3(1.0, 0.45, 1.0), 10, 6)
	b.ellipsoid(Vector3(0.7, 0.1, 0.2), Vector3(0.7, 0.4, 0.7), 8, 6)
	b.ellipsoid(Vector3(-0.6, 0.05, -0.3), Vector3(0.6, 0.35, 0.6), 8, 6)
	mm.mesh = b.commit_mesh()
	var n := Quality.scale(70, 45)
	mm.instance_count = n
	for i in n:
		var far := i > n * 0.6
		var x := rng.randf_range(-160.0, 160.0)
		var z := rng.randf_range(-160.0, 160.0)
		var y := rng.randf_range(-45.0, -18.0) if not far else rng.randf_range(20.0, 70.0)
		if far:
			var a := rng.randf() * TAU
			x = cos(a) * rng.randf_range(170.0, 260.0)
			z = sin(a) * rng.randf_range(170.0, 260.0)
		var s := rng.randf_range(10.0, 24.0)
		mm.set_instance_transform(i, Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(s, s * 0.8, s)), Vector3(x, y, z)))
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	mmi.material_override = Mats.pbr(CLOUD, 1.0)
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mmi)


func _dressing() -> void:
	var avoid := [Vector3(0, 0, 15), Vector3(12, 0, 6), Vector3(-8, 0, 22), Vector3(20, 0, 20), Vector3(-18, 0, 8)]
	var n := 0
	var tries := 0
	while n < Quality.scale(40, 26) and tries < 2000:
		tries += 1
		var x := rng.randf_range(-110.0, 110.0)
		var z := rng.randf_range(-125.0, 80.0)
		if not _clear_spot(x, z, avoid, 8.0, 0.8):
			continue
		_tree(0, Vector3(x, g(x, z) - 0.2, z), rng.randf_range(0.7, 1.1))
		n += 1
	_scatter(Quality.scale(400, 220), 0.14, [Color(0.95, 0.85, 0.3), Color(0.95, 0.5, 0.6), Color(0.98, 0.98, 0.98), Color(0.5, 0.6, 1.0)], avoid)


func _set_pieces() -> void:
	_cyl(Vector3(12.0, g(12.0, -6.0) - 0.5, -6.0), 1.6, 4.8, STONE, 10, 1.4)
	_moon_on_ground("welcome", 12.0, -6.0, 5.6)
	# Clouds between islands.
	_mover(Vector3(8.0, 1.0, -14.0), Vector3(27.0, 5.0, -30.0), Vector3(4.5, 0.8, 4.5), 6.0)
	_place_moon("cloud1", Vector3(40.0, g(40.0, -30.0) + 6.2, -30.0))
	_cyl(Vector3(40.0, g(40.0, -30.0) - 0.5, -30.0), 1.4, 4.8, STONE, 10)
	_mover(Vector3(37.0, 7.0, -42.0), Vector3(18.0, 11.0, -58.0), Vector3(4.5, 0.8, 4.5), 7.0)
	_cyl(Vector3(10.0, g(10.0, -72.0) - 0.5, -72.0), 1.4, 4.8, STONE, 10)
	_place_moon("cloud2", Vector3(10.0, g(10.0, -72.0) + 6.2, -72.0))
	_mover(Vector3(26.0, 13.0, -70.0), Vector3(52.0, 17.0, -70.0), Vector3(4.5, 0.8, 4.5), 7.0)
	_mover(Vector3(-38.0, 25.0, -98.0), Vector3(-88.0, 31.0, -74.0), Vector3(5.0, 0.8, 5.0), 10.0)
	_mover(Vector3(-2.0, 13.0, -84.0), Vector3(-10.0, 23.0, -96.0), Vector3(4.5, 0.8, 4.5), 7.0)
	_moon_on_ground("peak", -95.0, -70.0, 1.6)
	_mover(Vector3(10.0, 1.0, 34.0), Vector3(26.0, 3.0, 50.0), Vector3(4.5, 0.8, 4.5), 6.0)
	_moon_on_ground("far", 30.0, 62.0, 1.4)
	_chest_at(Vector3(36.0, g(36.0, 66.0) + 0.5, 66.0))
	# Spring to a ring in the sky.
	_spring(Vector3(20.0, g(20.0, 20.0), 20.0), 28.0)
	var ring := MeshLib.Builder.new()
	var prof := []
	for i in 13:
		var a := TAU * i / 12.0
		prof.append(Vector2(3.0 + 0.5 * cos(a), 0.5 * sin(a)))
	ring.lathe(prof, 20, Vector3.ZERO, Basis.IDENTITY, false)
	var rm := ring.commit(Mats.pbr(Color(1.0, 0.85, 0.3), 0.4, 0.6), "SkyRing")
	rm.position = Vector3(20.0, 11.0, 14.5)
	add_child(rm)
	_box(Vector3(20.0, 10.5, 14.5), Vector3(5.0, 0.4, 5.0), STONE_DARK)
	_place_moon("spring", Vector3(20.0, 12.4, 14.5))
	# Wind column: it lifts you, then drift over to the ledge beside it.
	_updraft(Vector3(-18.0, 0.0, 8.0), 2.6, 24.0)
	_box(Vector3(-13.5, 19.0, 12.0), Vector3(4.0, 0.4, 4.0), STONE_DARK)
	_place_moon("updraft", Vector3(-13.5, 20.8, 12.0))
	# Cannon west, bird east, stilt on D.
	_cannon(Vector3(-20.0, g(-20.0, 4.0), 4.0), Vector3(-1.0, 0.0, 0.1).normalized())
	_moon_on_ground("rocket", -72.0, 10.0, 1.4)
	_moon_on_ground("bird", 72.0, 22.0, 1.4)
	_moon_on_ground("lonely", -50.0, 62.0, 1.4)
	_cyl(Vector3(66.0, g(66.0, -64.0) - 0.5, -64.0), 2.4, 9.6, STONE, 12, 2.0)
	_place_moon("stilt", Vector3(66.0, g(66.0, -64.0) + 10.6, -64.0))
	_switch_at(Vector3(4.0, g(4.0, -66.0), -66.0))
	timer_moon_pos = Vector3(62.0, g(62.0, -74.0) + 1.3, -74.0)
	# Storm island arena.
	_arena_ring(arena_center, arena_r, -PI * 0.5, STONE, STONE_DARK, 14, 4.0)
	_spot(Vector3(-24.0, g(-24.0, -114.0) + 0.06, -114.0), "spot2")
	_spot(Vector3(-8.0, g(-8.0, 30.0) + 0.06, 30.0), "spot1")
	_bell_at(Vector3(-12.0, g(-12.0, -8.0), -8.0), STONE_DARK)
	_cyl(Vector3(44.0, g(44.0, -34.0) - 0.3, -34.0), 1.4, 1.0, STONE_DARK, 8)
	_statue_at(Vector3(44.0, g(44.0, -34.0) + 0.7, -34.0), STONE_DARK, STONE)
	_slab_at(Vector3(14.0, g(14.0, -78.0) + 0.2, -78.0), STONE)
	for cpos in [Vector3(6, 0, -2), Vector3(-10, 0, 14), Vector3(42, 0, -24), Vector3(-36, 0, -30), Vector3(8, 0, -66),
			Vector3(60, 0, -72), Vector3(-14, 0, -102), Vector3(70, 0, 26), Vector3(28, 0, 58)]:
		_crate(Vector3(cpos.x, g(cpos.x, cpos.z) + 0.5, cpos.z))


func _pickups() -> void:
	_coin_line(Vector3(-6, 0, 4), Vector3(6, 0, 4), 5)
	_coin_ring(Vector3(0, 0, -6), 6.0, 8)
	_coin_ring(Vector3(40, 0, -30), 6.0, 8)
	_coin_ring(Vector3(10, 0, -72), 7.0, 8)
	_coin_ring(Vector3(-20, 0, -108), 8.0, 10)
	_coin_ring(Vector3(-40, 0, -35), 6.0, 8)
	_coin_ring(Vector3(30, 0, 62), 5.0, 6)
	_coin_ring(Vector3(-72, 0, 10), 5.0, 6)
	_coin_ring(Vector3(72, 0, 22), 5.0, 6)
	for i in 6:
		_pickup("coin", Vector3(-18.0, 3.0 + i * 3.0, 8.0))
	for i in 6:
		_pickup("coin", Vector3(20.0, 3.0 + i * 1.6, 20.0))
	_purples_at([Vector3(-12, 0, -8), Vector3(-13, 0, -6), Vector3(-14, 0, -4), Vector3(36, 0, -26), Vector3(44, 0, -36),
		Vector3(6, 0, -78), Vector3(16, 0, -66), Vector3(-30, 0, -104), Vector3(-10, 0, -112), Vector3(-44, 0, -30), Vector3(-36, 0, -40),
		Vector3(62, 0, -66), Vector3(66, 0, -76), Vector3(26, 0, 56), Vector3(34, 0, 68), Vector3(-54, 0, 58), Vector3(-46, 0, 66),
		Vector3(-76, 0, 6), Vector3(76, 0, 18), Vector3(-95, 0, -74)])
	_hearts_at([Vector3(-8, 0, 30), Vector3(40, 0, -22), Vector3(4, 0, -80), Vector3(-30, 0, -100)])
	for i in 8:
		var a := TAU * i / 8.0
		var x := cos(a) * 20.0
		var z := 10.0 + sin(a) * 20.0
		var b := _pickup("blue", Vector3(x, g(x, z) + 1.0, z))
		blue_coins.append(b)


func _creatures() -> void:
	for p in [Vector3(-12, 0, 12), Vector3(14, 0, 14), Vector3(38, 0, -24), Vector3(-38, 0, -30), Vector3(6, 0, -66),
			Vector3(-26, 0, -100), Vector3(-14, 0, -116), Vector3(30, 0, 56), Vector3(-50, 0, 66), Vector3(-12, 0, -8)]:
		_enemy("bonk", p)
	for p in [Vector3(12, 0, -8), Vector3(44, 0, -26), Vector3(14, 0, -76), Vector3(-30, 0, -112)]:
		_enemy("spiny", p)
	for p in [Vector3(8, 0, 28), Vector3(-4, 0, 32)]:
		_capturable(Captures.Frog.new(), p)
	_capturable(Captures.Stilt.new(), Vector3(58, 0, -68))
	_capturable(Captures.Bird.new(), Vector3(-14, 0, -2))
	_spawn_boss()


func _moons() -> void:
	pass


func _checkpoints() -> void:
	checkpoints = [
		{"pos": Vector3(0, 0.3, 15), "yaw": 0.0, "name": "Landing Isle"},
		{"pos": Vector3(38, g(38, -26) + 0.3, -26), "yaw": 0.0, "name": "Cloud Isle"},
		{"pos": Vector3(6, g(6, -66) + 0.3, -66), "yaw": 0.0, "name": "Middle Isle"},
		{"pos": Vector3(-20, g(-20, -92) + 0.3, -92), "yaw": 0.0, "name": "Storm Isle Gate"},
		{"pos": Vector3(-70, g(-70, 8) + 0.3, 8), "yaw": 0.0, "name": "West Isle"},
		{"pos": Vector3(70, g(70, 20) + 0.3, 20), "yaw": 0.0, "name": "East Isle"},
		{"pos": Vector3(28, g(28, 58) + 0.3, 58), "yaw": 0.0, "name": "Southern Isle"},
		{"pos": Vector3(58, g(58, -66) + 0.3, -66), "yaw": 0.0, "name": "High Isle"},
	]
