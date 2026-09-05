# A grind rail: a Path3D whose curve is baked, plus a tube mesh, support
# posts and a faint energy pulse. The player finds rails through the "rail"
# group and attaches by nearest baked offset.
class_name Rail
extends Path3D

var aabb := AABB()
var length := 0.0


static func make(points: Array, posts: bool = true, post_to_y: float = -1e9) -> Rail:
	var r := Rail.new()
	r.name = "Rail"
	var c := Curve3D.new()
	c.bake_interval = 0.5
	for i in points.size():
		var p: Vector3 = points[i]
		var prev: Vector3 = points[max(i - 1, 0)]
		var next: Vector3 = points[min(i + 1, points.size() - 1)]
		var t := (next - prev) * 0.25
		c.add_point(p, -t, t)
	r.curve = c
	r.set_meta("posts", posts)
	r.set_meta("post_to_y", post_to_y)
	return r


func _ready() -> void:
	add_to_group("rail")
	length = curve.get_baked_length()
	var pts := curve.get_baked_points()
	if pts.size() > 0:
		aabb = AABB(pts[0], Vector3.ZERO)
		for p in pts:
			aabb = aabb.expand(p)
	aabb.position += global_position
	_build_mesh()


func tangent_at(off: float) -> Vector3:
	var l := curve.get_baked_length()
	var a := curve.sample_baked(clampf(off - 0.3, 0.0, l), true)
	var b := curve.sample_baked(clampf(off + 0.3, 0.0, l), true)
	var t := (b - a)
	if t.length_squared() < 1e-6:
		return Vector3.FORWARD
	return (global_basis * t).normalized()


func _build_mesh() -> void:
	var b := MeshLib.Builder.new()
	var l := curve.get_baked_length()
	var step := 1.0
	var n := int(ceil(l / step))
	var rings := []
	var r := 0.11
	var segs := 8
	for i in n + 1:
		var off := minf(i * step, l)
		var p := curve.sample_baked(off, true)
		var t := (curve.sample_baked(minf(off + 0.5, l), true) - curve.sample_baked(maxf(off - 0.5, 0.0), true)).normalized()
		var side := t.cross(Vector3.UP)
		if side.length_squared() < 1e-4:
			side = Vector3.RIGHT
		side = side.normalized()
		var up := side.cross(t).normalized()
		var ring := []
		for k in segs + 1:
			var a := TAU * float(k) / segs
			ring.append([p + (side * cos(a) + up * sin(a)) * r, (side * cos(a) + up * sin(a)).normalized()])
		rings.append([ring, off])
	for i in n:
		var r0: Array = rings[i][0]
		var r1: Array = rings[i + 1][0]
		var v0: float = rings[i][1]
		var v1: float = rings[i + 1][1]
		for k in segs:
			b.quad_n(r0[k][0], r1[k][0], r1[k + 1][0], r0[k + 1][0], r0[k][1], r1[k][1], r1[k + 1][1], r0[k + 1][1],
				Vector2(float(k) / segs, v0), Vector2(float(k) / segs, v1), Vector2(float(k + 1) / segs, v1), Vector2(float(k + 1) / segs, v0))
	var mi := b.commit(Mats.rail(), "RailMesh")
	add_child(mi)
	# Rounded end caps.
	var caps := MeshLib.Builder.new()
	caps.ellipsoid(curve.sample_baked(0.0, true), Vector3(r * 1.3, r * 1.3, r * 1.3), 8, 6)
	caps.ellipsoid(curve.sample_baked(l, true), Vector3(r * 1.3, r * 1.3, r * 1.3), 8, 6)
	add_child(caps.commit(Mats.pbr(Color(0.9, 0.55, 0.15), 0.4, 0.7), "Caps"))
	# Posts every ~9 m down to the ground / a fixed height.
	if get_meta("posts", true):
		var pb := MeshLib.Builder.new()
		var post_to: float = get_meta("post_to_y", -1e9)
		var off := 3.0
		while off < l - 2.0:
			var p := curve.sample_baked(off, true)
			var bottom_y: float = post_to if post_to > -1e8 else p.y - 6.0
			if bottom_y < p.y - 0.5:
				pb.cylinder(Vector3(p.x, bottom_y, p.z), p - Vector3(0, 0.05, 0), 0.16, 0.10, 8)
				pb.lathe([Vector2(0.0, 0.0), Vector2(0.3, 0.0), Vector2(0.3, 0.08), Vector2(0.14, 0.14)], 10, p - Vector3(0, 0.18, 0))
			off += 9.0
		add_child(pb.commit(Mats.pbr(Color(0.55, 0.58, 0.62), 0.5, 0.8), "Posts"))
