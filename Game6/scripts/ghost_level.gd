# Kingdom 7: Ghost Manor. Fog, a haunted mansion with a tower, a hedge
# maze, a swamp, a graveyard hill, and ghosts that fade in and out. Phantom
# Raptor haunts the top of the hill.
class_name GhostLevel
extends Level

const STONE := Color(0.42, 0.4, 0.48)
const STONE_DARK := Color(0.3, 0.28, 0.35)
const HEDGE := Color(0.14, 0.32, 0.18)
const MAZE := [
	"###############",
	"#.....#.......#",
	"#.###.#.#####.#",
	"#.#...#.....#.#",
	"#.#.#######.#.#",
	"#.#.#.....#.#.#",
	"#.#.#.###.#.#.#",
	"#...#.#M#.#...#",
	"###.#.#.#.#.###",
	"#...#...#.#...#",
	"#.###.###.#.#.#",
	"#.....#...#.#.#",
	"#.#####.###.#.#",
	"#.............#",
	"#######.#######",
]


func _init() -> void:
	Terrain.mode = "ghost"
	kingdom_id = "ghost"
	kingdom_title = "GHOST MANOR"
	kingdom_index = 7
	loading_text = "BUILDING GHOST MANOR..."
	next_kingdom = "ridge"
	next_kingdom_title = "DINO RIDGE"
	boss_name = "PHANTOM RAPTOR"
	boss_colour = Color(0.5, 0.3, 0.72)
	boss_extra_hp = 2
	arena_center = Vector3(60, 8, -60)
	arena_r = 13.0
	shop_pos = Vector3(14, 0, 12)
	balloon_pos = Vector3(0, 0, 26)
	timer_moon_pos = Vector3(0.0, 1.3, -28.0)
	timer_msg = "Run to the mansion door!"
	timer_len = 12.0
	tree_tint = Color(0.45, 0.4, 0.5)
	moon_names = {
		"welcome": "Welcome to Ghost Manor",
		"hall": "Moon in the Great Hall",
		"attic": "Up in the Attic",
		"tower": "Top of the Haunted Tower",
		"maze": "Heart of the Hedge Maze",
		"graveyard": "Crypt on the Graveyard Hill",
		"swamp": "Stilt Stretch in the Swamp",
		"frog": "Frog Hop to the Dead Tree",
		"timer": "Manor Dash Against the Clock",
		"spot1": "Glowing Spot on the Lawn",
		"spot2": "Glowing Spot Among the Graves",
		"chest": "Chest in the Swamp",
		"bell": "Ring the Chapel Bell",
		"scarecrow": "Hat on the Stone Angel",
		"slab": "Under the Crypt Slab",
		"bonks": "Bust Six Ghosts",
		"bluecoins": "Blue Coins Through the Maze",
		"shop": "Moon from the Shop",
		"boss": "Phantom Raptor's Hill",
	}
	hints = [
		{"pos": Vector3(0, 0, -30), "r": 8.0, "text": "The manor door is open. Ghosts can only be hit while they are solid."},
		{"pos": Vector3(-45, 0, -20), "r": 8.0, "text": "A hedge maze. The moon is in the middle. Follow the blue coins."},
		{"pos": Vector3(-40, 0, 44), "r": 10.0, "text": "A swamp. Throw your HAT at the plant to stretch up to the dead tree."},
		{"pos": Vector3(40, 0, -40), "r": 8.0, "text": "The graveyard hill. Something purple is prowling up there..."},
		{"pos": Vector3(18, 0, -62), "r": 8.0, "text": "Ledges spiral up the tower."},
	]
	shot_scenes = [
		{"name": "01_title", "pos": Vector3(0, 0.3, 15), "yaw": 0.0, "pitch": 0.2, "title": true},
		{"name": "02_lawn", "pos": Vector3(0, 0.3, 4), "yaw": 0.0, "pitch": 0.3},
		{"name": "03_manor", "pos": Vector3(0, 0.5, -24), "yaw": 0.0, "pitch": 0.35},
		{"name": "04_hall", "pos": Vector3(0, 0.5, -40), "yaw": 0.0, "pitch": 0.25},
		{"name": "05_maze", "pos": Vector3(-45, 0.5, -14), "yaw": 0.0, "pitch": 0.6},
		{"name": "06_graveyard", "pos": Vector3(40, 0.5, -44), "yaw": -1.0, "pitch": 0.35},
		{"name": "07_swamp", "pos": Vector3(-30, 0.5, 36), "yaw": 0.8, "pitch": 0.3},
	]


func _blocked(x: float, z: float) -> bool:
	if absf(x) < 26.0 and z < -30.0 and z > -70.0:
		return true
	if x > -68.0 and x < -22.0 and z > -46.0 and z < -2.0:
		return true
	if Vector2(x - 60.0, z + 60.0).length() < 22.0:
		return true
	if Vector2(x + 50.0, z - 60.0).length() < 26.0:
		return true
	return false


func shallow_water(pos: Vector3) -> bool:
	return Vector2(pos.x + 50.0, pos.z - 60.0).length() < 24.0 and pos.y < Terrain.SWAMP_Y + 0.25


func _environment() -> void:
	_env_setup({"top": Color(0.03, 0.02, 0.08), "horizon": Color(0.2, 0.12, 0.3), "ground": Color(0.02, 0.02, 0.04), "ground_h": Color(0.12, 0.08, 0.18),
		"sun": Color(0.6, 0.65, 0.9), "sun_energy": 0.45, "sun_rot": Vector3(-50.0, -40.0, 0.0), "ambient": Color(0.35, 0.3, 0.5), "ambient_energy": 0.55,
		"fog": Color(0.1, 0.08, 0.16), "fog_density": 0.004, "fog_sky": 0.3, "sun_size": 6.0})
	var mb := MeshLib.Builder.new()
	mb.ellipsoid(Vector3.ZERO, Vector3(16, 16, 16), 16, 12)
	var moon := mb.commit(Mats.unshaded(Color(0.95, 0.9, 0.7)), "Moon")
	moon.position = Vector3(-150, 140, -230)
	add_child(moon)
	for p in [Vector3(0, 6, 0), Vector3(0, 4, -32), Vector3(60, 12, -60), Vector3(-45, 4, -24), Vector3(-40, 4, 40), Vector3(30, 5, 18)]:
		_omni(p, Color(0.8, 0.7, 1.0), 1.3, 26.0)


func _water() -> void:
	_water_quad(-50.0, 60.0, 52.0, 52.0, Terrain.SWAMP_Y, Mats.liquid("swamp"), 8)


func _dressing() -> void:
	var avoid := [Vector3(0, 0, 15), Vector3(14, 0, 12), Vector3(0, 0, 26), Vector3(30, 0, 18), Vector3(-20, 0, 20)]
	var n := 0
	var tries := 0
	while n < Quality.scale(70, 45) and tries < 3000:
		tries += 1
		var x := rng.randf_range(-125.0, 125.0)
		var z := rng.randf_range(-125.0, 125.0)
		if not _clear_spot(x, z, avoid, 9.0, 0.75):
			continue
		_tree(0 if rng.randf() < 0.5 else 1, Vector3(x, g(x, z) - 0.2, z), rng.randf_range(0.8, 1.4))
		n += 1
	for i in Quality.scale(40, 25):
		var x := rng.randf_range(-125.0, 125.0)
		var z := rng.randf_range(-125.0, 125.0)
		if _clear_spot(x, z, avoid, 7.0, 0.5):
			_rock(Vector3(x, g(x, z) - 0.1, z), rng.randf_range(0.5, 1.4))
	# Lanterns along the path to the manor.
	for zz in [4.0, -8.0, -20.0]:
		_lantern(Vector3(-4.0, g(-4.0, zz), zz), Color(0.8, 0.7, 1.0))
		_lantern(Vector3(4.0, g(4.0, zz), zz), Color(0.8, 0.7, 1.0))


func _tomb(pos: Vector3, h: float) -> void:
	_box(pos + Vector3(0, h * 0.5, 0), Vector3(1.2, h, 0.3), STONE, 0.9, Basis(Vector3.UP, rng.randf_range(-0.2, 0.2)))


func _set_pieces() -> void:
	_cyl(Vector3(12.0, g(12.0, -6.0) - 0.5, -6.0), 1.6, 4.8, STONE, 10, 1.4)
	_moon_on_ground("welcome", 12.0, -6.0, 5.6)
	# --- The manor: ground floor, upper floor, tower.
	var mz := -50.0
	_box(Vector3(0, -0.4, mz), Vector3(44.0, 1.0, 30.0), STONE_DARK)
	_box(Vector3(-22.0, 3.0, mz), Vector3(1.2, 6.0, 30.0), STONE)
	_box(Vector3(22.0, 3.0, mz), Vector3(1.2, 6.0, 30.0), STONE)
	_box(Vector3(0, 3.0, mz - 15.0), Vector3(44.0, 6.0, 1.2), STONE)
	_box(Vector3(-13.0, 3.0, mz + 15.0), Vector3(18.0, 6.0, 1.2), STONE)
	_box(Vector3(13.0, 3.0, mz + 15.0), Vector3(18.0, 6.0, 1.2), STONE)
	_box(Vector3(0, 5.0, mz + 15.0), Vector3(8.0, 2.0, 1.2), STONE)
	# Interior walls making a hall and two side rooms.
	_box(Vector3(-10.0, 3.0, mz - 4.0), Vector3(1.0, 6.0, 22.0), STONE_DARK)
	_box(Vector3(10.0, 3.0, mz - 4.0), Vector3(1.0, 6.0, 22.0), STONE_DARK)
	_place_moon("hall", Vector3(0, 1.4, mz - 11.0))
	_place_moon("attic", Vector3(-16.0, 7.6, mz - 10.0))
	# Upper floor slab with a stair hole, stairs, upper walls, roof.
	_box(Vector3(-11.0, 6.3, mz), Vector3(22.0, 0.6, 30.0), STONE_DARK)
	_box(Vector3(14.0, 6.3, mz), Vector3(16.0, 0.6, 30.0), STONE_DARK)
	_box(Vector3(3.0, 6.3, mz - 11.0), Vector3(6.0, 0.6, 8.0), STONE_DARK)
	for i in 6:
		_box(Vector3(3.0, 0.5 + i * 1.0, mz + 10.0 - i * 2.0), Vector3(6.0, 1.0, 2.0), STONE)
	_box(Vector3(-22.0, 8.8, mz), Vector3(1.2, 5.0, 30.0), STONE)
	_box(Vector3(22.0, 8.8, mz), Vector3(1.2, 5.0, 30.0), STONE)
	_box(Vector3(0, 8.8, mz - 15.0), Vector3(44.0, 5.0, 1.2), STONE)
	_box(Vector3(0, 8.8, mz + 15.0), Vector3(44.0, 5.0, 1.2), STONE)
	_box(Vector3(0, 11.6, mz), Vector3(46.0, 0.8, 32.0), STONE_DARK)
	for i in 4:
		_box(Vector3(23.6, 2.4 + i * 2.4, mz + 10.0 - i * 4.0), Vector3(2.6, 0.4, 2.6), STONE_DARK)
	_omni(Vector3(0, 4.0, mz - 4.0), Color(1.0, 0.75, 0.5), 1.8, 22.0)
	_omni(Vector3(-12.0, 9.5, mz), Color(1.0, 0.75, 0.5), 1.2, 16.0)
	# Windows: lit boxes on the front.
	for wx in [-16.0, -8.0, 8.0, 16.0]:
		for wy in [3.0, 9.0]:
			var w := MeshLib.Builder.new()
			w.box(Vector3.ZERO, Vector3(1.6, 2.2, 0.1))
			var mi := w.commit(Mats.glow(Color(1.0, 0.8, 0.45), 1.3), "Window")
			mi.position = Vector3(wx, wy, mz + 15.7)
			add_child(mi)
	# The tower on the north-east corner with a ledge spiral.
	var tx := 20.0
	var tz := mz - 14.0
	_box(Vector3(tx, 14.0, tz), Vector3(8.0, 28.0, 8.0), STONE)
	var pts := [Vector2(-5.0, 0), Vector2(-5.0, -5.0), Vector2(5.0, -5.0), Vector2(5.0, 5.0), Vector2(-5.0, 5.0), Vector2(-5.0, 0)]
	var idx := 0
	var acc := 0.0
	var next_at := 0.0
	for seg in pts.size() - 1:
		var a: Vector2 = pts[seg]
		var b: Vector2 = pts[seg + 1]
		var sl := a.distance_to(b)
		while acc + sl >= next_at and idx < 12:
			var p := a.lerp(b, (next_at - acc) / sl)
			_box(Vector3(tx + p.x, 12.5 + idx * 1.4, tz + p.y), Vector3(2.6, 0.4, 2.6), STONE_DARK)
			idx += 1
			next_at += 3.4
		acc += sl
	_box(Vector3(tx, 28.6, tz), Vector3(9.0, 0.5, 9.0), STONE_DARK)
	_place_moon("tower", Vector3(tx, 30.2, tz))
	# --- Hedge maze.
	var cs := 3.0
	var ox := -45.0 - MAZE[0].length() * cs * 0.5
	var oz := -24.0 - MAZE.size() * cs * 0.5
	var path_cells: Array = []
	for r in MAZE.size():
		var row: String = MAZE[r]
		for c in row.length():
			var ch := row[c]
			var x := ox + (c + 0.5) * cs
			var z := oz + (r + 0.5) * cs
			if ch == "#":
				_box(Vector3(x, g(x, z) + 1.25, z), Vector3(cs, 2.5, cs), HEDGE, 0.95)
			elif ch == "M":
				_place_moon("maze", Vector3(x, g(x, z) + 1.3, z))
			else:
				path_cells.append(Vector3(x, 0, z))
	for i in 8:
		var p: Vector3 = path_cells[(i * 17 + 3) % path_cells.size()]
		var b := _pickup("blue", Vector3(p.x, g(p.x, p.z) + 1.0, p.z))
		blue_coins.append(b)
	# --- Graveyard hill: tombstones, a crypt, the arena.
	for i in 24:
		var a := TAU * i / 24.0
		var r := 17.0 + (i % 3) * 3.0
		var x := 60.0 + cos(a) * r
		var z := -60.0 + sin(a) * r
		_tomb(Vector3(x, g(x, z), z), rng.randf_range(1.0, 1.8))
	_arena_ring(arena_center, arena_r, PI, STONE, STONE_DARK, 14, 3.5)
	_box(Vector3(66.0, 9.5, -52.0), Vector3(5.0, 3.0, 4.0), STONE_DARK)
	_place_moon("graveyard", Vector3(66.0, 12.4, -52.0))
	_slab_at(Vector3(66.0, 8.2, -70.0), STONE)
	_spot(Vector3(50.0, 8.06, -50.0), "spot2")
	_cyl(Vector3(40.0, g(40.0, -40.0) - 0.3, -40.0), 1.4, 1.0, STONE_DARK, 8)
	_statue_at(Vector3(40.0, g(40.0, -40.0) + 0.7, -40.0), STONE, STONE)
	_switch_at(Vector3(36.0, g(36.0, -30.0), -30.0))
	# --- Swamp: stilt to a dead tree, chest on a stump, frogs.
	_cyl(Vector3(-56.0, g(-56.0, 70.0) - 0.5, 70.0), 1.2, 9.6, Color(0.3, 0.25, 0.2), 8)
	_place_moon("swamp", Vector3(-56.0, g(-56.0, 70.0) + 10.6, 70.0))
	_cyl(Vector3(-40.0, g(-40.0, 58.0) - 0.5, 58.0), 1.6, 1.4, Color(0.3, 0.25, 0.2), 8)
	_chest_at(Vector3(-40.0, g(-40.0, 58.0) + 1.4, 58.0))
	_cyl(Vector3(-30.0, g(-30.0, 26.0) - 0.5, 26.0), 1.2, 8.0, Color(0.3, 0.25, 0.2), 8)
	_place_moon("frog", Vector3(-30.0, g(-30.0, 26.0) + 9.2, 26.0))
	# --- Chapel bell and lawn spot.
	_bell_at(Vector3(30.0, g(30.0, 18.0), 18.0), STONE_DARK)
	_spot(Vector3(-20.0, g(-20.0, 20.0) + 0.06, 20.0), "spot1")
	for cpos in [Vector3(8, 0, 2), Vector3(-14, 0, 8), Vector3(-6, 0, -46), Vector3(14, 0, -58), Vector3(80, 0, -20),
			Vector3(-90, 0, -60), Vector3(-80, 0, 10), Vector3(20, 0, 60)]:
		_crate(Vector3(cpos.x, g(cpos.x, cpos.z) + 0.5, cpos.z))


func _pickups() -> void:
	_coin_line(Vector3(-6, 0, 4), Vector3(6, 0, 4), 5)
	_coin_line(Vector3(0, 0, -6), Vector3(0, 0, -28), 5)
	_coin_ring(Vector3(0, 0, -50), 4.0, 6)
	_coin_line(Vector3(30, 0, -30), Vector3(50, 0, -46), 5)
	_coin_ring(Vector3(60, 8, -60), 8.0, 8)
	_coin_line(Vector3(-20, 0, 30), Vector3(-44, 0, 44), 6)
	_coin_ring(Vector3(-50, 0, 60), 10.0, 8)
	_coin_ring(Vector3(-90, 0, -80), 5.0, 6)
	_coin_ring(Vector3(90, 0, 40), 5.0, 6)
	_coin_line(Vector3(20, 0, 40), Vector3(60, 0, 70), 6)
	for i in 5:
		_pickup("coin", Vector3(20.0, 14.0 + i * 3.0, -64.0))
	_purples_at([Vector3(-12, 0, -8), Vector3(-13, 0, -6), Vector3(-14, 0, -4), Vector3(-16, 0, -60), Vector3(16, 0, -60),
		Vector3(-16, 7.2, -54), Vector3(16, 7.2, -54), Vector3(64, 8, -66), Vector3(56, 8, -54), Vector3(-36, 0, 52), Vector3(-44, 0, 66),
		Vector3(-30, 0, -8), Vector3(-60, 0, -8), Vector3(30, 0, 24), Vector3(26, 0, 12), Vector3(-90, 0, -76), Vector3(-94, 0, -84),
		Vector3(90, 0, 36), Vector3(94, 0, 44), Vector3(20, 29.5, -64)])
	_hearts_at([Vector3(-8, 0, 30), Vector3(0, 0, -34), Vector3(44, 0, -36), Vector3(-40, 0, 40)])


func _creatures() -> void:
	for p in [Vector3(-6, 0, -44), Vector3(6, 0, -56), Vector3(-16, 0, -44), Vector3(16, 0, -44), Vector3(40, 0, -50),
			Vector3(70, 0, -80), Vector3(-45, 0, -30), Vector3(-30, 0, 40), Vector3(20, 0, 30), Vector3(-80, 0, -50)]:
		_enemy("ghost", p)
	for p in [Vector3(-15, 0, -10), Vector3(30, 0, 40), Vector3(-70, 0, 20)]:
		_enemy("bonk", p)
	for p in [Vector3(50, 0, -30), Vector3(-20, 0, 60)]:
		_enemy("spiny", p)
	for p in [Vector3(-34, 0, 34), Vector3(-26, 0, 42), Vector3(-44, 0, 34)]:
		_capturable(Captures.Frog.new(), p)
	_capturable(Captures.Stilt.new(), Vector3(-46, 0, 62))
	_spawn_boss()


func _moons() -> void:
	pass


func _checkpoints() -> void:
	checkpoints = [
		{"pos": Vector3(0, 0.3, 15), "yaw": 0.0, "name": "The Lawn"},
		{"pos": Vector3(0, g(0, -30) + 0.3, -30), "yaw": 0.0, "name": "Manor Door"},
		{"pos": Vector3(-45, g(-45, -2) + 0.3, -2), "yaw": 0.0, "name": "Maze Gate"},
		{"pos": Vector3(40, g(40, -44) + 0.3, -44), "yaw": -PI * 0.5, "name": "Graveyard Foot"},
		{"pos": Vector3(44, 8.3, -60), "yaw": -PI * 0.5, "name": "Hill Top Gate"},
		{"pos": Vector3(-40, g(-40, 40) + 0.3, 40), "yaw": 0.0, "name": "Swamp Edge"},
		{"pos": Vector3(30, g(30, 14) + 0.3, 14), "yaw": 0.0, "name": "Chapel"},
	]
