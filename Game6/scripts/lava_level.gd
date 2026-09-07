# Kingdom 5: Volcano Bay. Rock islands in a sea of lava, bridges and
# springs between the near ones, a fireball to swim the far ones, a rocket
# cannon, and a volcano to climb with a moon in its crater. Magma Raptor
# holds the western island.
class_name LavaLevel
extends Level

const BASALT := Color(0.3, 0.28, 0.3)
const BASALT_DARK := Color(0.2, 0.18, 0.2)
const EMBER := Color(1.0, 0.5, 0.15)


func _init() -> void:
	Terrain.mode = "lava"
	kingdom_id = "lava"
	kingdom_title = "VOLCANO BAY"
	kingdom_index = 5
	loading_text = "BUILDING VOLCANO BAY..."
	next_kingdom = "sky"
	next_kingdom_title = "CLOUD ISLANDS"
	boss_name = "MAGMA RAPTOR"
	boss_colour = Color(0.25, 0.15, 0.18)
	boss_metal = true
	boss_extra_hp = 1
	arena_center = Vector3(-42, 1, -26)
	arena_r = 11.0
	shop_pos = Vector3(12, 0, 6)
	balloon_pos = Vector3(-8, 0, 22)
	timer_moon_pos = Vector3(52.0, 3.5, -30.0)
	timer_msg = "Quick! The moon is on the far side of this island."
	timer_len = 10.0
	moon_names = {
		"welcome": "Welcome to Volcano Bay",
		"rim": "Rim of the Volcano",
		"crater": "Blaze in the Crater",
		"blaze": "Far Island Swim",
		"rocket": "Rocket to the East Isle",
		"springs": "Spring Hopper",
		"timer": "Island Dash Against the Clock",
		"stilt": "Stilt Stretch on the South Isle",
		"spot1": "Glowing Spot on the Landing Isle",
		"spot2": "Glowing Spot at the Volcano Foot",
		"chest": "Chest on the West Isle",
		"bell": "Ring the Bay Bell",
		"scarecrow": "Hat on the Stone Idol",
		"slab": "Under the Cracked Basalt",
		"bonks": "Bonk Bash by the Lava",
		"bluecoins": "Blue Coins Round the Shore",
		"shop": "Moon from the Shop",
		"boss": "Magma Raptor's Isle",
	}
	hints = [
		{"pos": Vector3(0, 0, 36), "r": 10.0, "text": "Lava! Fall in and it's back to the flag. Only a fireball can swim it."},
		{"pos": Vector3(10, 0, 34), "r": 8.0, "text": "A fireball in the lava. Throw your HAT at it, then swim. JUMP is a huge leap."},
		{"pos": Vector3(18, 0, -2), "r": 8.0, "text": "A bridge to the next island."},
		{"pos": Vector3(-19, 0, 8), "r": 6.0, "text": "A spring! Jump onto it and it throws you over the lava."},
		{"pos": Vector3(12, 3, -70), "r": 10.0, "text": "The volcano is climbable. Its rim has a moon, and the crater hides another."},
		{"pos": Vector3(-30, 1, -26), "r": 8.0, "text": "Something glows behind the black rocks..."},
	]
	shot_scenes = [
		{"name": "01_title", "pos": Vector3(0, 0.3, 15), "yaw": 0.0, "pitch": 0.2, "title": true},
		{"name": "02_landing", "pos": Vector3(0, 0.3, 4), "yaw": 0.0, "pitch": 0.3},
		{"name": "03_shore", "pos": Vector3(6, 0.5, 30), "yaw": PI, "pitch": 0.35},
		{"name": "04_bridge", "pos": Vector3(20, 0.5, -6), "yaw": -0.9, "pitch": 0.3},
		{"name": "05_volcano", "pos": Vector3(12, 3.5, -56), "yaw": 0.0, "pitch": 0.5},
		{"name": "06_rim", "pos": Vector3(0, 30.5, -96), "yaw": 0.0, "pitch": 0.5},
		{"name": "07_arena", "pos": Vector3(-28, 1.5, -26), "yaw": PI * 0.5, "pitch": 0.3},
	]


func _blocked(x: float, z: float) -> bool:
	return g(x, z) < 0.5


func lava_at(p: Vector3) -> bool:
	if Vector2(p.x, p.z + 108.0).length() < 9.0:
		return p.y < Terrain.CRATER_Y + 0.5
	return p.y < Terrain.LAVA_Y + 0.5 and g(p.x, p.z) < Terrain.LAVA_Y


func lava_level(p: Vector3) -> float:
	return Terrain.CRATER_Y if Vector2(p.x, p.z + 108.0).length() < 9.0 else Terrain.LAVA_Y


func deep_water(pos: Vector3) -> bool:
	return lava_at(pos)


func _environment() -> void:
	_env_setup({"top": Color(0.12, 0.05, 0.08), "horizon": Color(0.7, 0.3, 0.12), "ground": Color(0.3, 0.08, 0.02), "ground_h": Color(0.6, 0.25, 0.1),
		"sun": Color(1.0, 0.7, 0.5), "sun_energy": 0.7, "sun_rot": Vector3(-30.0, 60.0, 0.0), "ambient": Color(0.6, 0.3, 0.2), "ambient_energy": 0.6,
		"fog": Color(0.45, 0.15, 0.08), "fog_density": 0.002, "sun_size": 6.0})
	for p in [Vector3(0, 2, 40), Vector3(-30, 2, 10), Vector3(30, 2, -40), Vector3(-42, 3, -26), Vector3(0, 28, -108), Vector3(60, 2, 10)]:
		_omni(p, EMBER, 1.4, 30.0)
	var embers := CPUParticles3D.new()
	embers.position = Vector3(0, 30, -108)
	embers.amount = 60
	embers.lifetime = 3.0
	embers.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	embers.emission_sphere_radius = 8.0
	embers.direction = Vector3.UP
	embers.spread = 20.0
	embers.initial_velocity_min = 6.0
	embers.initial_velocity_max = 12.0
	embers.gravity = Vector3(0, -3, 0)
	embers.scale_amount_min = 0.15
	embers.scale_amount_max = 0.4
	embers.mesh = SphereMesh.new()
	(embers.mesh as SphereMesh).radius = 0.5
	(embers.mesh as SphereMesh).height = 1.0
	embers.material_override = Mats.unshaded(Color(1.0, 0.6, 0.2))
	add_child(embers)


func _water() -> void:
	_water_quad(0.0, 0.0, 270.0, 270.0, Terrain.LAVA_Y, Mats.liquid("lava"), 14)
	_water_quad(0.0, -108.0, 19.0, 19.0, Terrain.CRATER_Y, Mats.liquid("lava"), 4)


func _dressing() -> void:
	var avoid := [Vector3(0, 0, 15), Vector3(12, 0, 6), Vector3(-8, 0, 22)]
	for i in Quality.scale(60, 40):
		var x := rng.randf_range(-100.0, 100.0)
		var z := rng.randf_range(-90.0, 90.0)
		if _clear_spot(x, z, avoid, 6.0, 0.6):
			_rock(Vector3(x, g(x, z) - 0.1, z), rng.randf_range(0.6, 2.0))
	# Dead trees on the landing isle.
	for i in 6:
		var a := TAU * i / 6.0
		var x := cos(a) * 17.0
		var z := 12.0 + sin(a) * 17.0
		if _clear_spot(x, z, avoid, 6.0, 0.6):
			_tree(1, Vector3(x, g(x, z) - 0.2, z), 0.9)


func _bridge(a: Vector3, b: Vector3) -> void:
	var d := b - a
	var len := Vector2(d.x, d.z).length()
	var ang := atan2(-d.z, d.x)
	var mid := (a + b) * 0.5
	_box(mid + Vector3(0, 0.3, 0), Vector3(len + 2.0, 0.6, 3.6), Color(0.45, 0.3, 0.2), 0.9, Basis(Vector3.UP, ang))
	for s in [-1.0, 1.0]:
		_box(mid + Vector3(0, 1.1, 0) + Vector3(-sin(ang), 0, -cos(ang)) * 1.6 * s, Vector3(len + 2.0, 0.15, 0.15), Color(0.35, 0.22, 0.14), 0.9, Basis(Vector3.UP, ang))


func _set_pieces() -> void:
	_cyl(Vector3(8.0, g(8.0, -2.0) - 0.5, -2.0), 1.6, 4.8, BASALT, 10, 1.4)
	_moon_on_ground("welcome", 8.0, -2.0, 5.6)
	# Bridges: landing isle to the east isle, landing isle to the boss isle,
	# east isle on to the volcano foot.
	_bridge(Vector3(15.5, 0.0, -0.6), Vector3(33.8, 2.0, -15.4))
	_bridge(Vector3(-14.8, 0.0, -1.4), Vector3(-32.7, 1.0, -17.6))
	_bridge(Vector3(35.7, 2.0, -30.4), Vector3(19.5, 3.0, -52.0))
	# Springs across to the west isle and back.
	_spring(Vector3(-19.0, g(-19.0, 8.0), 8.0), 26.0, Vector3(-14.0, 0.0, 2.0))
	_spring(Vector3(-46.0, g(-46.0, 18.0), 18.0), 26.0, Vector3(14.0, 0.0, -2.0))
	_cyl(Vector3(-56.0, g(-56.0, 14.0) - 0.5, 14.0), 1.4, 3.0, BASALT, 8)
	_place_moon("springs", Vector3(-56.0, g(-56.0, 14.0) + 4.2, 14.0))
	_chest_at(Vector3(-60.0, g(-60.0, 26.0) + 0.5, 26.0))
	# East isle: switch and timer moon pillar, slab.
	_switch_at(Vector3(36.0, g(36.0, -18.0), -18.0))
	_cyl(Vector3(48.0, g(48.0, -28.0) - 0.5, -28.0), 1.2, 2.0, BASALT, 8)
	timer_moon_pos = Vector3(48.0, g(48.0, -28.0) + 3.2, -28.0)
	_slab_at(Vector3(44.0, g(44.0, -14.0) + 0.2, -14.0), BASALT)
	# Volcano rim and crater pillar.
	_moon_on_ground("rim", 0.0, -96.0, 1.6)
	_cyl(Vector3(0.0, Terrain.CRATER_Y - 2.5, -108.0), 1.2, 3.0, BASALT_DARK, 8)
	_place_moon("crater", Vector3(0.0, Terrain.CRATER_Y + 1.8, -108.0))
	# Far islands: Blaze swim moon, stilt isle, rocket isle.
	_moon_on_ground("blaze", -80.0, -70.0, 1.4)
	_cyl(Vector3(-16.0, g(-16.0, 68.0) - 0.5, 68.0), 2.4, 9.6, BASALT, 12, 2.0)
	_place_moon("stilt", Vector3(-16.0, g(-16.0, 68.0) + 10.6, 68.0))
	_cannon(Vector3(10.0, g(10.0, 24.0), 24.0), Vector3(66.0, 0.0, -92.0).normalized())
	_moon_on_ground("rocket", 76.0, -68.0, 1.4)
	# Boss isle.
	_arena_ring(arena_center, arena_r, 0.0, BASALT, BASALT_DARK, 14, 5.0)
	# Bell and idol on the landing isle.
	_bell_at(Vector3(-10.0, g(-10.0, 0.0), 0.0), BASALT_DARK)
	_cyl(Vector3(8.0, g(8.0, 22.0) - 0.3, 22.0), 1.4, 1.0, BASALT_DARK, 8)
	_statue_at(Vector3(8.0, g(8.0, 22.0) + 0.7, 22.0), BASALT, BASALT_DARK)
	_spot(Vector3(-10.0, g(-10.0, 14.0) + 0.06, 14.0), "spot1")
	_spot(Vector3(14.0, g(14.0, -62.0) + 0.06, -62.0), "spot2")
	for cpos in [Vector3(4, 0, 2), Vector3(-12, 0, 4), Vector3(40, 0, -26), Vector3(-40, 0, -34), Vector3(-52, 0, 14),
			Vector3(60, 0, 36), Vector3(10, 0, -58), Vector3(-24, 0, 60)]:
		_crate(Vector3(cpos.x, g(cpos.x, cpos.z) + 0.5, cpos.z))


func _pickups() -> void:
	_coin_line(Vector3(-6, 0, 4), Vector3(6, 0, 4), 5)
	_coin_ring(Vector3(0, 0, 12), 8.0, 10)
	_coin_line(Vector3(18, 0, -2), Vector3(32, 0, -14), 5)
	_coin_ring(Vector3(42, 0, -22), 6.0, 8)
	_coin_line(Vector3(12, 0, -52), Vector3(4, 0, -76), 6)
	_coin_line(Vector3(0, 0, -80), Vector3(0, 0, -96), 4)
	_coin_ring(Vector3(-42, 0, -26), 6.0, 8)
	_coin_ring(Vector3(-54, 0, 20), 5.0, 6)
	_coin_ring(Vector3(64, 0, 32), 5.0, 6)
	_coin_ring(Vector3(-22, 0, 64), 5.0, 6)
	for i in 8:
		_pickup("coin", Vector3(18.0 + i * 6.0, 4.0 + sin(i * 0.8), 26.0 - i * 9.0))
	_purples_at([Vector3(-10, 0, -4), Vector3(-12, 0, -2), Vector3(-14, 0, 0), Vector3(40, 0, -30), Vector3(46, 0, -30),
		Vector3(-40, 0, -20), Vector3(-44, 0, -32), Vector3(-52, 0, 16), Vector3(-58, 0, 26), Vector3(10, 0, -66), Vector3(14, 0, -70),
		Vector3(4, 0, -96), Vector3(-4, 0, -96), Vector3(-20, 0, 60), Vector3(-24, 0, 68), Vector3(64, 0, 28), Vector3(68, 0, 36),
		Vector3(-78, 0, -66), Vector3(-82, 0, -74), Vector3(76, 0, -64)])
	_hearts_at([Vector3(-8, 0, 30), Vector3(40, 0, -18), Vector3(8, 0, -70), Vector3(-36, 0, -36)])
	for i in 8:
		var a := TAU * i / 8.0
		var x := cos(a) * 20.0
		var z := 12.0 + sin(a) * 20.0
		var b := _pickup("blue", Vector3(x, g(x, z) + 1.0, z))
		blue_coins.append(b)


func _creatures() -> void:
	for p in [Vector3(-12, 0, 12), Vector3(14, 0, 14), Vector3(38, 0, -20), Vector3(-38, 0, -30), Vector3(6, 0, -60),
			Vector3(-56, 0, 24), Vector3(-22, 0, 60), Vector3(64, 0, 34), Vector3(-12, 0, 0), Vector3(18, 0, -66)]:
		_enemy("bonk", p)
	for p in [Vector3(10, 0, -2), Vector3(46, 0, -26), Vector3(10, 0, -54), Vector3(-46, 0, -20)]:
		_enemy("spiny", p)
	_capturable(Captures.Stilt.new(), Vector3(-26, 0, 60))
	var bz := Captures.Blaze.new()
	add_child(bz)
	bz.global_position = Vector3(10, Terrain.LAVA_Y + 0.2, 36)
	bz.setup(self, player)
	capturables.append(bz)
	_spawn_boss()


func _moons() -> void:
	pass


func _checkpoints() -> void:
	checkpoints = [
		{"pos": Vector3(0, 0.3, 12), "yaw": 0.0, "name": "Landing Isle"},
		{"pos": Vector3(40, g(40, -20) + 0.3, -20), "yaw": 0.0, "name": "East Isle"},
		{"pos": Vector3(14, g(14, -56) + 0.3, -56), "yaw": 0.0, "name": "Volcano Foot"},
		{"pos": Vector3(0, g(0, -84) + 0.3, -84), "yaw": 0.0, "name": "Volcano Slope"},
		{"pos": Vector3(-31, g(-31, -26) + 0.3, -26), "yaw": PI * 0.5, "name": "Boss Isle Gate"},
		{"pos": Vector3(-54, g(-54, 22) + 0.3, 22), "yaw": 0.0, "name": "West Isle"},
		{"pos": Vector3(-20, g(-20, 62) + 0.3, 62), "yaw": 0.0, "name": "South Isle"},
		{"pos": Vector3(74, g(74, -66) + 0.3, -66), "yaw": 0.0, "name": "East Isle Far"},
		{"pos": Vector3(-78, g(-78, -68) + 0.3, -68), "yaw": 0.0, "name": "Far West Isle"},
	]
