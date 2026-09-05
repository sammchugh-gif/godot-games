# Small procedural-geometry toolkit shared by the character, the track and
# the props. Everything is emitted through SurfaceTool so we get normals,
# tangents and vertex colours (used for baked AO / sway weights) for free.
class_name MeshLib
extends RefCounted


class Builder:
	var st := SurfaceTool.new()
	var color := Color.WHITE

	func _init() -> void:
		st.begin(Mesh.PRIMITIVE_TRIANGLES)

	func v(p: Vector3, uv: Vector2 = Vector2.ZERO, n: Vector3 = Vector3.ZERO) -> void:
		st.set_color(color)
		st.set_uv(uv)
		if n != Vector3.ZERO:
			st.set_normal(n)
		st.add_vertex(p)

	# Counter-clockwise when seen from the front.
	func tri(a: Vector3, b: Vector3, c: Vector3, ua: Vector2 = Vector2.ZERO, ub: Vector2 = Vector2.ZERO, uc: Vector2 = Vector2.ZERO) -> void:
		var n := (b - a).cross(c - a)
		if n.length_squared() < 1e-12:
			return
		n = n.normalized()
		v(a, ua, n)
		v(b, ub, n)
		v(c, uc, n)

	func quad(a: Vector3, b: Vector3, c: Vector3, d: Vector3, ua: Vector2 = Vector2(0, 0), ub: Vector2 = Vector2(1, 0), uc: Vector2 = Vector2(1, 1), ud: Vector2 = Vector2(0, 1)) -> void:
		tri(a, b, c, ua, ub, uc)
		tri(a, c, d, ua, uc, ud)

	# Smooth quad: caller supplies per-vertex normals.
	func quad_n(a: Vector3, b: Vector3, c: Vector3, d: Vector3, na: Vector3, nb: Vector3, nc: Vector3, nd: Vector3,
			ua: Vector2, ub: Vector2, uc: Vector2, ud: Vector2, ca: Color = Color.WHITE, cb: Color = Color.WHITE, cc: Color = Color.WHITE, cd: Color = Color.WHITE) -> void:
		_cv(a, na, ua, ca); _cv(b, nb, ub, cb); _cv(c, nc, uc, cc)
		_cv(a, na, ua, ca); _cv(c, nc, uc, cc); _cv(d, nd, ud, cd)

	func _cv(p: Vector3, n: Vector3, uv: Vector2, c: Color) -> void:
		st.set_color(c)
		st.set_uv(uv)
		st.set_normal(n)
		st.add_vertex(p)

	func box(center: Vector3, size: Vector3, basis: Basis = Basis.IDENTITY) -> void:
		var h := size * 0.5
		var corners := []
		for i in 8:
			var p := Vector3(
				h.x if (i & 1) else -h.x,
				h.y if (i & 2) else -h.y,
				h.z if (i & 4) else -h.z)
			corners.append(center + basis * p)
		# faces: -x +x -y +y -z +z
		quad(corners[0], corners[4], corners[6], corners[2])
		quad(corners[1], corners[3], corners[7], corners[5])
		quad(corners[0], corners[1], corners[5], corners[4])
		quad(corners[2], corners[6], corners[7], corners[3])
		quad(corners[0], corners[2], corners[3], corners[1])
		quad(corners[4], corners[5], corners[7], corners[6])

	# Solid of revolution around local Y: profile is a list of (radius, y).
	# Smooth normals, UV.x around, UV.y along the profile.
	func lathe(profile: Array, segs: int = 16, center: Vector3 = Vector3.ZERO, basis: Basis = Basis.IDENTITY, caps: bool = true) -> void:
		var n := profile.size()
		var ring_pts := []
		var ring_n := []
		for i in n:
			var pts := []
			var nrm := []
			var r: float = profile[i].x
			var y: float = profile[i].y
			# Profile tangent for smooth normals.
			var prev: Vector2 = profile[max(i - 1, 0)]
			var next: Vector2 = profile[min(i + 1, n - 1)]
			var tang := (next - prev).normalized()
			var nn2 := Vector2(tang.y, -tang.x)
			for k in segs + 1:
				var a := TAU * float(k) / segs
				var c := cos(a)
				var s := sin(a)
				pts.append(center + basis * Vector3(c * r, y, s * r))
				nrm.append((basis * Vector3(c * nn2.x, nn2.y, s * nn2.x)).normalized())
			ring_pts.append(pts)
			ring_n.append(nrm)
		for i in n - 1:
			var v0 := float(i) / (n - 1)
			var v1 := float(i + 1) / (n - 1)
			for k in segs:
				var u0 := float(k) / segs
				var u1 := float(k + 1) / segs
				quad_n(ring_pts[i][k], ring_pts[i + 1][k], ring_pts[i + 1][k + 1], ring_pts[i][k + 1],
					ring_n[i][k], ring_n[i + 1][k], ring_n[i + 1][k + 1], ring_n[i][k + 1],
					Vector2(u0, v0), Vector2(u0, v1), Vector2(u1, v1), Vector2(u1, v0), color, color, color, color)
		if caps:
			if profile[0].x > 0.001:
				var c0: Vector3 = center + basis * Vector3(0, profile[0].y, 0)
				for k in segs:
					tri(c0, ring_pts[0][k], ring_pts[0][k + 1])
			if profile[n - 1].x > 0.001:
				var c1: Vector3 = center + basis * Vector3(0, profile[n - 1].y, 0)
				for k in segs:
					tri(c1, ring_pts[n - 1][k + 1], ring_pts[n - 1][k])

	# Ellipsoid, smooth.
	func ellipsoid(center: Vector3, radii: Vector3, segs: int = 16, rings: int = 12, basis: Basis = Basis.IDENTITY) -> void:
		var prof := []
		for i in rings + 1:
			var t := PI * float(i) / rings
			prof.append(Vector2(sin(t), -cos(t)))
		var pts := []
		for i in rings + 1:
			var row := []
			for k in segs + 1:
				var a := TAU * float(k) / segs
				var p := Vector3(cos(a) * prof[i].x * radii.x, prof[i].y * radii.y, sin(a) * prof[i].x * radii.z)
				row.append(p)
			pts.append(row)
		for i in rings:
			for k in segs:
				var p0: Vector3 = pts[i][k]
				var p1: Vector3 = pts[i + 1][k]
				var p2: Vector3 = pts[i + 1][k + 1]
				var p3: Vector3 = pts[i][k + 1]
				var q := [p0, p1, p2, p3]
				var nq := []
				var wq := []
				for p in q:
					var nn := Vector3(p.x / (radii.x * radii.x), p.y / (radii.y * radii.y), p.z / (radii.z * radii.z))
					nq.append((basis * nn).normalized())
					wq.append(center + basis * p)
				quad_n(wq[0], wq[1], wq[2], wq[3], nq[0], nq[1], nq[2], nq[3],
					Vector2(float(k) / segs, float(i) / rings), Vector2(float(k) / segs, float(i + 1) / rings),
					Vector2(float(k + 1) / segs, float(i + 1) / rings), Vector2(float(k + 1) / segs, float(i) / rings),
					color, color, color, color)

	# A tapered, optionally curved spike: base radius r0 at `from`, tip at `to`.
	# `bend` bows the spine sideways for the swept-back quill shape.
	func spike(from: Vector3, to: Vector3, r0: float, segs: int = 10, steps: int = 6, bend: Vector3 = Vector3.ZERO, r_curve: float = 1.6) -> void:
		var axis := (to - from).normalized()
		var side := axis.cross(Vector3.UP)
		if side.length_squared() < 0.01:
			side = axis.cross(Vector3.RIGHT)
		side = side.normalized()
		var up2 := side.cross(axis).normalized()
		var rings := []
		for i in steps + 1:
			var t := float(i) / steps
			var c := from.lerp(to, t) + bend * sin(t * PI)
			var r := r0 * pow(1.0 - t, 1.0 / r_curve) * (1.0 - t * 0.02)
			if i == steps:
				r = 0.0
			var ring := []
			for k in segs + 1:
				var a := TAU * float(k) / segs
				ring.append(c + (side * cos(a) + up2 * sin(a)) * r)
			rings.append(ring)
		for i in steps:
			for k in segs:
				var p0: Vector3 = rings[i][k]
				var p1: Vector3 = rings[i + 1][k]
				var p2: Vector3 = rings[i + 1][k + 1]
				var p3: Vector3 = rings[i][k + 1]
				var cen_i: Vector3 = from.lerp(to, float(i) / steps) + bend * sin(float(i) / steps * PI)
				var cen_j: Vector3 = from.lerp(to, float(i + 1) / steps) + bend * sin(float(i + 1) / steps * PI)
				var n0 := (p0 - cen_i).normalized() if i < steps else axis
				var n3 := (p3 - cen_i).normalized()
				var n1 := (p1 - cen_j).normalized() if i + 1 < steps else axis
				var n2 := (p2 - cen_j).normalized() if i + 1 < steps else axis
				quad_n(p0, p1, p2, p3, n0, n1, n2, n3,
					Vector2(float(k) / segs, float(i) / steps), Vector2(float(k) / segs, float(i + 1) / steps),
					Vector2(float(k + 1) / segs, float(i + 1) / steps), Vector2(float(k + 1) / segs, float(i) / steps),
					color, color, color, color)
		# Base cap.
		for k in segs:
			tri(from, rings[0][k + 1], rings[0][k])

	func cylinder(from: Vector3, to: Vector3, r0: float, r1: float, segs: int = 12, caps: bool = true) -> void:
		var axis := (to - from)
		var len := axis.length()
		if len < 1e-5:
			return
		axis /= len
		var b := _basis_from_y(axis)
		lathe([Vector2(r0, 0.0), Vector2(r1, len)], segs, from, b, caps)

	func commit(material: Material = null, name: String = "Mesh", tangents: bool = false) -> MeshInstance3D:
		if tangents:
			st.generate_tangents()
		var mesh := st.commit()
		var mi := MeshInstance3D.new()
		mi.mesh = mesh
		mi.name = name
		if material:
			mi.material_override = material
		return mi

	func commit_mesh(tangents: bool = false) -> ArrayMesh:
		if tangents:
			st.generate_tangents()
		return st.commit()

	static func _basis_from_y(y: Vector3) -> Basis:
		var x := y.cross(Vector3.FORWARD)
		if x.length_squared() < 0.01:
			x = y.cross(Vector3.RIGHT)
		x = x.normalized()
		var z := x.cross(y).normalized()
		return Basis(x, y, z)


static func basis_from_y(y: Vector3) -> Basis:
	return Builder._basis_from_y(y)


# Look-at style basis where -Z points along `dir` and Y is as close to `up` as possible.
static func basis_forward(dir: Vector3, up: Vector3 = Vector3.UP) -> Basis:
	dir = dir.normalized()
	var x := up.cross(dir)
	if x.length_squared() < 1e-6:
		x = Vector3.RIGHT
	x = x.normalized()
	var y := dir.cross(x).normalized()
	return Basis(x, y, -dir)


# Trimesh collision from an ArrayMesh (concave; used for the road).
static func collider(mesh: ArrayMesh, name: String = "Col") -> StaticBody3D:
	var body := StaticBody3D.new()
	body.name = name
	var cs := CollisionShape3D.new()
	cs.shape = mesh.create_trimesh_shape()
	body.add_child(cs)
	return body


static func mesh_node(mesh: Mesh, mat: Material, pos: Vector3 = Vector3.ZERO, basis: Basis = Basis.IDENTITY) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = mat
	mi.transform = Transform3D(basis, pos)
	return mi
