# Bounded voxel arena: flat byte grid, chunked culled-face meshing with
# per-vertex ambient occlusion, trimesh collision, and a DDA voxel raycast.
class_name VoxelWorld
extends Node3D

signal block_broken(pos: Vector3i, id: int, by_boss: bool)
signal structure_changed()

const SX := 64
const SY := 48
const SZ := 64
const CHUNK := 16
const CX := SX / CHUNK
const CZ := SZ / CHUNK

# face index -> normal, and the (u, v) basis with u.cross(v) == normal so that
# emitting TL,TR,BR / TL,BR,BL gives Godot's clockwise front-facing winding.
const FACE_N := [
	Vector3i(1, 0, 0), Vector3i(-1, 0, 0),
	Vector3i(0, 1, 0), Vector3i(0, -1, 0),
	Vector3i(0, 0, 1), Vector3i(0, 0, -1),
]
const FACE_U := [
	Vector3(0, 0, -1), Vector3(0, 0, 1),
	Vector3(1, 0, 0), Vector3(1, 0, 0),
	Vector3(1, 0, 0), Vector3(-1, 0, 0),
]
const FACE_V := [
	Vector3(0, 1, 0), Vector3(0, 1, 0),
	Vector3(0, 0, -1), Vector3(0, 0, 1),
	Vector3(0, 1, 0), Vector3(0, 1, 0),
]
const FACE_SHADE := [0.76, 0.72, 1.0, 0.5, 0.88, 0.84]
const AO_LEVELS := [0.46, 0.66, 0.84, 1.0]

var voxels := PackedByteArray()
var col_top := PackedByteArray()          # per column, highest non-air y plus one
var damage := {}                          # voxel index -> accumulated damage
var placed := {}                          # voxel index -> block id placed by the player
var tnt_blocks := {}
var spike_blocks := {}
var turret_blocks := {}

var placed_total := 0                     # blocks the player placed this round
var placed_lost := 0                      # of those, how many the boss destroyed

var atlas: ImageTexture
var _mat_opaque: StandardMaterial3D
var _mat_alpha: StandardMaterial3D
var _chunk_mesh: Array[MeshInstance3D] = []
var _chunk_shape: Array[CollisionShape3D] = []
var _dirty := {}
var _rebuild_all_now := false
# Chunks re-meshed per frame. Lowered on mobile, where a burst of GDScript
# meshing in one frame is felt as a stutter.
var rebuild_budget := 2
var initial_budget := 64
# Scratch buffer for collision triangles. Kept as a member because Godot 4
# Packed arrays are copy-on-write values and would not mutate through a parameter.
var _tris := PackedVector3Array()


func _ready() -> void:
	atlas = Blocks.build_atlas()
	_build_materials()
	_alloc()
	_build_chunk_nodes()


func _alloc() -> void:
	voxels.resize(SX * SY * SZ)
	voxels.fill(0)
	col_top.resize(SX * SZ)
	col_top.fill(0)


func _build_materials() -> void:
	_mat_opaque = StandardMaterial3D.new()
	_mat_opaque.albedo_texture = atlas
	_mat_opaque.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	_mat_opaque.vertex_color_use_as_albedo = true
	_mat_opaque.roughness = 0.82
	_mat_opaque.metallic_specular = 0.3

	_mat_alpha = StandardMaterial3D.new()
	_mat_alpha.albedo_texture = atlas
	_mat_alpha.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	_mat_alpha.vertex_color_use_as_albedo = true
	_mat_alpha.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_mat_alpha.cull_mode = BaseMaterial3D.CULL_DISABLED
	_mat_alpha.roughness = 0.6


func _build_chunk_nodes() -> void:
	for cz in CZ:
		for cx in CX:
			var mi := MeshInstance3D.new()
			mi.name = "Chunk_%d_%d" % [cx, cz]
			add_child(mi)
			_chunk_mesh.append(mi)

			var body := StaticBody3D.new()
			body.collision_layer = 1
			body.collision_mask = 0
			var cs := CollisionShape3D.new()
			cs.shape = ConcavePolygonShape3D.new()
			body.add_child(cs)
			add_child(body)
			_chunk_shape.append(cs)


# ------------------------------------------------------------- indexing ----

static func in_bounds(x: int, y: int, z: int) -> bool:
	return x >= 0 and y >= 0 and z >= 0 and x < SX and y < SY and z < SZ

static func idx(x: int, y: int, z: int) -> int:
	return x + z * SX + y * SX * SZ

func get_block(x: int, y: int, z: int) -> int:
	if not in_bounds(x, y, z):
		return Blocks.AIR
	return voxels[idx(x, y, z)]

func get_blockv(p: Vector3i) -> int:
	return get_block(p.x, p.y, p.z)

func is_solid(x: int, y: int, z: int) -> bool:
	return get_block(x, y, z) != Blocks.AIR

# Opaque for ambient-occlusion purposes: glass and leaves should not darken.
func _occludes(x: int, y: int, z: int) -> bool:
	var b := get_block(x, y, z)
	return b != Blocks.AIR and not Blocks.is_transparent(b)


func set_block(x: int, y: int, z: int, id: int, by_player: bool = false) -> void:
	if not in_bounds(x, y, z):
		return
	var i := idx(x, y, z)
	var old: int = voxels[i]
	if old == id:
		return
	voxels[i] = id
	damage.erase(i)

	tnt_blocks.erase(i)
	spike_blocks.erase(i)
	turret_blocks.erase(i)
	if id == Blocks.TNT:
		tnt_blocks[i] = true
	elif id == Blocks.SPIKE:
		spike_blocks[i] = true
	elif id == Blocks.TURRET:
		turret_blocks[i] = true

	if by_player and id != Blocks.AIR:
		if not placed.has(i):
			placed_total += 1
		placed[i] = id
	elif id == Blocks.AIR and placed.has(i):
		placed.erase(i)

	# Maintain the per-column height cap that keeps meshing cheap.
	var ci := x + z * SX
	if id != Blocks.AIR:
		if y + 1 > col_top[ci]:
			col_top[ci] = y + 1
	elif col_top[ci] == y + 1:
		var ny := y
		while ny >= 0 and get_block(x, ny, z) == Blocks.AIR:
			ny -= 1
		col_top[ci] = ny + 1

	_mark_dirty(x, z)
	if x % CHUNK == 0:
		_mark_dirty(x - 1, z)
	if x % CHUNK == CHUNK - 1:
		_mark_dirty(x + 1, z)
	if z % CHUNK == 0:
		_mark_dirty(x, z - 1)
	if z % CHUNK == CHUNK - 1:
		_mark_dirty(x, z + 1)


func _mark_dirty(x: int, z: int) -> void:
	if x < 0 or z < 0 or x >= SX or z >= SZ:
		return
	_dirty[(x / CHUNK) + (z / CHUNK) * CX] = true


# ---------------------------------------------------------- world build ----

func generate(world_seed: int) -> void:
	voxels.fill(0)
	col_top.fill(0)
	damage.clear()
	placed.clear()
	tnt_blocks.clear()
	spike_blocks.clear()
	turret_blocks.clear()
	placed_total = 0
	placed_lost = 0

	var noise := FastNoiseLite.new()
	noise.seed = world_seed
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	noise.frequency = 0.028

	var beach := FastNoiseLite.new()
	beach.seed = world_seed + 991
	beach.frequency = 0.05

	const BASE := 10
	for z in SZ:
		for x in SX:
			var h: int = BASE + int(round(noise.get_noise_2d(x, z) * 3.0))
			# Flatten a generous build plateau in the middle of the arena.
			var d: float = Vector2(x - SX * 0.5, z - SZ * 0.5).length()
			if d < 20.0:
				var t: float = clampf((20.0 - d) / 6.0, 0.0, 1.0)
				h = int(round(lerpf(float(h), float(BASE), t)))
			var sandy: bool = beach.get_noise_2d(x, z) > 0.42 and d > 22.0
			for y in range(0, h + 1):
				var id := Blocks.STONE
				if y <= 1:
					id = Blocks.BEDROCK
				elif y == h:
					id = Blocks.SAND if sandy else Blocks.GRASS
				elif y > h - 4:
					id = Blocks.SAND if sandy else Blocks.DIRT
				voxels[idx(x, y, z)] = id
			col_top[x + z * SX] = h + 1

	_build_border_wall()
	_scatter_trees(world_seed)

	for i in _chunk_mesh.size():
		_dirty[i] = true
	_rebuild_all_now = true


func _build_border_wall() -> void:
	# A bedrock lip so nothing walks off the edge of the arena.
	for z in SZ:
		for x in SX:
			if x > 1 and z > 1 and x < SX - 2 and z < SZ - 2:
				continue
			var top: int = col_top[x + z * SX]
			for y in range(top, top + 3):
				if y < SY:
					voxels[idx(x, y, z)] = Blocks.BEDROCK
			col_top[x + z * SX] = mini(top + 3, SY)


func _scatter_trees(world_seed: int) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = world_seed + 4242
	var placed_trees := 0
	var attempts := 0
	while placed_trees < 26 and attempts < 500:
		attempts += 1
		var x := rng.randi_range(6, SX - 7)
		var z := rng.randi_range(6, SZ - 7)
		if Vector2(x - SX * 0.5, z - SZ * 0.5).length() < 22.0:
			continue
		var gy: int = col_top[x + z * SX] - 1
		if gy <= 0 or get_block(x, gy, z) != Blocks.GRASS:
			continue
		var h := rng.randi_range(4, 6)
		for i in h:
			voxels[idx(x, gy + 1 + i, z)] = Blocks.LOG
		var crown := gy + h
		for dy in range(-1, 3):
			var r := 2 if dy < 1 else 1
			for dz in range(-r, r + 1):
				for dx in range(-r, r + 1):
					if abs(dx) == r and abs(dz) == r:
						continue
					var lx := x + dx
					var ly := crown + dy
					var lz := z + dz
					if in_bounds(lx, ly, lz) and voxels[idx(lx, ly, lz)] == Blocks.AIR:
						voxels[idx(lx, ly, lz)] = Blocks.LEAVES
		col_top[x + z * SX] = maxi(col_top[x + z * SX], crown + 3)
		for dz in range(-2, 3):
			for dx in range(-2, 3):
				var cx2 := x + dx
				var cz2 := z + dz
				if cx2 >= 0 and cz2 >= 0 and cx2 < SX and cz2 < SZ:
					col_top[cx2 + cz2 * SX] = maxi(col_top[cx2 + cz2 * SX], crown + 3)
		placed_trees += 1


func clear_player_blocks() -> void:
	# Wipe last round's fort so the next build starts on clean ground.
	for i in placed.keys():
		var y: int = i / (SX * SZ)
		var rem: int = i % (SX * SZ)
		var z: int = rem / SX
		var x: int = rem % SX
		set_block(x, y, z, Blocks.AIR)
	placed.clear()
	placed_total = 0
	placed_lost = 0
	emit_signal("structure_changed")


# --------------------------------------------------------------- meshing ---

func _process(_delta: float) -> void:
	if _dirty.is_empty():
		return
	var budget := initial_budget if _rebuild_all_now else rebuild_budget
	_rebuild_all_now = false
	var keys := _dirty.keys()
	var n: int = mini(budget, keys.size())
	for k in range(n):
		var ci: int = keys[k]
		_dirty.erase(ci)
		_rebuild_chunk(ci)


func _rebuild_chunk(ci: int) -> void:
	var cx: int = (ci % CX) * CHUNK
	var cz: int = (ci / CX) * CHUNK

	var st_op := SurfaceTool.new()
	var st_al := SurfaceTool.new()
	st_op.begin(Mesh.PRIMITIVE_TRIANGLES)
	st_al.begin(Mesh.PRIMITIVE_TRIANGLES)
	var any_op := false
	var any_al := false
	_tris.clear()

	for z in range(cz, cz + CHUNK):
		for x in range(cx, cx + CHUNK):
			var top: int = col_top[x + z * SX]
			for y in range(0, top):
				var id: int = voxels[idx(x, y, z)]
				if id == Blocks.AIR:
					continue
				var transparent := Blocks.is_transparent(id)
				for f in 6:
					var n: Vector3i = FACE_N[f]
					var nx := x + n.x
					var ny := y + n.y
					var nz := z + n.z
					var nb := get_block(nx, ny, nz)
					if nb != Blocks.AIR:
						if not Blocks.is_transparent(nb):
							continue
						if nb == id:
							continue
					var st: SurfaceTool = st_al if transparent else st_op
					_emit_face(st, x, y, z, f, id)
					if transparent:
						any_al = true
					else:
						any_op = true

	var mesh := ArrayMesh.new()
	if any_op:
		st_op.commit(mesh)
		mesh.surface_set_material(mesh.get_surface_count() - 1, _mat_opaque)
	if any_al:
		st_al.commit(mesh)
		mesh.surface_set_material(mesh.get_surface_count() - 1, _mat_alpha)

	_chunk_mesh[ci].mesh = mesh if (any_op or any_al) else null

	var shape: ConcavePolygonShape3D = _chunk_shape[ci].shape
	shape.set_faces(_tris)


func _emit_face(st: SurfaceTool, x: int, y: int, z: int, f: int, id: int) -> void:
	var n: Vector3i = FACE_N[f]
	var u: Vector3 = FACE_U[f]
	var v: Vector3 = FACE_V[f]
	var centre := Vector3(x + 0.5, y + 0.5, z + 0.5) + Vector3(n) * 0.5
	var nf := Vector3(n)

	var p_tl := centre - u * 0.5 + v * 0.5
	var p_tr := centre + u * 0.5 + v * 0.5
	var p_br := centre + u * 0.5 - v * 0.5
	var p_bl := centre - u * 0.5 - v * 0.5

	var shade: float = FACE_SHADE[f]
	var ui := Vector3i(int(u.x), int(u.y), int(u.z))
	var vi := Vector3i(int(v.x), int(v.y), int(v.z))
	var base := Vector3i(x, y, z) + n

	var a_tl := _ao(base, -ui, vi) * shade
	var a_tr := _ao(base, ui, vi) * shade
	var a_br := _ao(base, ui, -vi) * shade
	var a_bl := _ao(base, -ui, -vi) * shade

	var rect := Blocks.atlas_uv(Blocks.tile_for_face(id, f))
	var uv_tl := Vector2(rect.position.x, rect.position.y)
	var uv_tr := Vector2(rect.end.x, rect.position.y)
	var uv_br := Vector2(rect.end.x, rect.end.y)
	var uv_bl := Vector2(rect.position.x, rect.end.y)

	# Flip the quad's diagonal towards the darker corner pair; without this the
	# AO gradient visibly kinks across the triangle seam.
	if a_tl + a_br < a_tr + a_bl:
		_vert(st, p_tl, nf, uv_tl, a_tl)
		_vert(st, p_tr, nf, uv_tr, a_tr)
		_vert(st, p_br, nf, uv_br, a_br)
		_vert(st, p_tl, nf, uv_tl, a_tl)
		_vert(st, p_br, nf, uv_br, a_br)
		_vert(st, p_bl, nf, uv_bl, a_bl)
	else:
		_vert(st, p_tr, nf, uv_tr, a_tr)
		_vert(st, p_br, nf, uv_br, a_br)
		_vert(st, p_bl, nf, uv_bl, a_bl)
		_vert(st, p_tr, nf, uv_tr, a_tr)
		_vert(st, p_bl, nf, uv_bl, a_bl)
		_vert(st, p_tl, nf, uv_tl, a_tl)

	_tris.push_back(p_tl)
	_tris.push_back(p_tr)
	_tris.push_back(p_br)
	_tris.push_back(p_tl)
	_tris.push_back(p_br)
	_tris.push_back(p_bl)


func _vert(st: SurfaceTool, p: Vector3, n: Vector3, uv: Vector2, bright: float) -> void:
	st.set_normal(n)
	st.set_uv(uv)
	st.set_color(Color(bright, bright, bright, 1.0))
	st.add_vertex(p)


func _ao(base: Vector3i, du: Vector3i, dv: Vector3i) -> float:
	var s1 := _occludes(base.x + du.x, base.y + du.y, base.z + du.z)
	var s2 := _occludes(base.x + dv.x, base.y + dv.y, base.z + dv.z)
	if s1 and s2:
		return AO_LEVELS[0]
	var c := _occludes(base.x + du.x + dv.x, base.y + du.y + dv.y, base.z + du.z + dv.z)
	var occ := (1 if s1 else 0) + (1 if s2 else 0) + (1 if c else 0)
	return AO_LEVELS[3 - occ]


# --------------------------------------------------------------- damage ----

# Returns true when the block was destroyed by this hit.
func damage_block(x: int, y: int, z: int, amount: float, by_boss: bool = true) -> bool:
	if not in_bounds(x, y, z):
		return false
	var id := get_block(x, y, z)
	if id == Blocks.AIR or id == Blocks.BEDROCK:
		return false
	var i := idx(x, y, z)
	var d: float = float(damage.get(i, 0.0)) + amount
	if d >= Blocks.hardness(id):
		var was_placed := placed.has(i)
		set_block(x, y, z, Blocks.AIR)
		if was_placed and by_boss:
			placed_lost += 1
		emit_signal("block_broken", Vector3i(x, y, z), id, by_boss)
		if was_placed:
			emit_signal("structure_changed")
		return true
	damage[i] = d
	return false


func damage_sphere(centre: Vector3, radius: float, amount: float) -> Array:
	# Returns the ids of every block destroyed, so callers can spawn debris.
	var broken := []
	var r := int(ceil(radius))
	var c := Vector3i(floori(centre.x), floori(centre.y), floori(centre.z))
	for dy in range(-r, r + 1):
		for dz in range(-r, r + 1):
			for dx in range(-r, r + 1):
				var p := c + Vector3i(dx, dy, dz)
				var dist := Vector3(p) + Vector3(0.5, 0.5, 0.5) - centre
				if dist.length() > radius:
					continue
				var falloff: float = 1.0 - clampf(dist.length() / maxf(radius, 0.001), 0.0, 1.0) * 0.5
				var id := get_blockv(p)
				if id == Blocks.AIR or id == Blocks.BEDROCK:
					continue
				if damage_block(p.x, p.y, p.z, amount * falloff):
					broken.append({"pos": p, "id": id})
	return broken


func structure_integrity() -> float:
	if placed_total == 0:
		return 1.0
	return clampf(1.0 - float(placed_lost) / float(placed_total), 0.0, 1.0)


func placed_remaining() -> int:
	return placed.size()


# Nearest player-placed block to a world position, or null when the fort is gone.
func nearest_placed(from: Vector3, prefer_low: bool = true):
	var best = null
	var best_d := INF
	for i in placed.keys():
		var y: int = i / (SX * SZ)
		var rem: int = i % (SX * SZ)
		var z: int = rem / SX
		var x: int = rem % SX
		var c := Vector3(x + 0.5, y + 0.5, z + 0.5)
		var d := from.distance_squared_to(c)
		if prefer_low:
			# Bias the boss towards load-bearing blocks near the ground.
			d += float(y) * 6.0
		if d < best_d:
			best_d = d
			best = Vector3i(x, y, z)
	return best


func decode_index(i: int) -> Vector3i:
	var y: int = i / (SX * SZ)
	var rem: int = i % (SX * SZ)
	return Vector3i(rem % SX, y, rem / SX)


# -------------------------------------------------------------- raycast ----

# Amanatides & Woo voxel traversal. Returns {} on a miss, otherwise
# {block: Vector3i, normal: Vector3i, point: Vector3, id: int}.
func raycast(origin: Vector3, dir: Vector3, max_dist: float) -> Dictionary:
	var d := dir.normalized()
	var p := Vector3i(floori(origin.x), floori(origin.y), floori(origin.z))
	var step := Vector3i(int(signf(d.x)), int(signf(d.y)), int(signf(d.z)))

	var t_delta := Vector3(
		INF if is_zero_approx(d.x) else absf(1.0 / d.x),
		INF if is_zero_approx(d.y) else absf(1.0 / d.y),
		INF if is_zero_approx(d.z) else absf(1.0 / d.z))

	var t_max := Vector3(INF, INF, INF)
	if not is_zero_approx(d.x):
		var bx := float(p.x) + (1.0 if step.x > 0 else 0.0)
		t_max.x = (bx - origin.x) / d.x
	if not is_zero_approx(d.y):
		var by := float(p.y) + (1.0 if step.y > 0 else 0.0)
		t_max.y = (by - origin.y) / d.y
	if not is_zero_approx(d.z):
		var bz := float(p.z) + (1.0 if step.z > 0 else 0.0)
		t_max.z = (bz - origin.z) / d.z

	var normal := Vector3i.ZERO
	var t := 0.0
	while t <= max_dist:
		if in_bounds(p.x, p.y, p.z):
			var id: int = voxels[idx(p.x, p.y, p.z)]
			if id != Blocks.AIR:
				return {
					"block": p,
					"normal": normal,
					"point": origin + d * t,
					"id": id,
				}
		if t_max.x < t_max.y and t_max.x < t_max.z:
			p.x += step.x
			t = t_max.x
			t_max.x += t_delta.x
			normal = Vector3i(-step.x, 0, 0)
		elif t_max.y < t_max.z:
			p.y += step.y
			t = t_max.y
			t_max.y += t_delta.y
			normal = Vector3i(0, -step.y, 0)
		else:
			p.z += step.z
			t = t_max.z
			t_max.z += t_delta.z
			normal = Vector3i(0, 0, -step.z)
		# Rays that leave the arena upwards or sideways can never come back.
		if p.y < 0 or p.y >= SY:
			break
		if p.x < -1 or p.z < -1 or p.x > SX or p.z > SZ:
			break
	return {}


# Chunks still waiting to be meshed. Until this is zero the collision shapes
# are incomplete and nothing should be dropped into the world.
func pending_rebuilds() -> int:
	return _dirty.size()


func surface_y(x: int, z: int) -> int:
	if x < 0 or z < 0 or x >= SX or z >= SZ:
		return 12
	return col_top[x + z * SX]
