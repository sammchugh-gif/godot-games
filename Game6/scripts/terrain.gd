# Dino Ridge's ground: a heightfield defined by a function, rendered as one
# vertex-coloured mesh with a trimesh collider. The function is the single
# source of truth, so props can ask Terrain.height() where to stand.
#
# Layout (x east, z south, y up):
#   * the landing meadow around the origin at y = 0,
#   * plateau one north of z = -40 at y = 12, cliffs everywhere except a long
#     grass ramp on the east side (x 24..62),
#   * plateau two (the ridge top) north of z = -85 at y = 26, same ramp,
#   * a pond under the waterfall at (-10, -28) draining south as a river,
#   * a deep gorge along x = 78 with a far island beyond it (x > 88).
class_name Terrain
extends RefCounted

const SIZE := 260.0
const CELL := 2.0
const N := int(SIZE / CELL) + 1
const WATER_Y := -0.35
const GORGE_WATER_Y := -12.0
const HARBOUR_Y := -2.5
const STREETS_X := [-100.0, -60.0, -20.0, 20.0, 60.0, 100.0]
const STREETS_Z := [-100.0, -60.0, -20.0, 20.0, 60.0]

# Which kingdom's ground function is live. Set by the level's _init().
static var city := false

static var _noise: FastNoiseLite


static func _n() -> FastNoiseLite:
	if _noise == null:
		_noise = FastNoiseLite.new()
		_noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
		_noise.seed = 4242
		_noise.frequency = 0.035
		_noise.fractal_octaves = 3
	return _noise


static func s01(t: float) -> float:
	t = clampf(t, 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)


# 1 where z < z0 (north), 0 where z > z0, blended over width w.
static func stepz(z: float, z0: float, w: float) -> float:
	return s01((z0 - z) / w + 0.5)


static func gauss(d2: float, r: float) -> float:
	return exp(-d2 / (r * r))


static func ramp_mask(x: float) -> float:
	return s01((x - 22.0) / 8.0) * (1.0 - s01((x - 64.0) / 8.0))


static func height(x: float, z: float) -> float:
	if city:
		return city_height(x, z)
	var ramp := ramp_mask(x)
	var w := lerpf(3.2, 30.0, ramp)
	var h := 12.0 * stepz(z, -40.0, w)
	h += 14.0 * stepz(z, -85.0, w)
	# Rolling grass everywhere.
	h += 1.3 * _n().get_noise_2d(x, z)
	# Hills in the south meadow.
	h += 3.5 * gauss((x - 42.0) * (x - 42.0) + (z - 62.0) * (z - 62.0), 16.0)
	h += 2.5 * gauss((x + 52.0) * (x + 52.0) + (z - 72.0) * (z - 72.0), 14.0)
	h += 4.0 * gauss((x + 92.0) * (x + 92.0) + (z + 20.0) * (z + 20.0), 22.0)
	# Pond under the waterfall, and the river south of it.
	h -= 2.2 * gauss((x + 10.0) * (x + 10.0) + (z + 28.0) * (z + 28.0), 12.0)
	h -= 1.6 * gauss((x + 10.0) * (x + 10.0), 5.0) * s01((z + 24.0) / 6.0)
	# Gorge to the east, only south of the plateaus, and the island past it.
	var gz := s01((z + 34.0) / 10.0)
	h -= 24.0 * gauss((x - 78.0) * (x - 78.0), 9.5) * gz
	var island := s01((x - 86.0) / 5.0) * gz
	h = lerpf(h, 5.0 + 0.8 * _n().get_noise_2d(x * 2.0, z * 2.0), island)
	# Flat spots: the landing meadow and the boss arena.
	h = lerpf(h, 0.0, gauss(x * x + (z - 12.0) * (z - 12.0), 20.0))
	h = lerpf(h, 26.0, s01((17.0 - sqrt((x + 6.0) * (x + 6.0) + (z + 108.0) * (z + 108.0))) / 4.0))
	return h


static func normal(x: float, z: float) -> Vector3:
	var e := 0.6
	var dx := height(x + e, z) - height(x - e, z)
	var dz := height(x, z + e) - height(x, z - e)
	return Vector3(-dx, 2.0 * e, -dz).normalized()


# Skyline City: flat streets, a mound in the park, a quay dropping into the
# harbour along the south edge.
static func city_height(x: float, z: float) -> float:
	var h := 2.2 * gauss((x + 40.0) * (x + 40.0) + z * z, 13.0)
	h += 0.25 * _n().get_noise_2d(x * 2.0, z * 2.0)
	h -= 12.0 * s01((z - 91.0) / 5.0)
	return h


static func on_street(x: float, z: float, w: float = 6.0) -> bool:
	for sx in STREETS_X:
		if absf(x - sx) < w:
			return true
	for sz in STREETS_Z:
		if absf(z - sz) < w:
			return true
	return false


static func in_park(x: float, z: float) -> bool:
	return x > -58.0 and x < -22.0 and z > -18.0 and z < 18.0


static func city_colour(x: float, z: float, h: float, n: Vector3) -> Color:
	var nz := _n().get_noise_2d(x * 3.0 + 100.0, z * 3.0)
	if h < -2.0:
		return Color(0.12, 0.16, 0.24)
	if z > 84.0:
		return Color(0.58, 0.55, 0.5).lerp(Color(0.5, 0.48, 0.45), 0.5 + 0.5 * nz)
	if in_park(x, z):
		var grass := Color(0.2, 0.45, 0.18).lerp(Color(0.28, 0.55, 0.2), 0.5 + 0.5 * nz)
		return grass.lerp(Color(0.4, 0.35, 0.3), 1.0 - s01((n.y - 0.7) / 0.2))
	if on_street(x, z):
		return Color(0.17, 0.17, 0.2).lerp(Color(0.22, 0.22, 0.25), 0.5 + 0.5 * nz)
	return Color(0.5, 0.5, 0.52).lerp(Color(0.44, 0.44, 0.47), 0.5 + 0.5 * nz)


static func colour(x: float, z: float, h: float, n: Vector3) -> Color:
	if city:
		return city_colour(x, z, h, n)
	var nz := _n().get_noise_2d(x * 3.0 + 100.0, z * 3.0)
	var grass := Color(0.3, 0.6, 0.2).lerp(Color(0.45, 0.72, 0.24), 0.5 + 0.5 * nz)
	if h > 20.0:
		grass = grass.lerp(Color(0.66, 0.66, 0.36), 0.5)
	elif h > 8.0:
		grass = grass.lerp(Color(0.6, 0.76, 0.3), 0.35)
	var rock := Color(0.44, 0.37, 0.32).lerp(Color(0.56, 0.49, 0.42), 0.5 + 0.5 * nz)
	var sand := Color(0.8, 0.72, 0.5)
	var c := grass
	var steep := 1.0 - s01((n.y - 0.62) / 0.2)
	c = c.lerp(rock, steep)
	if h < 0.6 and x < 40.0:
		c = c.lerp(sand, s01((0.6 - h) / 1.2) * 0.85)
	if h < -3.0:
		c = c.lerp(Color(0.3, 0.28, 0.3), s01((-3.0 - h) / 6.0))
	return c


# Builds the mesh + collider; returns the StaticBody3D holding both.
static func build() -> StaticBody3D:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var half := SIZE * 0.5
	var pts: PackedVector3Array = PackedVector3Array()
	var cols: PackedColorArray = PackedColorArray()
	var nrms: PackedVector3Array = PackedVector3Array()
	pts.resize(N * N)
	cols.resize(N * N)
	nrms.resize(N * N)
	for j in N:
		for i in N:
			var x := -half + i * CELL
			var z := -half + j * CELL
			var h := height(x, z)
			var n := normal(x, z)
			pts[j * N + i] = Vector3(x, h, z)
			nrms[j * N + i] = n
			cols[j * N + i] = colour(x, z, h, n)
	for j in N - 1:
		for i in N - 1:
			var a := j * N + i
			var b := a + 1
			var c := a + N
			var d := c + 1
			# Split each cell along the shorter diagonal so cliffs stay crisp.
			var flip := absf(pts[a].y - pts[d].y) > absf(pts[b].y - pts[c].y)
			if flip:
				_tri(st, pts, nrms, cols, a, c, b)
				_tri(st, pts, nrms, cols, b, c, d)
			else:
				_tri(st, pts, nrms, cols, a, c, d)
				_tri(st, pts, nrms, cols, a, d, b)
	var mesh := st.commit()
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = Mats.vertex_painted()
	mi.name = "TerrainMesh"
	var body := StaticBody3D.new()
	body.name = "Terrain"
	var cs := CollisionShape3D.new()
	cs.shape = mesh.create_trimesh_shape()
	body.add_child(cs)
	body.add_child(mi)
	return body


static func _tri(st: SurfaceTool, p: PackedVector3Array, n: PackedVector3Array, c: PackedColorArray, i0: int, i1: int, i2: int) -> void:
	# Godot front faces are clockwise; callers pass counter-clockwise.
	for i in [i0, i2, i1]:
		st.set_normal(n[i])
		st.set_color(c[i])
		st.add_vertex(p[i])
