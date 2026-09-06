# Kingdom 2: Skyline City. Night, neon windows, rooftops to hop, a harbour,
# an elevated rail line, a taxi to drive, a tank to fire, and Robo Raptor
# waiting on the roof of Skyline Tower.
class_name CityLevel
extends Level

const ROOF_Y := 30.0
const TOWER := Vector3(40.0, 0.0, -40.0)
const ASPHALT := Color(0.2, 0.2, 0.23)
const STEEL := Color(0.35, 0.37, 0.42)
const BRICK := Color(0.55, 0.32, 0.25)
const CONCRETE := Color(0.62, 0.62, 0.64)
const GLASS_BLUE := Color(0.28, 0.4, 0.55)
const CREAM := Color(0.8, 0.72, 0.58)

var _win_lit := MeshLib.Builder.new()
var _win_dark := MeshLib.Builder.new()
var race_rings: Array = []
var race_next := -1
var race_t := -1.0
var _ring_mesh: ArrayMesh
var _ring_pos: Array = []


func _init() -> void:
	Terrain.city = true
	kingdom_id = "city"
	kingdom_title = "SKYLINE CITY"
	kingdom_index = 2
	loading_text = "BUILDING SKYLINE CITY..."
	next_kingdom = "ridge"
	next_kingdom_title = "DINO RIDGE"
	boss_name = "ROBO RAPTOR"
	boss_colour = Color(0.72, 0.78, 0.9)
	boss_metal = true
	arena_center = Vector3(TOWER.x, ROOF_Y, TOWER.z)
	arena_r = 13.0
	shop_pos = Vector3(12, 0, -8)
	balloon_pos = Vector3(0, 0, 16)
	timer_moon_pos = Vector3(10.0, 10.8, 40.0)
	timer_msg = "Quick! The moon is up on the rail line, straight north!"
	timer_len = 12.0
	moon_names = {
		"welcome": "Welcome to Skyline City",
		"fountain": "Frog on the Fountain",
		"rail": "End of the Line",
		"crane": "Hooked on the Crane",
		"vault": "Tank Breaks the Vault",
		"alley": "Alley Wall Jump",
		"billboard": "Billboard Climb",
		"lighthouse": "Lighthouse Lookout",
		"manhole": "Under the Manhole Cover",
		"timer": "Rooftop Dash Against the Clock",
		"spot1": "Glowing Spot in the Park",
		"spot2": "Glowing Spot on the Bank",
		"bell": "Ring the Park Bell Three Times",
		"scarecrow": "Hat on the Statue",
		"chest": "Chest in the Back Alley",
		"bonks": "Bonk Bash Downtown",
		"bluecoins": "Blue Coins on the Quay",
		"taxi": "Taxi Time Trial",
		"shop": "Moon from the Shop",
		"highrise": "Rooftop Hopper",
		"boss": "Robo Raptor's Rooftop",
	}
	hints = [
		{"pos": Vector3(14, 0, -14), "r": 7.0, "text": "A moon on the kiosk! Triple jump, or throw your hat and bounce on it."},
		{"pos": Vector3(-30, 0, -20), "r": 14.0, "text": "Throw your HAT at the taxi to drive it!"},
		{"pos": Vector3(40, 0, 14), "r": 10.0, "text": "A tank! Throw your HAT at it, then JUMP fires."},
		{"pos": Vector3(40, 0, 8), "r": 6.0, "text": "Metal crates. Only the tank's shells can break those."},
		{"pos": Vector3(21, 0, -40), "r": 9.0, "text": "Hop up the ledges around Skyline Tower to reach the roof."},
		{"pos": Vector3(83, 0, -16), "r": 8.0, "text": "A narrow alley: jump from wall to wall to climb it."},
		{"pos": Vector3(40, 2, -20), "r": 7.0, "text": "Drive the taxi through the glowing ring to start a race!"},
		{"pos": Vector3(10, 6, 52), "r": 6.0, "text": "Ground POUND the red switch!"},
		{"pos": Vector3(-10, 0, 58), "r": 7.0, "text": "Stairs up to the rail line."},
		{"pos": Vector3(94, 0, 78), "r": 9.0, "text": "Throw your HAT at the plant, then stretch up beside the lighthouse."},
		{"pos": Vector3(-80, 0, 62), "r": 8.0, "text": "Climb the awnings to the roof, then up to the billboard."},
		{"pos": Vector3(-20, 0, -60), "r": 6.0, "text": "That manhole cover looks loose. POUND it!"},
		{"pos": Vector3(27, 30, -42), "r": 8.0, "text": "Something big is powered down on this roof..."},
	]
	shot_scenes = [
		{"name": "01_title", "pos": Vector3(0, 0.3, 6), "yaw": 0.0, "pitch": 0.2, "title": true},
		{"name": "02_plaza", "pos": Vector3(0, 0.3, 2), "yaw": 0.0, "pitch": 0.3},
		{"name": "03_park", "pos": Vector3(-30, 0.5, 14), "yaw": 0.7, "pitch": 0.3},
		{"name": "04_taxi", "pos": Vector3(-20, 0.5, -14), "yaw": 0.4, "pitch": 0.25},
		{"name": "05_tower", "pos": Vector3(14, 0.5, -30), "yaw": -1.2, "pitch": 0.45},
		{"name": "06_bank", "pos": Vector3(40, 0.5, 20), "yaw": 0.0, "pitch": 0.3},
		{"name": "07_rail", "pos": Vector3(-10, 0.5, 62), "yaw": 0.0, "pitch": 0.35},
		{"name": "08_harbour", "pos": Vector3(40, 0.5, 70), "yaw": -1.0, "pitch": 0.3},
		{"name": "09_alley", "pos": Vector3(83, 0.5, -17), "yaw": PI, "pitch": 0.4},
		{"name": "10_roof", "pos": Vector3(26, 30.5, -42), "yaw": -PI * 0.5, "pitch": 0.3},
		{"name": "11_overview", "pos": Vector3(54, 30.5, -54), "yaw": 0.75, "pitch": 0.6},
		{"name": "12_billboard", "pos": Vector3(-80, 0.5, 66), "yaw": 0.0, "pitch": 0.4},
	]


func _blocked(x: float, z: float) -> bool:
	return not Terrain.in_park(x, z)


func deep_water(pos: Vector3) -> bool:
	return pos.z > 90.0 and pos.y < Terrain.HARBOUR_Y + 0.4


func shallow_water(_pos: Vector3) -> bool:
	return false


# ------------------------------------------------------------ environment --

func _environment() -> void:
	var env := Environment.new()
	var sky := Sky.new()
	var sm := ProceduralSkyMaterial.new()
	sm.sky_top_color = Color(0.02, 0.03, 0.09)
	sm.sky_horizon_color = Color(0.16, 0.11, 0.28)
	sm.ground_bottom_color = Color(0.02, 0.02, 0.04)
	sm.ground_horizon_color = Color(0.1, 0.08, 0.18)
	sm.sun_angle_max = 8.0
	sky.sky_material = sm
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.32, 0.36, 0.56)
	env.ambient_light_energy = 0.55
	env.fog_enabled = true
	env.fog_light_color = Color(0.06, 0.07, 0.14)
	env.fog_density = 0.0012
	env.fog_sky_affect = 0.1
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_white = 4.0
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var moonlight := DirectionalLight3D.new()
	moonlight.rotation_degrees = Vector3(-55.0, -35.0, 0.0)
	moonlight.light_energy = 0.55
	moonlight.light_color = Color(0.7, 0.8, 1.0)
	moonlight.shadow_enabled = true
	moonlight.directional_shadow_max_distance = 60.0 if Quality.lightweight() else 100.0
	moonlight.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS if Quality.lightweight() else DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	moonlight.directional_shadow_split_1 = 0.2 if Quality.lightweight() else 0.08
	moonlight.directional_shadow_split_2 = 0.22
	moonlight.directional_shadow_split_3 = 0.5
	moonlight.directional_shadow_fade_start = 0.85
	moonlight.directional_shadow_blend_splits = true
	moonlight.shadow_bias = 0.04
	moonlight.shadow_normal_bias = 1.2
	add_child(moonlight)
	# The moon and the stars.
	var mb := MeshLib.Builder.new()
	mb.ellipsoid(Vector3.ZERO, Vector3(14, 14, 14), 16, 12)
	var moon := mb.commit(Mats.unshaded(Color(0.95, 0.95, 0.85)), "Moon")
	moon.position = Vector3(180, 150, -260)
	add_child(moon)
	var stars := MultiMesh.new()
	stars.transform_format = MultiMesh.TRANSFORM_3D
	var sb := MeshLib.Builder.new()
	sb.ellipsoid(Vector3.ZERO, Vector3(0.9, 0.9, 0.9), 6, 4)
	stars.mesh = sb.commit_mesh()
	stars.instance_count = 260
	for i in 260:
		var a := rng.randf() * TAU
		var e := rng.randf_range(0.08, 1.4)
		var p := Vector3(cos(a) * cos(e), sin(e), sin(a) * cos(e)) * 380.0
		var sc := rng.randf_range(0.5, 1.4)
		stars.set_instance_transform(i, Transform3D(Basis.IDENTITY.scaled(Vector3.ONE * sc), p))
	var smi := MultiMeshInstance3D.new()
	smi.multimesh = stars
	smi.material_override = Mats.unshaded(Color(1, 1, 1))
	smi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(smi)
	# A handful of real lights where it matters.
	for spec in [[Vector3(0, 7, 0), Color(1.0, 0.85, 0.6), 1.6, 30.0], [Vector3(-40, 7, 0), Color(0.7, 0.9, 1.0), 1.4, 26.0],
			[Vector3(22, 6, -22), Color(1.0, 0.8, 0.55), 1.2, 24.0], [Vector3(40, 5, 12), Color(1.0, 0.85, 0.6), 1.2, 22.0],
			[Vector3(0, 6, 80), Color(1.0, 0.85, 0.6), 1.2, 30.0], [Vector3(100, 16, 80), Color(1.0, 0.95, 0.8), 2.5, 45.0]]:
		var lt := OmniLight3D.new()
		lt.position = spec[0]
		lt.light_color = spec[1]
		lt.light_energy = spec[2]
		lt.omni_range = spec[3]
		lt.shadow_enabled = false
		add_child(lt)


func _water() -> void:
	_water_quad(0.0, 112.0, 300.0, 46.0, Terrain.HARBOUR_Y, Mats.water(true), 10)


func _dressing() -> void:
	var avoid := [Vector3(-40, 0, 0), Vector3(-52, 0, 10), Vector3(-30, 0, 12), Vector3(-48, 0, 6), Vector3(-32, 0, -8)]
	var n := 0
	var tries := 0
	while n < 22 and tries < 600:
		tries += 1
		var x := rng.randf_range(-56.0, -24.0)
		var z := rng.randf_range(-16.0, 16.0)
		if not _clear_spot(x, z, avoid, 6.0, 0.8):
			continue
		_tree(0 if rng.randf() < 0.7 else 1, Vector3(x, g(x, z) - 0.2, z), rng.randf_range(0.8, 1.2))
		n += 1
	for x in [-80.0, -60.0, -40.0, -20.0, 0.0, 20.0, 40.0, 60.0, 80.0]:
		_tree(2, Vector3(x, g(x, 74.0) - 0.2, 74.0), 1.1)
	_scatter(Quality.scale(160, 100), 0.14, [Color(0.95, 0.85, 0.3), Color(0.95, 0.4, 0.5), Color(0.98, 0.98, 0.98)], avoid)


# --------------------------------------------------------------- buildings --

# A building: a box body plus rows of windows on all four faces (batched into
# two meshes: lit and dark). Origin is the centre of the footprint on the
# ground; returns the body so callers can add things to it.
func _building(cx: float, cz: float, w: float, h: float, d: float, col: Color, lit: float = 0.5, props: bool = true) -> StaticBody3D:
	var y0 := g(cx, cz) - 0.3
	var body := _box(Vector3(cx, y0 + h * 0.5, cz), Vector3(w, h, d), col, 0.85)
	body.name = "Building"
	var rows := int((h - 2.5) / 3.0)
	for face in 4:
		var span := w if face < 2 else d
		var cols := int((span - 1.6) / 2.6)
		if cols <= 0:
			continue
		var start := -(cols - 1) * 1.3
		for r in rows:
			var y := y0 + 2.2 + r * 3.0
			for c in cols:
				var u := start + c * 2.6
				var b := _win_lit if rng.randf() < lit else _win_dark
				var u0 := u - 0.55
				var u1 := u + 0.55
				var y1 := y + 1.4
				match face:
					0:   # +Z (south)
						var z := cz + d * 0.5 + 0.04
						b.quad(Vector3(cx + u0, y, z), Vector3(cx + u1, y, z), Vector3(cx + u1, y1, z), Vector3(cx + u0, y1, z))
					1:   # -Z (north)
						var z := cz - d * 0.5 - 0.04
						b.quad(Vector3(cx + u1, y, z), Vector3(cx + u0, y, z), Vector3(cx + u0, y1, z), Vector3(cx + u1, y1, z))
					2:   # +X (east)
						var x := cx + w * 0.5 + 0.04
						b.quad(Vector3(x, y, cz + u1), Vector3(x, y, cz + u0), Vector3(x, y1, cz + u0), Vector3(x, y1, cz + u1))
					3:   # -X (west)
						var x := cx - w * 0.5 - 0.04
						b.quad(Vector3(x, y, cz + u0), Vector3(x, y, cz + u1), Vector3(x, y1, cz + u1), Vector3(x, y1, cz + u0))
	if props and w > 9.0 and d > 9.0:
		var top := y0 + h
		if rng.randf() < 0.5:
			_cyl(Vector3(cx + w * 0.25, top, cz - d * 0.2), 1.1, 2.2, Color(0.5, 0.42, 0.35), 10)
		else:
			_box(Vector3(cx - w * 0.25, top + 0.6, cz + d * 0.2), Vector3(2.0, 1.2, 2.0), Color(0.45, 0.47, 0.5))
		# Parapet.
		_box(Vector3(cx, top + 0.25, cz - d * 0.5 + 0.2), Vector3(w, 0.5, 0.4), col.darkened(0.15))
		_box(Vector3(cx, top + 0.25, cz + d * 0.5 - 0.2), Vector3(w, 0.5, 0.4), col.darkened(0.15))
	return body


func _finish_windows() -> void:
	var lit := _win_lit.commit(Mats.glow(Color(1.0, 0.88, 0.55), 1.4, 0.5), "WindowsLit")
	lit.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(lit)
	var dark := _win_dark.commit(Mats.pbr(Color(0.1, 0.13, 0.2), 0.3, 0.2), "WindowsDark")
	dark.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(dark)


func _lamp(pos: Vector3) -> void:
	var b := MeshLib.Builder.new()
	b.cylinder(Vector3.ZERO, Vector3(0, 4.6, 0), 0.1, 0.08, 6)
	b.cylinder(Vector3(0, 4.6, 0), Vector3(0.9, 4.6, 0), 0.06, 0.06, 5)
	var pole := b.commit(Mats.pbr(Color(0.2, 0.22, 0.25), 0.6), "Lamp")
	pole.position = pos
	add_child(pole)
	var hb := MeshLib.Builder.new()
	hb.ellipsoid(Vector3(0.9, 4.45, 0), Vector3(0.28, 0.2, 0.28), 8, 6)
	var head := hb.commit(Mats.glow(Color(1.0, 0.9, 0.65), 2.0), "LampHead")
	head.position = pos
	add_child(head)


func _fence_ring(center: Vector3, r: float, n: int, gap_angle: float, h: float) -> void:
	for i in n:
		var a := TAU * i / n
		if absf(wrapf(a - gap_angle, -PI, PI)) < 0.5:
			continue
		var p := center + Vector3(cos(a) * r, 0, sin(a) * r)
		_cyl(p, 0.35, h, STEEL, 6)
		var gb := MeshLib.Builder.new()
		gb.ellipsoid(Vector3(0, h + 0.2, 0), Vector3(0.4, 0.25, 0.4), 8, 5)
		var glow := gb.commit(Mats.glow(Color(1.0, 0.3, 0.3), 1.8), "Beacon")
		glow.position = p
		add_child(glow)


func _set_pieces() -> void:
	_ring_mesh = Models.torus_mesh(2.2, 0.22, 24)
	# Street lamps at every intersection corner.
	for sx in Terrain.STREETS_X:
		for sz in Terrain.STREETS_Z:
			_lamp(Vector3(sx + 6.5, g(sx + 6.5, sz + 6.5), sz + 6.5))
			if rng.randf() < 0.5:
				_lamp(Vector3(sx - 6.5, g(sx - 6.5, sz - 6.5), sz - 6.5))
	# --- Plaza (C3): kiosk with the welcome moon, the statue.
	var kiosk := _box(Vector3(14.0, 1.75, -14.0), Vector3(3.2, 3.5, 3.2), Color(0.2, 0.55, 0.45))
	kiosk.name = "Kiosk"
	_box(Vector3(14.0, 3.7, -14.0), Vector3(4.0, 0.3, 4.0), Color(0.9, 0.3, 0.25))
	_cyl(Vector3(-10.0, 0.0, -8.0), 1.4, 1.0, CONCRETE, 10)
	scarecrow = Node3D.new()
	scarecrow.position = Vector3(-10.0, 1.0, -8.0)
	var scb := MeshLib.Builder.new()
	scb.cylinder(Vector3.ZERO, Vector3(0, 2.4, 0), 0.22, 0.18, 8)
	scb.cylinder(Vector3(-0.9, 1.7, 0), Vector3(0.9, 1.7, 0), 0.1, 0.1, 6)
	scb.box(Vector3(0, 1.5, 0), Vector3(0.8, 0.9, 0.45))
	scarecrow.add_child(scb.commit(Mats.pbr(Color(0.66, 0.66, 0.68), 0.7), "Body"))
	var sch := MeshLib.Builder.new()
	sch.ellipsoid(Vector3(0, 2.35, 0), Vector3(0.34, 0.38, 0.34), 10, 8)
	scarecrow.add_child(sch.commit(Mats.pbr(Color(0.7, 0.7, 0.72), 0.7), "Head"))
	Models.eyes(scarecrow, Vector3(0, 2.4, -0.26), 0.12, 0.06)
	add_child(scarecrow)
	# --- Park (B3): fountain, bell, glowing spot.
	var fx := -40.0
	var fz := 0.0
	var fy := g(fx, fz)
	_cyl(Vector3(fx, fy - 0.2, fz), 3.4, 1.0, CONCRETE, 16)
	_cyl(Vector3(fx, fy + 0.8, fz), 0.55, 2.6, CONCRETE, 10)
	_cyl(Vector3(fx, fy + 3.4, fz), 1.2, 0.3, CONCRETE, 12)
	var fw := MeshLib.Builder.new()
	fw.lathe([Vector2(0.0, 0.0), Vector2(3.1, 0.0)], 16, Vector3(fx, fy + 0.55, fz), Basis.IDENTITY, false)
	add_child(fw.commit(Mats.water(), "FountainWater"))
	var bt := Vector3(-52.0, g(-52.0, 10.0), 10.0)
	_cyl(bt, 0.15, 5.0, Color(0.2, 0.2, 0.22), 6)
	_box(bt + Vector3(0.7, 5.0, 0), Vector3(1.6, 0.15, 0.3), Color(0.2, 0.2, 0.22))
	bell = Node3D.new()
	bell.position = bt + Vector3(1.2, 4.1, 0)
	var bb := MeshLib.Builder.new()
	bb.lathe([Vector2(0.0, 0.8), Vector2(0.25, 0.8), Vector2(0.4, 0.4), Vector2(0.55, 0.0), Vector2(0.0, 0.0)], 14)
	bell.add_child(bb.commit(Mats.pbr(Color(0.85, 0.7, 0.3), 0.35, 0.7), "Bell"))
	add_child(bell)
	_spot(Vector3(-30.0, g(-30.0, 12.0) + 0.06, 12.0), "spot1")
	# --- Bank (D3) with the vault and a glowing spot on its roof.
	_building(40.0, -2.0, 26.0, 10.0, 12.0, CREAM, 0.6, false)
	_box(Vector3(37.2, 2.0, 6.5), Vector3(1.6, 4.0, 5.0), CREAM.darkened(0.1))
	_box(Vector3(42.8, 2.0, 6.5), Vector3(1.6, 4.0, 5.0), CREAM.darkened(0.1))
	_box(Vector3(40.0, 4.3, 6.5), Vector3(7.2, 0.6, 5.0), CREAM.darkened(0.1))
	for mx in [38.2, 40.0, 41.8]:
		_metal_crate(Vector3(mx, 0.6, 8.3))
	var sign := Label3D.new()
	sign.text = "BANK"
	sign.font_size = 120
	sign.pixel_size = 0.012
	sign.modulate = Color(1.0, 0.9, 0.5)
	sign.position = Vector3(40.0, 8.5, 4.2)
	add_child(sign)
	for i in 3:
		_box(Vector3(26.0, 2.4 + i * 2.5, -6.0 + i * 5.0), Vector3(2.8, 0.4, 2.8), STEEL)
	_spot(Vector3(40.0, 10.06 - 0.3, -2.0), "spot2")
	# --- Skyline Tower (D2): the boss roof, a fire escape spiral, the crane.
	_building(TOWER.x, TOWER.z, 30.0, ROOF_Y, 30.0, GLASS_BLUE, 0.55, false)
	var half := 16.6
	var corners := [Vector2(-half, 0), Vector2(-half, -half), Vector2(half, -half), Vector2(half, half), Vector2(-half, half), Vector2(-half, 0)]
	var ledge_i := 0
	var dist_acc := 0.0
	var next_at := 0.0
	for seg in corners.size() - 1:
		var a: Vector2 = corners[seg]
		var b: Vector2 = corners[seg + 1]
		var seg_len := a.distance_to(b)
		var t := 0.0
		while dist_acc + (seg_len - t) >= next_at and ledge_i < 22:
			var along := next_at - dist_acc
			var p := a.lerp(b, along / seg_len)
			var y := 1.4 + ledge_i * 1.4
			_box(Vector3(TOWER.x + p.x, y, TOWER.z + p.y), Vector3(3.4, 0.5, 3.4), STEEL)
			if ledge_i % 3 == 1:
				_pickup("coin", Vector3(TOWER.x + p.x, y + 1.2, TOWER.z + p.y))
			ledge_i += 1
			next_at += 6.0
			t = along
		dist_acc += seg_len
	_fence_ring(arena_center, 14.2, 16, PI, 2.0)
	_cyl(Vector3(60.0, 0.0, -62.0), 0.9, 40.0, Color(0.9, 0.6, 0.15), 8)
	var jib_dir := Vector3(44.0 - 60.0, 0, -44.0 + 62.0)
	var jib_len := jib_dir.length()
	var jib_ang := atan2(-jib_dir.z, jib_dir.x)
	_box(Vector3(52.0, 39.6, -53.0), Vector3(jib_len + 4.0, 0.8, 1.2), Color(0.9, 0.6, 0.15), 0.8, Basis(Vector3.UP, jib_ang))
	_cyl(Vector3(44.0, 35.0, -44.0), 0.08, 4.6, Color(0.2, 0.2, 0.2), 5)
	_box(Vector3(44.0, 34.7, -44.0), Vector3(0.8, 0.5, 0.8), Color(0.3, 0.3, 0.32))
	# --- Alley (E3): two towers with a narrow gap.
	_building(74.0, 0.0, 16.0, 12.0, 24.0, BRICK, 0.45)
	_building(91.8, 0.0, 16.4, 12.0, 24.0, Color(0.5, 0.5, 0.56), 0.4)
	# --- Billboard block (A4).
	_building(-80.0, 51.0, 18.0, 8.0, 14.0, Color(0.6, 0.5, 0.45), 0.5, false)
	for s in [-1.0, 1.0]:
		_cyl(Vector3(-80.0 + 6.0 * s, 7.7, 51.0), 0.25, 6.5, STEEL, 6)
	_box(Vector3(-80.0, 12.0, 51.5), Vector3(14.0, 6.0, 0.4), Color(0.95, 0.95, 0.9))
	_box(Vector3(-80.0, 14.8, 50.6), Vector3(14.0, 0.4, 1.2), STEEL)
	var ad := Label3D.new()
	ad.text = "DYLAN'S\nODYSSEY"
	ad.font_size = 160
	ad.pixel_size = 0.014
	ad.modulate = Color(0.95, 0.2, 0.3)
	ad.position = Vector3(-80.0, 12.0, 51.8)
	add_child(ad)
	_box(Vector3(-84.0, 2.6, 59.0), Vector3(4.0, 0.3, 2.2), Color(0.9, 0.3, 0.25))
	_box(Vector3(-76.0, 5.2, 59.0), Vector3(4.0, 0.3, 2.2), Color(0.25, 0.4, 0.9))
	_box(Vector3(-86.0, 11.2, 51.0), Vector3(2.4, 0.3, 2.4), STEEL)
	# --- Market block (C4): the switch roof and the rail stairs.
	_building(10.0, 52.0, 12.0, 6.0, 10.0, Color(0.7, 0.4, 0.3), 0.5, false)
	switch_node = _cyl(Vector3(10.0, 6.0 - 0.3, 52.0), 1.0, 0.5, Color(0.85, 0.15, 0.15), 12)
	switch_node.name = "Switch"
	_cyl(Vector3(10.0, 5.4, 52.0), 1.4, 0.3, Color(0.4, 0.4, 0.42), 12)
	for i in 6:
		_box(Vector3(-10.0, 0.75 + 1.5 * i, 56.0 - 2.4 * i), Vector3(4.0, 1.5, 2.4), CONCRETE)
	# --- The rail line.
	_box(Vector3(0.0, 8.75, 40.0), Vector3(244.0, 0.5, 4.0), Color(0.3, 0.32, 0.36))
	_box(Vector3(0.0, 9.1, 39.0), Vector3(244.0, 0.2, 0.25), Color(0.7, 0.7, 0.72))
	_box(Vector3(0.0, 9.1, 41.0), Vector3(244.0, 0.2, 0.25), Color(0.7, 0.7, 0.72))
	var px := -120.0
	while px <= 120.0:
		_cyl(Vector3(px, g(px, 40.0) - 0.3, 40.0), 0.7, 9.0, Color(0.3, 0.32, 0.36), 8)
		px += 16.0
	# --- Rooftop staircase (A2).
	_building(-94.0, -40.0, 10.0, 5.0, 26.0, Color(0.55, 0.5, 0.48), 0.4, false)
	_building(-82.0, -40.0, 10.0, 9.5, 26.0, Color(0.5, 0.55, 0.6), 0.45, false)
	_building(-70.0, -40.0, 10.0, 14.0, 26.0, BRICK, 0.5, false)
	# --- Back alley with the chest (A1).
	_building(-90.0, -80.0, 14.0, 7.0, 24.0, Color(0.5, 0.45, 0.42), 0.3, false)
	_building(-70.0, -80.0, 14.0, 7.0, 24.0, Color(0.45, 0.42, 0.45), 0.3, false)
	chest = _box(Vector3(-80.0, 0.5, -88.0), Vector3(1.4, 1.0, 1.0), Color(0.55, 0.32, 0.15))
	chest.name = "Chest"
	var lid := MeshLib.Builder.new()
	lid.box(Vector3(0, 0.6, 0), Vector3(1.45, 0.25, 1.05))
	chest.add_child(lid.commit(Mats.pbr(Color(0.85, 0.7, 0.25), 0.4, 0.6), "Lid"))
	# --- Manhole cover at the crossroads.
	var slab := _box(Vector3(-20.0, 0.12, -60.0), Vector3(2.4, 0.3, 2.4), Color(0.3, 0.3, 0.32))
	slab.name = "Slab"
	slabs.append(slab)
	# --- Harbour: lighthouse, bollards, crates.
	var lp := Vector3(100.0, g(100.0, 80.0) - 0.3, 80.0)
	_cyl(lp, 2.6, 14.0, Color(0.95, 0.95, 0.92), 14, 2.2)
	_box(lp + Vector3(0, 7.0, 0), Vector3(5.1, 1.6, 5.1), Color(0.85, 0.2, 0.2))
	_cyl(lp + Vector3(0, 14.0, 0), 3.2, 0.5, Color(0.3, 0.3, 0.34), 14)
	_cyl(lp + Vector3(0, 14.5, 0), 1.2, 1.8, Color(0.9, 0.9, 0.6), 10)
	var lgb := MeshLib.Builder.new()
	lgb.ellipsoid(Vector3(0, 16.3, 0), Vector3(1.0, 1.0, 1.0), 10, 8)
	var lg := lgb.commit(Mats.glow(Color(1.0, 0.95, 0.7), 3.0), "LighthouseLamp")
	lg.position = lp
	add_child(lg)
	var bx := -100.0
	while bx <= 100.0:
		_cyl(Vector3(bx, g(bx, 88.0) - 0.2, 88.0), 0.35, 0.9, Color(0.2, 0.2, 0.22), 8)
		bx += 20.0
	# --- Filler buildings in the free blocks.
	var free_blocks := [[-60, -20, -100, -60], [-20, 20, -100, -60], [20, 60, -100, -60], [60, 100, -100, -60],
		[-60, -20, -60, -20], [-20, 20, -60, -20], [60, 100, -60, -20], [-100, -60, -20, 20],
		[-60, -20, 20, 60], [20, 60, 20, 60], [60, 100, 20, 60]]
	var palette := [BRICK, CONCRETE, Color(0.5, 0.55, 0.62), Color(0.62, 0.48, 0.4), Color(0.4, 0.45, 0.5), CREAM]
	for blk in free_blocks:
		var x0: float = blk[0] + 8.0
		var x1: float = blk[1] - 8.0
		var z0: float = blk[2] + 8.0
		var z1: float = blk[3] - 8.0
		# Two buildings per block, split along z, keeping clear of the rail.
		for half_i in 2:
			var za := z0 if half_i == 0 else (z0 + z1) * 0.5 + 3.0
			var zb := (z0 + z1) * 0.5 - 3.0 if half_i == 0 else z1
			var w := rng.randf_range(9.0, minf(16.0, x1 - x0))
			var d := rng.randf_range(8.0, minf(14.0, zb - za))
			var cx := rng.randf_range(x0 + w * 0.5, x1 - w * 0.5)
			var cz := rng.randf_range(za + d * 0.5, zb - d * 0.5)
			if absf(cz - 40.0) < d * 0.5 + 3.0:
				continue
			var h := rng.randf_range(5.0, 17.0)
			_building(cx, cz, w, h, d, palette[rng.randi() % palette.size()], rng.randf_range(0.3, 0.7))
	_finish_windows()
	# --- Crates.
	for cpos in [Vector3(6, 0, -12), Vector3(-14, 0, 10), Vector3(30, 0, 24), Vector3(-30, 0, 82), Vector3(30, 0, 82),
			Vector3(60, 0, 84), Vector3(-100, 0, 40), Vector3(100, 0, 0), Vector3(24, 0, -64), Vector3(-64, 0, -24)]:
		_crate(Vector3(cpos.x, g(cpos.x, cpos.z) + 0.5, cpos.z))
	# --- Taxi race rings.
	_ring_pos = [Vector3(40, 0, -20), Vector3(100, 0, -20), Vector3(100, 0, 60), Vector3(20, 0, 60),
		Vector3(-60, 0, 60), Vector3(-100, 0, 20), Vector3(-100, 0, -60), Vector3(-20, 0, -60)]
	for i in _ring_pos.size():
		var p: Vector3 = _ring_pos[i]
		var mi := MeshInstance3D.new()
		mi.mesh = _ring_mesh
		mi.material_override = Mats.glow(Color(0.3, 0.9, 1.0), 1.2, 0.4)
		mi.position = Vector3(p.x, g(p.x, p.z) + 2.3, p.z)
		# Rings face along the street they sit on.
		mi.rotation.y = 0.0 if i in [0, 1, 3, 4, 7] else PI * 0.5
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		mi.visible = i == 0
		add_child(mi)
		race_rings.append(mi)


# ----------------------------------------------------------------- pickups --

func _pickups() -> void:
	_coin_line(Vector3(-8, 0, 0), Vector3(8, 0, 0), 5)
	_coin_ring(Vector3(0, 0, -30), 4.0, 8)
	_coin_line(Vector3(-40, 0, -20), Vector3(40, 0, -20), 9)
	_coin_ring(Vector3(-40, 0, 10), 5.0, 8)
	_coin_line(Vector3(20, 0, -70), Vector3(20, 0, -100), 5)
	_coin_line(Vector3(60, 0, 30), Vector3(60, 0, 56), 5)
	_coin_line(Vector3(-100, 0, -50), Vector3(-100, 0, 10), 7)
	_coin_line(Vector3(-40, 0, 84), Vector3(40, 0, 84), 9)
	_coin_ring(Vector3(0, 0, 76), 4.0, 6)
	for i in 14:
		_pickup("coin", Vector3(-104.0 + i * 16.0, 10.3, 40.0))
	for i in 5:
		_pickup("coin", Vector3(-82.0, 10.6 + i * 0.0, -52.0 + i * 6.0))
	_coin_arc(Vector3(83.0, 1.0, -14.0), Vector3(83.0, 13.0, 8.0), 2.0, 6)
	_coin_ring(Vector3(40, ROOF_Y, -40), 9.0, 10)
	_coin_line(Vector3(-100, 0, 60), Vector3(-60, 0, 60), 5)
	var purples := [
		Vector3(-36, 0, -4), Vector3(-38, 0, -6), Vector3(-40, 0, -8),
		Vector3(36, 10.0, -4), Vector3(40, 10.0, -4), Vector3(44, 10.0, -4),
		Vector3(54, 30.3, -54), Vector3(26, 30.3, -26),
		Vector3(-40, 10.0, 40), Vector3(-36, 10.0, 40),
		Vector3(74, 12.0, 4), Vector3(74, 12.0, -4),
		Vector3(96, 0, 84), Vector3(98, 0, 86),
		Vector3(-60, 0, 84), Vector3(-64, 0, 86),
		Vector3(-82, 9.5, -40), Vector3(-94, 5.0, -40),
		Vector3(-80, 0, -80), Vector3(-16, 0, 16)]
	for i in purples.size():
		var p: Vector3 = purples[i]
		var y: float = p.y + 1.0 if p.y > 0.5 else g(p.x, p.z) + 1.0
		_pickup("purple", Vector3(p.x, y, p.z), i)
	for hp: Vector3 in [Vector3(-26, 0, -14), Vector3(52, ROOF_Y, -52), Vector3(0, 0, 78), Vector3(-80, 9.0, 40)]:
		var y: float = hp.y + 1.0 if hp.y > 0.5 else g(hp.x, hp.z) + 1.0
		_pickup("heart", Vector3(hp.x, y, hp.z))
	for i in 8:
		var x := -45.0 + i * 12.5
		var b := _pickup("blue", Vector3(x, g(x, 86.0) + 1.0, 86.0))
		blue_coins.append(b)


func _creatures() -> void:
	for p in [Vector3(-40, 0, -20), Vector3(60, 0, -60), Vector3(-60, 0, 46), Vector3(20, 0, -100), Vector3(-20, 0, 80),
			Vector3(60, 0, 20), Vector3(-100, 0, 0), Vector3(100, 0, 50), Vector3(-34, 0, 12), Vector3(0, 0, -60), Vector3(80, 0, 84)]:
		_enemy("bonk", p)
	for p in [Vector3(-20, 0, -40), Vector3(20, 0, 46), Vector3(0, 0, 60), Vector3(-60, 0, -80)]:
		_enemy("spiny", p)
	for p in [Vector3(-48, 0, 6), Vector3(-32, 0, -8), Vector3(-44, 0, -10)]:
		_capturable(Captures.Frog.new(), p)
	_capturable(Captures.Stilt.new(), Vector3(94, 0, 78))
	var taxi := Captures.Taxi.new()
	taxi.patrol_a = Vector3(-90, 0, -20)
	taxi.patrol_b = Vector3(90, 0, -20)
	_capturable(taxi, Vector3(-30, 0, -20), -PI * 0.5)
	_capturable(Captures.Tank.new(), Vector3(40, 0, 15), 0.0)
	_spawn_boss()


func _moons() -> void:
	_place_moon("welcome", Vector3(14.0, 5.2, -14.0))
	_place_moon("fountain", Vector3(-40.0, g(-40.0, 0.0) + 4.9, 0.0))
	_place_moon("rail", Vector3(118.0, 10.6, 40.0))
	_place_moon("crane", Vector3(44.0, ROOF_Y + 4.8, -44.0))
	_place_moon("vault", Vector3(40.0, 1.6, 5.5))
	_place_moon("alley", Vector3(74.0, 13.6, 0.0))
	_place_moon("billboard", Vector3(-80.0, 16.4, 50.6))
	_place_moon("lighthouse", Vector3(100.0, g(100.0, 80.0) + 18.0, 80.0))
	_place_moon("highrise", Vector3(-70.0, 15.6, -40.0))


func _checkpoints() -> void:
	checkpoints = [
		{"pos": Vector3(0, 0.3, 6), "yaw": 0.0, "name": "Plaza"},
		{"pos": Vector3(-40, g(-40, 14) + 0.3, 14), "yaw": 0.0, "name": "Park"},
		{"pos": Vector3(21, 0.3, -36), "yaw": -PI * 0.5, "name": "Tower Base"},
		{"pos": Vector3(27, ROOF_Y + 0.3, -42), "yaw": -PI * 0.5, "name": "Tower Roof"},
		{"pos": Vector3(0, 0.3, 78), "yaw": 0.0, "name": "Harbour"},
		{"pos": Vector3(94, 0.3, 72), "yaw": 0.0, "name": "Lighthouse"},
		{"pos": Vector3(74, 0.3, -16), "yaw": PI, "name": "Alley"},
		{"pos": Vector3(-80, 0.3, 64), "yaw": 0.0, "name": "Billboard"},
		{"pos": Vector3(-10, 0.3, 60), "yaw": 0.0, "name": "Rail Stairs"},
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


# ----------------------------------------------------------- taxi race ----

func _kingdom_physics(dt: float) -> void:
	if race_rings.is_empty():
		return
	var apos := player.actor_pos()
	var in_taxi := player.capture != null and player.capture.kind == "taxi"
	if race_t > 0.0:
		race_t -= dt
		timer_changed.emit(race_t)
		if race_t <= 0.0 or not in_taxi:
			_race_reset("Race over. Drive through the first ring to try again." if in_taxi else "You left the taxi. Race reset.")
			return
	if not in_taxi:
		return
	var idx := 0 if race_next < 0 else race_next
	var ring: Node3D = race_rings[idx]
	if Vector2(apos.x - ring.position.x, apos.z - ring.position.z).length() < 3.4:
		if race_next < 0:
			race_t = 50.0
			race_next = 1
			message.emit("Taxi race! Drive through every ring before time runs out.")
			Sfx.play("switch")
		else:
			race_next += 1
			Sfx.play("checkpoint")
		ring.visible = false
		if race_next >= race_rings.size():
			race_t = -1.0
			timer_changed.emit(0.0)
			race_next = -1
			for r in race_rings:
				r.visible = false
			race_rings[0].visible = true
			spawn_moon("taxi", ring.position + Vector3(0, 2.0, 0))
			return
		race_rings[race_next].visible = true
	var r2: Node3D = race_rings[idx if race_next < 0 else race_next]
	r2.scale = Vector3.ONE * (1.0 + 0.08 * sin(_anim_t * 8.0))


func _race_reset(msg: String) -> void:
	race_t = -1.0
	race_next = -1
	timer_changed.emit(0.0)
	for i in race_rings.size():
		race_rings[i].visible = i == 0
		race_rings[i].scale = Vector3.ONE
	message.emit(msg)
	Sfx.play("deny")
