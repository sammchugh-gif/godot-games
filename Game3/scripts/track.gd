# A racing circuit. The centre line is a closed Catmull-Rom style Curve3D
# built from TrackDefs; it is baked into frames one metre apart (position,
# forward, up, right, signed curvature, width, tunnel amount). Ships and AI
# live in TRACK SPACE -- (s along the lap, x across, h above the surface) --
# and are converted to world space with xform(). That makes hovering, wall
# limits and AI trivially robust, which is what an anti-gravity racer wants.
#
# Every visible surface is a real texture set (see Mats): the road, walls,
# kerbs, neon rails, tunnels, gates, terrain, buildings and sky.
class_name Track
extends Node3D

const STEP := 1.0
const CHUNK := 40  # samples per mesh chunk (frustum culled separately)
const WALL_H := 2.6
const RAIL_H := 0.4
const KERB_W := 1.4

var def: Dictionary
var theme := {}
var length := 0.0
var n := 0
var pos := PackedVector3Array()
var fwd := PackedVector3Array()
var up := PackedVector3Array()
var right := PackedVector3Array()
var curv := PackedFloat32Array()
var vcurv := PackedFloat32Array()  # vertical curvature, + = curving up (valley)
var width := PackedFloat32Array()
var tunnel := PackedFloat32Array()
var pads: Array = []            # {type, s, x, len, w}
var grid: Array = []            # [Vector2(s, x)] start slots, pole first
var minimap := PackedVector2Array()
var minimap_bounds := Rect2()

var _sun: DirectionalLight3D
var _env: WorldEnvironment
var _pad_mats: Array = []
var _time := 0.0
var _lava_mat: StandardMaterial3D


static func themes() -> Dictionary:
	return {
		"marina": {
			"sky": "sky_sunset", "sky_energy": 0.95, "sky_rot": 0.0,
			"ambient": Color(0.6, 0.5, 0.52), "ambient_energy": 1.7,
			"sun_dir": Vector3(-0.35, -0.3, -0.9), "sun_color": Color(1.0, 0.72, 0.5), "sun_energy": 1.3,
			"fog": Color(0.78, 0.55, 0.5), "fog_density": 0.0011,
			"neon": Color(0.0, 1.0, 0.9), "neon2": Color(1.0, 0.25, 0.75),
			"road": "asphalt", "road_tile": 26.0, "road_tint": Color(0.95, 0.95, 1.0),
			"wall": "rivet_panels", "tunnel": "tech_panels", "under": "steel",
			"terrain": "water", "terrain_y": -6.0,
			"buildings": ["glass", "train", "container"], "building_count": 90,
			"music": "music_race",
		},
		"cryo": {
			"sky": "sky_night", "sky_energy": 0.9, "sky_rot": 1.2,
			"ambient": Color(0.45, 0.55, 0.75), "ambient_energy": 2.0,
			"sun_dir": Vector3(0.3, -0.5, 0.8), "sun_color": Color(0.75, 0.85, 1.0), "sun_energy": 1.3,
			"fog": Color(0.05, 0.08, 0.16), "fog_density": 0.0018,
			"neon": Color(0.3, 0.65, 1.0), "neon2": Color(0.95, 0.25, 1.0),
			"road": "scifi_floor", "road_tile": 12.0, "road_tint": Color(1, 1, 1),
			"wall": "tech_panels", "tunnel": "tech_panels_color", "under": "gun_metal",
			"terrain": "ice", "terrain_y": -22.0,
			"buildings": ["tech", "glass"], "building_count": 40,
			"music": "music_utopia",
		},
		"magma": {
			"sky": "sky_space", "sky_energy": 1.0, "sky_rot": 0.6,
			"ambient": Color(0.6, 0.35, 0.28), "ambient_energy": 1.6,
			"sun_dir": Vector3(0.5, -0.55, -0.65), "sun_color": Color(1.0, 0.55, 0.35), "sun_energy": 1.1,
			"fog": Color(0.22, 0.05, 0.03), "fog_density": 0.0013,
			"neon": Color(1.0, 0.5, 0.1), "neon2": Color(0.2, 1.0, 0.45),
			"road": "anti_slip", "road_tile": 7.0, "road_tint": Color(0.7, 0.62, 0.62),
			"wall": "tech_panels_color", "tunnel": "metal_pillars", "under": "steel",
			"terrain": "lava", "terrain_y": -30.0,
			"buildings": ["container", "tech"], "building_count": 45,
			"music": "music_race",
		},
	}


func build(track_def: Dictionary) -> void:
	def = track_def
	theme = themes()[def["theme"]]
	_bake_frames()
	_place_pads()
	_place_grid()
	_build_minimap()
	_build_track_meshes()
	_build_environment()
	_build_terrain()
	_build_buildings()


# ----------------------------------------------------------------- frames ---

func _bake_frames() -> void:
	var pts: Array = def["points"]
	var curve := Curve3D.new()
	curve.closed = true
	curve.bake_interval = 0.5
	var m := pts.size()
	for i in m:
		var p := _pt(pts[i])
		var prev := _pt(pts[(i - 1 + m) % m])
		var next := _pt(pts[(i + 1) % m])
		var tangent := (next - prev) / 6.0
		curve.add_point(p, -tangent, tangent)
	length = curve.get_baked_length()
	n = int(round(length / STEP))
	var step := length / n
	pos.resize(n); fwd.resize(n); up.resize(n); right.resize(n)
	curv.resize(n); vcurv.resize(n); width.resize(n); tunnel.resize(n)
	for i in n:
		pos[i] = curve.sample_baked(i * step, true)
	# Forward from neighbours, up by parallel transport (no twist).
	var u := Vector3.UP
	for i in n:
		var f := (pos[(i + 1) % n] - pos[(i - 1 + n) % n]).normalized()
		fwd[i] = f
		u = (u - f * u.dot(f)).normalized()
		up[i] = u
	# Fix the loop closure twist by distributing the residual roll.
	var u_end := (up[0] - fwd[0] * up[0].dot(fwd[0]))
	var closing := up[n - 1] - fwd[0] * up[n - 1].dot(fwd[0])
	var resid := closing.normalized().signed_angle_to(u_end.normalized(), fwd[0])
	# Per-control-point attributes: bank, width, tunnel, keyed by offset.
	var offs := PackedFloat32Array()
	for i in m:
		offs.append(curve.get_closest_offset(_pt(pts[i])))
	offs[0] = 0.0
	for i in n:
		var s := i * step
		var k := 0
		for j in m:
			if offs[j] <= s:
				k = j
		var k2 := (k + 1) % m
		var o1 := offs[k]
		var o2 := offs[k2] if k2 != 0 else length
		var t := clampf((s - o1) / maxf(o2 - o1, 0.001), 0.0, 1.0)
		var ts := t * t * (3.0 - 2.0 * t)
		var bank := deg_to_rad(lerpf(pts[k][3], pts[k2][3], ts))
		width[i] = lerpf(pts[k][4], pts[k2][4], ts)
		var t1 := 1.0 if pts[k][5] else 0.0
		var t2 := 1.0 if pts[k2][5] else 0.0
		tunnel[i] = lerpf(t1, t2, ts)
		# Apply closure correction and banking as a roll about forward.
		var roll := -resid * (float(i) / n) + bank
		var f := fwd[i]
		var uu := up[i].rotated(f, roll)
		up[i] = uu
		right[i] = f.cross(uu).normalized()
	for i in n:
		var a := fwd[(i - 1 + n) % n]
		var b := fwd[(i + 1) % n]
		curv[i] = (b - a).dot(right[i]) / (2.0 * step)
		vcurv[i] = (b - a).dot(up[i]) / (2.0 * step)
	# Smooth curvature a little for the AI look-ahead.
	var sm := PackedFloat32Array()
	sm.resize(n)
	for i in n:
		var acc := 0.0
		for j in range(-3, 4):
			acc += curv[(i + j + n) % n]
		sm[i] = acc / 7.0
	curv = sm


static func _pt(p: Array) -> Vector3:
	return Vector3(p[0], p[1], p[2])


func wrap_s(s: float) -> float:
	return fposmod(s, length)


func idx(s: float) -> int:
	return int(floorf(wrap_s(s) / (length / n))) % n


func width_at(s: float) -> float:
	return width[idx(s)]


func curvature_at(s: float) -> float:
	return curv[idx(s)]


func vcurvature_at(s: float) -> float:
	return vcurv[idx(s)]


func tunnel_at(s: float) -> float:
	return tunnel[idx(s)]


# Max |x| a ship centre may take before it is in the wall.
func limit_at(s: float, ship_half_w: float) -> float:
	return width_at(s) * 0.5 - 0.5 - ship_half_w


# Full frame at s: basis X = right, Y = up, Z = -forward (Godot model convention).
func xform(s: float, x: float = 0.0, h: float = 0.0) -> Transform3D:
	var step := length / n
	var sw := wrap_s(s)
	var fi := sw / step
	var i := int(floorf(fi)) % n
	var t := fi - floorf(fi)
	var j := (i + 1) % n
	var p := pos[i].lerp(pos[j], t)
	var f := fwd[i].lerp(fwd[j], t).normalized()
	var u := up[i].lerp(up[j], t).normalized()
	var r := f.cross(u).normalized()
	u = r.cross(f).normalized()
	var b := Basis(r, u, -f)
	return Transform3D(b, p + r * x + u * h)


func point(s: float, x: float = 0.0, h: float = 0.0) -> Vector3:
	return xform(s, x, h).origin


# ------------------------------------------------------------------- pads ---

func _place_pads() -> void:
	pads.clear()
	var straight := PackedFloat32Array()
	straight.resize(n)
	for i in n:
		var mx := 0.0
		for j in range(-20, 21):
			mx = maxf(mx, absf(curv[(i + j + n) % n]))
		straight[i] = mx
	var last_boost := -400.0
	var side := 1.0
	var s := 70.0
	while s < length - 80.0:
		var i := idx(s)
		if straight[i] < 0.0045 and s - last_boost > 170.0:
			pads.append({"type": "boost", "s": s, "x": side * width[i] * 0.22, "len": 14.0, "w": 6.5})
			last_boost = s
			side = -side
			s += 60.0
		s += 10.0
	# Weapon pads: regular, kept clear of boost pads and the start line.
	var ws := 140.0
	while ws < length - 120.0:
		var ok := true
		for p in pads:
			if absf(p["s"] - ws) < 40.0:
				ok = false
		if ok:
			var i := idx(ws)
			pads.append({"type": "weapon", "s": ws, "x": 0.0, "len": 7.0, "w": width[i] - 2.0 * KERB_W - 1.0})
		ws += 330.0
	pads.sort_custom(func(a, b): return a["s"] < b["s"])


func pad_at(s: float, x: float) -> Dictionary:
	var sw := wrap_s(s)
	for p in pads:
		var ps: float = p["s"]
		if sw >= ps and sw <= ps + p["len"] and absf(x - p["x"]) <= p["w"] * 0.5:
			return p
	return {}


func _place_grid() -> void:
	grid.clear()
	for i in 8:
		var row := i / 2
		var col := i % 2
		grid.append(Vector2(-14.0 - row * 9.0, (-4.5 if col == 0 else 4.5) + (0.0 if row % 2 == 0 else 0.0)))


func _build_minimap() -> void:
	minimap = PackedVector2Array()
	var mn := Vector2(1e9, 1e9)
	var mx := Vector2(-1e9, -1e9)
	var i := 0
	while i < n:
		var v := Vector2(pos[i].x, pos[i].z)
		minimap.append(v)
		mn = mn.min(v)
		mx = mx.max(v)
		i += 8
	minimap_bounds = Rect2(mn, mx - mn)


func map_point(world: Vector3) -> Vector2:
	return Vector2(world.x, world.z)


# ------------------------------------------------------------ track meshes ---

class Builder:
	var st := SurfaceTool.new()
	var mat: Material
	var count := 0
	func _init(m: Material) -> void:
		mat = m
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
	func quad(a: Vector3, b: Vector3, c: Vector3, d: Vector3, nrm: Vector3,
			ua: Vector2, ub: Vector2, uc: Vector2, ud: Vector2) -> void:
		var face := (b - a).cross(c - a)
		if face.dot(nrm) < 0.0:
			var tb := b; b = d; d = tb
			var tu := ub; ub = ud; ud = tu
		st.set_normal(nrm); st.set_uv(ua); st.add_vertex(a)
		st.set_normal(nrm); st.set_uv(ub); st.add_vertex(b)
		st.set_normal(nrm); st.set_uv(uc); st.add_vertex(c)
		st.set_normal(nrm); st.set_uv(ua); st.add_vertex(a)
		st.set_normal(nrm); st.set_uv(uc); st.add_vertex(c)
		st.set_normal(nrm); st.set_uv(ud); st.add_vertex(d)
		count += 2
	# Axis-aligned-in-frame box: centre c, half extents along (r, u, f).
	func box(c: Vector3, r: Vector3, u: Vector3, f: Vector3, hx: float, hy: float, hz: float, uv_scale: float = 0.25) -> void:
		var x := r * hx; var y := u * hy; var z := f * hz
		var p000 := c - x - y - z; var p100 := c + x - y - z; var p010 := c - x + y - z; var p110 := c + x + y - z
		var p001 := c - x - y + z; var p101 := c + x - y + z; var p011 := c - x + y + z; var p111 := c + x + y + z
		var sx := hx * 2.0 * uv_scale; var sy := hy * 2.0 * uv_scale; var sz := hz * 2.0 * uv_scale
		quad(p001, p101, p111, p011, f, Vector2(0, 0), Vector2(sx, 0), Vector2(sx, sy), Vector2(0, sy))
		quad(p100, p000, p010, p110, -f, Vector2(0, 0), Vector2(sx, 0), Vector2(sx, sy), Vector2(0, sy))
		quad(p101, p100, p110, p111, r, Vector2(0, 0), Vector2(sz, 0), Vector2(sz, sy), Vector2(0, sy))
		quad(p000, p001, p011, p010, -r, Vector2(0, 0), Vector2(sz, 0), Vector2(sz, sy), Vector2(0, sy))
		quad(p010, p011, p111, p110, u, Vector2(0, 0), Vector2(sx, 0), Vector2(sx, sz), Vector2(0, sz))
		quad(p001, p000, p100, p101, -u, Vector2(0, 0), Vector2(sx, 0), Vector2(sx, sz), Vector2(0, sz))
	func commit(parent: Node3D, name: String, with_tangents: bool = true) -> MeshInstance3D:
		if count == 0:
			return null
		st.index()
		if with_tangents:
			st.generate_tangents()
		var mesh := st.commit()
		mesh.surface_set_material(0, mat)
		var mi := MeshInstance3D.new()
		mi.name = name
		mi.mesh = mesh
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		parent.add_child(mi)
		return mi


func _build_track_meshes() -> void:
	var root := Node3D.new()
	root.name = "TrackMesh"
	add_child(root)
	var neon: Color = theme["neon"]
	var neon2: Color = theme["neon2"]
	var road_mat := Mats.pbr(theme["road"], theme["road_tint"], Vector3.ONE, 0.0, Color.WHITE, true)
	var wall_mat := Mats.pbr(theme["wall"], Color(1.0, 1.0, 1.05))
	var under_mat := Mats.pbr(theme["under"], Color(0.35, 0.35, 0.4))
	var tunnel_mat := Mats.pbr(theme["tunnel"], Color(0.75, 0.75, 0.8))
	tunnel_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	var kerb_mat := Mats.sprite("trim_lights_emission", neon * Color(1.3, 1.3, 1.3), true, false)
	var rail_mat := Mats.glow(neon, 2.5, false)
	var rail2_mat := Mats.glow(neon2, 2.5, false)
	var gate_mat := Mats.pbr("trim_misc_2", Color(0.7, 0.7, 0.75))
	var road_tile: float = theme["road_tile"]
	var step := length / n
	var chunk_start := 0
	while chunk_start < n:
		var road := Builder.new(road_mat)
		var wall := Builder.new(wall_mat)
		var under := Builder.new(under_mat)
		var kerb := Builder.new(kerb_mat)
		var rail := Builder.new(rail_mat)
		var rail2 := Builder.new(rail2_mat)
		var tun := Builder.new(tunnel_mat)
		var gate := Builder.new(gate_mat)
		var last := mini(chunk_start + CHUNK, n)
		for i in range(chunk_start, last):
			var j := (i + 1) % n
			var s0 := i * step
			var s1 := s0 + step
			_segment(i, j, s0, s1, road, wall, under, kerb, rail, tun, road_tile)
		# Gates every 160 m, the start gantry at 0.
		var gs := 160.0
		var g := 0.0
		while g < length:
			var gi := int(floorf(g / step))
			if gi >= chunk_start and gi < last:
				_gate(gi, g < 1.0, gate, rail2 if g > 1.0 else rail)
			g += gs
		var holder := Node3D.new()
		holder.name = "Chunk%d" % (chunk_start / CHUNK)
		root.add_child(holder)
		road.commit(holder, "Road")
		wall.commit(holder, "Wall")
		under.commit(holder, "Under")
		kerb.commit(holder, "Kerb")
		rail.commit(holder, "Rail", false)
		rail2.commit(holder, "Rail2", false)
		tun.commit(holder, "Tunnel")
		gate.commit(holder, "Gate")
		chunk_start += CHUNK
	_build_pad_meshes(root)


func _segment(i: int, j: int, s0: float, s1: float, road: Builder, wall: Builder, under: Builder,
		kerb: Builder, rail: Builder, tun: Builder, road_tile: float) -> void:
	var p0 := pos[i]; var p1 := pos[j]
	var r0 := right[i]; var r1 := right[j]
	var u0 := up[i]; var u1 := up[j]
	var f0 := fwd[i]; var f1 := fwd[j]
	var h0 := width[i] * 0.5; var h1 := width[j] * 0.5
	var v0 := s0 / road_tile; var v1 := s1 / road_tile
	# Road surface (between the kerbs).
	var kw := KERB_W
	var a := p0 - r0 * (h0 - kw); var b := p0 + r0 * (h0 - kw)
	var c := p1 + r1 * (h1 - kw); var d := p1 - r1 * (h1 - kw)
	var uw := (h0 * 2.0 - 2.0 * kw) / road_tile
	road.quad(a, b, c, d, (u0 + u1).normalized(), Vector2(v0, 0), Vector2(v0, uw), Vector2(v1, uw), Vector2(v1, 0))
	# Kerbs (neon trim texture, hex lights running along the track).
	var kv0 := s0 / 4.0; var kv1 := s1 / 4.0
	var lift := 0.03
	kerb.quad(p0 - r0 * h0 + u0 * lift, a + u0 * lift, d + u1 * lift, p1 - r1 * h1 + u1 * lift, u0,
		Vector2(0, kv0), Vector2(1, kv0), Vector2(1, kv1), Vector2(0, kv1))
	kerb.quad(b + u0 * lift, p0 + r0 * h0 + u0 * lift, p1 + r1 * h1 + u1 * lift, c + u1 * lift, u0,
		Vector2(0, kv0), Vector2(1, kv0), Vector2(1, kv1), Vector2(0, kv1))
	# Walls: inner faces lean 0.5 m outwards. Wall texture 4 m per tile.
	var wv0 := s0 / 4.0; var wv1 := s1 / 4.0
	var l0 := p0 - r0 * h0; var l1 := p1 - r1 * h1
	var rr0 := p0 + r0 * h0; var rr1 := p1 + r1 * h1
	var lt0 := l0 + u0 * WALL_H - r0 * 0.5; var lt1 := l1 + u1 * WALL_H - r1 * 0.5
	var rt0 := rr0 + u0 * WALL_H + r0 * 0.5; var rt1 := rr1 + u1 * WALL_H + r1 * 0.5
	wall.quad(l0, lt0, lt1, l1, r0, Vector2(wv0, 0), Vector2(wv0, 0.65), Vector2(wv1, 0.65), Vector2(wv1, 0))
	wall.quad(rr0, rt0, rt1, rr1, -r0, Vector2(wv0, 0), Vector2(wv0, 0.65), Vector2(wv1, 0.65), Vector2(wv1, 0))
	# Outer wall faces and slab underside (visible on bridges and banking).
	var lb0 := l0 - u0 * 1.8 - r0 * 0.6; var lb1 := l1 - u1 * 1.8 - r1 * 0.6
	var rb0 := rr0 - u0 * 1.8 + r0 * 0.6; var rb1 := rr1 - u1 * 1.8 + r1 * 0.6
	under.quad(lb0, lt0, lt1, lb1, -r0, Vector2(wv0, 0), Vector2(wv0, 1.1), Vector2(wv1, 1.1), Vector2(wv1, 0))
	under.quad(rb0, rt0, rt1, rb1, r0, Vector2(wv0, 0), Vector2(wv0, 1.1), Vector2(wv1, 1.1), Vector2(wv1, 0))
	under.quad(lb0, rb0, rb1, lb1, -u0, Vector2(wv0, 0), Vector2(wv0, h0 * 0.5), Vector2(wv1, h0 * 0.5), Vector2(wv1, 0))
	# Neon rails on top of the walls.
	var rlt0 := lt0 + u0 * RAIL_H; var rlt1 := lt1 + u1 * RAIL_H
	var rrt0 := rt0 + u0 * RAIL_H; var rrt1 := rt1 + u1 * RAIL_H
	var z := Vector2.ZERO
	rail.quad(lt0, rlt0, rlt1, lt1, r0, z, z, z, z)
	rail.quad(lt0 - r0 * 0.35, rlt0 - r0 * 0.35, rlt1 - r1 * 0.35, lt1 - r1 * 0.35, -r0, z, z, z, z)
	rail.quad(rlt0 - r0 * 0.35, rlt0, rlt1, rlt1 - r1 * 0.35, u0, z, z, z, z)
	rail.quad(rt0, rrt0, rrt1, rt1, -r0, z, z, z, z)
	rail.quad(rt0 + r0 * 0.35, rrt0 + r0 * 0.35, rrt1 + r1 * 0.35, rt1 + r1 * 0.35, r0, z, z, z, z)
	rail.quad(rrt0, rrt0 + r0 * 0.35, rrt1 + r1 * 0.35, rrt1, u0, z, z, z, z)
	# Tunnel arch.
	var t0 := tunnel[i]; var t1 := tunnel[j]
	if t0 > 0.02 or t1 > 0.02:
		var segs := 7
		var tv0 := s0 / 8.0; var tv1 := s1 / 8.0
		for k in segs:
			var a0 := PI * float(k) / segs
			var a1 := PI * float(k + 1) / segs
			var q00 := _arch_point(p0, r0, u0, h0, t0, a0)
			var q01 := _arch_point(p0, r0, u0, h0, t0, a1)
			var q10 := _arch_point(p1, r1, u1, h1, t1, a0)
			var q11 := _arch_point(p1, r1, u1, h1, t1, a1)
			var nrm := ((p0 + u0 * (WALL_H + 3.0)) - (q00 + q01) * 0.5).normalized()
			tun.quad(q00, q01, q11, q10, nrm, Vector2(tv0, float(k) * 0.5), Vector2(tv0, float(k + 1) * 0.5),
				Vector2(tv1, float(k + 1) * 0.5), Vector2(tv1, float(k) * 0.5))
		# Ceiling light strip.
		var top0 := _arch_point(p0, r0, u0, h0, t0, PI * 0.5) - u0 * 0.15
		var top1 := _arch_point(p1, r1, u1, h1, t1, PI * 0.5) - u1 * 0.15
		rail.quad(top0 - r0 * 0.5, top0 + r0 * 0.5, top1 + r1 * 0.5, top1 - r1 * 0.5, -u0, z, z, z, z)


func _arch_point(p: Vector3, r: Vector3, u: Vector3, half: float, t: float, a: float) -> Vector3:
	var c := p + u * WALL_H
	var rx := half + 0.6
	var ry := (half * 0.7 + 2.0) * t
	return c - r * cos(a) * rx + u * sin(a) * ry


func _gate(i: int, is_start: bool, gate: Builder, glow: Builder) -> void:
	var p := pos[i]; var r := right[i]; var u := up[i]; var f := fwd[i]
	var half := width[i] * 0.5
	var gh := 12.0 if is_start else 9.0
	var post_x := half + 2.2
	gate.box(p + r * post_x + u * gh * 0.5, r, u, f, 0.8, gh * 0.5, 0.8)
	gate.box(p - r * post_x + u * gh * 0.5, r, u, f, 0.8, gh * 0.5, 0.8)
	gate.box(p + u * gh, r, u, f, post_x + 0.8, 0.7, 0.8)
	glow.box(p + u * (gh - 0.9), r, u, f, post_x - 0.2, 0.18, 0.45)
	if is_start:
		glow.box(p + u * (gh + 0.9), r, u, f, post_x - 0.2, 0.18, 0.45)
		glow.box(p + r * (post_x - 1.0) + u * gh * 0.5, r, u, f, 0.15, gh * 0.5, 0.15)
		glow.box(p - r * (post_x - 1.0) + u * gh * 0.5, r, u, f, 0.15, gh * 0.5, 0.15)


func _build_pad_meshes(root: Node3D) -> void:
	_pad_mats.clear()
	var boost_mat := Mats.sprite("arrow", theme["neon"], true, false)
	var weap_mat := Mats.sprite("trim_lights_emission", theme["neon2"], true, false)
	_pad_mats = [boost_mat, weap_mat]
	var b := Builder.new(boost_mat)
	var w := Builder.new(weap_mat)
	var lift := 0.08
	for p in pads:
		var s: float = p["s"]
		var segs := 6
		for k in segs:
			var sa: float = s + p["len"] * float(k) / segs
			var sb: float = s + p["len"] * float(k + 1) / segs
			var xa: float = p["x"] - p["w"] * 0.5
			var xb: float = p["x"] + p["w"] * 0.5
			var pa := point(sa, xa, lift); var pb := point(sa, xb, lift)
			var pc := point(sb, xb, lift); var pd := point(sb, xa, lift)
			var u := xform(sa).basis.y
			if p["type"] == "boost":
				var va := float(k) / segs * 2.0
				var vb := float(k + 1) / segs * 2.0
				# Arrow points along +u of the texture; map so it points forward.
				b.quad(pa, pb, pc, pd, u, Vector2(va, 1), Vector2(va, 0), Vector2(vb, 0), Vector2(vb, 1))
			else:
				var tiles: float = p["w"] / 6.0
				w.quad(pa, pb, pc, pd, u, Vector2(0, float(k) / segs), Vector2(tiles, float(k) / segs),
					Vector2(tiles, float(k + 1) / segs), Vector2(0, float(k + 1) / segs))
	b.commit(root, "BoostPads", false)
	w.commit(root, "WeaponPads", false)


# ------------------------------------------------------------ environment ---

func _build_environment() -> void:
	_env = WorldEnvironment.new()
	var env := Environment.new()
	var sky := Sky.new()
	var sm := PanoramaSkyMaterial.new()
	sm.panorama = Mats.sky_tex(theme["sky"])
	sm.energy_multiplier = theme["sky_energy"]
	sm.filter = true
	sky.sky_material = sm
	sky.radiance_size = Sky.RADIANCE_SIZE_128
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.sky_rotation = Vector3(0, theme["sky_rot"], 0)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = theme["ambient"]
	env.ambient_light_energy = theme["ambient_energy"]
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.0
	env.tonemap_white = 4.0
	env.fog_enabled = true
	env.fog_mode = Environment.FOG_MODE_EXPONENTIAL
	env.fog_light_color = theme["fog"]
	env.fog_density = theme["fog_density"]
	env.fog_sky_affect = 0.15
	env.fog_aerial_perspective = 0.4
	env.glow_enabled = true
	env.glow_intensity = 0.45
	env.glow_bloom = 0.0
	env.glow_hdr_threshold = 1.25
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_ADDITIVE
	env.set("glow_levels/3", 0.6)
	env.set("glow_levels/5", 0.8)
	_env.environment = env
	add_child(_env)
	_sun = DirectionalLight3D.new()
	_sun.light_color = theme["sun_color"]
	_sun.light_energy = theme["sun_energy"]
	_sun.shadow_enabled = false
	_sun.look_at_from_position(Vector3.ZERO, (theme["sun_dir"] as Vector3).normalized(), Vector3.UP)
	add_child(_sun)


# ---------------------------------------------------------------- terrain ---

var _noise := FastNoiseLite.new()
var _near := {}  # cell -> true when a track sample is within ~2 cells
const CELL := 30.0


func terrain_height(x: float, z: float) -> float:
	var base: float = theme["terrain_y"]
	var h := _noise.get_noise_2d(x * 0.6, z * 0.6) * 34.0 + _noise.get_noise_2d(x * 2.5, z * 2.5) * 6.0
	if theme["terrain"] == "water":
		return base
	return base + h


func _cell(x: float, z: float) -> Vector2i:
	return Vector2i(int(floorf(x / CELL)), int(floorf(z / CELL)))


func _mark_near() -> void:
	_near.clear()
	var i := 0
	while i < n:
		var c := _cell(pos[i].x, pos[i].z)
		for dx in range(-2, 3):
			for dz in range(-2, 3):
				_near[Vector2i(c.x + dx, c.y + dz)] = true
		i += 6


func near_track(x: float, z: float) -> bool:
	return _near.has(_cell(x, z))


func _build_terrain() -> void:
	_noise.seed = hash(def["id"])
	_noise.frequency = 0.01
	_noise.fractal_octaves = 3
	_mark_near()
	var kind: String = theme["terrain"]
	var mi := MeshInstance3D.new()
	mi.name = "Terrain"
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	if kind == "water":
		var pm := PlaneMesh.new()
		pm.size = Vector2(5000, 5000)
		pm.subdivide_depth = 1
		pm.subdivide_width = 1
		mi.mesh = pm
		mi.position = Vector3(0, theme["terrain_y"], 0)
		var sh := ShaderMaterial.new()
		sh.shader = _water_shader()
		sh.set_shader_parameter("normal1", Mats.tex("water_normal"))
		sh.set_shader_parameter("normal2", Mats.tex("water_normal2"))
		sh.set_shader_parameter("color", Color(0.03, 0.09, 0.14))
		sh.set_shader_parameter("sun_color", theme["sun_color"])
		mi.material_override = sh
		add_child(mi)
		return
	# Heightfield around the circuit, carved down where the track passes.
	var size := 2600.0
	var cells := 88
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var cs := size / cells
	var heights := PackedFloat32Array()
	heights.resize((cells + 1) * (cells + 1))
	var lowest := 1e9
	for i in n:
		lowest = minf(lowest, pos[i].y)
	for iz in cells + 1:
		for ix in cells + 1:
			var x := -size * 0.5 + ix * cs
			var z := -size * 0.5 + iz * cs
			var h := terrain_height(x, z)
			if near_track(x, z):
				h = minf(h, lowest - 16.0)
			heights[iz * (cells + 1) + ix] = h
	var tile := 40.0
	for iz in cells:
		for ix in cells:
			var x0 := -size * 0.5 + ix * cs; var x1 := x0 + cs
			var z0 := -size * 0.5 + iz * cs; var z1 := z0 + cs
			var a := Vector3(x0, heights[iz * (cells + 1) + ix], z0)
			var b := Vector3(x1, heights[iz * (cells + 1) + ix + 1], z0)
			var c := Vector3(x1, heights[(iz + 1) * (cells + 1) + ix + 1], z1)
			var d := Vector3(x0, heights[(iz + 1) * (cells + 1) + ix], z1)
			var n1 := (b - a).cross(d - a).normalized()
			if n1.y < 0.0:
				n1 = -n1
			for v in [[a, Vector2(x0, z0)], [d, Vector2(x0, z1)], [c, Vector2(x1, z1)], [a, Vector2(x0, z0)], [c, Vector2(x1, z1)], [b, Vector2(x1, z0)]]:
				st.set_normal(n1)
				st.set_uv(v[1] / tile)
				st.add_vertex(v[0])
	st.index()
	st.generate_tangents()
	var mesh := st.commit()
	var mat: Material
	if kind == "lava":
		_lava_mat = StandardMaterial3D.new()
		_lava_mat.albedo_texture = Mats.tex("lava_albedo")
		_lava_mat.emission_enabled = true
		_lava_mat.emission_texture = Mats.tex("lava_albedo")
		_lava_mat.emission = Color(1.0, 0.55, 0.25)
		_lava_mat.emission_energy_multiplier = 1.6
		_lava_mat.roughness = 0.9
		_lava_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		mat = _lava_mat
	else:
		mat = Mats.simple(kind, Color(1.0, 1.0, 1.0), Vector3.ONE, 0.35, 0.05)
	mesh.surface_set_material(0, mat)
	mi.mesh = mesh
	add_child(mi)


func _water_shader() -> Shader:
	var sh := Shader.new()
	sh.code = """
shader_type spatial;
uniform sampler2D normal1 : hint_normal, filter_linear_mipmap, repeat_enable;
uniform sampler2D normal2 : hint_normal, filter_linear_mipmap, repeat_enable;
uniform vec4 color : source_color = vec4(0.03, 0.09, 0.14, 1.0);
uniform vec4 sun_color : source_color = vec4(1.0);
varying vec3 wpos;
void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	vec2 uv = wpos.xz / 18.0;
	vec3 n1 = texture(normal1, uv + vec2(TIME * 0.025, TIME * 0.015)).rgb;
	vec3 n2 = texture(normal2, uv * 1.9 - vec2(TIME * 0.02, TIME * 0.028)).rgb;
	NORMAL_MAP = normalize(mix(n1, n2, 0.5) * 2.0 - 1.0) * 0.5 + 0.5;
	NORMAL_MAP_DEPTH = 0.8;
	ALBEDO = color.rgb;
	ROUGHNESS = 0.06;
	METALLIC = 0.15;
	SPECULAR = 0.8;
}
"""
	return sh


# -------------------------------------------------------------- buildings ---

func _building_shader() -> Shader:
	var sh := Shader.new()
	sh.code = """
shader_type spatial;
uniform sampler2D albedo_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D normal_tex : hint_normal, filter_linear_mipmap, repeat_enable;
uniform sampler2D emission_tex : source_color, filter_linear_mipmap, repeat_enable, hint_default_black;
uniform vec4 tint : source_color = vec4(1.0);
uniform vec4 emission_color : source_color = vec4(1.0);
uniform float emission_energy = 2.0;
uniform float rough = 0.6;
uniform float metal = 0.3;
varying vec2 uv_s;
varying float glow;
void vertex() {
	uv_s = UV * INSTANCE_CUSTOM.xy;
	glow = INSTANCE_CUSTOM.z;
}
void fragment() {
	ALBEDO = texture(albedo_tex, uv_s).rgb * tint.rgb;
	NORMAL_MAP = texture(normal_tex, uv_s).rgb;
	EMISSION = texture(emission_tex, uv_s).rgb * emission_color.rgb * emission_energy * glow;
	ROUGHNESS = rough;
	METALLIC = metal;
}
"""
	return sh


# Unit box with per-face 0..1 UVs (u along the face width, v up).
static func _unit_box() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var faces := [
		[Vector3(0, 0, 1), Vector3(1, 0, 0), Vector3(0, 1, 0)],
		[Vector3(0, 0, -1), Vector3(-1, 0, 0), Vector3(0, 1, 0)],
		[Vector3(1, 0, 0), Vector3(0, 0, -1), Vector3(0, 1, 0)],
		[Vector3(-1, 0, 0), Vector3(0, 0, 1), Vector3(0, 1, 0)],
		[Vector3(0, 1, 0), Vector3(1, 0, 0), Vector3(0, 0, -1)],
	]
	for f in faces:
		var nrm: Vector3 = f[0]; var ax: Vector3 = f[1]; var ay: Vector3 = f[2]
		var c := nrm * 0.5
		var a := c - ax * 0.5 - ay * 0.5; var b := c + ax * 0.5 - ay * 0.5
		var cc := c + ax * 0.5 + ay * 0.5; var d := c - ax * 0.5 + ay * 0.5
		for v in [[a, Vector2(0, 1)], [b, Vector2(1, 1)], [cc, Vector2(1, 0)], [a, Vector2(0, 1)], [cc, Vector2(1, 0)], [d, Vector2(0, 0)]]:
			st.set_normal(nrm); st.set_uv(v[1]); st.add_vertex(v[0])
	st.index()
	st.generate_tangents()
	return st.commit()


func _build_buildings() -> void:
	var kinds: Array = theme["buildings"]
	var count: int = theme["building_count"]
	if Quality.lightweight():
		count = int(count * 0.8)
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(def["id"]) + 7
	var box := _unit_box()
	var groups := {}
	for k in kinds:
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.use_custom_data = true
		mm.mesh = box
		groups[k] = {"mm": mm, "items": []}
	var attempts := 0
	var placed := 0
	var lowest := 1e9
	var highest := -1e9
	for i in n:
		lowest = minf(lowest, pos[i].y)
		highest = maxf(highest, pos[i].y)
	while placed < count and attempts < count * 40:
		attempts += 1
		var i := rng.randi_range(0, n - 1)
		var side := 1.0 if rng.randf() < 0.5 else -1.0
		var dist := rng.randf_range(38.0, 150.0)
		var p := pos[i] + right[i] * side * dist
		p.y = 0.0
		if near_track(p.x, p.z):
			continue
		var kind: String = kinds[rng.randi_range(0, kinds.size() - 1)]
		var w := rng.randf_range(14.0, 40.0)
		var d := rng.randf_range(14.0, 40.0)
		var h := rng.randf_range(18.0, 110.0)
		if kind == "container":
			h = rng.randf_range(8.0, 22.0)
			w = rng.randf_range(20.0, 50.0)
		var ground := terrain_height(p.x, p.z)
		if theme["terrain"] == "water":
			ground = theme["terrain_y"] - 2.0
		var top := ground + h
		# Do not let towers poke through the racing line's sky-bridge zone.
		if top > highest + 40.0 and dist < 60.0:
			h = maxf(10.0, highest + 10.0 - ground)
		var too_close := false
		for g in groups.values():
			for it in g["items"]:
				if not it.has("crown") and it["pos"].distance_to(Vector2(p.x, p.z)) < (it["w"] + w) * 0.6:
					too_close = true
					break
			if too_close:
				break
		if too_close:
			continue
		var rot := rng.randf_range(-0.3, 0.3) + atan2(fwd[i].x, fwd[i].z)
		groups[kind]["items"].append({"pos": Vector2(p.x, p.z), "w": maxf(w, d), "h": h, "d": d, "ground": ground, "rot": rot, "glow": rng.randf_range(0.4, 1.4)})
		placed += 1
		# Taller towers get a narrower crown and an antenna for a skyline.
		if h > 40.0 and rng.randf() < 0.6:
			var cw := w * rng.randf_range(0.4, 0.7)
			var ch := h * rng.randf_range(0.15, 0.4)
			groups[kind]["items"].append({"pos": Vector2(p.x, p.z), "w": cw, "h": ch, "d": d * 0.6, "ground": ground + h, "rot": rot, "glow": rng.randf_range(0.6, 1.6), "crown": true})
			if rng.randf() < 0.5:
				groups[kind]["items"].append({"pos": Vector2(p.x, p.z), "w": 1.2, "h": ch * 1.5, "d": 1.2, "ground": ground + h + ch, "rot": rot, "glow": 3.0, "crown": true})
	for kind in groups.keys():
		var items: Array = groups[kind]["items"]
		if items.is_empty():
			continue
		var mm: MultiMesh = groups[kind]["mm"]
		mm.instance_count = items.size()
		var tile := 12.0
		for k in items.size():
			var it: Dictionary = items[k]
			var b := Basis(Vector3.UP, it["rot"]).scaled(Vector3(it["w"], it["h"], it["d"]))
			var t := Transform3D(b, Vector3(it["pos"].x, it["ground"] + it["h"] * 0.5, it["pos"].y))
			mm.set_instance_transform(k, t)
			mm.set_instance_custom_data(k, Color(it["w"] / tile, it["h"] / tile, it["glow"], 0.0))
		var mmi := MultiMeshInstance3D.new()
		mmi.name = "Buildings_" + kind
		mmi.multimesh = mm
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var sh := ShaderMaterial.new()
		sh.shader = _building_shader()
		match kind:
			"glass":
				sh.set_shader_parameter("albedo_tex", Mats.tex("glass_albedo"))
				sh.set_shader_parameter("normal_tex", Mats.tex("glass_normal"))
				sh.set_shader_parameter("emission_tex", Mats.tex("glass_emission"))
				sh.set_shader_parameter("emission_color", theme["neon"].lerp(Color.WHITE, 0.4))
				sh.set_shader_parameter("emission_energy", 2.2)
				sh.set_shader_parameter("tint", Color(0.8, 0.85, 0.95))
				sh.set_shader_parameter("rough", 0.25)
				sh.set_shader_parameter("metal", 0.6)
			"train":
				sh.set_shader_parameter("albedo_tex", Mats.tex("train_albedo"))
				sh.set_shader_parameter("normal_tex", Mats.tex("train_normal"))
				sh.set_shader_parameter("emission_tex", Mats.tex("trim_lights_emission"))
				sh.set_shader_parameter("emission_color", theme["neon2"])
				sh.set_shader_parameter("emission_energy", 1.2)
				sh.set_shader_parameter("tint", Color(0.9, 0.9, 0.95))
			"tech":
				sh.set_shader_parameter("albedo_tex", Mats.tex("tech_panels_color_albedo"))
				sh.set_shader_parameter("normal_tex", Mats.tex("tech_panels_color_normal"))
				sh.set_shader_parameter("emission_tex", Mats.tex("glass_emission"))
				sh.set_shader_parameter("emission_color", theme["neon2"].lerp(Color.WHITE, 0.3))
				sh.set_shader_parameter("emission_energy", 1.8)
				sh.set_shader_parameter("tint", Color(1.0, 1.0, 1.0))
			_:
				sh.set_shader_parameter("albedo_tex", Mats.tex("container1_albedo"))
				sh.set_shader_parameter("normal_tex", Mats.tex("container1_normal"))
				sh.set_shader_parameter("emission_tex", Mats.tex("trim_lights_emission"))
				sh.set_shader_parameter("emission_color", Color(1.0, 0.8, 0.5))
				sh.set_shader_parameter("emission_energy", 1.0)
				sh.set_shader_parameter("tint", Color(1.0, 1.0, 1.0))
		mmi.material_override = sh
		add_child(mmi)


func _process(delta: float) -> void:
	_time += delta
	var pulse := 0.75 + 0.25 * sin(_time * 6.0)
	for m in _pad_mats:
		m.albedo_color.a = pulse
	if _lava_mat != null:
		_lava_mat.emission_energy_multiplier = 1.4 + 0.4 * sin(_time * 1.3)
