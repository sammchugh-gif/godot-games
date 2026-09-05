# Route baking and road construction.
#
# A route is a list of control points: {p: Vector3, w: width, up: Vector3 or
# null, kind: "ground"|"bridge"|"loop"|"tunnel"|"ramp"|"gap"|"collapse",
# depth: skirt depth}. It is interpolated as a Catmull-Rom spline into
# frames about 1.5 m apart, each with position, forward, up, right, width,
# kind and distance along the route. Explicit up vectors (loops, corkscrew,
# wall run) are slerped between points; elsewhere the up vector is world up
# with a little banking into corners.
#
# From the frames we build the running surface (road shader), the checkered
# skirts, tunnel tubes, and trimesh collision in chunks.
class_name Track
extends RefCounted

const STEP := 1.5

var frames: Array = []          # Array of Dictionary
var length := 0.0


static func cp(p: Vector3, w: float = 12.0, kind: String = "ground", up = null, depth: float = 2.5) -> Dictionary:
	return {"p": p, "w": w, "kind": kind, "up": up, "depth": depth}


# --- Generators for set pieces ---------------------------------------------

# A vertical loop starting at `entry` travelling along `fwd` (horizontal).
# The exit is shifted sideways by `shift` so it clears the entry.
static func loop_points(entry: Vector3, fwd: Vector3, r: float, shift: float, w: float, n: int = 28) -> Array:
	fwd = Vector3(fwd.x, 0, fwd.z).normalized()
	var lat := fwd.cross(Vector3.UP).normalized()
	var c := entry + Vector3.UP * r
	var pts := []
	for i in range(1, n):
		var a := TAU * float(i) / n
		var p := c + fwd * (r * sin(a)) - Vector3.UP * (r * cos(a)) + lat * (shift * float(i) / n)
		var up := (c + lat * (shift * float(i) / n) - p).normalized()
		pts.append(cp(p, w, "loop", up, 1.6))
	return pts


# A corkscrew: the road spirals once around a horizontal axis while moving
# forward `len` metres. Starts and ends upright.
static func corkscrew_points(start: Vector3, fwd: Vector3, len: float, rc: float, w: float, n: int = 30, turns: float = 1.0) -> Array:
	fwd = Vector3(fwd.x, 0, fwd.z).normalized()
	var pts := []
	for i in range(1, n):
		var t := float(i) / n
		var ang := TAU * turns * t
		var axis_p := start + Vector3.UP * rc + fwd * (len * t)
		var off := (-Vector3.UP * rc).rotated(fwd, ang)
		var p := axis_p + off
		var up := (axis_p - p).normalized()
		pts.append(cp(p, w, "loop", up, 1.6))
	return pts


# A wall run: the road rolls `angle` radians onto a wall over `rise` metres,
# holds for `hold` metres and rolls back. `side` = +1 rolls toward the
# right-hand wall.
static func wall_points(start: Vector3, fwd: Vector3, rise: float, hold: float, rc: float, w: float, side: float = 1.0, angle: float = PI * 0.5) -> Array:
	fwd = Vector3(fwd.x, 0, fwd.z).normalized()
	var pts := []
	var total := rise * 2.0 + hold
	var n := int(total / 4.0)
	for i in range(1, n + 1):
		var d := total * float(i) / n
		var ang: float
		if d < rise:
			ang = angle * (d / rise)
		elif d < rise + hold:
			ang = angle
		else:
			ang = angle * (1.0 - (d - rise - hold) / rise)
		var axis_p := start + Vector3.UP * rc + fwd * d
		var off := (-Vector3.UP * rc).rotated(fwd, ang * side)
		var p := axis_p + off
		var up := (axis_p - p).normalized()
		pts.append(cp(p, w, "loop" if ang > 0.05 else "ground", up if ang > 0.02 else null, 8.0))
	return pts


# --- Baking ------------------------------------------------------------------

func bake(points: Array) -> void:
	frames.clear()
	var n := points.size()
	var s := 0.0
	var prev_up := Vector3.UP
	for i in n - 1:
		var p0: Vector3 = points[max(i - 1, 0)]["p"]
		var p1: Vector3 = points[i]["p"]
		var p2: Vector3 = points[i + 1]["p"]
		var p3: Vector3 = points[min(i + 2, n - 1)]["p"]
		var seg_len := p1.distance_to(p2)
		var steps := maxi(int(ceil(seg_len / STEP)), 1)
		for k in steps:
			var u := float(k) / steps
			var pos := _catmull(p0, p1, p2, p3, u)
			var tan := _catmull_tan(p0, p1, p2, p3, u)
			if tan.length_squared() < 1e-6:
				tan = (p2 - p1)
			tan = tan.normalized()
			var w: float = lerpf(points[i]["w"], points[i + 1]["w"], u)
			var depth: float = lerpf(points[i]["depth"], points[i + 1]["depth"], u)
			var ka: String = points[i]["kind"]
			var kb: String = points[i + 1]["kind"]
			var kind := ka
			if ka == "gap" or kb == "gap":
				kind = "gap"            # nothing is built across a gap
			elif ka == "collapse" and kb != "collapse":
				kind = kb               # planks stop at the last collapse point
			elif kb == "collapse" and ka != "collapse":
				kind = ka
			elif u > 0.5 and kb != ka and kb in ["loop", "tunnel"]:
				kind = kb
			var up_a = points[i]["up"]
			var up_b = points[i + 1]["up"]
			var up: Vector3
			if up_a != null and up_b != null:
				up = _slerp_dir(up_a, up_b, u)
			elif up_a != null:
				up = _slerp_dir(up_a, Vector3.UP, smoothstep(0.0, 1.0, u))
			elif up_b != null:
				up = _slerp_dir(Vector3.UP, up_b, smoothstep(0.0, 1.0, u))
			else:
				up = Vector3.UP
			# Orthonormalise against the tangent.
			var right := tan.cross(up)
			if right.length_squared() < 1e-5:
				right = tan.cross(prev_up)
				if right.length_squared() < 1e-5:
					right = Vector3.RIGHT
			right = right.normalized()
			up = right.cross(tan).normalized()
			if frames.size() > 0:
				s += pos.distance_to(frames[frames.size() - 1]["p"])
			frames.append({"p": pos, "f": tan, "u": up, "r": right, "w": w, "kind": kind, "s": s, "depth": depth, "ao": 1.0})
			prev_up = up
	# Last point.
	var last: Dictionary = points[n - 1]
	var lp: Vector3 = last["p"]
	var lf: Vector3 = (lp - frames[frames.size() - 1]["p"]).normalized()
	var lu: Vector3 = Vector3.UP if last["up"] == null else last["up"]
	var lr := lf.cross(lu).normalized()
	lu = lr.cross(lf).normalized()
	s += lp.distance_to(frames[frames.size() - 1]["p"])
	frames.append({"p": lp, "f": lf, "u": lu, "r": lr, "w": last["w"], "kind": last["kind"], "s": s, "depth": last["depth"], "ao": 1.0})
	length = s
	# Banking on flat ground: roll into corners by curvature.
	for i in range(1, frames.size() - 1):
		var fr: Dictionary = frames[i]
		if fr["kind"] != "ground" and fr["kind"] != "bridge":
			continue
		var f0: Vector3 = frames[i - 1]["f"]
		var f1: Vector3 = frames[i + 1]["f"]
		var turn := f0.cross(f1).y
		var bank := clampf(turn * 4.0, -0.22, 0.22)
		if absf(bank) > 0.001:
			var f: Vector3 = fr["f"]
			var up: Vector3 = (fr["u"] as Vector3).rotated(f, -bank)
			var right := f.cross(up).normalized()
			fr["u"] = right.cross(f).normalized()
			fr["r"] = right
	# Smooth the banking so it does not jitter.
	for pass_i in 3:
		for i in range(1, frames.size() - 1):
			var fr: Dictionary = frames[i]
			if fr["kind"] != "ground" and fr["kind"] != "bridge":
				continue
			var u: Vector3 = ((frames[i - 1]["u"] as Vector3) + (fr["u"] as Vector3) * 2.0 + (frames[i + 1]["u"] as Vector3)).normalized()
			var f: Vector3 = fr["f"]
			var right := f.cross(u).normalized()
			fr["u"] = right.cross(f).normalized()
			fr["r"] = right
	# Tunnel AO: darken vertex colour inside tunnels with a ramp at the mouths.
	for i in frames.size():
		var fr: Dictionary = frames[i]
		if fr["kind"] == "tunnel":
			var d_in := 1e9
			for j in range(max(i - 12, 0), min(i + 12, frames.size() - 1) + 1):
				if frames[j]["kind"] != "tunnel":
					d_in = minf(d_in, absf(float(fr["s"]) - float(frames[j]["s"])))
			fr["ao"] = lerpf(0.35, 1.0, clampf(1.0 - d_in / 14.0, 0.0, 1.0)) if d_in < 1e8 else 0.35


func _slerp_dir(a: Vector3, b: Vector3, t: float) -> Vector3:
	a = a.normalized()
	b = b.normalized()
	var d := clampf(a.dot(b), -1.0, 1.0)
	if d > 0.9995:
		return a.lerp(b, t).normalized()
	if d < -0.9995:
		var axis := a.cross(Vector3.RIGHT)
		if axis.length_squared() < 1e-5:
			axis = a.cross(Vector3.FORWARD)
		return a.rotated(axis.normalized(), PI * t)
	var ang := acos(d)
	var axis2 := a.cross(b).normalized()
	return a.rotated(axis2, ang * t)


static func _catmull(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, t: float) -> Vector3:
	var t2 := t * t
	var t3 := t2 * t
	return 0.5 * ((2.0 * p1) + (-p0 + p2) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2 + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3)


static func _catmull_tan(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, t: float) -> Vector3:
	var t2 := t * t
	return 0.5 * ((-p0 + p2) + 2.0 * (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t + 3.0 * (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t2)


func frame_at(dist: float) -> Dictionary:
	var lo := 0
	var hi := frames.size() - 1
	dist = clampf(dist, 0.0, length)
	while hi - lo > 1:
		var mid := (lo + hi) >> 1
		if float(frames[mid]["s"]) <= dist:
			lo = mid
		else:
			hi = mid
	var a: Dictionary = frames[lo]
	var b: Dictionary = frames[hi]
	var t := 0.0
	var ds := float(b["s"]) - float(a["s"])
	if ds > 1e-4:
		t = clampf((dist - float(a["s"])) / ds, 0.0, 1.0)
	return {
		"p": (a["p"] as Vector3).lerp(b["p"], t),
		"f": (a["f"] as Vector3).lerp(b["f"], t).normalized(),
		"u": (a["u"] as Vector3).lerp(b["u"], t).normalized(),
		"r": (a["r"] as Vector3).lerp(b["r"], t).normalized(),
		"w": lerpf(a["w"], b["w"], t),
		"kind": a["kind"],
		"s": dist,
	}


# World position at distance `dist`, lateral offset `lat` (metres, + = right)
# and height `h` above the surface.
func pos_at(dist: float, lat: float = 0.0, h: float = 0.0) -> Vector3:
	var fr := frame_at(dist)
	return (fr["p"] as Vector3) + (fr["r"] as Vector3) * lat + (fr["u"] as Vector3) * h


func fwd_at(dist: float) -> Vector3:
	return frame_at(dist)["f"]


func up_at(dist: float) -> Vector3:
	return frame_at(dist)["u"]


func right_at(dist: float) -> Vector3:
	return frame_at(dist)["r"]


# Distance along the route of the frame nearest to a world point.
func dist_of(p: Vector3) -> float:
	var best := 1e18
	var bs := 0.0
	for fr in frames:
		var d: float = (fr["p"] as Vector3).distance_squared_to(p)
		if d < best:
			best = d
			bs = fr["s"]
	return bs


# --- Geometry ----------------------------------------------------------------

# Builds road meshes + colliders under `parent`. Frames with kind "gap" or
# "collapse" are skipped (something else fills them).
func build(parent: Node3D) -> void:
	var chunk := 70
	var i := 0
	var n := frames.size()
	while i < n - 1:
		var j := mini(i + chunk, n - 1)
		_build_chunk(parent, i, j)
		i = j


func _build_chunk(parent: Node3D, i0: int, i1: int) -> void:
	var top := MeshLib.Builder.new()
	var side := MeshLib.Builder.new()
	var tube := MeshLib.Builder.new()
	var any_top := false
	var any_side := false
	var any_tube := false
	for i in range(i0, i1):
		var a: Dictionary = frames[i]
		var b: Dictionary = frames[i + 1]
		if a["kind"] in ["gap", "collapse"] or b["kind"] in ["gap", "collapse"]:
			continue
		var ap: Vector3 = a["p"]
		var bp: Vector3 = b["p"]
		var ar: Vector3 = a["r"]
		var br: Vector3 = b["r"]
		var au: Vector3 = a["u"]
		var bu: Vector3 = b["u"]
		var aw: float = a["w"] * 0.5
		var bw: float = b["w"] * 0.5
		var ad: float = a["depth"]
		var bd: float = b["depth"]
		var ca := Color(a["ao"], 0, 0)
		var cb := Color(b["ao"], 0, 0)
		var sa: float = a["s"]
		var sb: float = b["s"]
		# Top surface with a slight crown: the centre sits 6 cm above the edges.
		var segs := 6
		for k in segs:
			var t0 := float(k) / segs
			var t1 := float(k + 1) / segs
			var x0 := lerpf(-1.0, 1.0, t0)
			var x1 := lerpf(-1.0, 1.0, t1)
			var c0 := (1.0 - x0 * x0) * 0.06
			var c1 := (1.0 - x1 * x1) * 0.06
			var p00 := ap + ar * (aw * x0) + au * c0
			var p01 := ap + ar * (aw * x1) + au * c1
			var p10 := bp + br * (bw * x0) + bu * c0
			var p11 := bp + br * (bw * x1) + bu * c1
			top.quad_n(p00, p01, p11, p10, au, au, bu, bu,
				Vector2(t0, sa), Vector2(t1, sa), Vector2(t1, sb), Vector2(t0, sb), ca, ca, cb, cb)
			any_top = true
		# Skirts and bottom.
		var l0 := ap - ar * aw
		var r0 := ap + ar * aw
		var l1 := bp - br * bw
		var r1 := bp + br * bw
		var l0d := l0 - au * ad
		var r0d := r0 - au * ad
		var l1d := l1 - bu * bd
		var r1d := r1 - bu * bd
		var ao_c := Color(0.75, 0, 0)
		side.quad_n(l0, l1, l1d, l0d, -ar, -br, -br, -ar, Vector2(0, sa), Vector2(0, sb), Vector2(1, sb), Vector2(1, sa), ca, cb, ao_c, ao_c)
		side.quad_n(r0, r0d, r1d, r1, ar, ar, br, br, Vector2(0, sa), Vector2(1, sa), Vector2(1, sb), Vector2(0, sb), ca, ao_c, ao_c, cb)
		any_side = true
		if a["kind"] in ["loop", "bridge", "ramp"] or b["kind"] in ["loop", "bridge", "ramp"] or ad > 5.0:
			side.quad_n(l0d, l1d, r1d, r0d, -au, -bu, -bu, -au, Vector2(0, sa), Vector2(0, sb), Vector2(1, sb), Vector2(1, sa), ao_c, ao_c, ao_c, ao_c)
		# Tunnel tube: an arch of checkered stone with inward normals.
		if a["kind"] == "tunnel" and b["kind"] == "tunnel":
			var tsegs := 10
			var rad_a := aw * 1.15
			var rad_b := bw * 1.15
			for k in tsegs:
				var a0 := PI * float(k) / tsegs
				var a1 := PI * float(k + 1) / tsegs
				var q00 := ap + ar * (cos(a0) * rad_a) + au * (sin(a0) * rad_a * 0.9 + 0.5)
				var q01 := ap + ar * (cos(a1) * rad_a) + au * (sin(a1) * rad_a * 0.9 + 0.5)
				var q10 := bp + br * (cos(a0) * rad_b) + bu * (sin(a0) * rad_b * 0.9 + 0.5)
				var q11 := bp + br * (cos(a1) * rad_b) + bu * (sin(a1) * rad_b * 0.9 + 0.5)
				var n00 := -(ar * cos(a0) + au * sin(a0))
				var n01 := -(ar * cos(a1) + au * sin(a1))
				var n10 := -(br * cos(a0) + bu * sin(a0))
				var n11 := -(br * cos(a1) + bu * sin(a1))
				var cc_a := Color(float(a["ao"]) * 0.8, 0, 0)
				var cc_b := Color(float(b["ao"]) * 0.8, 0, 0)
				tube.quad_n(q00, q10, q11, q01, n00, n10, n11, n01,
					Vector2(float(k) / tsegs, sa), Vector2(float(k) / tsegs, sb), Vector2(float(k + 1) / tsegs, sb), Vector2(float(k + 1) / tsegs, sa), cc_a, cc_b, cc_b, cc_a)
				any_tube = true
	if any_top:
		var top_mesh := top.commit_mesh()
		var mi := MeshLib.mesh_node(top_mesh, Mats.road())
		mi.name = "Road%d" % i0
		parent.add_child(mi)
		var col := MeshLib.collider(top_mesh, "RoadCol%d" % i0)
		col.collision_layer = 1
		col.set_meta("ground_kind", "road")
		parent.add_child(col)
	if any_side:
		var side_mesh := side.commit_mesh()
		var mi2 := MeshLib.mesh_node(side_mesh, Mats.checker())
		mi2.name = "Skirt%d" % i0
		parent.add_child(mi2)
		var col2 := MeshLib.collider(side_mesh, "SkirtCol%d" % i0)
		col2.collision_layer = 1
		parent.add_child(col2)
	if any_tube:
		var tube_mesh := tube.commit_mesh()
		var mi3 := MeshLib.mesh_node(tube_mesh, Mats.checker(Color(0.45, 0.30, 0.18), Color(0.62, 0.45, 0.28), 2.0))
		mi3.name = "Tunnel%d" % i0
		parent.add_child(mi3)
		var col3 := MeshLib.collider(tube_mesh, "TunnelCol%d" % i0)
		col3.collision_layer = 1
		parent.add_child(col3)
