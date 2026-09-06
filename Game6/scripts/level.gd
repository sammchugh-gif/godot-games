# The shared kingdom runtime. A kingdom (RidgeLevel, CityLevel) extends this
# and builds its world with the helpers here; this class runs everything in
# it that is not a character of its own: coins, moons, crates, boulders,
# switches, checkpoints, the shop zone, the balloon and the hazards.
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

# Per-kingdom configuration, set by the subclass in _init().
var kingdom_id := "ridge"
var kingdom_title := "DINO RIDGE"
var kingdom_index := 1
var loading_text := "BUILDING..."
var needed := 12
var moon_names := {}
var multi: Array = ["boss"]
var boss_name := "KING RAPTOR"
var boss_colour := Color(0.85, 0.45, 0.2)
var boss_metal := false
var next_kingdom := ""
var next_kingdom_title := ""
var shot_scenes: Array = []

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
var boss_pos_offset := Vector3(-4, 0.5, 0)
var timer_moon_pos := Vector3.ZERO
var timer_msg := "Run!"
var timer_len := 16.0
var _shell_mesh: ArrayMesh
var rng := RandomNumberGenerator.new()
var hints: Array = []
var metal: Array = []          # metal crates: only tank shells and explosions
var shells: Array = []         # tank shells in flight
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
		n += 3 if id in multi else 1
	return n


func total_moons() -> int:
	var n := 0
	for id in moon_names:
		n += 3 if id in multi else 1
	return n


# ------------------------------------------------------- kingdom hooks --

func _environment() -> void:
	pass


func _water() -> void:
	pass


func _dressing() -> void:
	pass


# The balloon the kid arrived in and the Crazy Cap shop, at balloon_pos and
# shop_pos. Kingdoms may override.
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


func _set_pieces() -> void:
	pass


func _pickups() -> void:
	pass


func _creatures() -> void:
	pass


func _moons() -> void:
	pass


func _checkpoints() -> void:
	pass


# Where trees and rocks must not go (water, paths, streets...).
func _blocked(_x: float, _z: float) -> bool:
	return false


func deep_water(_p: Vector3) -> bool:
	return false


func shallow_water(_p: Vector3) -> bool:
	return false


# Per-kingdom logic each physics frame (cannons, races...).
func _kingdom_physics(_dt: float) -> void:
	pass


func _spawn_boss() -> void:
	boss = Boss.new()
	add_child(boss)
	boss.global_position = arena_center + boss_pos_offset
	boss.setup(self, player, arena_center, arena_r, boss_colour, boss_metal)
	boss.facing = -PI * 0.5
	boss.defeated.connect(_on_boss_defeated)
	boss.hit.connect(func(hp): boss_event.emit("hit", hp))
	boss.woke.connect(func(): boss_event.emit("start", 3))


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
	_shell_mesh = Models.shell_mesh()
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


# A glowing spot the kid ground-pounds for a moon.
func _spot(pos: Vector3, id: String) -> void:
	var d := MeshLib.Builder.new()
	d.lathe([Vector2(0.0, 0.0), Vector2(1.1, 0.0), Vector2(1.1, 0.05), Vector2(0.0, 0.05)], 16)
	var mi := d.commit(Mats.glow(Color(1.0, 0.9, 0.4), 1.8), "Spot")
	mi.position = pos
	mi.set_meta("id", id)
	add_child(mi)
	spots.append(mi)


# Anything a fast vehicle drives into.
func taxi_bump(pos: Vector3, r: float) -> void:
	for c in crates.duplicate():
		if is_instance_valid(c) and pos.distance_to(c.global_position) < r:
			_break_crate(c)
	for e in enemies.duplicate():
		if is_instance_valid(e) and e.alive and pos.distance_to(e.global_position) < r:
			e.smash()
			spawn_coins(e.global_position, 1)


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
	if _blocked(x, z):
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


func _crate(pos: Vector3) -> void:
	var body := _box(pos, Vector3(1.0, 1.0, 1.0), Color(0.8, 0.6, 0.3), 0.8, Basis(Vector3.UP, rng.randf() * 0.5))
	body.name = "Crate"
	var bands := MeshLib.Builder.new()
	bands.box(Vector3(0, 0, 0), Vector3(1.04, 0.14, 1.04))
	bands.box(Vector3(0, 0, 0), Vector3(0.14, 1.04, 1.04))
	body.add_child(bands.commit(Mats.pbr(Color(0.5, 0.35, 0.15)), "Bands"))
	crates.append(body)


func _metal_crate(pos: Vector3) -> void:
	var body := _box(pos, Vector3(1.2, 1.2, 1.2), Color(0.5, 0.55, 0.6), 0.35)
	body.name = "MetalCrate"
	var bands := MeshLib.Builder.new()
	bands.box(Vector3.ZERO, Vector3(1.24, 0.2, 1.24))
	bands.box(Vector3.ZERO, Vector3(0.2, 1.24, 1.24))
	bands.box(Vector3.ZERO, Vector3(1.24, 1.24, 0.2))
	body.add_child(bands.commit(Mats.pbr(Color(0.25, 0.28, 0.32), 0.4, 0.6), "Bands"))
	metal.append(body)


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


# -------------------------------------------------------------- creatures --

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


# ------------------------------------------------------------------ moons --

func _moon_node(id: String, pos: Vector3) -> Node3D:
	var m := Node3D.new()
	m.name = "Moon_" + id
	var mi := MeshInstance3D.new()
	mi.mesh = _moon_mesh
	var is_multi := id in multi
	mi.material_override = Mats.glow(Color(1.0, 0.9, 0.3) if not is_multi else Color(1.0, 0.75, 0.2), 1.6, 0.25)
	mi.scale = Vector3.ONE * (1.6 if is_multi else 1.0)
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
	if moons_got.has("vault"):
		for b in metal:
			b.queue_free()
		metal.clear()
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
		boss.global_position = arena_center + boss_pos_offset
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
	_kingdom_physics(dt)
	_shells_step(dt)
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
	var is_multi := id in multi
	Sfx.play("multimoon" if is_multi else "moon")
	burst(player.actor_pos() + Vector3(0, 1.5, 0), Color(1.0, 0.95, 0.5))
	moon_got.emit(id, moon_names.get(id, id), moon_count(), is_multi)


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
		timer_t = timer_len
		timer_moon = spawn_moon("timer", timer_moon_pos)
		message.emit(timer_msg)
	for sp in spots:
		if is_instance_valid(sp) and sp.visible and pos.distance_to(sp.global_position) < 2.0:
			sp.visible = false
			spawn_moon(str(sp.get_meta("id")), sp.global_position + Vector3(0, 1.4, 0))
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
	for m in metal.duplicate():
		if is_instance_valid(m) and pos.distance_to(m.global_position) < r:
			_break_metal(m)
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
	if pos.y < -26.0 or deep_water(pos):
		if pos.y >= -26.0:
			Sfx.play("splash")
		p.die()
		return
	var was := p.in_water
	p.in_water = shallow_water(pos)
	if p.in_water and not was:
		Sfx.play("splash", -8.0)


# ------------------------------------------------------------- shells ----

func tank_fire(pos: Vector3, dir: Vector3) -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = _shell_mesh
	mi.material_override = Mats.glow(Color(1.0, 0.7, 0.3), 1.5, 0.4)
	mi.position = pos
	_dyn.add_child(mi)
	shells.append({"node": mi, "vel": dir.normalized() * 32.0, "life": 2.2})
	Sfx.play("break", -6.0)
	burst(pos, Color(1.0, 0.8, 0.4))


func _shells_step(dt: float) -> void:
	for i in range(shells.size() - 1, -1, -1):
		var sh: Dictionary = shells[i]
		var n: Node3D = sh["node"]
		var v: Vector3 = sh["vel"]
		v.y -= 4.0 * dt
		sh["vel"] = v
		n.position += v * dt
		sh["life"] -= dt
		var hit: bool = sh["life"] <= 0.0 or n.position.y < Terrain.height(n.position.x, n.position.z) + 0.2
		for m in metal.duplicate():
			if is_instance_valid(m) and n.position.distance_to(m.global_position) < 2.0:
				_break_metal(m)
				hit = true
		for c in crates.duplicate():
			if is_instance_valid(c) and n.position.distance_to(c.global_position) < 1.5:
				_break_crate(c)
				hit = true
		for e in enemies.duplicate():
			if is_instance_valid(e) and e.alive and n.position.distance_to(e.global_position + Vector3(0, 0.5, 0)) < 1.4:
				e.smash()
				spawn_coins(e.global_position, 1)
				hit = true
		if boss and boss.active() and n.position.distance_to(boss.global_position + Vector3(0, 3.5, 0)) < 3.0:
			if boss.hat_hit():
				burst(boss.global_position + Vector3(0, 4.5, 0), Color(1.0, 0.6, 0.2))
			hit = true
		if hit:
			burst(n.position, Color(1.0, 0.6, 0.2))
			n.queue_free()
			shells.remove_at(i)


func _break_metal(m: Node3D) -> void:
	metal.erase(m)
	var p := m.global_position
	m.queue_free()
	Sfx.play("break")
	burst(p, Color(0.7, 0.75, 0.8))
	spawn_coins(p, 2)
	if cam:
		cam.shake = maxf(cam.shake, 0.5)
