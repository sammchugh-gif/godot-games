# The island. A heightfield built from a coast line, an altitude profile
# that follows the route, fractal noise, terraced cliffs (the checker rock
# steps of Green Hill), dig regions (the bay under the rails, the lagoon)
# and raise regions (ridges, cliff backdrops). The road is embedded last:
# terrain is pulled to the running surface under and just beside every
# ground frame so the path always sits in the land, never floats over it.
#
# Built in chunks with smooth normals, vertex AO (slope + cavity) and a
# wetness band, each chunk with its own trimesh collider.
class_name Terrain
extends RefCounted

var x0 := -600.0
var x1 := 220.0
var z0 := -1850.0
var z1 := 150.0
var cell := 4.0
var nx := 0
var nz := 0
var heights := PackedFloat32Array()
var road_h := PackedFloat32Array()
var road_w := PackedFloat32Array()   # blend weight 0..1
var digs: Array = []    # {a, b, r, h, fade}
var raises: Array = []  # {a, b, r, h, fade}
var coast: Array = []   # [z, x] pairs, sorted by z descending (toward -z)
var _noise: FastNoiseLite
var _noise2: FastNoiseLite
var _alt := {}          # z bucket (20 m) -> [alt, x]


func _init() -> void:
	_noise = FastNoiseLite.new()
	_noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	_noise.seed = 4242
	_noise.frequency = 0.006
	_noise.fractal_octaves = 4
	_noise.fractal_gain = 0.5
	_noise2 = FastNoiseLite.new()
	_noise2.noise_type = FastNoiseLite.TYPE_SIMPLEX
	_noise2.seed = 99
	_noise2.frequency = 0.03
	_noise2.fractal_octaves = 2


func dig(a: Vector3, b: Vector3, r: float, h: float, fade: float = 40.0) -> void:
	digs.append({"a": Vector2(a.x, a.z), "b": Vector2(b.x, b.z), "r": r, "h": h, "fade": fade})


func raise(a: Vector3, b: Vector3, r: float, h: float, fade: float = 30.0) -> void:
	raises.append({"a": Vector2(a.x, a.z), "b": Vector2(b.x, b.z), "r": r, "h": h, "fade": fade})


static func _seg_dist(p: Vector2, a: Vector2, b: Vector2) -> float:
	var ab := b - a
	var l2 := ab.length_squared()
	if l2 < 1e-6:
		return p.distance_to(a)
	var t := clampf((p - a).dot(ab) / l2, 0.0, 1.0)
	return p.distance_to(a + ab * t)


func coast_x(z: float) -> float:
	# Piecewise-linear coast line in z, plus wobble.
	if coast.is_empty():
		return -200.0
	var x := float(coast[0][1])
	for i in coast.size() - 1:
		var za: float = coast[i][0]
		var zb: float = coast[i + 1][0]
		if z <= za and z >= zb:
			var t := (za - z) / maxf(za - zb, 0.001)
			x = lerpf(coast[i][1], coast[i + 1][1], smoothstep(0.0, 1.0, t))
			break
		x = coast[i + 1][1]
	x += _noise2.get_noise_2d(0.0, z * 0.5) * 30.0
	return x


func _route_alt(z: float) -> Array:
	var k := int(floor(z / 20.0))
	if _alt.has(k):
		return _alt[k]
	# Find nearest known bucket.
	for d in range(1, 40):
		if _alt.has(k + d):
			return _alt[k + d]
		if _alt.has(k - d):
			return _alt[k - d]
	return [30.0, 0.0]


func prepare(track: Track) -> void:
	if Quality.lightweight():
		cell = 6.0
	nx = int((x1 - x0) / cell) + 1
	nz = int((z1 - z0) / cell) + 1
	heights.resize(nx * nz)
	road_h.resize(nx * nz)
	road_w.resize(nx * nz)
	road_h.fill(0.0)
	road_w.fill(0.0)
	# Altitude profile by z from ground frames.
	var acc := {}
	for fr in track.frames:
		if fr["kind"] != "ground" and fr["kind"] != "ramp" and fr["kind"] != "tunnel":
			continue
		var p: Vector3 = fr["p"]
		var k := int(floor(p.z / 20.0))
		if not acc.has(k):
			acc[k] = [0.0, 0.0, 0]
		acc[k][0] += p.y
		acc[k][1] += p.x
		acc[k][2] += 1
	for k in acc:
		_alt[k] = [acc[k][0] / acc[k][2], acc[k][1] / acc[k][2]]
	# Rasterise ground frames into the road height / weight grids. Ramps
	# get a tight fade so the land drops away sheer at their lip.
	for fr in track.frames:
		var kind: String = fr["kind"]
		if kind != "ground" and kind != "ramp":
			continue
		var fade := 18.0 if kind == "ground" else 4.0
		var p: Vector3 = fr["p"]
		var r: Vector3 = fr["r"]
		var half: float = fr["w"] * 0.5
		var rh := Vector2(r.x, r.z)
		if rh.length() < 0.05:
			continue
		rh = rh.normalized()
		var reach := half + fade
		var ix0 := maxi(int((p.x - reach - x0) / cell), 0)
		var ix1 := mini(int((p.x + reach - x0) / cell) + 1, nx - 1)
		var iz0 := maxi(int((p.z - reach - z0) / cell), 0)
		var iz1 := mini(int((p.z + reach - z0) / cell) + 1, nz - 1)
		var fh := Vector2(fr["f"].x, fr["f"].z).normalized()
		for iz in range(iz0, iz1 + 1):
			for ix in range(ix0, ix1 + 1):
				var wx := x0 + ix * cell
				var wz := z0 + iz * cell
				var d2 := Vector2(wx - p.x, wz - p.z)
				var lat := d2.dot(rh)
				var along := d2.dot(fh)
				var d := maxf(absf(lat) - half, 0.0)
				d = maxf(d, absf(along) - 1.0)
				if d > fade:
					continue
				var w := 1.0 - smoothstep(0.0, fade, d)
				var idx := iz * nx + ix
				if w > road_w[idx]:
					road_w[idx] = w
					var y_off := r.y * clampf(lat, -half, half)
					road_h[idx] = p.y - 0.4 + y_off
	# Tunnels: pull the heightfield up to a ridge over the tube so the bore
	# is always inside the hill (the raise regions add the bulk around it).
	for fr in track.frames:
		if fr["kind"] != "tunnel":
			continue
		var p: Vector3 = fr["p"]
		var half: float = fr["w"] * 0.5 + 4.0
		var reach := half + 10.0
		var ix0 := maxi(int((p.x - reach - x0) / cell), 0)
		var ix1 := mini(int((p.x + reach - x0) / cell) + 1, nx - 1)
		var iz0 := maxi(int((p.z - reach - z0) / cell), 0)
		var iz1 := mini(int((p.z + reach - z0) / cell) + 1, nz - 1)
		for iz in range(iz0, iz1 + 1):
			for ix in range(ix0, ix1 + 1):
				var wx := x0 + ix * cell
				var wz := z0 + iz * cell
				var d := Vector2(wx - p.x, wz - p.z).length()
				var dd := maxf(d - half, 0.0)
				if dd > 10.0:
					continue
				var w := 1.0 - smoothstep(0.0, 10.0, dd)
				var idx := iz * nx + ix
				if w > road_w[idx]:
					road_w[idx] = w
					road_h[idx] = p.y + 15.0
	# Heights. Coast and route altitude only vary with z, so they are
	# evaluated once per row.
	for iz in nz:
		var z := z0 + iz * cell
		var alt := _route_alt(z)
		var cx := coast_x(z)
		for ix in nx:
			heights[iz * nx + ix] = _height(x0 + ix * cell, z, iz * nx + ix, alt[0], alt[1], cx)


func _height(x: float, z: float, idx: int, a: float, rx: float, cx: float) -> float:
	var n1 := _noise.get_noise_2d(x, z)          # -1..1 broad
	var n2 := _noise2.get_noise_2d(x, z)         # -1..1 fine
	# Land: rises inland (east of the route), falls toward the coast. The
	# hills flatten out where the route runs low (beaches).
	var relief := clampf(a / 40.0, 0.3, 1.0)
	var h: float
	if x > rx:
		h = a + (x - rx) * 0.42 + n1 * 22.0 * relief
	else:
		h = a - (rx - x) * 0.22 + n1 * 16.0 * relief
	# Coast: below the water line west of the coast.
	var to_sea := cx - x    # positive when in the sea
	var sea_t := smoothstep(-8.0, 40.0, to_sea)
	var sea_floor := -14.0 + n2 * 3.0 - maxf(to_sea, 0.0) * 0.05
	h = lerpf(h, sea_floor, sea_t)
	# Digs (bay under the rails, lagoon) and raises (ridges, backdrops).
	var p2 := Vector2(x, z)
	for d in digs:
		var dd: float = _seg_dist(p2, d["a"], d["b"]) - d["r"]
		var t := 1.0 - smoothstep(0.0, d["fade"], dd)
		if t > 0.0:
			h = lerpf(h, minf(h, d["h"] + n2 * 2.0), t)
	for rr in raises:
		var dd: float = _seg_dist(p2, rr["a"], rr["b"]) - rr["r"]
		var t := 1.0 - smoothstep(0.0, rr["fade"], dd)
		if t > 0.0:
			h = lerpf(h, maxf(h, rr["h"] + n2 * 3.0), t)
	# Terraces: quantise into 9 m steps with soft risers, only away from roads
	# and above the beach.
	var w := road_w[idx]
	var step := 9.0
	var q := floor(h / step) * step
	var f := (h - q) / step
	var terr := q + smoothstep(0.30, 0.70, f) * step
	var terr_amt := (1.0 - w) * smoothstep(4.0, 12.0, h) * 0.75
	h = lerpf(h, terr, terr_amt)
	h += n2 * 1.2 * (1.0 - w)
	# Embed the road.
	if w > 0.0:
		h = lerpf(h, road_h[idx], w)
	return h


func height_at(x: float, z: float) -> float:
	var fx := (x - x0) / cell
	var fz := (z - z0) / cell
	var ix := clampi(int(floor(fx)), 0, nx - 2)
	var iz := clampi(int(floor(fz)), 0, nz - 2)
	var tx := clampf(fx - ix, 0.0, 1.0)
	var tz := clampf(fz - iz, 0.0, 1.0)
	var h00 := heights[iz * nx + ix]
	var h10 := heights[iz * nx + ix + 1]
	var h01 := heights[(iz + 1) * nx + ix]
	var h11 := heights[(iz + 1) * nx + ix + 1]
	return lerpf(lerpf(h00, h10, tx), lerpf(h01, h11, tx), tz)


func normal_at(x: float, z: float) -> Vector3:
	var e := cell
	var hl := height_at(x - e, z)
	var hr := height_at(x + e, z)
	var hd := height_at(x, z - e)
	var hu := height_at(x, z + e)
	return Vector3(hl - hr, 2.0 * e, hd - hu).normalized()


func road_weight_at(x: float, z: float) -> float:
	var ix := clampi(int((x - x0) / cell), 0, nx - 1)
	var iz := clampi(int((z - z0) / cell), 0, nz - 1)
	return road_w[iz * nx + ix]


func build(parent: Node3D) -> void:
	var chunk := 32
	var mat := Mats.terrain()
	var cz := 0
	while cz < nz - 1:
		var cx := 0
		while cx < nx - 1:
			_build_chunk(parent, cx, cz, mini(cx + chunk, nx - 1), mini(cz + chunk, nz - 1), mat)
			cx += chunk
		cz += chunk


func _build_chunk(parent: Node3D, ix0: int, iz0: int, ix1: int, iz1: int, mat: Material) -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var w := ix1 - ix0 + 1
	var h := iz1 - iz0 + 1
	var min_y := 1e9
	var max_y := -1e9
	for iz in range(iz0, iz1 + 1):
		for ix in range(ix0, ix1 + 1):
			var x := x0 + ix * cell
			var z := z0 + iz * cell
			var y := heights[iz * nx + ix]
			min_y = minf(min_y, y)
			max_y = maxf(max_y, y)
			var hl := heights[iz * nx + maxi(ix - 1, 0)]
			var hr := heights[iz * nx + mini(ix + 1, nx - 1)]
			var hd := heights[maxi(iz - 1, 0) * nx + ix]
			var hu := heights[mini(iz + 1, nz - 1) * nx + ix]
			var n := Vector3(hl - hr, 2.0 * cell, hd - hu).normalized()
			# Cavity AO: lower than neighbours -> darker.
			var avg := (hl + hr + hd + hu) * 0.25
			var cav := clampf((avg - y) / 6.0, 0.0, 1.0)
			var ao := clampf(1.0 - cav * 0.7, 0.3, 1.0)
			var wet := road_w[iz * nx + ix] * 0.4
			st.set_normal(n)
			st.set_color(Color(ao, wet, 0.0))
			st.set_uv(Vector2(x * 0.05, z * 0.05))
			st.add_vertex(Vector3(x, y, z))
	if max_y < -13.0:
		return  # deep sea floor chunk: invisible under the water and never touched
	for iz in h - 1:
		for ix in w - 1:
			var i00 := iz * w + ix
			var i10 := i00 + 1
			var i01 := i00 + w
			var i11 := i01 + 1
			st.add_index(i00)
			st.add_index(i01)
			st.add_index(i10)
			st.add_index(i10)
			st.add_index(i01)
			st.add_index(i11)
	var mesh := st.commit()
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = mat
	mi.name = "Terrain_%d_%d" % [ix0, iz0]
	parent.add_child(mi)
	var col := MeshLib.collider(mesh, "TerrainCol_%d_%d" % [ix0, iz0])
	col.collision_layer = 1
	col.set_meta("ground_kind", "grass")
	parent.add_child(col)


# The sea: a big subdivided plane with the ocean shader.
static func build_ocean(parent: Node3D, center: Vector3, size: Vector2) -> MeshInstance3D:
	var pm := PlaneMesh.new()
	pm.size = size
	var sub := 12 if Quality.lightweight() else 8
	pm.subdivide_width = int(size.x / sub)
	pm.subdivide_depth = int(size.y / sub)
	var mi := MeshInstance3D.new()
	mi.mesh = pm
	mi.material_override = Mats.ocean()
	mi.position = center
	mi.name = "Ocean"
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)
	# Kill plane a little below the waves: the player's own y check handles
	# death, this just stops anything falling forever.
	return mi
