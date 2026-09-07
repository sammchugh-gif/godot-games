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
static var mode := "ridge"
static var city: bool:
	get:
		return mode == "city"
	set(v):
		mode = "city" if v else "ridge"
const LAVA_Y := -3.0
const CRATER_Y := 24.0
const POISON_Y := -2.5
const SWAMP_Y := -0.4
# Floating islands of the Cloud Islands: x, z, radius, height.
const SKY_ISLANDS := [[0.0, 10.0, 26.0, 0.0], [40.0, -30.0, 14.0, 6.0], [-40.0, -35.0, 16.0, 4.0], [10.0, -72.0, 18.0, 12.0],
	[62.0, -70.0, 12.0, 18.0], [-20.0, -108.0, 22.0, 24.0], [-72.0, 10.0, 12.0, 3.0], [72.0, 22.0, 12.0, 8.0],
	[30.0, 62.0, 14.0, 2.0], [-50.0, 62.0, 14.0, 10.0], [-95.0, -70.0, 11.0, 30.0]]
# Rock islands of Volcano Bay: x, z, radius, height.
const LAVA_ISLANDS := [[0.0, 12.0, 24.0, 0.0], [42.0, -22.0, 14.0, 2.0], [-42.0, -26.0, 16.0, 1.0], [12.0, -62.0, 16.0, 3.0],
	[-54.0, 20.0, 14.0, 0.0], [64.0, 32.0, 13.0, 1.0], [-22.0, 64.0, 15.0, 0.0], [76.0, -68.0, 12.0, 4.0], [-80.0, -70.0, 13.0, 2.0]]

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
	match mode:
		"city":
			return city_height(x, z)
		"sand":
			return sand_height(x, z)
		"snow":
			return snow_height(x, z)
		"lava":
			return lava_height(x, z)
		"sky":
			return sky_height(x, z)
		"ghost":
			return ghost_height(x, z)
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


# --- Sunburn Sands: dunes, a mesa in the north with a ramp on the west, an
# oasis, and a sunken poison lake in the south-east.
static func sand_height(x: float, z: float) -> float:
	var h := 2.0 * _n().get_noise_2d(x * 0.6, z * 0.6) + 0.5 * _n().get_noise_2d(x * 3.0, z * 3.0)
	var ramp := s01((-x - 40.0) / 10.0) * (1.0 - s01((-x - 92.0) / 10.0))
	h += 10.0 * stepz(z, -70.0, lerpf(3.5, 30.0, ramp))
	h -= 2.4 * gauss((x + 50.0) * (x + 50.0) + (z - 30.0) * (z - 30.0), 14.0)
	h -= 5.0 * s01((22.0 - sqrt((x - 60.0) * (x - 60.0) + (z + 60.0) * (z + 60.0))) / 6.0)
	h = lerpf(h, 0.0, gauss(x * x + (z - 10.0) * (z - 10.0), 18.0))
	return h


static func sand_colour(x: float, z: float, h: float, n: Vector3) -> Color:
	var nz := _n().get_noise_2d(x * 3.0 + 100.0, z * 3.0)
	var sand := Color(0.88, 0.74, 0.42).lerp(Color(0.8, 0.62, 0.34), 0.5 + 0.5 * nz)
	var rock := Color(0.62, 0.36, 0.24).lerp(Color(0.74, 0.46, 0.3), 0.5 + 0.5 * nz)
	var c := sand.lerp(rock, 1.0 - s01((n.y - 0.6) / 0.2))
	if Vector2(x + 50.0, z - 30.0).length() < 15.0:
		c = c.lerp(Color(0.35, 0.62, 0.3), 0.5)
	if h < -2.0:
		c = c.lerp(Color(0.25, 0.3, 0.2), s01((-2.0 - h) / 2.0))
	if h > 8.0:
		c = c.lerp(Color(0.7, 0.42, 0.3), 0.4)
	return c


static func sand_quick(x: float, z: float) -> bool:
	return Vector2(x - 20.0, z + 30.0).length() < 8.0 or Vector2(x + 22.0, z + 46.0).length() < 8.0


# --- Frostbite Peaks: a great mountain in the north, a frozen lake in the
# east, a village on the flat.
static func snow_height(x: float, z: float) -> float:
	var h := 3.0 * _n().get_noise_2d(x * 0.7, z * 0.7)
	h += 42.0 * gauss(x * x + (z + 95.0) * (z + 95.0), 55.0)
	h += 6.0 * gauss((x + 70.0) * (x + 70.0) + (z - 60.0) * (z - 60.0), 25.0)
	h = lerpf(h, -0.5, s01((30.0 - sqrt((x - 50.0) * (x - 50.0) + (z - 40.0) * (z - 40.0))) / 4.0))
	h = lerpf(h, 0.0, gauss(x * x + (z - 10.0) * (z - 10.0), 18.0))
	h = lerpf(h, 12.0, s01((16.0 - sqrt((x + 60.0) * (x + 60.0) + (z + 90.0) * (z + 90.0))) / 4.0))
	return h


static func snow_ice(x: float, z: float) -> bool:
	return Vector2(x - 50.0, z - 40.0).length() < 28.0


static func snow_colour(x: float, z: float, h: float, n: Vector3) -> Color:
	var nz := _n().get_noise_2d(x * 3.0 + 100.0, z * 3.0)
	var snow := Color(0.94, 0.96, 1.0).lerp(Color(0.86, 0.9, 0.98), 0.5 + 0.5 * nz)
	var rock := Color(0.45, 0.48, 0.55).lerp(Color(0.55, 0.58, 0.65), 0.5 + 0.5 * nz)
	var c := snow.lerp(rock, 1.0 - s01((n.y - 0.62) / 0.2))
	if snow_ice(x, z):
		c = Color(0.7, 0.88, 1.0).lerp(Color(0.6, 0.8, 0.98), 0.5 + 0.5 * nz)
	return c


# --- Volcano Bay: rock islands in a lava sea and a volcano cone in the north.
static func lava_height(x: float, z: float) -> float:
	var h := -8.0 + 0.3 * _n().get_noise_2d(x * 2.0, z * 2.0)
	for isl in LAVA_ISLANDS:
		var d := Vector2(x - isl[0], z - isl[1]).length()
		var top: float = isl[3] + 0.8 * _n().get_noise_2d(x * 1.5, z * 1.5)
		h = maxf(h, lerpf(-8.0, top, s01((isl[2] - d) / 4.0)))
	var vd := Vector2(x, z + 108.0).length()
	var cone := clampf(30.0 * (1.0 - vd / 46.0), -8.0, 30.0)
	if vd < 9.0:
		cone = 22.0
	elif vd < 12.0:
		cone = lerpf(22.0, 30.0, (vd - 9.0) / 3.0)
	h = maxf(h, cone)
	return h


static func lava_colour(x: float, z: float, h: float, n: Vector3) -> Color:
	var nz := _n().get_noise_2d(x * 3.0 + 100.0, z * 3.0)
	var rock := Color(0.28, 0.26, 0.28).lerp(Color(0.38, 0.35, 0.36), 0.5 + 0.5 * nz)
	var c := rock.lerp(Color(0.2, 0.18, 0.2), 1.0 - s01((n.y - 0.6) / 0.2))
	if h < -2.0:
		c = Color(0.5, 0.2, 0.1).lerp(Color(0.3, 0.12, 0.08), s01((-2.0 - h) / 4.0))
	elif h < 0.5:
		c = c.lerp(Color(0.5, 0.25, 0.12), s01((0.5 - h) / 2.5) * 0.7)
	if h > 20.0:
		c = c.lerp(Color(0.5, 0.2, 0.12), s01((h - 20.0) / 8.0) * 0.6)
	return c


# --- Cloud Islands: floating islands over nothing.
static func sky_height(x: float, z: float) -> float:
	var h := -60.0
	for isl in SKY_ISLANDS:
		var d := Vector2(x - isl[0], z - isl[1]).length()
		var top: float = isl[3] + 0.6 * _n().get_noise_2d(x * 1.5, z * 1.5)
		h = maxf(h, lerpf(-60.0, top, s01((isl[2] - d) / 3.5)))
	return h


static func sky_colour(x: float, z: float, h: float, n: Vector3) -> Color:
	var nz := _n().get_noise_2d(x * 3.0 + 100.0, z * 3.0)
	var grass := Color(0.4, 0.78, 0.35).lerp(Color(0.55, 0.85, 0.4), 0.5 + 0.5 * nz)
	var cliff := Color(0.92, 0.93, 0.98).lerp(Color(0.8, 0.84, 0.92), 0.5 + 0.5 * nz)
	var c := grass.lerp(cliff, 1.0 - s01((n.y - 0.55) / 0.25))
	if h < -30.0:
		c = Color(0.75, 0.82, 0.95)
	return c


# --- Ghost Manor: dark grass, a graveyard hill in the east, a swamp in the
# west.
static func ghost_height(x: float, z: float) -> float:
	var h := 1.5 * _n().get_noise_2d(x * 0.8, z * 0.8)
	h += 8.0 * gauss((x - 60.0) * (x - 60.0) + (z + 60.0) * (z + 60.0), 30.0)
	h -= 1.5 * s01((26.0 - sqrt((x + 50.0) * (x + 50.0) + (z - 60.0) * (z - 60.0))) / 5.0)
	h = lerpf(h, 0.0, gauss(x * x + (z - 10.0) * (z - 10.0), 18.0))
	h = lerpf(h, 8.0, s01((15.0 - sqrt((x - 60.0) * (x - 60.0) + (z + 60.0) * (z + 60.0))) / 4.0))
	return h


static func ghost_colour(x: float, z: float, h: float, n: Vector3) -> Color:
	var nz := _n().get_noise_2d(x * 3.0 + 100.0, z * 3.0)
	var grass := Color(0.16, 0.28, 0.2).lerp(Color(0.22, 0.32, 0.24), 0.5 + 0.5 * nz)
	var rock := Color(0.3, 0.3, 0.36).lerp(Color(0.38, 0.36, 0.42), 0.5 + 0.5 * nz)
	var c := grass.lerp(rock, 1.0 - s01((n.y - 0.6) / 0.2))
	if h < -0.6:
		c = c.lerp(Color(0.2, 0.25, 0.12), s01((-0.6 - h) / 1.0))
	return c


static func colour(x: float, z: float, h: float, n: Vector3) -> Color:
	match mode:
		"city":
			return city_colour(x, z, h, n)
		"sand":
			return sand_colour(x, z, h, n)
		"snow":
			return snow_colour(x, z, h, n)
		"lava":
			return lava_colour(x, z, h, n)
		"sky":
			return sky_colour(x, z, h, n)
		"ghost":
			return ghost_colour(x, z, h, n)
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
