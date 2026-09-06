# Dino Ridge. Builds the whole kingdom in code and runs everything in it that
# is not a character of its own: coins, moons, crates, boulders, switches,
# checkpoints, the shop zone, the balloon, the rocket cannon, water hazards.
class_name Level
extends Node3D

signal coins_changed(coins: int, purple: int)
signal moon_got(id: String, name: String, count: int, multi: bool)
signal message(text: String)
signal checkpoint_set(idx: int)
signal shop_zone(inside: bool)
signal balloon_touched()
signal timer_changed(t: float)
signal boss_event(kind: String, hp: int)

const NEEDED := 12
const MOON_NAMES := {
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
const MULTI := ["boss"]

# A multimesh of identical pickups or props: one draw call for hundreds of
# coins. Items are dictionaries; hidden ones are parked far underground.
class Batch:
	var mm: MultiMesh
	var items: Array = []
	var cap: int
	var kind: String
	var upright: bool

	func _init(parent: Node3D, mesh: Mesh, mat: Material, capacity: int, k: String, up: bool) -> void:
		kind = k
		cap = capacity
		upright = up
		mm = MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.mesh = mesh
		mm.instance_count = capacity
		mm.custom_aabb = AABB(Vector3(-140, -60, -140), Vector3(280, 160, 280))
		for i in capacity:
			mm.set_instance_transform(i, Transform3D(Basis.IDENTITY.scaled(Vector3.ONE * 0.001), Vector3(0, -1000, 0)))
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		mmi.material_override = mat
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		parent.add_child(mmi)

	func add(pos: Vector3, idx: int) -> Dictionary:
		if items.size() >= cap:
			return {}
		var it := {"kind": kind, "idx": idx, "base": pos, "pos": pos, "visible": true, "slot": items.size()}
		items.append(it)
		return it

	func update(spin: float) -> void:
		for it in items:
			var slot: int = it["slot"]
			if not it["visible"]:
				mm.set_instance_transform(slot, Transform3D(Basis.IDENTITY.scaled(Vector3.ONE * 0.001), Vector3(0, -1000, 0)))
				continue
			var base: Vector3 = it["base"]
			var pos := base + Vector3(0, sin(spin + base.x) * 0.08, 0)
			it["pos"] = pos
			var b := Basis(Vector3.UP, spin)
			if upright:
				b = b * Basis(Vector3.RIGHT, PI * 0.5)
			mm.set_instance_transform(slot, Transform3D(b, pos))


var player: Player
var cam: CameraRig
var hat: Hat
var _batches := {}
var _tree_xf: Array = [[], [], []]
var _rock_xf: Array = []
var _hearts: Array = []
var coins := 0
var purple := 0
var moons_got := {}
var purple_got := {}
var bonk_kills := 0
var cleared := false
var checkpoints: Array = []
var current_cp := 0
var pickups: Array = []       # Node3D with meta "kind" (coin/purple/blue/heart)
var moons: Array = []
var enemies: Array = []
var capturables: Array = []
var crates: Array = []
var boulders: Array = []
var slabs: Array = []
var spots: Array = []
var bell: Node3D
var bell_rings := 0
var bell_cool := 0.0
var scarecrow: Node3D
var chest: Node3D
var switch_node: Node3D
var timer_t := -1.0
var timer_moon: Node3D
var blue_t := -1.0
var blue_coins: Array = []
var boss: Boss
var arena_center := Vector3(-6, 26, -108)
var arena_r := 16.0
var shop_pos := Vector3(14, 0, 12)
var shop_inside := false
var balloon_pos := Vector3(0, 0, 27)
var cannon_pos := Vector3.ZERO
var cannon_t := 2.0
var rng := RandomNumberGenerator.new()
var hints: Array = [
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
var _hint_t := 0.0
var _dyn: Node3D
var _anim_t := 0.0
var _coin_mesh: ArrayMesh
var _purple_mesh: ArrayMesh
var _moon_mesh: ArrayMesh
var _heart_mesh: ArrayMesh
var _dust: CPUParticles3D


static func g(x: float, z: float) -> float:
	return Terrain.height(x, z)


func moon_count() -> int:
	var n := 0
	for id in moons_got:
		n += 3 if id in MULTI else 1
	return n


func total_moons() -> int:
	var n := 0
	for id in MOON_NAMES:
		n += 3 if id in MULTI else 1
	return n


# ------------------------------------------------------------------ build --

func build(p: Player, c: CameraRig, h: Hat) -> void:
	player = p
	cam = c
	hat = h
	rng.seed = 77
	_coin_mesh = Models.coin_mesh(false)
	_purple_mesh = Models.coin_mesh(true)
	_moon_mesh = Models.moon_mesh()
	_heart_mesh = Models.heart_mesh()
	_dyn = Node3D.new()
	_dyn.name = "Dynamic"
	add_child(_dyn)
	_environment()
	add_child(Terrain.build())
	_water()
	_batches["coin"] = Batch.new(_dyn, _coin_mesh, Mats.glow(Color(1.0, 0.85, 0.2), 0.6, 0.3), 420, "coin", true)
	_batches["purple"] = Batch.new(_dyn, _purple_mesh, Mats.glow(Color(0.7, 0.3, 0.95), 0.8, 0.3), 24, "purple", true)
	_batches["blue"] = Batch.new(_dyn, _coin_mesh, Mats.glow(Color(0.25, 0.55, 1.0), 0.9, 0.3), 12, "blue", true)
	_dressing()
	_landing_zone()
	_set_pieces()
	_finish_dressing()
	_pickups()
	_creatures()
	_moons()
	_checkpoints()
	add_child(player)
	player.global_position = checkpoints[0]["pos"]
	player.facing = 0.0
	add_child(hat)
	hat.player = player
	hat.level = self
	player.pounded.connect(_on_pounded)
	_dust = CPUParticles3D.new()
	_dust.emitting = false
	_dust.one_shot = true
	_dust.amount = 24
	_dust.lifetime = 0.7
	_dust.explosiveness = 1.0
	_dust.direction = Vector3.UP
	_dust.spread = 70.0
	_dust.initial_velocity_min = 3.0
	_dust.initial_velocity_max = 7.0
	_dust.gravity = Vector3(0, -9, 0)
	_dust.scale_amount_min = 0.15
	_dust.scale_amount_max = 0.35
	_dust.mesh = SphereMesh.new()
	(_dust.mesh as SphereMesh).radius = 0.5
	(_dust.mesh as SphereMesh).height = 1.0
	_dust.material_override = Mats.unshaded(Color(1.0, 0.95, 0.7))
	add_child(_dust)


var _bursts: Array = []
var _burst_i := 0


func burst(pos: Vector3, col: Color = Color(1.0, 0.95, 0.7)) -> void:
	if _bursts.is_empty():
		for i in 6:
			var d := _dust.duplicate() as CPUParticles3D
			add_child(d)
			_bursts.append(d)
	var d: CPUParticles3D = _bursts[_burst_i]
	_burst_i = (_burst_i + 1) % _bursts.size()
	d.global_position = pos
	d.material_override = Mats.unshaded(col)
	d.restart()
	d.emitting = true


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


func _water_quad(cx: float, cz: float, w: float, d: float, y: float, mat: Material, segs: int = 8) -> void:
	var b := MeshLib.Builder.new()
	for j in segs:
		for i in segs:
			var x0 := cx - w * 0.5 + w * i / segs
			var x1 := cx - w * 0.5 + w * (i + 1) / segs
			var z0 := cz - d * 0.5 + d * j / segs
			var z1 := cz - d * 0.5 + d * (j + 1) / segs
			b.quad_n(Vector3(x0, y, z0), Vector3(x0, y, z1), Vector3(x1, y, z1), Vector3(x1, y, z0),
				Vector3.UP, Vector3.UP, Vector3.UP, Vector3.UP,
				Vector2(x0, z0) * 0.05, Vector2(x0, z1) * 0.05, Vector2(x1, z1) * 0.05, Vector2(x1, z0) * 0.05)
	add_child(b.commit(mat, "Water"))


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


func _box(center: Vector3, size: Vector3, col: Color, rough: float = 0.85, basis: Basis = Basis.IDENTITY) -> StaticBody3D:
	var body := StaticBody3D.new()
	var b := MeshLib.Builder.new()
	b.box(Vector3.ZERO, size)
	body.add_child(b.commit(Mats.pbr(col, rough), "Mesh"))
	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	cs.shape = shape
	body.add_child(cs)
	body.transform = Transform3D(basis, center)
	add_child(body)
	return body


# Cylinder standing on `base`.
func _cyl(base: Vector3, r: float, h: float, col: Color, segs: int = 12, r_top: float = -1.0) -> StaticBody3D:
	var body := StaticBody3D.new()
	var b := MeshLib.Builder.new()
	b.cylinder(Vector3.ZERO, Vector3(0, h, 0), r, r if r_top < 0.0 else r_top, segs)
	body.add_child(b.commit(Mats.pbr(col, 0.9), "Mesh"))
	var cs := CollisionShape3D.new()
	var shape := CylinderShape3D.new()
	shape.radius = maxf(r, r_top)
	shape.height = h
	cs.shape = shape
	cs.position = Vector3(0, h * 0.5, 0)
	body.add_child(cs)
	body.position = base
	add_child(body)
	return body


const ROCK := Color(0.55, 0.47, 0.4)
const ROCK_DARK := Color(0.42, 0.36, 0.32)
const WOOD := Color(0.55, 0.36, 0.2)


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


func _tree(kind: int, pos: Vector3, scale: float) -> void:
	var t := Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(scale, scale * rng.randf_range(0.9, 1.15), scale)), pos)
	_tree_xf[kind].append(t)
	var body := StaticBody3D.new()
	var cs := CollisionShape3D.new()
	var c := CylinderShape3D.new()
	c.radius = 0.4 * scale
	c.height = 3.0
	cs.shape = c
	cs.position = Vector3(0, 1.5, 0)
	body.add_child(cs)
	body.position = pos
	add_child(body)


func _rock(pos: Vector3, size: float) -> void:
	var sc := Vector3(size * rng.randf_range(0.8, 1.2), size * rng.randf_range(0.7, 1.1), size * rng.randf_range(0.8, 1.2))
	_rock_xf.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(sc), pos))


func _finish_dressing() -> void:
	for kind in 3:
		var xs: Array = _tree_xf[kind]
		if xs.is_empty():
			continue
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.use_colors = true
		mm.mesh = Models.tree_mesh(kind)
		mm.instance_count = xs.size()
		for i in xs.size():
			mm.set_instance_transform(i, xs[i])
			var tint := rng.randf_range(0.85, 1.1)
			mm.set_instance_color(i, Color(tint, tint * rng.randf_range(0.95, 1.08), tint))
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		mmi.material_override = Mats.vertex_painted(0.85)
		add_child(mmi)
	if not _rock_xf.is_empty():
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.use_colors = true
		mm.mesh = Models.rock(rng, 1.0)
		mm.instance_count = _rock_xf.size()
		for i in _rock_xf.size():
			mm.set_instance_transform(i, _rock_xf[i])
			mm.set_instance_color(i, ROCK.lerp(ROCK_DARK, rng.randf()))
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		mmi.material_override = Mats.vertex_painted(0.95)
		add_child(mmi)


func _clear_spot(x: float, z: float, avoid: Array, r: float, min_ny: float) -> bool:
	if absf(x + 10.0) < 8.0 and z > -36.0:
		return false
	if Vector2(x + 10.0, z + 28.0).length() < 15.0:
		return false
	if x > 62.0 and x < 92.0 and z > -34.0:
		return false
	if Terrain.ramp_mask(x) > 0.3 and z < -20.0 and z > -110.0:
		return false
	if Vector2(x - arena_center.x, z - arena_center.z).length() < arena_r + 5.0:
		return false
	for a in avoid:
		if Vector2(x - a.x, z - a.z).length() < r:
			return false
	if Terrain.normal(x, z).y < min_ny:
		return false
	return true


func _scatter(n: int, size: float, colours: Array, avoid: Array, grass: bool = false) -> void:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	var b := MeshLib.Builder.new()
	if grass:
		b.spike(Vector3(-0.5, 0, 0), Vector3(-0.3, 1.6, 0.1), 0.35, 5, 2)
		b.spike(Vector3(0.4, 0, 0.1), Vector3(0.5, 1.4, -0.1), 0.35, 5, 2)
		b.spike(Vector3(0, 0, -0.4), Vector3(0.1, 1.8, -0.3), 0.35, 5, 2)
	else:
		b.cylinder(Vector3.ZERO, Vector3(0, 1.2, 0), 0.12, 0.08, 5)
		b.ellipsoid(Vector3(0, 1.3, 0), Vector3(0.6, 0.35, 0.6), 7, 4)
	mm.mesh = b.commit_mesh()
	mm.instance_count = n
	var placed := 0
	var tries := 0
	while placed < n and tries < n * 6:
		tries += 1
		var x := rng.randf_range(-125.0, 125.0)
		var z := rng.randf_range(-125.0, 125.0)
		if not _clear_spot(x, z, avoid, 2.0, 0.8):
			continue
		var s := size * rng.randf_range(0.7, 1.3)
		var t := Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(s, s, s)), Vector3(x, g(x, z) - 0.02, z))
		mm.set_instance_transform(placed, t)
		mm.set_instance_color(placed, colours[rng.randi() % colours.size()])
		placed += 1
	mm.instance_count = placed
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	mmi.material_override = Mats.vertex_painted(0.9)
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mmi)


func _landing_zone() -> void:
	# The balloon the kid arrived in.
	var bp := balloon_pos
	var basket := _box(bp + Vector3(0, 0.6, 0), Vector3(2.2, 1.2, 2.2), WOOD)
	basket.name = "Balloon"
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 6.5, 0), Vector3(3.6, 4.2, 3.6), 18, 12)
	var env := b.commit(Mats.skin(Color(0.95, 0.25, 0.2)), "Envelope")
	env.position = bp
	add_child(env)
	var stripes := MeshLib.Builder.new()
	for i in 4:
		var a := TAU * i / 4.0
		stripes.box(Vector3(cos(a) * 3.4, 6.5, sin(a) * 3.4), Vector3(0.5, 6.5, 0.5), Basis(Vector3.UP, -a))
	var st := stripes.commit(Mats.skin(Color(1.0, 0.85, 0.25)), "Stripes")
	st.position = bp
	add_child(st)
	var ropes := MeshLib.Builder.new()
	for i in 4:
		var a := TAU * i / 4.0 + PI / 4.0
		ropes.cylinder(Vector3(cos(a) * 1.0, 1.2, sin(a) * 1.0), Vector3(cos(a) * 2.6, 3.4, sin(a) * 2.6), 0.05, 0.05, 5)
	var rp := ropes.commit(Mats.pbr(Color(0.3, 0.25, 0.2)), "Ropes")
	rp.position = bp
	add_child(rp)
	# The shop: posts, a striped roof, a counter and a hat on a stand.
	var sp := shop_pos
	for s in [-1.0, 1.0]:
		_cyl(sp + Vector3(2.2 * s, 0, -1.6), 0.12, 3.4, WOOD, 8)
		_cyl(sp + Vector3(2.2 * s, 0, 1.6), 0.12, 3.4, WOOD, 8)
	var roof := _box(sp + Vector3(0, 3.6, 0), Vector3(5.6, 0.3, 4.4), Color(0.9, 0.25, 0.2))
	roof.name = "ShopRoof"
	var rb := MeshLib.Builder.new()
	for i in 4:
		rb.box(Vector3(-2.1 + i * 1.4, 0.2, 0), Vector3(0.7, 0.32, 4.5))
	var rm := rb.commit(Mats.pbr(Color(0.98, 0.95, 0.9)), "RoofStripes")
	rm.position = sp + Vector3(0, 3.6, 0)
	add_child(rm)
	_box(sp + Vector3(0, 0.55, 1.2), Vector3(5.0, 1.1, 0.8), WOOD)
	var sign := _box(sp + Vector3(0, 4.3, 0), Vector3(3.6, 1.0, 0.2), Color(0.98, 0.85, 0.3))
	sign.name = "ShopSign"
	var lab := Label3D.new()
	lab.text = "CRAZY CAP"
	lab.font_size = 96
	lab.pixel_size = 0.01
	lab.modulate = Color(0.2, 0.1, 0.05)
	lab.position = sp + Vector3(0, 4.3, 0.12)
	lab.rotation.y = 0.0
	lab.billboard = BaseMaterial3D.BILLBOARD_DISABLED
	add_child(lab)
	var cap := Models.cap(Models.CAP_COLOURS["blue"], true, 1.6)
	cap.position = sp + Vector3(1.4, 1.15, 1.2)
	add_child(cap)
	var cap2 := Models.cap(Models.CAP_COLOURS["gold"], true, 1.6)
	cap2.position = sp + Vector3(-1.4, 1.15, 1.2)
	add_child(cap2)
	var keeper := Models.bonk()
	keeper.position = sp + Vector3(0, 0, -0.4)
	keeper.rotation.y = PI
	keeper.scale = Vector3(1.2, 1.2, 1.2)
	add_child(keeper)


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
	for sp in [Vector3(-20.0, 0, 30.0), Vector3(-40.0, 0, -95.0)]:
		var pos := Vector3(sp.x, g(sp.x, sp.z) + 0.06, sp.z)
		var d := MeshLib.Builder.new()
		d.lathe([Vector2(0.0, 0.0), Vector2(1.1, 0.0), Vector2(1.1, 0.05), Vector2(0.0, 0.05)], 16)
		var mi := d.commit(Mats.glow(Color(1.0, 0.9, 0.4), 1.8), "Spot")
		mi.position = pos
		add_child(mi)
		spots.append(mi)
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


func _crate(pos: Vector3) -> void:
	var body := _box(pos, Vector3(1.0, 1.0, 1.0), Color(0.8, 0.6, 0.3), 0.8, Basis(Vector3.UP, rng.randf() * 0.5))
	body.name = "Crate"
	var bands := MeshLib.Builder.new()
	bands.box(Vector3(0, 0, 0), Vector3(1.04, 0.14, 1.04))
	bands.box(Vector3(0, 0, 0), Vector3(0.14, 1.04, 1.04))
	body.add_child(bands.commit(Mats.pbr(Color(0.5, 0.35, 0.15)), "Bands"))
	crates.append(body)


func _boulder(pos: Vector3, size: float) -> void:
	var body := StaticBody3D.new()
	var mi := MeshInstance3D.new()
	mi.mesh = Models.rock(rng, size)
	mi.material_override = Mats.pbr(Color(0.5, 0.45, 0.5), 0.95)
	mi.scale = Vector3(1.0, 1.5, 1.0)
	body.add_child(mi)
	var cs := CollisionShape3D.new()
	var s := SphereShape3D.new()
	s.radius = size * 0.85
	cs.shape = s
	cs.position = Vector3(0, size * 0.4, 0)
	body.add_child(cs)
	body.position = pos
	body.name = "Boulder"
	add_child(body)
	boulders.append(body)


# --------------------------------------------------------------- pickups --

func _pickup(kind: String, pos: Vector3, idx: int = -1) -> Dictionary:
	if kind == "heart":
		var mi := MeshInstance3D.new()
		mi.mesh = _heart_mesh
		mi.material_override = Mats.glow(Color(1.0, 0.3, 0.4), 0.8, 0.3)
		mi.position = pos
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		_dyn.add_child(mi)
		var it := {"kind": "heart", "idx": idx, "base": pos, "pos": pos, "visible": true, "node": mi}
		_hearts.append(it)
		pickups.append(it)
		return it
	var b: Batch = _batches[kind]
	var it := b.add(pos, idx)
	if not it.is_empty():
		pickups.append(it)
	return it


func spawn_coins(pos: Vector3, n: int) -> void:
	for i in n:
		var a := TAU * i / n
		var p := pos + Vector3(cos(a) * 0.8, 0.6 + (i % 2) * 0.4, sin(a) * 0.8)
		_pickup("coin", p)


func _coin_line(a: Vector3, b: Vector3, n: int) -> void:
	for i in n:
		var t := float(i) / maxf(n - 1, 1)
		var p := a.lerp(b, t)
		_pickup("coin", Vector3(p.x, g(p.x, p.z) + 1.0 + p.y, p.z))


func _coin_ring(c: Vector3, r: float, n: int) -> void:
	for i in n:
		var a := TAU * i / n
		var x := c.x + cos(a) * r
		var z := c.z + sin(a) * r
		_pickup("coin", Vector3(x, g(x, z) + 1.0 + c.y, z))


func _coin_arc(a: Vector3, b: Vector3, h: float, n: int) -> void:
	for i in n:
		var t := float(i) / maxf(n - 1, 1)
		var p := a.lerp(b, t) + Vector3(0, sin(t * PI) * h, 0)
		_pickup("coin", p)


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


# -------------------------------------------------------------- creatures --

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
	boss = Boss.new()
	add_child(boss)
	boss.global_position = arena_center + Vector3(-4, 0.5, 0)
	boss.setup(self, player, arena_center, arena_r)
	boss.facing = -PI * 0.5
	boss.defeated.connect(_on_boss_defeated)
	boss.hit.connect(func(hp): boss_event.emit("hit", hp))
	boss.woke.connect(func(): boss_event.emit("start", 3))


func _enemy(kind: String, p: Vector3) -> void:
	var e := Enemy.new()
	add_child(e)
	e.global_position = Vector3(p.x, g(p.x, p.z) + 0.5, p.z)
	e.setup(kind, self, player)
	enemies.append(e)


func _capturable(c: Capturable, p: Vector3, facing: float = 0.0) -> void:
	add_child(c)
	c.global_position = Vector3(p.x, g(p.x, p.z) + 0.5, p.z)
	c.setup(self, player)
	c.facing = facing
	capturables.append(c)


func _fire_rocket() -> void:
	var r := Captures.Rocket.new()
	_dyn.add_child(r)
	r.global_position = cannon_pos + Vector3(3.0, 5.4, 0)
	r.setup(self, player)
	r.dir = Vector3.RIGHT
	r.facing = atan2(-1.0, 0.0)
	capturables.append(r)
	Sfx.play("rocket", -8.0)


# ------------------------------------------------------------------ moons --

func _moon_node(id: String, pos: Vector3) -> Node3D:
	var m := Node3D.new()
	m.name = "Moon_" + id
	var mi := MeshInstance3D.new()
	mi.mesh = _moon_mesh
	var multi := id in MULTI
	mi.material_override = Mats.glow(Color(1.0, 0.9, 0.3) if not multi else Color(1.0, 0.75, 0.2), 1.6, 0.25)
	mi.scale = Vector3.ONE * (1.6 if multi else 1.0)
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	m.add_child(mi)
	m.position = pos
	m.set_meta("id", id)
	m.set_meta("base", pos)
	m.set_meta("rise", 0.0)
	_dyn.add_child(m)
	moons.append(m)
	return m


func _place_moon(id: String, pos: Vector3) -> Node3D:
	if moons_got.has(id):
		return null
	for m in moons:
		if m.get_meta("id") == id:
			return m
	return _moon_node(id, pos)


func spawn_moon(id: String, pos: Vector3) -> Node3D:
	var m := _place_moon(id, pos)
	if m:
		m.set_meta("rise", 1.0)
		m.position = pos - Vector3(0, 1.5, 0)
		Sfx.play("heart")
		burst(pos, Color(1.0, 0.95, 0.5))
	return m


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


# ------------------------------------------------------------- save state --

func state() -> Dictionary:
	return {"coins": coins, "purple": purple, "moons": moons_got.keys(), "purples": purple_got.keys(),
		"bonks": bonk_kills, "cleared": cleared, "cp": current_cp, "bell": bell_rings}


func restore(d: Dictionary) -> void:
	coins = int(d.get("coins", 0))
	purple = int(d.get("purple", 0))
	bonk_kills = int(d.get("bonks", 0))
	cleared = bool(d.get("cleared", false))
	bell_rings = int(d.get("bell", 0))
	current_cp = clampi(int(d.get("cp", 0)), 0, checkpoints.size() - 1)
	for id in d.get("moons", []):
		moons_got[str(id)] = true
	for i in d.get("purples", []):
		purple_got[int(i)] = true
	# Remove things that are already collected.
	for m in moons.duplicate():
		if moons_got.has(m.get_meta("id")):
			moons.erase(m)
			m.queue_free()
	for it in pickups:
		if it["kind"] == "purple" and purple_got.has(int(it["idx"])):
			it["visible"] = false
	if moons_got.has("rex"):
		for b in boulders:
			b.queue_free()
		boulders.clear()
	if moons_got.has("boss") and boss:
		boss.state = Boss.S.DEAD
		boss.hp = 0
	_update_flags()
	coins_changed.emit(coins, purple)


func spawn_point() -> Dictionary:
	return checkpoints[current_cp]


func respawn_player() -> void:
	var c: Dictionary = checkpoints[current_cp]
	player.respawn(c["pos"] + Vector3(0, 0.3, 0), c["yaw"])
	coins = maxi(coins - 10, 0)
	coins_changed.emit(coins, purple)
	if boss and boss.state != Boss.S.DEAD:
		boss.state = Boss.S.SLEEP
		boss.hp = 3
		boss.global_position = arena_center + Vector3(-4, 0.5, 0)
	# Respawn crates? No: the world remembers what you broke.


func _update_flags() -> void:
	for i in checkpoints.size():
		var pole := get_node_or_null("Flag%d" % i)
		if pole:
			var cloth := pole.get_node("FlagCloth") as MeshInstance3D
			cloth.material_override = Mats.pbr(Color(1.0, 0.85, 0.2) if i == current_cp else Color(0.4, 0.4, 0.45))


# --------------------------------------------------------------- running --

func _physics_process(dt: float) -> void:
	if player == null:
		return
	_anim_t += dt
	bell_cool = maxf(bell_cool - dt, 0.0)
	# Rocket cannon.
	cannon_t -= dt
	if cannon_t <= 0.0:
		cannon_t = 4.5
		if player.actor_pos().distance_to(cannon_pos) < 70.0:
			_fire_rocket()
	# Prune freed capturables.
	for i in range(capturables.size() - 1, -1, -1):
		if not is_instance_valid(capturables[i]):
			capturables.remove_at(i)
	for i in range(enemies.size() - 1, -1, -1):
		if not is_instance_valid(enemies[i]):
			enemies.remove_at(i)
	if player.dead:
		return
	var apos := player.actor_pos()
	var r := 1.3
	if player.capture and player.capture.kind == "rex":
		r = 3.2
	_collect_at(apos + Vector3(0, 0.7, 0), r)
	if player.capture == null:
		_enemy_contact()
	# Checkpoints.
	for i in checkpoints.size():
		if i != current_cp and player.capture == null:
			var c: Dictionary = checkpoints[i]
			if apos.distance_to(c["pos"]) < 3.5:
				current_cp = i
				_update_flags()
				Sfx.play("checkpoint")
				message.emit("CHECKPOINT: " + str(c["name"]))
				checkpoint_set.emit(i)
	# One-off hints near the set pieces.
	_hint_t -= dt
	if _hint_t <= 0.0:
		_hint_t = 0.5
		for hnt in hints:
			if not hnt.get("done", false):
				var hp: Vector3 = hnt["pos"]
				if Vector2(apos.x - hp.x, apos.z - hp.z).length() < float(hnt["r"]) and absf(apos.y - hp.y) < 8.0:
					hnt["done"] = true
					message.emit(str(hnt["text"]))
	# Shop zone and balloon.
	var inside := Vector2(apos.x - shop_pos.x, apos.z - shop_pos.z - 3.0).length() < 3.2 and player.capture == null
	if inside != shop_inside:
		shop_inside = inside
		shop_zone.emit(inside)
	if Vector2(apos.x - balloon_pos.x, apos.z - balloon_pos.z).length() < 2.6 and player.capture == null:
		balloon_touched.emit()
	# Timed moon.
	if timer_t > 0.0:
		timer_t -= dt
		timer_changed.emit(timer_t)
		if timer_t <= 0.0:
			timer_changed.emit(0.0)
			if timer_moon and is_instance_valid(timer_moon):
				moons.erase(timer_moon)
				timer_moon.queue_free()
			timer_moon = null
			message.emit("Too slow! Pound the switch to try again.")
			Sfx.play("deny")
	if blue_t > 0.0:
		blue_t -= dt
		timer_changed.emit(blue_t)
		if blue_t <= 0.0:
			timer_changed.emit(0.0)
			for b in blue_coins:
				b["visible"] = true
			message.emit("Blue coins reset. Try again!")
			Sfx.play("deny")
	# Camera zone for the boss.
	if cam:
		cam.zone_distance = 15.0 if (boss and boss.active()) else 0.0


func _process(dt: float) -> void:
	# Spin pickups and moons (cheap: they are plain nodes).
	var spin := _anim_t * 2.4
	for k in _batches:
		(_batches[k] as Batch).update(spin)
	for it in _hearts:
		var n: Node3D = it["node"]
		n.visible = it["visible"]
		n.rotation.y = spin
		var base: Vector3 = it["base"]
		n.position.y = base.y + sin(spin + base.x) * 0.08
	for m in moons:
		if not is_instance_valid(m):
			continue
		m.rotation.y = spin * 0.6
		var base: Vector3 = m.get_meta("base")
		var rise: float = m.get_meta("rise")
		if rise > 0.0:
			rise = maxf(rise - dt * 1.2, 0.0)
			m.set_meta("rise", rise)
			m.position = base - Vector3(0, 1.5 * rise, 0)
		else:
			m.position.y = base.y + sin(spin * 0.8) * 0.12
	if bell:
		bell.rotation.z = sin(_anim_t * 12.0) * 0.25 * clampf(bell_cool, 0.0, 1.0)


func _collect_at(p: Vector3, r: float) -> void:
	for it in pickups:
		if not it["visible"]:
			continue
		var pos: Vector3 = it["pos"]
		if pos.distance_to(p) < r:
			_take_pickup(it)
	for i in range(moons.size() - 1, -1, -1):
		var m: Node3D = moons[i]
		if not is_instance_valid(m):
			moons.remove_at(i)
			continue
		if m.position.distance_to(p) < r + 0.5:
			_take_moon(m)


func _take_pickup(it: Dictionary) -> void:
	var kind: String = it["kind"]
	it["visible"] = false
	var pos: Vector3 = it["pos"]
	match kind:
		"coin":
			coins += 1
			Sfx.play("coin", -4.0)
			burst(pos, Color(1.0, 0.9, 0.4))
		"purple":
			purple += 1
			purple_got[int(it["idx"])] = true
			Sfx.play("purple", -2.0)
			burst(pos, Color(0.8, 0.5, 1.0))
		"heart":
			player.heal(1)
			Sfx.play("heart")
			burst(pos, Color(1.0, 0.5, 0.6))
		"blue":
			Sfx.play("purple", -2.0, 0.0)
			burst(pos, Color(0.5, 0.7, 1.0))
			if blue_t <= 0.0:
				blue_t = 16.0
				message.emit("Grab all 8 blue coins!")
			var left := 0
			for b in blue_coins:
				if b["visible"]:
					left += 1
			if left == 0:
				blue_t = -1.0
				timer_changed.emit(0.0)
				spawn_moon("bluecoins", pos + Vector3(0, 1.0, 0))
	coins_changed.emit(coins, purple)


func _take_moon(m: Node3D) -> void:
	var id: String = m.get_meta("id")
	moons.erase(m)
	m.queue_free()
	if m == timer_moon:
		timer_moon = null
		timer_t = -1.0
		timer_changed.emit(0.0)
	award_moon(id)


func award_moon(id: String) -> void:
	if moons_got.has(id):
		return
	moons_got[id] = true
	var multi := id in MULTI
	Sfx.play("multimoon" if multi else "moon")
	burst(player.actor_pos() + Vector3(0, 1.5, 0), Color(1.0, 0.95, 0.5))
	moon_got.emit(id, MOON_NAMES.get(id, id), moon_count(), multi)


func _enemy_contact() -> void:
	var pp := player.global_position
	for e in enemies:
		if not is_instance_valid(e) or not e.alive:
			continue
		var ep: Vector3 = e.global_position
		var dxz := Vector2(pp.x - ep.x, pp.z - ep.z).length()
		if dxz > 0.95:
			continue
		if player.is_stomping() and pp.y > e.top() - 0.55 and pp.y < e.top() + 0.9:
			if e.stomp():
				player.bounce(11.5)
				spawn_coins(ep, 1)
				burst(ep + Vector3(0, 0.6, 0), Color(0.8, 0.6, 0.3))
			else:
				player.damage(ep)
		elif pp.y < e.top() and pp.y + 1.5 > ep.y:
			player.damage(ep)


func enemy_killed(e: Enemy) -> void:
	enemies.erase(e)
	if e.kind == "bonk":
		bonk_kills += 1
		if bonk_kills == 6:
			spawn_moon("bonks", e.global_position + Vector3(0, 1.2, 0))
		elif bonk_kills < 6:
			message.emit("Bonks bashed: %d / 6" % bonk_kills)


# The hat reports where it is every frame; return true to send it home.
func hat_touch(h: Hat, pos: Vector3) -> bool:
	if player.capture == null and not player.dead:
		for c in capturables:
			if not is_instance_valid(c):
				continue
			var cp: Vector3 = c.global_position + Vector3(0, c.focus_height * 0.5, 0)
			if pos.distance_to(cp) < c.capture_radius:
				player.capture_into(c)
				return true
	for e in enemies:
		if not is_instance_valid(e) or not e.alive:
			continue
		if pos.distance_to(e.global_position + Vector3(0, 0.5, 0)) < 1.1:
			if e.hat_hit():
				spawn_coins(e.global_position, 1)
			return true
	_collect_at(pos, 1.0)
	for c in crates.duplicate():
		if is_instance_valid(c) and pos.distance_to(c.global_position) < 1.2:
			_break_crate(c)
			return true
	if bell and pos.distance_to(bell.global_position + Vector3(0, 0.4, 0)) < 1.3 and bell_cool <= 0.0:
		_ring_bell()
		return true
	if scarecrow and pos.distance_to(scarecrow.global_position + Vector3(0, 2.3, 0)) < 1.3:
		_scarecrow_hit()
		return true
	if chest and is_instance_valid(chest) and pos.distance_to(chest.global_position) < 1.6:
		_open_chest()
		return true
	if boss and boss.active() and pos.distance_to(boss.global_position + Vector3(0, 4.0, 0)) < 3.2:
		if boss.hat_hit():
			burst(boss.global_position + Vector3(0, 4.5, 0), Color(1.0, 0.6, 0.2))
		return true
	return false


func _break_crate(c: Node3D) -> void:
	crates.erase(c)
	var p := c.global_position
	c.queue_free()
	Sfx.play("break")
	burst(p, Color(0.8, 0.6, 0.3))
	spawn_coins(p, 3)


func _ring_bell() -> void:
	bell_cool = 1.0
	Sfx.play("bell")
	if moons_got.has("bell"):
		return
	bell_rings += 1
	if bell_rings >= 3:
		spawn_moon("bell", bell.global_position + Vector3(0, 2.0, 0))
	else:
		message.emit("Bell rung %d of 3" % bell_rings)


func _scarecrow_hit() -> void:
	Sfx.play("switch")
	var capn := scarecrow.get_node_or_null("Cap")
	if capn == null:
		var c := Models.cap(player.cap_colour, true, 1.3)
		c.name = "Cap"
		c.position = Vector3(0, 2.62, 0)
		scarecrow.add_child(c)
	if not moons_got.has("scarecrow"):
		spawn_moon("scarecrow", scarecrow.global_position + Vector3(0, 4.5, 0))


func _open_chest() -> void:
	var p := chest.global_position
	chest.queue_free()
	chest = null
	Sfx.play("break")
	burst(p + Vector3(0, 0.8, 0), Color(1.0, 0.85, 0.3))
	spawn_coins(p, 5)
	if not moons_got.has("chest"):
		spawn_moon("chest", p + Vector3(0, 1.6, 0))


func _on_pounded(pos: Vector3) -> void:
	burst(pos, Color(0.9, 0.85, 0.7))
	for s in slabs.duplicate():
		if is_instance_valid(s) and pos.distance_to(s.global_position) < 2.4:
			slabs.erase(s)
			var p: Vector3 = s.global_position
			s.queue_free()
			Sfx.play("break")
			spawn_moon("slab", p + Vector3(0, 1.4, 0))
	if switch_node and pos.distance_to(switch_node.global_position) < 2.2 and timer_t <= 0.0 and not moons_got.has("timer"):
		Sfx.play("switch")
		timer_t = 16.0
		timer_moon = spawn_moon("timer", Vector3(-22.0, g(-22.0, -62.0) + 1.3, -62.0))
		message.emit("Run! The moon is west along the plateau.")
	for sp in spots:
		if is_instance_valid(sp) and sp.visible and pos.distance_to(sp.global_position) < 2.0:
			sp.visible = false
			var id := "spot1" if sp.global_position.z > 0.0 else "spot2"
			spawn_moon(id, sp.global_position + Vector3(0, 1.4, 0))
	for e in enemies.duplicate():
		if is_instance_valid(e) and e.alive and pos.distance_to(e.global_position) < 3.2:
			e.smash()
			spawn_coins(e.global_position, 1)
	for c in crates.duplicate():
		if is_instance_valid(c) and pos.distance_to(c.global_position) < 2.2:
			_break_crate(c)
	if boss and boss.active():
		if boss.pound_near(pos):
			burst(boss.global_position + Vector3(0, 4.5, 0), Color(1.0, 0.6, 0.2))


func rex_smash(pos: Vector3, r: float) -> void:
	for b in boulders.duplicate():
		if is_instance_valid(b) and pos.distance_to(b.global_position) < r:
			boulders.erase(b)
			var p: Vector3 = b.global_position
			b.queue_free()
			Sfx.play("break")
			burst(p + Vector3(0, 1.0, 0), Color(0.6, 0.55, 0.6))
			if cam:
				cam.shake = 0.9
	for e in enemies.duplicate():
		if is_instance_valid(e) and e.alive and pos.distance_to(e.global_position) < r:
			e.smash()
			spawn_coins(e.global_position, 1)
	for c in crates.duplicate():
		if is_instance_valid(c) and pos.distance_to(c.global_position) < r:
			_break_crate(c)


func explosion(pos: Vector3, r: float) -> void:
	burst(pos, Color(1.0, 0.6, 0.2))
	for c in crates.duplicate():
		if is_instance_valid(c) and pos.distance_to(c.global_position) < r:
			_break_crate(c)
	for e in enemies.duplicate():
		if is_instance_valid(e) and e.alive and pos.distance_to(e.global_position) < r:
			e.smash()


func stilt_head(pos: Vector3) -> void:
	_collect_at(pos, 1.4)


func _on_boss_defeated() -> void:
	boss_event.emit("down", 0)
	spawn_moon("boss", arena_center + Vector3(0, 2.0, 0))


func check_hazards(p: Player) -> void:
	var pos := p.global_position
	if pos.y < -26.0:
		p.die()
		return
	if pos.x > 64.0 and pos.x < 92.0 and pos.z > -34.0 and pos.y < Terrain.GORGE_WATER_Y + 0.3:
		Sfx.play("splash")
		p.die()
		return
	var river := absf(pos.x + 10.0) < 5.5 and pos.z > -22.0
	var pond := Vector2(pos.x + 10.0, pos.z + 28.0).length() < 11.0
	var was := p.in_water
	p.in_water = (river or pond) and pos.y < Terrain.WATER_Y + 0.25
	if p.in_water and not was:
		Sfx.play("splash", -8.0)
