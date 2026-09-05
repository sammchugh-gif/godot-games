# Bounded voxel world: flat byte grid, 3D-chunked culled-face meshing with
# per-vertex ambient occlusion, trimesh collision, and a DDA voxel raycast.
#
# Unlike a surface-only arena this world is solid nearly all the way down, so
# chunks are split in Y as well as X/Z. Re-meshing after a dig then touches
# 16x16x16 voxels instead of a full column.
class_name VoxelWorld
extends Node3D

signal block_broken(pos: Vector3i, id: int, by_player: bool)
signal seal_opened()

const SX := 48
const SY := 64
const SZ := 48
const CHUNK := 16
const CX := SX / CHUNK
const CY := SY / CHUNK
const CZ := SZ / CHUNK

# The sealed boss cavern, carved into the bottom of every level.
const ARENA_R := 13
const ARENA_FLOOR := 4
const ARENA_TOP := 21
const WALL := 2                       # thickness of the bedrock rim / seal shell

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
var star_rocks := {}                      # voxel index -> true, for the HUD counter
var seal_blocks := {}                     # voxel index -> true, cleared on unlock
var sealed := true

# Filled during generation so the director can place stars and creatures
# without re-scanning the whole grid.
var cave_spots: Array[Vector3i] = []
var surface_spots: Array[Vector3i] = []

var atlas: ImageTexture
var _mat_opaque: StandardMaterial3D
var _mat_alpha: StandardMaterial3D
var _mat_glow: StandardMaterial3D
var _chunk_mesh: Array[MeshInstance3D] = []
var _chunk_shape: Array[CollisionShape3D] = []
var _dirty := {}
var _rebuild_all_now := false
# Chunks re-meshed per frame. Lowered on mobile, where a burst of GDScript
# meshing in one frame is felt as a stutter. initial_budget 0 means "all".
var rebuild_budget := 3
var initial_budget := 0
# Scratch buffer for collision triangles. Kept as a member because Godot 4
# Packed arrays are copy-on-write values and would not mutate through a parameter.
var _tris := PackedVector3Array()


func _ready() -> void:
	atlas = Blocks.build_atlas()
	_build_materials()
	voxels.resize(SX * SY * SZ)
	voxels.fill(0)
	col_top.resize(SX * SZ)
	col_top.fill(0)
	_build_chunk_nodes()


func _build_materials() -> void:
	_mat_opaque = StandardMaterial3D.new()
	_mat_opaque.albedo_texture = atlas
	_mat_opaque.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	_mat_opaque.vertex_color_use_as_albedo = true
	_mat_opaque.roughness = 0.95
	_mat_opaque.metallic_specular = 0.1

	_mat_alpha = StandardMaterial3D.new()
	_mat_alpha.albedo_texture = atlas
	_mat_alpha.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	_mat_alpha.vertex_color_use_as_albedo = true
	_mat_alpha.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_mat_alpha.cull_mode = BaseMaterial3D.CULL_DISABLED
	_mat_alpha.roughness = 0.6

	# Unshaded so crystal, magma and glowmoss stay bright in an unlit cave.
	_mat_glow = StandardMaterial3D.new()
	_mat_glow.albedo_texture = atlas
	_mat_glow.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	_mat_glow.vertex_color_use_as_albedo = true
	_mat_glow.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED


func _build_chunk_nodes() -> void:
	for cy in CY:
		for cz in CZ:
			for cx in CX:
				var mi := MeshInstance3D.new()
				mi.name = "Chunk_%d_%d_%d" % [cx, cy, cz]
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

func is_solidv(p: Vector3i) -> bool:
	return get_block(p.x, p.y, p.z) != Blocks.AIR

# Opaque for ambient-occlusion purposes: ice should not darken its neighbours.
func _occludes(x: int, y: int, z: int) -> bool:
	var b := get_block(x, y, z)
	return b != Blocks.AIR and not Blocks.is_transparent(b)


func set_block(x: int, y: int, z: int, id: int) -> void:
	if not in_bounds(x, y, z):
		return
	var i := idx(x, y, z)
	var old: int = voxels[i]
	if old == id:
		return
	voxels[i] = id
	damage.erase(i)
	star_rocks.erase(i)
	seal_blocks.erase(i)
	if id == Blocks.STARROCK:
		star_rocks[i] = true
	elif id == Blocks.SEAL:
		seal_blocks[i] = true

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

	_mark_dirty(x, y, z)
	if x % CHUNK == 0:
		_mark_dirty(x - 1, y, z)
	if x % CHUNK == CHUNK - 1:
		_mark_dirty(x + 1, y, z)
	if y % CHUNK == 0:
		_mark_dirty(x, y - 1, z)
	if y % CHUNK == CHUNK - 1:
		_mark_dirty(x, y + 1, z)
	if z % CHUNK == 0:
		_mark_dirty(x, y, z - 1)
	if z % CHUNK == CHUNK - 1:
		_mark_dirty(x, y, z + 1)


func _mark_dirty(x: int, y: int, z: int) -> void:
	if not in_bounds(x, y, z):
		return
	_dirty[(x / CHUNK) + (z / CHUNK) * CX + (y / CHUNK) * CX * CZ] = true


# ---------------------------------------------------------- world build ----

func generate(world_seed: int, level: int) -> void:
	voxels.fill(0)
	col_top.fill(0)
	damage.clear()
	star_rocks.clear()
	seal_blocks.clear()
	cave_spots.clear()
	surface_spots.clear()
	sealed = true

	var rng := RandomNumberGenerator.new()
	rng.seed = world_seed

	var hills := FastNoiseLite.new()
	hills.seed = world_seed
	hills.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	hills.frequency = 0.035

	# Two ridged fields intersected: where both are near zero you get a
	# connected worm of empty space rather than swiss-cheese blobs.
	var cave_a := FastNoiseLite.new()
	cave_a.seed = world_seed + 17
	cave_a.noise_type = FastNoiseLite.TYPE_SIMPLEX
	cave_a.frequency = 0.055
	var cave_b := FastNoiseLite.new()
	cave_b.seed = world_seed + 4001
	cave_b.noise_type = FastNoiseLite.TYPE_SIMPLEX
	cave_b.frequency = 0.055

	var ore := FastNoiseLite.new()
	ore.seed = world_seed + 909
	ore.frequency = 0.11

	const BASE := 46
	var deep_line := ARENA_TOP + 6

	for z in SZ:
		for x in SX:
			var h: int = BASE + int(round(hills.get_noise_2d(x, z) * 3.5))
			# Flatten a landing pad in the middle so every level starts safe.
			var pad: float = Vector2(x - SX * 0.5, z - SZ * 0.5).length()
			if pad < 9.0:
				var t: float = clampf((9.0 - pad) / 4.0, 0.0, 1.0)
				h = int(round(lerpf(float(h), float(BASE), t)))
			for y in range(0, h + 1):
				var id := Blocks.STONE
				if y <= 1:
					id = Blocks.BEDROCK
				elif y < deep_line:
					id = Blocks.DEEPSTONE
				elif y == h:
					id = Blocks.GRASS
				elif y > h - 4:
					id = Blocks.DIRT
				voxels[idx(x, y, z)] = id
			col_top[x + z * SX] = h + 1

	_carve_caves(cave_a, cave_b, rng)
	_sprinkle_ore(ore, rng, level)
	_carve_arena()
	_build_border()
	_scatter_props(rng)
	_collect_spots(rng)

	for i in _chunk_mesh.size():
		_dirty[i] = true
	_rebuild_all_now = true


func _carve_caves(a: FastNoiseLite, b: FastNoiseLite, rng: RandomNumberGenerator) -> void:
	var top_limit := 42                      # keep a solid crust under the grass
	for y in range(ARENA_TOP + 3, top_limit):
		# Caves widen with depth; near the crust they are tight crawlways.
		var t: float = 1.0 - float(y - ARENA_TOP) / float(top_limit - ARENA_TOP)
		var thresh: float = 0.055 + t * 0.045
		for z in range(2, SZ - 2):
			for x in range(2, SX - 2):
				var na: float = a.get_noise_3d(x, y * 1.7, z)
				var nb: float = b.get_noise_3d(x, y * 1.7, z)
				if absf(na) < thresh and absf(nb) < thresh:
					voxels[idx(x, y, z)] = Blocks.AIR

	# A handful of proper caverns so the underground is not all corridors.
	for i in 7:
		var cx := rng.randi_range(8, SX - 9)
		var cz := rng.randi_range(8, SZ - 9)
		var cy := rng.randi_range(ARENA_TOP + 5, 38)
		var r := rng.randf_range(3.5, 6.0)
		for dy in range(-int(r) - 1, int(r) + 2):
			for dz in range(-int(r) - 1, int(r) + 2):
				for dx in range(-int(r) - 1, int(r) + 2):
					var p := Vector3i(cx + dx, cy + dy, cz + dz)
					if p.x < 2 or p.z < 2 or p.x >= SX - 2 or p.z >= SZ - 2:
						continue
					if p.y <= ARENA_TOP + 1 or p.y >= 43:
						continue
					# Squash vertically so caverns read as rooms, not spheres.
					if Vector3(dx, dy * 1.6, dz).length() <= r:
						voxels[idx(p.x, p.y, p.z)] = Blocks.AIR


func _sprinkle_ore(ore: FastNoiseLite, rng: RandomNumberGenerator, level: int) -> void:
	for y in range(3, 44):
		for z in range(1, SZ - 1):
			for x in range(1, SX - 1):
				var i := idx(x, y, z)
				var id: int = voxels[i]
				if id != Blocks.STONE and id != Blocks.DEEPSTONE:
					continue
				var n: float = ore.get_noise_3d(x, y, z)
				if n > 0.58:
					voxels[i] = Blocks.CRYSTAL
				elif n < -0.62 and y < ARENA_TOP + 12:
					voxels[i] = Blocks.MAGMA
				elif level >= 4 and n > 0.44 and n < 0.48 and y > 30:
					voxels[i] = Blocks.ICE

	# Glowmoss clings to cave ceilings, which is what actually lights the caves.
	for y in range(ARENA_TOP + 3, 43):
		for z in range(2, SZ - 2):
			for x in range(2, SX - 2):
				if voxels[idx(x, y, z)] != Blocks.AIR:
					continue
				var above := idx(x, y + 1, z)
				var aid: int = voxels[above]
				if (aid == Blocks.STONE or aid == Blocks.DEEPSTONE) and rng.randf() < 0.055:
					voxels[above] = Blocks.GLOWMOSS


# The boss cavern: a wide disc of empty space sealed inside a sealstone shell.
func _carve_arena() -> void:
	var cx := SX / 2
	var cz := SZ / 2
	for y in range(ARENA_FLOOR - WALL, ARENA_TOP + WALL + 1):
		for z in SZ:
			for x in SX:
				var d: float = Vector2(x - cx, z - cz).length()
				if d > float(ARENA_R + WALL):
					continue
				var i := idx(x, y, z)
				var inside: bool = d <= float(ARENA_R) and y > ARENA_FLOOR and y < ARENA_TOP
				if inside:
					voxels[i] = Blocks.AIR
				elif y <= ARENA_FLOOR:
					voxels[i] = Blocks.BEDROCK if y < ARENA_FLOOR else Blocks.DEEPSTONE
				else:
					voxels[i] = Blocks.SEAL
					seal_blocks[i] = true

	# Rim lights around the floor so the arena is readable before the fight.
	for k in 12:
		var ang := TAU * float(k) / 12.0
		var lx := cx + int(round(cos(ang) * float(ARENA_R - 1)))
		var lz := cz + int(round(sin(ang) * float(ARENA_R - 1)))
		if in_bounds(lx, ARENA_FLOOR, lz):
			voxels[idx(lx, ARENA_FLOOR, lz)] = Blocks.CRYSTAL

	# Crystal pillars: they light the walls, and they are the only cover in a
	# fight where standing still gets you slammed.
	for k in 6:
		var pang := TAU * float(k) / 6.0 + 0.5
		var px := cx + int(round(cos(pang) * float(ARENA_R - 3)))
		var pz := cz + int(round(sin(pang) * float(ARENA_R - 3)))
		for h in range(ARENA_FLOOR + 1, ARENA_FLOOR + 5):
			if in_bounds(px, h, pz):
				voxels[idx(px, h, pz)] = Blocks.CRYSTAL if h > ARENA_FLOOR + 2 else Blocks.DEEPSTONE

	for z in SZ:
		for x in SX:
			var ci := x + z * SX
			if Vector2(x - cx, z - cz).length() <= float(ARENA_R + WALL):
				col_top[ci] = maxi(col_top[ci], ARENA_TOP + WALL + 1)


func _build_border() -> void:
	# A bedrock shell so nothing walks or digs off the edge of the world.
	for z in SZ:
		for x in SX:
			if x >= WALL and z >= WALL and x < SX - WALL and z < SZ - WALL:
				continue
			var top: int = maxi(int(col_top[x + z * SX]), 1)
			for y in range(0, mini(top + 4, SY)):
				voxels[idx(x, y, z)] = Blocks.BEDROCK
			col_top[x + z * SX] = mini(top + 4, SY)


func _scatter_props(rng: RandomNumberGenerator) -> void:
	# Surface: a few gnarled root trees for silhouette.
	var placed := 0
	var attempts := 0
	while placed < 14 and attempts < 400:
		attempts += 1
		var x := rng.randi_range(5, SX - 6)
		var z := rng.randi_range(5, SZ - 6)
		if Vector2(x - SX * 0.5, z - SZ * 0.5).length() < 11.0:
			continue
		var gy: int = int(col_top[x + z * SX]) - 1
		if gy <= 0 or voxels[idx(x, gy, z)] != Blocks.GRASS:
			continue
		var h := rng.randi_range(3, 5)
		for i in h:
			if gy + 1 + i < SY:
				voxels[idx(x, gy + 1 + i, z)] = Blocks.ROOT
		var crown := gy + h
		for dz in range(-2, 3):
			for dx in range(-2, 3):
				if absi(dx) == 2 and absi(dz) == 2:
					continue
				var lx := x + dx
				var lz := z + dz
				if not in_bounds(lx, crown + 1, lz):
					continue
				if voxels[idx(lx, crown + 1, lz)] == Blocks.AIR:
					voxels[idx(lx, crown + 1, lz)] = Blocks.MUSHROOM
				col_top[lx + lz * SX] = maxi(int(col_top[lx + lz * SX]), crown + 2)
		col_top[x + z * SX] = maxi(int(col_top[x + z * SX]), crown + 2)
		placed += 1

	# Underground: mushroom clumps on cave floors.
	for i in 60:
		var x := rng.randi_range(3, SX - 4)
		var z := rng.randi_range(3, SZ - 4)
		var y := rng.randi_range(ARENA_TOP + 4, 41)
		if voxels[idx(x, y, z)] == Blocks.AIR and voxels[idx(x, y - 1, z)] != Blocks.AIR:
			voxels[idx(x, y, z)] = Blocks.MUSHROOM


# Air voxels standing on solid ground, split into "in a cave" and "on the
# surface". Everything that gets spawned in a level is drawn from these.
func _collect_spots(rng: RandomNumberGenerator) -> void:
	for z in range(3, SZ - 3):
		for x in range(3, SX - 3):
			var top: int = int(col_top[x + z * SX])
			if top < SY and top > 4:
				var gid: int = voxels[idx(x, top - 1, z)]
				if gid == Blocks.GRASS or gid == Blocks.DIRT:
					surface_spots.append(Vector3i(x, top, z))
			for y in range(ARENA_TOP + 4, 42):
				if voxels[idx(x, y, z)] != Blocks.AIR:
					continue
				if voxels[idx(x, y + 1, z)] != Blocks.AIR:
					continue
				if voxels[idx(x, y - 1, z)] == Blocks.AIR:
					continue
				cave_spots.append(Vector3i(x, y, z))

	_shuffle(cave_spots, rng)
	_shuffle(surface_spots, rng)


func _shuffle(arr: Array[Vector3i], rng: RandomNumberGenerator) -> void:
	for i in range(arr.size() - 1, 0, -1):
		var j := rng.randi_range(0, i)
		var t := arr[i]
		arr[i] = arr[j]
		arr[j] = t


func arena_centre() -> Vector3:
	return Vector3(SX * 0.5, ARENA_FLOOR + 1.0, SZ * 0.5)


func open_seal() -> void:
	if not sealed:
		return
	sealed = false
	for i in seal_blocks.keys():
		var p := decode_index(i)
		voxels[i] = Blocks.AIR
		var ci: int = p.x + p.z * SX
		if int(col_top[ci]) == p.y + 1:
			var ny := p.y
			while ny >= 0 and voxels[idx(p.x, ny, p.z)] == Blocks.AIR:
				ny -= 1
			col_top[ci] = ny + 1
		_mark_dirty(p.x, p.y, p.z)
		_mark_dirty(p.x - 1, p.y, p.z)
		_mark_dirty(p.x + 1, p.y, p.z)
		_mark_dirty(p.x, p.y - 1, p.z)
		_mark_dirty(p.x, p.y + 1, p.z)
		_mark_dirty(p.x, p.y, p.z - 1)
		_mark_dirty(p.x, p.y, p.z + 1)
	seal_blocks.clear()
	_rebuild_all_now = true
	emit_signal("seal_opened")


func decode_index(i: int) -> Vector3i:
	var y: int = i / (SX * SZ)
	var rem: int = i % (SX * SZ)
	return Vector3i(rem % SX, y, rem / SX)


# --------------------------------------------------------------- meshing ---

# Chunks still waiting to be meshed. Until this is zero the collision shapes
# are incomplete and nothing should be dropped into the world.
func pending_rebuilds() -> int:
	return _dirty.size()


func _process(_delta: float) -> void:
	if _dirty.is_empty():
		return
	var budget := (initial_budget if initial_budget > 0 else _chunk_mesh.size()) if _rebuild_all_now else rebuild_budget
	_rebuild_all_now = false
	var keys := _dirty.keys()
	var n: int = mini(budget, keys.size())
	for k in range(n):
		var ci: int = keys[k]
		_dirty.erase(ci)
		_rebuild_chunk(ci)


func _rebuild_chunk(ci: int) -> void:
	var cx: int = (ci % CX) * CHUNK
	var cz: int = ((ci / CX) % CZ) * CHUNK
	var cy: int = (ci / (CX * CZ)) * CHUNK

	var st_op := SurfaceTool.new()
	var st_al := SurfaceTool.new()
	var st_gl := SurfaceTool.new()
	st_op.begin(Mesh.PRIMITIVE_TRIANGLES)
	st_al.begin(Mesh.PRIMITIVE_TRIANGLES)
	st_gl.begin(Mesh.PRIMITIVE_TRIANGLES)
	var any_op := false
	var any_al := false
	var any_gl := false
	_tris.clear()

	for z in range(cz, cz + CHUNK):
		for x in range(cx, cx + CHUNK):
			var top: int = mini(int(col_top[x + z * SX]), cy + CHUNK)
			for y in range(cy, top):
				var id: int = voxels[idx(x, y, z)]
				if id == Blocks.AIR:
					continue
				var transparent := Blocks.is_transparent(id)
				var glow := Blocks.is_glow(id)
				for f in 6:
					var nrm: Vector3i = FACE_N[f]
					var nb := get_block(x + nrm.x, y + nrm.y, z + nrm.z)
					if nb != Blocks.AIR:
						if not Blocks.is_transparent(nb):
							continue
						if nb == id:
							continue
					var st: SurfaceTool = st_op
					if transparent:
						st = st_al
						any_al = true
					elif glow:
						st = st_gl
						any_gl = true
					else:
						any_op = true
					_emit_face(st, x, y, z, f, id)

	var mesh := ArrayMesh.new()
	if any_op:
		st_op.commit(mesh)
		mesh.surface_set_material(mesh.get_surface_count() - 1, _mat_opaque)
	if any_gl:
		st_gl.commit(mesh)
		mesh.surface_set_material(mesh.get_surface_count() - 1, _mat_glow)
	if any_al:
		st_al.commit(mesh)
		mesh.surface_set_material(mesh.get_surface_count() - 1, _mat_alpha)

	_chunk_mesh[ci].mesh = mesh if (any_op or any_al or any_gl) else null

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

	# Glow faces are unshaded, so AO and face shading would only dirty them.
	var lit := not Blocks.is_glow(id)
	var shade: float = FACE_SHADE[f] if lit else 1.0
	var ui := Vector3i(int(u.x), int(u.y), int(u.z))
	var vi := Vector3i(int(v.x), int(v.y), int(v.z))
	var base := Vector3i(x, y, z) + n

	var a_tl := (_ao(base, -ui, vi) if lit else 1.0) * shade
	var a_tr := (_ao(base, ui, vi) if lit else 1.0) * shade
	var a_br := (_ao(base, ui, -vi) if lit else 1.0) * shade
	var a_bl := (_ao(base, -ui, -vi) if lit else 1.0) * shade

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

# Fraction of the way through breaking the block at p, 0..1.
func dig_progress(p: Vector3i) -> float:
	var id := get_blockv(p)
	if not Blocks.is_diggable(id):
		return 0.0
	var d: float = float(damage.get(idx(p.x, p.y, p.z), 0.0))
	return clampf(d / Blocks.hardness(id), 0.0, 1.0)


# Returns true when the block was destroyed by this hit.
func damage_block(x: int, y: int, z: int, amount: float, by_player: bool = true) -> bool:
	if not in_bounds(x, y, z):
		return false
	var id := get_block(x, y, z)
	if not Blocks.is_diggable(id):
		return false
	var i := idx(x, y, z)
	var d: float = float(damage.get(i, 0.0)) + amount
	if d >= Blocks.hardness(id):
		set_block(x, y, z, Blocks.AIR)
		emit_signal("block_broken", Vector3i(x, y, z), id, by_player)
		return true
	damage[i] = d
	return false


func damage_sphere(centre: Vector3, radius: float, amount: float) -> Array:
	# Returns every block destroyed, so callers can spawn matching debris.
	var broken := []
	var r := int(ceil(radius))
	var c := Vector3i(floori(centre.x), floori(centre.y), floori(centre.z))
	for dy in range(-r, r + 1):
		for dz in range(-r, r + 1):
			for dx in range(-r, r + 1):
				var p := c + Vector3i(dx, dy, dz)
				var off := Vector3(p) + Vector3(0.5, 0.5, 0.5) - centre
				var dist := off.length()
				if dist > radius:
					continue
				var falloff: float = 1.0 - clampf(dist / maxf(radius, 0.001), 0.0, 1.0) * 0.5
				var id := get_blockv(p)
				if not Blocks.is_diggable(id):
					continue
				if damage_block(p.x, p.y, p.z, amount * falloff, false):
					broken.append({"pos": p, "id": id})
	return broken


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
		t_max.x = (float(p.x) + (1.0 if step.x > 0 else 0.0) - origin.x) / d.x
	if not is_zero_approx(d.y):
		t_max.y = (float(p.y) + (1.0 if step.y > 0 else 0.0) - origin.y) / d.y
	if not is_zero_approx(d.z):
		t_max.z = (float(p.z) + (1.0 if step.z > 0 else 0.0) - origin.z) / d.z

	var normal := Vector3i.ZERO
	var t := 0.0
	while t <= max_dist:
		if in_bounds(p.x, p.y, p.z):
			var id: int = voxels[idx(p.x, p.y, p.z)]
			if id != Blocks.AIR:
				return {"block": p, "normal": normal, "point": origin + d * t, "id": id}
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
		if p.y < 0 or p.y >= SY:
			break
		if p.x < -1 or p.z < -1 or p.x > SX or p.z > SZ:
			break
	return {}


func surface_y(x: int, z: int) -> int:
	if x < 0 or z < 0 or x >= SX or z >= SZ:
		return 48
	return int(col_top[x + z * SX])
