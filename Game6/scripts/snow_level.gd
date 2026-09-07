# Kingdom 4: Frostbite Peaks. A village of igloos, a frozen lake to slide
# on, a bird to fly, and a great mountain to climb, with Frost Raptor on a
# shelf on its western side.
class_name SnowLevel
extends Level

const SNOW := Color(0.94, 0.96, 1.0)
const ICE := Color(0.7, 0.88, 1.0)
const SLATE := Color(0.45, 0.5, 0.6)
var _snowfall: CPUParticles3D


func _init() -> void:
	Terrain.mode = "snow"
	kingdom_id = "snow"
	kingdom_title = "FROSTBITE PEAKS"
	kingdom_index = 4
	loading_text = "BUILDING FROSTBITE PEAKS..."
	next_kingdom = "lava"
	next_kingdom_title = "VOLCANO BAY"
	boss_name = "FROST RAPTOR"
	boss_colour = Color(0.88, 0.94, 1.0)
	boss_extra_hp = 1
	arena_center = Vector3(-60, 12, -90)
	arena_r = 14.0
	shop_pos = Vector3(14, 0, 12)
	balloon_pos = Vector3(0, 0, 26)
	timer_moon_pos = Vector3(0.0, 0.0, -30.0)
	timer_msg = "Ski down! The moon is at the bottom of the mountain."
	timer_len = 16.0
	tree_tint = Color(0.8, 0.95, 0.9)
	moon_names = {
		"welcome": "Welcome to Frostbite Peaks",
		"summit": "Summit of the Great Peak",
		"bird": "Skyla's Nest on the Spire",
		"lake": "Middle of the Frozen Lake",
		"igloo": "Inside the Big Igloo",
		"timer": "Ski Run Against the Clock",
		"frog": "Frog Hop to the Pine Pillar",
		"stilt": "Stilt Stretch in the Snow",
		"spot1": "Glowing Spot in the Snow",
		"spot2": "Glowing Spot by the Lake",
		"chest": "Chest in the Pine Grove",
		"bell": "Ring the Village Bell",
		"scarecrow": "Hat on the Snowman",
		"slab": "Under the Ice Slab",
		"bonks": "Snowbonk Bash",
		"bluecoins": "Blue Coins Across the Ice",
		"shop": "Moon from the Shop",
		"boss": "Frost Raptor's Shelf",
	}
	hints = [
		{"pos": Vector3(0, 0, -40), "r": 10.0, "text": "The mountain goes all the way up. Just keep climbing."},
		{"pos": Vector3(-20, 0, -40), "r": 10.0, "text": "A bird! Throw your HAT at it. Tap JUMP to flap. Land to rest."},
		{"pos": Vector3(50, 0, 40), "r": 30.0, "text": "Ice! You slide. Plan your turns early."},
		{"pos": Vector3(5, 36, -92), "r": 8.0, "text": "Ground POUND the switch and race to the bottom!"},
		{"pos": Vector3(-16, 0, -10), "r": 7.0, "text": "There is an igloo big enough to walk into."},
		{"pos": Vector3(-42, 12, -90), "r": 8.0, "text": "Something icy is sleeping on this shelf..."},
	]
	shot_scenes = [
		{"name": "01_title", "pos": Vector3(0, 0.3, 15), "yaw": 0.0, "pitch": 0.2, "title": true},
		{"name": "02_village", "pos": Vector3(0, 0.3, 4), "yaw": 0.0, "pitch": 0.3},
		{"name": "03_lake", "pos": Vector3(24, 0.5, 30), "yaw": -0.9, "pitch": 0.3},
		{"name": "04_mountain", "pos": Vector3(0, Terrain.height(0.0, -30.0) + 0.5, -30), "yaw": 0.0, "pitch": 0.5},
		{"name": "05_summit", "pos": Vector3(0, 39.0, -80), "yaw": PI, "pitch": 0.5},
		{"name": "06_arena", "pos": Vector3(-44, 12.5, -90), "yaw": PI * 0.5, "pitch": 0.3},
	]


func _blocked(x: float, z: float) -> bool:
	if Terrain.snow_ice(x, z):
		return true
	if g(x, z) > 20.0:
		return true
	if Vector2(x - arena_center.x, z - arena_center.z).length() < 20.0:
		return true
	return false


func ice_at(p: Vector3) -> bool:
	return Terrain.snow_ice(p.x, p.z) and p.y < 1.0


func _environment() -> void:
	_env_setup({"top": Color(0.22, 0.42, 0.85), "horizon": Color(0.75, 0.85, 1.0), "ground": Color(0.6, 0.65, 0.75), "ground_h": Color(0.85, 0.9, 1.0),
		"sun": Color(1.0, 0.95, 0.9), "sun_energy": 0.9, "sun_rot": Vector3(-38.0, 50.0, 0.0), "ambient": Color(0.6, 0.7, 0.9), "ambient_energy": 0.6,
		"fog": Color(0.8, 0.87, 1.0), "fog_density": 0.0005})
	_snowfall = CPUParticles3D.new()
	_snowfall.amount = Quality.scale(300, 160)
	_snowfall.lifetime = 5.0
	_snowfall.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	_snowfall.emission_box_extents = Vector3(30, 1, 30)
	_snowfall.direction = Vector3.DOWN
	_snowfall.spread = 15.0
	_snowfall.initial_velocity_min = 3.0
	_snowfall.initial_velocity_max = 5.0
	_snowfall.gravity = Vector3.ZERO
	_snowfall.scale_amount_min = 0.08
	_snowfall.scale_amount_max = 0.16
	_snowfall.mesh = SphereMesh.new()
	(_snowfall.mesh as SphereMesh).radius = 0.5
	(_snowfall.mesh as SphereMesh).height = 1.0
	_snowfall.material_override = Mats.unshaded(Color(1, 1, 1, 0.8))
	add_child(_snowfall)


func _kingdom_physics(_dt: float) -> void:
	if _snowfall and player:
		_snowfall.global_position = player.actor_pos() + Vector3(0, 18, 0)


func _dressing() -> void:
	var avoid := [Vector3(0, 0, 15), Vector3(14, 0, 12), Vector3(0, 0, 26), Vector3(-16, 0, -10), Vector3(14, 0, -12), Vector3(-20, 0, -40), Vector3(20, 0, 30)]
	var n := 0
	var tries := 0
	while n < Quality.scale(110, 70) and tries < 3000:
		tries += 1
		var x := rng.randf_range(-125.0, 125.0)
		var z := rng.randf_range(-125.0, 125.0)
		if not _clear_spot(x, z, avoid, 9.0, 0.75):
			continue
		_tree(1, Vector3(x, g(x, z) - 0.2, z), rng.randf_range(0.8, 1.4))
		n += 1
	for i in Quality.scale(50, 30):
		var x := rng.randf_range(-125.0, 125.0)
		var z := rng.randf_range(-125.0, 125.0)
		if _clear_spot(x, z, avoid, 7.0, 0.5):
			_rock(Vector3(x, g(x, z) - 0.1, z), rng.randf_range(0.5, 1.6))


func _igloo(pos: Vector3, r: float, big: bool) -> void:
	var h := 3.0 if big else 2.0
	for i in 10:
		var a := TAU * i / 10.0
		if i == 7 or (big and i == 8):
			continue
		var p := pos + Vector3(cos(a) * r, h * 0.5, sin(a) * r)
		_box(p, Vector3(2.2, h, 1.4), SNOW, 0.95, Basis(Vector3.UP, -a))
	_box(pos + Vector3(0, h + 0.3, 0), Vector3(r * 2.2, 0.6, r * 2.2), SNOW)
	var d := MeshLib.Builder.new()
	var prof := []
	for i in 6:
		var t := float(i) / 5.0
		prof.append(Vector2(r * 1.1 * cos(t * PI * 0.5), h + 0.6 + r * 0.7 * sin(t * PI * 0.5)))
	d.lathe(prof, 16)
	var mi := d.commit(Mats.pbr(SNOW, 0.95), "Dome")
	mi.position = pos
	add_child(mi)
	if big:
		_omni(pos + Vector3(0, 2.0, 0), Color(1.0, 0.85, 0.6), 1.5, 10.0)


func _set_pieces() -> void:
	_cyl(Vector3(12.0, g(12.0, -6.0) - 0.5, -6.0), 1.6, 4.8, SLATE, 10, 1.4)
	_moon_on_ground("welcome", 12.0, -6.0, 5.6)
	# Village igloos; the big one has a moon inside.
	_igloo(Vector3(-16.0, g(-16.0, -10.0) - 0.2, -10.0), 4.0, true)
	_place_moon("igloo", Vector3(-16.0, g(-16.0, -10.0) + 1.2, -10.0))
	_igloo(Vector3(-26.0, g(-26.0, 4.0) - 0.2, 4.0), 2.6, false)
	_igloo(Vector3(-8.0, g(-8.0, 22.0) - 0.2, 22.0), 2.6, false)
	_igloo(Vector3(24.0, g(24.0, -14.0) - 0.2, -14.0), 2.6, false)
	# Snowman statue.
	_statue_at(Vector3(14.0, g(14.0, -12.0), -12.0), SNOW, SNOW)
	_bell_at(Vector3(-4.0, g(-4.0, -18.0), -18.0), SLATE)
	# Summit, spire for the bird, ski switch.
	_moon_on_ground("summit", 0.0, -95.0, 1.6)
	_cyl(Vector3(30.0, g(30.0, -90.0) - 0.5, -90.0), 2.0, 8.0, SLATE, 10, 1.6)
	_place_moon("bird", Vector3(30.0, g(30.0, -90.0) + 9.2, -90.0))
	_switch_at(Vector3(5.0, g(5.0, -92.0), -92.0))
	timer_moon_pos = Vector3(0.0, g(0.0, -30.0) + 1.3, -30.0)
	# Frozen lake moon, pine pillar for the frog, stilt spire.
	_place_moon("lake", Vector3(50.0, 0.9, 40.0))
	_cyl(Vector3(20.0, g(20.0, 30.0) - 0.5, 30.0), 1.4, 9.0, Color(0.45, 0.3, 0.16), 8)
	_place_moon("frog", Vector3(20.0, g(20.0, 30.0) + 10.2, 30.0))
	_cyl(Vector3(-70.0, g(-70.0, 58.0) - 0.5, 58.0), 2.4, 9.6, SLATE, 12, 2.0)
	_place_moon("stilt", Vector3(-70.0, g(-70.0, 58.0) + 10.6, 58.0))
	# Arena on the western shelf.
	_arena_ring(arena_center, arena_r, 0.0, SLATE, Color(0.35, 0.4, 0.5))
	_chest_at(Vector3(-80.0, g(-80.0, -20.0) + 0.5, -20.0))
	for i in 6:
		var a := TAU * i / 6.0
		_tree(1, Vector3(-80.0 + cos(a) * 5.0, g(-80.0 + cos(a) * 5.0, -20.0 + sin(a) * 5.0) - 0.2, -20.0 + sin(a) * 5.0), 1.1)
	_slab_at(Vector3(30.0, g(30.0, -20.0) + 0.2, -20.0), ICE)
	_spot(Vector3(-40.0, g(-40.0, 20.0) + 0.06, 20.0), "spot1")
	_spot(Vector3(60.0, g(60.0, -40.0) + 0.06, -40.0), "spot2")
	for cpos in [Vector3(8, 0, 2), Vector3(-30, 0, 30), Vector3(40, 0, 0), Vector3(-60, 0, -50), Vector3(70, 0, 70),
			Vector3(-90, 0, 40), Vector3(20, 0, -60), Vector3(-30, 0, -60)]:
		_crate(Vector3(cpos.x, g(cpos.x, cpos.z) + 0.5, cpos.z))


func _pickups() -> void:
	_coin_line(Vector3(-6, 0, 4), Vector3(6, 0, 4), 5)
	_coin_ring(Vector3(0, 0, -30), 5.0, 8)
	_coin_line(Vector3(0, 0, -45), Vector3(0, 0, -90), 8)
	_coin_line(Vector3(-10, 0, -60), Vector3(-50, 0, -85), 6)
	_coin_ring(Vector3(50, 0, 40), 12.0, 10)
	_coin_line(Vector3(-20, 0, 30), Vector3(-60, 0, 50), 6)
	_coin_line(Vector3(30, 0, -60), Vector3(60, 0, -90), 5)
	_coin_ring(Vector3(-90, 0, 60), 5.0, 6)
	_coin_ring(Vector3(90, 0, -40), 5.0, 6)
	_purples_at([Vector3(-12, 0, -8), Vector3(-13, 0, -6), Vector3(-14, 0, -4), Vector3(4, 0, -95), Vector3(-4, 0, -95),
		Vector3(50, 0, 30), Vector3(50, 0, 50), Vector3(-66, 0, 50), Vector3(-74, 0, 50), Vector3(-80, 0, -14), Vector3(-80, 0, -26),
		Vector3(26, 0, -86), Vector3(34, 0, -86), Vector3(-40, 12, -76), Vector3(-42, 12, -78), Vector3(90, 0, 60), Vector3(92, 0, 62),
		Vector3(-100, 0, -60), Vector3(-102, 0, -62), Vector3(60, 0, -60)])
	_hearts_at([Vector3(-8, 0, 30), Vector3(0, 0, -70), Vector3(-40, 12, -100), Vector3(80, 0, 20)])
	_blue_line(Vector3(30, 0, 20), Vector3(72, 0, 58), 8, 1.0)


func _creatures() -> void:
	for p in [Vector3(-15, 0, -10), Vector3(18, 0, -22), Vector3(30, 0, 30), Vector3(60, 0, 50), Vector3(0, 0, -55), Vector3(-25, 0, -55),
			Vector3(-45, 0, 60), Vector3(40, 0, 8), Vector3(-15, 0, -100), Vector3(20, 0, -75)]:
		_enemy("snowbonk", p)
	for p in [Vector3(10, 0, 40), Vector3(-5, 0, -70), Vector3(50, 0, 0), Vector3(-30, 12, -108)]:
		_enemy("spiny", p)
	for p in [Vector3(14, 0, 34), Vector3(24, 0, 40), Vector3(10, 0, 26)]:
		_capturable(Captures.Frog.new(), p)
	_capturable(Captures.Stilt.new(), Vector3(-60, 0, 50))
	_capturable(Captures.Bird.new(), Vector3(-20, 0, -40))
	_spawn_boss()


func _moons() -> void:
	pass


func _checkpoints() -> void:
	checkpoints = [
		{"pos": Vector3(0, 0.3, 15), "yaw": 0.0, "name": "Village"},
		{"pos": Vector3(0, g(0, -45) + 0.3, -45), "yaw": 0.0, "name": "Mountain Foot"},
		{"pos": Vector3(0, g(0, -78) + 0.3, -78), "yaw": 0.0, "name": "High Slope"},
		{"pos": Vector3(30, g(30, 30) + 0.3, 30), "yaw": -PI * 0.5, "name": "Lake Shore"},
		{"pos": Vector3(-52, g(-52, 44) + 0.3, 44), "yaw": 0.0, "name": "Stilt Field"},
		{"pos": Vector3(-42, 12.3, -90), "yaw": PI * 0.5, "name": "Shelf Gate"},
		{"pos": Vector3(-20, g(-20, -34) + 0.3, -34), "yaw": 0.0, "name": "Bird Rock"},
	]
