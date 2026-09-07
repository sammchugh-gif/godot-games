# Kingdom 3: Sunburn Sands. Dunes, a pyramid with a tomb inside, a stone
# lion to ride across a poison lake, an oasis, quicksand, and a mesa in the
# north where Dune Raptor waits.
class_name SandLevel
extends Level

const SAND := Color(0.9, 0.78, 0.5)
const SANDSTONE := Color(0.82, 0.62, 0.36)
const SANDSTONE_DARK := Color(0.66, 0.46, 0.26)


func _init() -> void:
	Terrain.mode = "sand"
	kingdom_id = "sand"
	kingdom_title = "SUNBURN SANDS"
	kingdom_index = 3
	loading_text = "BUILDING SUNBURN SANDS..."
	next_kingdom = "snow"
	next_kingdom_title = "FROSTBITE PEAKS"
	boss_name = "DUNE RAPTOR"
	boss_colour = Color(0.88, 0.68, 0.32)
	arena_center = Vector3(0, 10, -100)
	arena_r = 15.0
	shop_pos = Vector3(14, 0, 12)
	balloon_pos = Vector3(0, 0, 26)
	timer_moon_pos = Vector3(30.0, 11.3, -86.0)
	timer_msg = "Run east along the mesa!"
	timer_len = 12.0
	tree_tint = Color(0.95, 1.0, 0.85)
	moon_names = {
		"welcome": "Welcome to Sunburn Sands",
		"pyramid": "Top of the Pyramid",
		"tomb": "Deep in the Tomb",
		"poison": "Jaxi Across the Poison",
		"mesa": "Spire on the Mesa",
		"timer": "Mesa Dash Against the Clock",
		"oasis": "Palm Top at the Oasis",
		"stilt": "Stilt Stretch in the Sand",
		"quicksand": "Wading Through Quicksand",
		"spot1": "Glowing Spot in the Dunes",
		"spot2": "Glowing Spot on the Mesa",
		"chest": "Chest in the Rock Ring",
		"bell": "Ring the Desert Bell",
		"scarecrow": "Hat on the Sphinx",
		"slab": "Under the Cracked Slab",
		"bonks": "Bonk Bash in the Sun",
		"bluecoins": "Blue Coins Round the Oasis",
		"shop": "Moon from the Shop",
		"boss": "Dune Raptor's Mesa",
	}
	hints = [
		{"pos": Vector3(0, 0, -17), "r": 8.0, "text": "A doorway into the pyramid... and steps up the outside."},
		{"pos": Vector3(30, 0, -40), "r": 10.0, "text": "A stone lion! Throw your HAT at it to ride. It can walk on poison."},
		{"pos": Vector3(60, -2, -60), "r": 26.0, "text": "Poison! Only Jaxi can cross it."},
		{"pos": Vector3(20, 0, -30), "r": 9.0, "text": "Quicksand. You can wade through, slowly."},
		{"pos": Vector3(-70, 4, -70), "r": 12.0, "text": "This ramp climbs the mesa."},
		{"pos": Vector3(-50, 0, 30), "r": 14.0, "text": "An oasis! Frogs, palms, and a plant to stretch."},
		{"pos": Vector3(-18, 10, -100), "r": 8.0, "text": "Something is sunbathing behind those rocks..."},
	]
	shot_scenes = [
		{"name": "01_title", "pos": Vector3(0, 0.3, 15), "yaw": 0.0, "pitch": 0.2, "title": true},
		{"name": "02_pyramid", "pos": Vector3(0, 0.3, 0), "yaw": 0.0, "pitch": 0.3},
		{"name": "03_jaxi", "pos": Vector3(24, 0.5, -30), "yaw": -0.6, "pitch": 0.3},
		{"name": "04_poison", "pos": Vector3(38, 0.5, -50), "yaw": -0.8, "pitch": 0.35},
		{"name": "05_oasis", "pos": Vector3(-40, 0.5, 48), "yaw": 0.4, "pitch": 0.3},
		{"name": "06_mesa", "pos": Vector3(-40, 10.5, -84), "yaw": -1.4, "pitch": 0.35},
		{"name": "07_overview", "pos": Vector3(0, 13.7, -32), "yaw": PI, "pitch": 0.5},
	]


func _blocked(x: float, z: float) -> bool:
	if Vector2(x - 60.0, z + 60.0).length() < 26.0:
		return true
	if absf(x) < 18.0 and z > -50.0 and z < -14.0:
		return true
	if Terrain.sand_quick(x, z):
		return true
	return false


func deep_water(pos: Vector3) -> bool:
	return Vector2(pos.x - 60.0, pos.z + 60.0).length() < 21.5 and pos.y < Terrain.POISON_Y + 0.35


func shallow_water(pos: Vector3) -> bool:
	if Vector2(pos.x + 50.0, pos.z - 30.0).length() < 11.0 and pos.y < -0.2:
		return true
	return Terrain.sand_quick(pos.x, pos.z) and pos.y < g(pos.x, pos.z) + 0.6


func _environment() -> void:
	_env_setup({"top": Color(0.25, 0.5, 0.95), "horizon": Color(0.95, 0.85, 0.7), "ground": Color(0.5, 0.4, 0.25), "ground_h": Color(0.9, 0.8, 0.6),
		"sun": Color(1.0, 0.95, 0.8), "sun_energy": 1.05, "sun_rot": Vector3(-62.0, 20.0, 0.0), "ambient": Color(0.7, 0.62, 0.5), "ambient_energy": 0.5,
		"fog": Color(0.95, 0.85, 0.65), "fog_density": 0.0009})


func _water() -> void:
	_water_quad(-50.0, 30.0, 26.0, 26.0, -0.4, Mats.water(), 6)
	_water_quad(60.0, -60.0, 46.0, 46.0, Terrain.POISON_Y, Mats.liquid("poison"), 8)


func _dressing() -> void:
	var avoid := [Vector3(0, 0, 15), Vector3(14, 0, 12), Vector3(0, 0, 26), Vector3(30, 0, -40), Vector3(12, 0, -6), Vector3(20, 0, -5)]
	for i in 9:
		var a := TAU * i / 9.0
		var x := -50.0 + cos(a) * 15.0
		var z := 30.0 + sin(a) * 15.0
		_tree(2, Vector3(x, g(x, z) - 0.2, z), rng.randf_range(0.9, 1.3))
	var n := 0
	var tries := 0
	while n < Quality.scale(24, 16) and tries < 800:
		tries += 1
		var x := rng.randf_range(-125.0, 125.0)
		var z := rng.randf_range(-125.0, 125.0)
		if not _clear_spot(x, z, avoid, 10.0, 0.75):
			continue
		_tree(2, Vector3(x, g(x, z) - 0.2, z), rng.randf_range(0.7, 1.1))
		n += 1
	for i in Quality.scale(70, 45):
		var x := rng.randf_range(-125.0, 125.0)
		var z := rng.randf_range(-125.0, 125.0)
		if _clear_spot(x, z, avoid, 7.0, 0.5):
			_rock(Vector3(x, g(x, z) - 0.1, z), rng.randf_range(0.5, 1.8))
	# Cacti: tall green cylinders with arms.
	for i in Quality.scale(40, 26):
		var x := rng.randf_range(-125.0, 125.0)
		var z := rng.randf_range(-125.0, 125.0)
		if not _clear_spot(x, z, avoid, 8.0, 0.8):
			continue
		var c := MeshLib.Builder.new()
		var h := rng.randf_range(2.0, 4.0)
		c.cylinder(Vector3.ZERO, Vector3(0, h, 0), 0.35, 0.3, 8)
		c.cylinder(Vector3(0.3, h * 0.5, 0), Vector3(0.9, h * 0.5, 0), 0.18, 0.18, 6)
		c.cylinder(Vector3(0.9, h * 0.5, 0), Vector3(0.9, h * 0.85, 0), 0.18, 0.15, 6)
		var mi := c.commit(Mats.skin(Color(0.3, 0.6, 0.3)), "Cactus")
		mi.position = Vector3(x, g(x, z) - 0.1, z)
		mi.rotation.y = rng.randf() * TAU
		add_child(mi)
	_scatter(Quality.scale(300, 180), 0.22, [Color(0.55, 0.62, 0.3), Color(0.7, 0.66, 0.4)], avoid, true)


func _set_pieces() -> void:
	# Welcome pillar.
	_cyl(Vector3(12.0, g(12.0, -6.0) - 0.5, -6.0), 1.6, 4.8, SANDSTONE, 10, 1.4)
	# The pyramid: stepped tiers; the ground tier is hollow with a tomb.
	var pz := -32.0
	for i in range(1, 5):
		var w := 30.0 - 6.0 * i
		_box(Vector3(0, i * 2.4 + 1.2, pz), Vector3(w, 2.4, w), SANDSTONE if i % 2 == 0 else SANDSTONE_DARK)
	_box(Vector3(-8.5, 1.2, pz), Vector3(13.0, 2.4, 30.0), SANDSTONE_DARK)
	_box(Vector3(8.5, 1.2, pz), Vector3(13.0, 2.4, 30.0), SANDSTONE_DARK)
	_box(Vector3(0, 1.2, pz - 11.0), Vector3(4.0, 2.4, 8.0), SANDSTONE_DARK)
	_omni(Vector3(0, 2.0, pz - 3.0), Color(1.0, 0.75, 0.4), 2.0, 12.0)
	_place_moon("tomb", Vector3(0, 1.3, pz - 5.0))
	_place_moon("pyramid", Vector3(0, 4 * 2.4 + 2.4 + 1.4, pz))
	# Sphinx statue.
	_cyl(Vector3(20.0, g(20.0, -5.0) - 0.3, -5.0), 1.6, 1.0, SANDSTONE, 10)
	_statue_at(Vector3(20.0, g(20.0, -5.0) + 0.7, -5.0), SANDSTONE_DARK, SANDSTONE)
	# Poison lake island: a stepped mound Jaxi can climb.
	_cyl(Vector3(60.0, -5.6, -60.0), 6.5, 2.6, SANDSTONE_DARK, 12)
	_cyl(Vector3(60.0, -3.2, -60.0), 4.0, 2.6, SANDSTONE, 12)
	_place_moon("poison", Vector3(60.0, 0.9, -60.0))
	# Mesa: spire, switch, arena.
	_cyl(Vector3(40.0, g(40.0, -95.0) - 0.5, -95.0), 2.0, 6.0, SANDSTONE, 10, 1.6)
	_place_moon("mesa", Vector3(40.0, g(40.0, -95.0) + 7.2, -95.0))
	_switch_at(Vector3(-40.0, g(-40.0, -80.0), -80.0))
	_arena_ring(arena_center, arena_r, PI, SANDSTONE, SANDSTONE_DARK)
	# Oasis: a palm-trunk pillar for the frog moon and a stilt spire.
	_cyl(Vector3(-58.0, g(-58.0, 22.0) - 0.5, 22.0), 1.0, 8.0, Color(0.5, 0.35, 0.2), 8)
	_place_moon("oasis", Vector3(-58.0, g(-58.0, 22.0) + 9.0, 22.0))
	_cyl(Vector3(-30.0, g(-30.0, 52.0) - 0.5, 52.0), 2.4, 9.6, SANDSTONE, 12, 2.0)
	_place_moon("stilt", Vector3(-30.0, g(-30.0, 52.0) + 10.6, 52.0))
	# Quicksand discs.
	for q in [Vector3(20, 0, -30), Vector3(-22, 0, -46)]:
		var d := MeshLib.Builder.new()
		d.lathe([Vector2(0.0, 0.0), Vector2(8.0, 0.0), Vector2(8.0, 0.04), Vector2(0.0, 0.04)], 20)
		var mi := d.commit(Mats.pbr(Color(0.62, 0.5, 0.3), 0.95), "Quicksand")
		mi.position = Vector3(q.x, g(q.x, q.z) + 0.05, q.z)
		add_child(mi)
	_moon_on_ground("quicksand", 20.0, -30.0)
	_moon_on_ground("welcome", 12.0, -6.0, 5.6)
	# Rock ring with the chest.
	for i in 8:
		var a := TAU * i / 8.0
		if i == 2:
			continue
		var x := 70.0 + cos(a) * 5.0
		var z := 20.0 + sin(a) * 5.0
		_cyl(Vector3(x, g(x, z) - 0.5, z), 1.4, 2.5 + (i % 3), SANDSTONE_DARK, 8)
	_chest_at(Vector3(70.0, g(70.0, 20.0) + 0.5, 20.0))
	_bell_at(Vector3(-20.0, g(-20.0, -10.0), -10.0), SANDSTONE_DARK)
	_slab_at(Vector3(40.0, g(40.0, 40.0) + 0.2, 40.0), SANDSTONE)
	_spot(Vector3(-70.0, g(-70.0, -20.0) + 0.06, -20.0), "spot1")
	_spot(Vector3(50.0, g(50.0, -108.0) + 0.06, -108.0), "spot2")
	for cpos in [Vector3(8, 0, 2), Vector3(-14, 0, 8), Vector3(30, 0, 30), Vector3(-60, 0, -30), Vector3(60, 0, 40),
			Vector3(-90, 0, 20), Vector3(20, 10, -110), Vector3(-30, 10, -95)]:
		_crate(Vector3(cpos.x, g(cpos.x, cpos.z) + 0.5, cpos.z))


func _pickups() -> void:
	_coin_line(Vector3(-6, 0, 4), Vector3(6, 0, 4), 5)
	_coin_ring(Vector3(0, 0, -8), 5.0, 8)
	_coin_line(Vector3(20, 0, -14), Vector3(30, 0, -36), 6)
	_coin_line(Vector3(-40, 0, 0), Vector3(-50, 0, 20), 5)
	_coin_ring(Vector3(-50, 0, 30), 6.0, 8)
	_coin_line(Vector3(-52, 0, -60), Vector3(-72, 0, -76), 6)
	_coin_line(Vector3(-60, 0, -90), Vector3(-20, 0, -100), 6)
	_coin_ring(Vector3(0, 0, -100), 6.0, 8)
	_coin_line(Vector3(30, 0, 40), Vector3(70, 0, 40), 6)
	_coin_line(Vector3(40, 0, -50), Vector3(60, 0, -80), 5)
	_coin_ring(Vector3(90, 0, -20), 5.0, 6)
	for i in 5:
		_pickup("coin", Vector3(0, 2.4 * i + 3.6, -32.0 + 15.0 - 3.0 * i))
	_purples_at([Vector3(-12, 0, -8), Vector3(-13, 0, -6), Vector3(-14, 0, -4), Vector3(-6, 3.6, -32), Vector3(6, 3.6, -32),
		Vector3(36, 0, -42), Vector3(38, 0, -44), Vector3(60, -1.8, -50), Vector3(60, -1.8, -70),
		Vector3(-46, 0, 26), Vector3(-54, 0, 34), Vector3(-40, 10, -76), Vector3(-42, 10, -78),
		Vector3(70, 0, 26), Vector3(20, 0, -34), Vector3(-90, 0, 40), Vector3(-92, 0, 42), Vector3(90, 0, 60), Vector3(92, 0, 62), Vector3(0, 10, -116)])
	_hearts_at([Vector3(-8, 0, 30), Vector3(-70, 0, -60), Vector3(20, 0, -112), Vector3(80, 0, -20)])
	for i in 8:
		var a := TAU * i / 8.0
		var x := -50.0 + cos(a) * 11.0
		var z := 30.0 + sin(a) * 11.0
		var b := _pickup("blue", Vector3(x, g(x, z) + 1.0, z))
		blue_coins.append(b)


func _creatures() -> void:
	for p in [Vector3(-15, 0, -10), Vector3(20, 0, 20), Vector3(40, 0, -12), Vector3(-40, 0, -30), Vector3(-80, 0, 0), Vector3(80, 0, 0),
			Vector3(-20, 0, -90), Vector3(20, 0, -90), Vector3(30, 0, 60), Vector3(-60, 0, 70)]:
		_enemy("bonk", p)
	for p in [Vector3(10, 0, -55), Vector3(-30, 0, -70), Vector3(60, 0, 60), Vector3(-45, 0, -110)]:
		_enemy("spiny", p)
	for p in [Vector3(-44, 0, 20), Vector3(-56, 0, 38), Vector3(-38, 0, 36)]:
		_capturable(Captures.Frog.new(), p)
	_capturable(Captures.Stilt.new(), Vector3(-40, 0, 44))
	_capturable(Captures.Jaxi.new(), Vector3(30, 0, -40), PI)
	_spawn_boss()


func _moons() -> void:
	pass


func _checkpoints() -> void:
	checkpoints = [
		{"pos": Vector3(0, 0.3, 15), "yaw": 0.0, "name": "Landing Dune"},
		{"pos": Vector3(0, g(0, -12) + 0.3, -12), "yaw": 0.0, "name": "Pyramid Door"},
		{"pos": Vector3(30, g(30, -34) + 0.3, -34), "yaw": 0.0, "name": "Jaxi Stand"},
		{"pos": Vector3(-70, g(-70, -80) + 0.3, -80), "yaw": -PI * 0.5, "name": "Mesa Top"},
		{"pos": Vector3(-20, g(-20, -100) + 0.3, -100), "yaw": -PI * 0.5, "name": "Arena Gate"},
		{"pos": Vector3(-50, g(-50, 46) + 0.3, 46), "yaw": 0.0, "name": "Oasis"},
		{"pos": Vector3(40, g(40, -56) + 0.3, -56), "yaw": -PI * 0.5, "name": "Poison Shore"},
	]
