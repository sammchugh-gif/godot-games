# Scenery: palms, flowers, grass, boulders, ruins, waterfalls, torches, the
# checkpoint posts and the goal gate. Vegetation is instanced through
# MultiMesh with the foliage shader (wind + player reaction).
class_name Props
extends RefCounted

static var _palm_trunk: ArrayMesh
static var _palm_fronds: ArrayMesh
static var _flower: ArrayMesh
static var _grass: ArrayMesh
static var _rock: ArrayMesh


static func palm_meshes() -> Array:
	if _palm_trunk == null:
		var b := MeshLib.Builder.new()
		b.color = Color(0, 0, 0)
		# Trunk: a chain of tapered cylinders along a gentle S-curve with ring ridges.
		var prev := Vector3.ZERO
		var segs := 9
		for i in segs:
			var t0 := float(i) / segs
			var t1 := float(i + 1) / segs
			var p0 := Vector3(sin(t0 * 1.6) * 1.4, t0 * 9.0, 0)
			var p1 := Vector3(sin(t1 * 1.6) * 1.4, t1 * 9.0, 0)
			b.cylinder(p0, p1, lerpf(0.42, 0.22, t0), lerpf(0.42, 0.22, t1), 10, i == 0)
			# Ridge.
			var mid := p0.lerp(p1, 0.5)
			b.lathe([Vector2(lerpf(0.42, 0.22, t0) * 1.0, -0.06), Vector2(lerpf(0.42, 0.22, t0) * 1.18, 0.0), Vector2(lerpf(0.42, 0.22, t0) * 1.0, 0.06)], 10, mid, MeshLib.basis_from_y((p1 - p0).normalized()), false)
			prev = p1
		# Crown knob and coconuts.
		b.ellipsoid(prev + Vector3(0, 0.1, 0), Vector3(0.45, 0.35, 0.45), 10, 6)
		for k in 3:
			var a := TAU * k / 3.0 + 0.4
			b.ellipsoid(prev + Vector3(cos(a) * 0.4, -0.25, sin(a) * 0.4), Vector3(0.22, 0.25, 0.22), 8, 6)
		_palm_trunk = b.commit_mesh()
		# Fronds: 9 arched strips of leaflets, vertex colour red = sway freedom.
		var f := MeshLib.Builder.new()
		var top := prev + Vector3(0, 0.2, 0)
		for k in 9:
			var a := TAU * float(k) / 9.0 + (0.3 if k % 2 == 0 else 0.0)
			var dir := Vector3(cos(a), 0, sin(a))
			var droop := 0.35 + (0.25 if k % 2 == 0 else 0.0)
			var steps := 7
			var l := 4.6 + (0.6 if k % 3 == 0 else 0.0)
			for s in steps:
				var t0 := float(s) / steps
				var t1 := float(s + 1) / steps
				var c0 := top + dir * (l * t0) + Vector3(0, 1.4 * sin(t0 * 2.2) - droop * 4.0 * t0 * t0, 0)
				var c1 := top + dir * (l * t1) + Vector3(0, 1.4 * sin(t1 * 2.2) - droop * 4.0 * t1 * t1, 0)
				var side := dir.cross(Vector3.UP).normalized()
				var w0 := 0.9 * sin(minf(t0 * 1.3 + 0.2, PI))
				var w1 := 0.9 * sin(minf(t1 * 1.3 + 0.2, PI))
				var sag0 := Vector3(0, -0.35 * w0, 0)
				var sag1 := Vector3(0, -0.35 * w1, 0)
				f.color = Color(t0 * t0, 0, 0)
				var n := (side.cross(c1 - c0)).normalized()
				# Two half-quads meeting at the rib, with per-vertex free weights.
				f.quad_n(c0, c1, c1 + side * w1 + sag1, c0 + side * w0 + sag0, n, n, n, n,
					Vector2(0.5, t0), Vector2(0.5, t1), Vector2(1, t1), Vector2(1, t0),
					Color(t0 * t0, 0, 0), Color(t1 * t1, 0, 0), Color(t1 * t1, 0, 0), Color(t0 * t0, 0, 0))
				f.quad_n(c0 - side * w0 + sag0, c1 - side * w1 + sag1, c1, c0, n, n, n, n,
					Vector2(0, t0), Vector2(0, t1), Vector2(0.5, t1), Vector2(0.5, t0),
					Color(t0 * t0, 0, 0), Color(t1 * t1, 0, 0), Color(t1 * t1, 0, 0), Color(t0 * t0, 0, 0))
		_palm_fronds = f.commit_mesh()
	return [_palm_trunk, _palm_fronds]


static func flower_mesh() -> ArrayMesh:
	if _flower == null:
		var b := MeshLib.Builder.new()
		# Stem + a five-petal head + a centre, as crossed quads that catch light.
		b.color = Color(0.2, 0, 0)
		b.cylinder(Vector3.ZERO, Vector3(0, 0.55, 0), 0.03, 0.02, 5, false)
		for k in 5:
			var a := TAU * float(k) / 5.0
			var d := Vector3(cos(a), 0, sin(a))
			var s := d.cross(Vector3.UP) * 0.10
			var c := Vector3(0, 0.6, 0)
			b.color = Color(1.0, 0, 0)
			b.quad_n(c - s, c + s, c + s + d * 0.24 + Vector3(0, 0.05, 0), c - s + d * 0.24 + Vector3(0, 0.05, 0),
				Vector3.UP, Vector3.UP, Vector3.UP, Vector3.UP, Vector2(0, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0, 1),
				Color(1, 0, 0), Color(1, 0, 0), Color(1, 0, 0), Color(1, 0, 0))
		b.color = Color(1.0, 0, 0)
		b.ellipsoid(Vector3(0, 0.63, 0), Vector3(0.07, 0.05, 0.07), 6, 4)
		_flower = b.commit_mesh()
	return _flower


static func grass_mesh() -> ArrayMesh:
	if _grass == null:
		var b := MeshLib.Builder.new()
		for k in 3:
			var a := PI * float(k) / 3.0
			var d := Vector3(cos(a), 0, sin(a)) * 0.45
			b.quad_n(-d, d, d * 0.4 + Vector3(0, 0.9, 0), -d * 0.4 + Vector3(0, 0.9, 0), Vector3.UP, Vector3.UP, Vector3.UP, Vector3.UP,
				Vector2(0, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0, 1), Color(0, 0, 0), Color(0, 0, 0), Color(1, 0, 0), Color(1, 0, 0))
		_grass = b.commit_mesh()
	return _grass


static func rock_mesh() -> ArrayMesh:
	if _rock == null:
		var b := MeshLib.Builder.new()
		b.ellipsoid(Vector3(0, 0.6, 0), Vector3(1.6, 1.0, 1.3), 10, 7)
		b.ellipsoid(Vector3(0.9, 0.5, 0.5), Vector3(0.9, 0.7, 0.8), 8, 6)
		_rock = b.commit_mesh()
	return _rock


static func multimesh(parent: Node3D, mesh: Mesh, xforms: Array, mat: Material, name: String, shadows: bool = true) -> MultiMeshInstance3D:
	if xforms.is_empty():
		return null
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	mm.instance_count = xforms.size()
	for i in xforms.size():
		mm.set_instance_transform(i, xforms[i])
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	mmi.material_override = mat
	mmi.name = name
	if not shadows:
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mmi)
	return mmi


static func palms(parent: Node3D, xforms: Array) -> void:
	var m := palm_meshes()
	multimesh(parent, m[0], xforms, Mats.pbr(Color(0.48, 0.34, 0.20), 0.85), "PalmTrunks")
	multimesh(parent, m[1], xforms, Mats.foliage(Color(0.12, 0.45, 0.14), Color(0.45, 0.80, 0.22), 0.45, 0.4), "PalmFronds")


static func flowers(parent: Node3D, xforms: Array, color_a: Color, color_b: Color, name: String) -> void:
	multimesh(parent, flower_mesh(), xforms, Mats.foliage(color_a, color_b, 0.12, 1.6), name, false)


static func grass(parent: Node3D, xforms: Array) -> void:
	multimesh(parent, grass_mesh(), xforms, Mats.foliage(Color(0.20, 0.55, 0.15), Color(0.55, 0.88, 0.28), 0.22, 2.2), "Grass", false)


static func rocks(parent: Node3D, xforms: Array) -> void:
	multimesh(parent, rock_mesh(), xforms, Mats.checker(Color(0.60, 0.34, 0.14), Color(0.86, 0.56, 0.24), 1.2), "Rocks")


# --- Ruins ---------------------------------------------------------------------

static func stone() -> StandardMaterial3D:
	return Mats.pbr(Color(0.78, 0.74, 0.62), 0.85, 0.0, 0.3)


static func stone_dark() -> StandardMaterial3D:
	return Mats.pbr(Color(0.55, 0.52, 0.45), 0.9, 0.0, 0.3)


static func column(parent: Node3D, pos: Vector3, h: float, broken: bool = false, r: float = 0.9) -> void:
	var b := MeshLib.Builder.new()
	var top_h := h * (0.55 if broken else 1.0)
	# Fluted shaft.
	var prof := [Vector2(r * 1.35, 0.0), Vector2(r * 1.35, 0.35), Vector2(r * 1.1, 0.5), Vector2(r, 0.7), Vector2(r * 0.92, top_h - 0.6)]
	if broken:
		prof.append(Vector2(r * 0.8, top_h))
		prof.append(Vector2(0.0, top_h + 0.3))
	else:
		prof.append(Vector2(r * 1.1, top_h - 0.4))
		prof.append(Vector2(r * 1.4, top_h - 0.1))
		prof.append(Vector2(r * 1.4, top_h))
		prof.append(Vector2(0.0, top_h))
	b.lathe(prof, 14, pos)
	var mi := b.commit(stone(), "Column")
	parent.add_child(mi)
	var body := StaticBody3D.new()
	body.collision_layer = 1
	var cs := CollisionShape3D.new()
	var sh := CylinderShape3D.new()
	sh.radius = r * 1.1
	sh.height = top_h
	cs.shape = sh
	cs.position = pos + Vector3(0, top_h * 0.5, 0)
	body.add_child(cs)
	parent.add_child(body)


static func block(parent: Node3D, pos: Vector3, size: Vector3, yaw: float = 0.0, mat: Material = null, collide: bool = true) -> void:
	var b := MeshLib.Builder.new()
	b.color = Color(1, 0, 0)
	var bs := Basis(Vector3.UP, yaw)
	b.box(pos, size, bs)
	parent.add_child(b.commit(mat if mat else stone(), "Block"))
	if collide:
		var body := StaticBody3D.new()
		body.collision_layer = 1
		var cs := CollisionShape3D.new()
		var sh := BoxShape3D.new()
		sh.size = size
		cs.shape = sh
		cs.transform = Transform3D(bs, pos)
		body.add_child(cs)
		parent.add_child(body)


# A stone arch spanning `w` across the route at `pos`, facing `fwd`.
static func arch(parent: Node3D, pos: Vector3, fwd: Vector3, w: float, h: float) -> void:
	var right := fwd.cross(Vector3.UP).normalized()
	var mat := stone()
	block(parent, pos + right * (w * 0.5 + 1.0) + Vector3(0, h * 0.5, 0), Vector3(2.2, h, 2.6), atan2(-fwd.x, -fwd.z), mat)
	block(parent, pos - right * (w * 0.5 + 1.0) + Vector3(0, h * 0.5, 0), Vector3(2.2, h, 2.6), atan2(-fwd.x, -fwd.z), mat)
	# Lintel + keystone.
	block(parent, pos + Vector3(0, h + 1.0, 0), Vector3(w + 4.4, 2.0, 2.8), atan2(-fwd.x, -fwd.z), mat, false)
	block(parent, pos + Vector3(0, h + 2.6, 0), Vector3(3.0, 1.4, 3.2), atan2(-fwd.x, -fwd.z), stone_dark(), false)
	# Vines: a few green strips hanging from the lintel.
	var b := MeshLib.Builder.new()
	for i in 6:
		var x := lerpf(-w * 0.45, w * 0.45, float(i) / 5.0)
		var top := pos + right * x + Vector3(0, h + 0.2, 0)
		var l := randf_range(1.5, 4.0)
		b.quad_n(top - right * 0.15, top + right * 0.15, top + right * 0.1 - Vector3(0, l, 0), top - right * 0.1 - Vector3(0, l, 0),
			-fwd, -fwd, -fwd, -fwd, Vector2(0, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0, 1), Color(0, 0, 0), Color(0, 0, 0), Color(1, 0, 0), Color(1, 0, 0))
	parent.add_child(b.commit(Mats.foliage(Color(0.15, 0.45, 0.12), Color(0.35, 0.7, 0.2), 0.25, 0.8), "Vines"))


# A torch: pole, bowl, flame particles and a warm omni light.
static func torch(parent: Node3D, pos: Vector3, light: bool = true) -> void:
	var b := MeshLib.Builder.new()
	b.cylinder(pos, pos + Vector3(0, 2.2, 0), 0.10, 0.08, 8)
	b.lathe([Vector2(0.0, 2.1), Vector2(0.35, 2.1), Vector2(0.42, 2.5), Vector2(0.0, 2.5)], 10, pos)
	parent.add_child(b.commit(Mats.pbr(Color(0.25, 0.2, 0.15), 0.7, 0.4), "Torch"))
	var p := CPUParticles3D.new()
	p.amount = 14
	p.lifetime = 0.7
	p.mesh = QuadMesh.new()
	(p.mesh as QuadMesh).size = Vector2(0.5, 0.5)
	p.material_override = Mats.particle_mat(Color(1.0, 0.6, 0.15, 0.9))
	p.position = pos + Vector3(0, 2.5, 0)
	p.direction = Vector3.UP
	p.spread = 12.0
	p.initial_velocity_min = 1.2
	p.initial_velocity_max = 2.2
	p.scale_amount_min = 0.5
	p.scale_amount_max = 1.2
	p.gravity = Vector3(0, 1.5, 0)
	p.color_ramp = _ramp([Color(1.0, 0.9, 0.5, 1.0), Color(1.0, 0.4, 0.1, 0.8), Color(0.3, 0.05, 0.0, 0.0)])
	parent.add_child(p)
	if light:
		var l := OmniLight3D.new()
		l.light_color = Color(1.0, 0.65, 0.3)
		l.light_energy = 3.0
		l.omni_range = 16.0
		l.omni_attenuation = 1.4
		l.shadow_enabled = false
		l.position = pos + Vector3(0, 2.8, 0)
		parent.add_child(l)


static func _ramp(colors: Array) -> Gradient:
	var g := Gradient.new()
	var offs := PackedFloat32Array()
	var cols := PackedColorArray()
	for i in colors.size():
		offs.append(float(i) / (colors.size() - 1))
		cols.append(colors[i])
	g.offsets = offs
	g.colors = cols
	return g


# --- Waterfall ------------------------------------------------------------------

# A sheet from `top` falling `h` metres, `w` wide, facing `fwd` (the viewer's
# side), with spray at the base and mist particles.
static func waterfall(parent: Node3D, top: Vector3, w: float, h: float, fwd: Vector3) -> void:
	var right := fwd.cross(Vector3.UP).normalized()
	var b := MeshLib.Builder.new()
	var segs := 6
	for i in segs:
		var t0 := float(i) / segs
		var t1 := float(i + 1) / segs
		# The plume bows outward as it falls.
		var bow0 := fwd * (sin(t0 * PI * 0.5) * w * 0.12)
		var bow1 := fwd * (sin(t1 * PI * 0.5) * w * 0.12)
		var y0 := top.y - h * t0
		var y1 := top.y - h * t1
		var a := Vector3(top.x, y0, top.z) - right * (w * 0.5) + bow0
		var bb := Vector3(top.x, y0, top.z) + right * (w * 0.5) + bow0
		var c := Vector3(top.x, y1, top.z) + right * (w * 0.5 * (1.0 + t1 * 0.25)) + bow1
		var d := Vector3(top.x, y1, top.z) - right * (w * 0.5 * (1.0 + t1 * 0.25)) + bow1
		b.quad_n(a, bb, c, d, fwd, fwd, fwd, fwd, Vector2(0, t0), Vector2(1, t0), Vector2(1, t1), Vector2(0, t1))
	var mi := b.commit(Mats.waterfall(), "Waterfall")
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)
	# Lip: a small white foam roll where the water leaves the edge.
	var lb := MeshLib.Builder.new()
	lb.cylinder(top - right * (w * 0.5) - fwd * 1.5, top + right * (w * 0.5) - fwd * 1.5, 0.7, 0.7, 8)
	lb.quad(top - right * (w * 0.5) - fwd * 1.5 + Vector3(0, 0.3, 0), top + right * (w * 0.5) - fwd * 1.5 + Vector3(0, 0.3, 0),
		top + right * (w * 0.5), top - right * (w * 0.5))
	var lm := lb.commit(Mats.glow(Color(0.9, 0.98, 1.0), 0.4, 0.3), "Lip")
	parent.add_child(lm)
	# Spray at the base.
	var base := Vector3(top.x, top.y - h, top.z) + fwd * (w * 0.12)
	var spray := CPUParticles3D.new()
	spray.amount = Quality.scale(90, 40)
	spray.lifetime = 1.8
	spray.mesh = QuadMesh.new()
	(spray.mesh as QuadMesh).size = Vector2(3.0, 3.0)
	spray.material_override = Mats.particle_mat(Color(0.9, 0.97, 1.0, 0.35), false)
	spray.position = base
	spray.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	spray.emission_box_extents = Vector3(w * 0.5, 0.5, 2.0)
	spray.direction = Vector3.UP
	spray.spread = 60.0
	spray.initial_velocity_min = 3.0
	spray.initial_velocity_max = 9.0
	spray.gravity = Vector3(0, -6.0, 0)
	spray.scale_amount_min = 1.0
	spray.scale_amount_max = 2.5
	spray.color_ramp = _ramp([Color(1, 1, 1, 0.0), Color(1, 1, 1, 0.5), Color(1, 1, 1, 0.0)])
	parent.add_child(spray)
	# Mist drifting up the face.
	var mist := CPUParticles3D.new()
	mist.amount = Quality.scale(30, 12)
	mist.lifetime = 4.0
	mist.mesh = QuadMesh.new()
	(mist.mesh as QuadMesh).size = Vector2(8.0, 8.0)
	mist.material_override = Mats.particle_mat(Color(0.95, 1.0, 1.0, 0.18), false)
	mist.position = base + fwd * 3.0
	mist.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	mist.emission_box_extents = Vector3(w * 0.6, 1.0, 3.0)
	mist.direction = Vector3.UP
	mist.spread = 30.0
	mist.initial_velocity_min = 1.0
	mist.initial_velocity_max = 3.0
	mist.gravity = Vector3(0, 0.8, 0)
	mist.scale_amount_min = 1.0
	mist.scale_amount_max = 2.0
	mist.color_ramp = _ramp([Color(1, 1, 1, 0.0), Color(1, 1, 1, 0.35), Color(1, 1, 1, 0.0)])
	parent.add_child(mist)


# Still pool surface (a flat disc of water) for the top of a waterfall or a lagoon.
static func pool(parent: Node3D, center: Vector3, size: Vector2) -> void:
	var pm := PlaneMesh.new()
	pm.size = size
	pm.subdivide_width = 8
	pm.subdivide_depth = 8
	var mi := MeshInstance3D.new()
	mi.mesh = pm
	mi.material_override = Mats.ocean()
	mi.position = center
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)


# --- Checkpoint post and goal ---------------------------------------------------

static func star_post(parent: Node3D, pos: Vector3) -> Node3D:
	var root := Node3D.new()
	root.position = pos
	parent.add_child(root)
	var b := MeshLib.Builder.new()
	b.cylinder(Vector3.ZERO, Vector3(0, 2.6, 0), 0.10, 0.08, 8)
	b.lathe([Vector2(0.0, 0.0), Vector2(0.45, 0.0), Vector2(0.45, 0.15), Vector2(0.0, 0.15)], 10)
	root.add_child(b.commit(Mats.pbr(Color(0.25, 0.27, 0.3), 0.5, 0.7), "Post"))
	var head := Node3D.new()
	head.position = Vector3(0, 2.8, 0)
	head.name = "Head"
	root.add_child(head)
	var s := MeshLib.Builder.new()
	s.ellipsoid(Vector3.ZERO, Vector3(0.42, 0.42, 0.42), 12, 8)
	head.add_child(s.commit(Mats.glow(Color(0.2, 0.5, 1.0), 0.8, 0.3), "Ball"))
	var st := MeshLib.Builder.new()
	for k in 5:
		var a0 := TAU * float(k) / 5.0 - PI * 0.5
		var a1 := a0 + TAU / 10.0
		var a2 := a0 + TAU / 5.0
		st.tri(Vector3(0, 0, -0.44), Vector3(cos(a1) * 0.18, sin(a1) * 0.18, -0.44), Vector3(cos(a0) * 0.42, sin(a0) * 0.42, -0.44))
		st.tri(Vector3(0, 0, -0.44), Vector3(cos(a2) * 0.42, sin(a2) * 0.42, -0.44), Vector3(cos(a1) * 0.18, sin(a1) * 0.18, -0.44))
		st.tri(Vector3(0, 0, 0.44), Vector3(cos(a0) * 0.42, sin(a0) * 0.42, 0.44), Vector3(cos(a1) * 0.18, sin(a1) * 0.18, 0.44))
		st.tri(Vector3(0, 0, 0.44), Vector3(cos(a1) * 0.18, sin(a1) * 0.18, 0.44), Vector3(cos(a2) * 0.42, sin(a2) * 0.42, 0.44))
	head.add_child(st.commit(Mats.glow(Color(1.0, 0.85, 0.2), 1.5, 0.3), "Star"))
	return root


static func goal_gate(parent: Node3D, pos: Vector3, fwd: Vector3) -> void:
	var right := fwd.cross(Vector3.UP).normalized()
	var b := MeshLib.Builder.new()
	# A big golden ring standing across the road.
	var prof := []
	for i in 13:
		var a := TAU * float(i) / 12.0
		prof.append(Vector2(6.0 + cos(a) * 0.45, sin(a) * 0.45))
	b.lathe(prof, 40, pos + Vector3(0, 7.0, 0), MeshLib.basis_from_y(fwd), false)
	var mi := b.commit(Ring.material(), "GoalRing")
	parent.add_child(mi)
	# Two posts.
	var pb := MeshLib.Builder.new()
	pb.cylinder(pos + right * 7.0, pos + right * 7.0 + Vector3(0, 9.0, 0), 0.4, 0.3, 10)
	pb.cylinder(pos - right * 7.0, pos - right * 7.0 + Vector3(0, 9.0, 0), 0.4, 0.3, 10)
	parent.add_child(pb.commit(Mats.pbr(Color(0.9, 0.9, 0.95), 0.4, 0.8), "GoalPosts"))
	# GOAL banner: a red plate with white lettering blocks.
	var bn := MeshLib.Builder.new()
	bn.box(pos + Vector3(0, 12.0, 0), Vector3(14.0, 2.6, 0.3), MeshLib.basis_forward(fwd))
	parent.add_child(bn.commit(Mats.pbr(Color(0.85, 0.12, 0.10), 0.5), "Banner"))
	var lb := MeshLib.Builder.new()
	var glyphs := [
		# G
		[[0, 0, 1, 5], [0, 4, 4, 1], [0, 0, 4, 1], [3, 0, 1, 3], [2, 2, 2, 1]],
		# O
		[[0, 0, 1, 5], [3, 0, 1, 5], [0, 0, 4, 1], [0, 4, 4, 1]],
		# A
		[[0, 0, 1, 5], [3, 0, 1, 5], [0, 4, 4, 1], [0, 2, 4, 1]],
		# L
		[[0, 0, 1, 5], [0, 0, 4, 1]],
	]
	var cellw := 0.42
	var start_x := -6.0
	for gi in glyphs.size():
		for r: Array in glyphs[gi]:
			var cx: float = start_x + gi * 3.2 + (r[0] + r[2] * 0.5) * cellw
			var cy: float = 11.0 + (r[1] + r[3] * 0.5) * cellw
			lb.box(pos + right * cx + Vector3(0, cy, 0) - fwd * 0.2, Vector3(r[2] * cellw, r[3] * cellw, 0.15), MeshLib.basis_forward(fwd))
	parent.add_child(lb.commit(Mats.glow(Color.WHITE, 0.8, 0.5), "Letters"))


# A wooden plank for the collapsing bridge: returns a StaticBody with mesh + box.
static func plank(pos: Vector3, basis: Basis, size: Vector3) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.transform = Transform3D(basis, pos)
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = size
	cs.shape = sh
	body.add_child(cs)
	var b := MeshLib.Builder.new()
	b.color = Color(1, 0, 0)
	b.box(Vector3.ZERO, size)
	body.add_child(b.commit(Mats.pbr(Color(0.55, 0.36, 0.18), 0.85), "Plank"))
	body.set_meta("ground_kind", "wood")
	return body


# Rope-and-post railings for a bridge span between two frames.
static func rope_rail(parent: Node3D, pts: Array, height: float = 1.1) -> void:
	var b := MeshLib.Builder.new()
	for i in pts.size() - 1:
		var a: Vector3 = pts[i]
		var c: Vector3 = pts[i + 1]
		var mid := (a + c) * 0.5 + Vector3(0, height - 0.25, 0)
		b.cylinder(a + Vector3(0, height, 0), mid, 0.04, 0.04, 5, false)
		b.cylinder(mid, c + Vector3(0, height, 0), 0.04, 0.04, 5, false)
		if i % 3 == 0:
			b.cylinder(a, a + Vector3(0, height + 0.15, 0), 0.09, 0.08, 6)
	parent.add_child(b.commit(Mats.pbr(Color(0.6, 0.45, 0.25), 0.9), "Rope"))


# Big checkered cliff slab used as a backdrop (wall run, ruins).
static func cliff(parent: Node3D, pos: Vector3, size: Vector3, yaw: float = 0.0) -> void:
	var b := MeshLib.Builder.new()
	b.color = Color(1, 0, 0)
	var bs := Basis(Vector3.UP, yaw)
	b.box(pos, size, bs)
	parent.add_child(b.commit(Mats.checker(), "Cliff"))
	var body := StaticBody3D.new()
	body.collision_layer = 1
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = size
	cs.shape = sh
	cs.transform = Transform3D(bs, pos)
	body.add_child(cs)
	parent.add_child(body)
