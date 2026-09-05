# Builds an anti-gravity ship out of code: a wide flat hull made from
# cross-section rings, two engine pods, wings, fins and a canopy. Surfaces
# use the real brushed-aluminium, sci-fi panel, carbon and glass texture sets
# tinted with the team colours. Returns a Node3D; engine glow quads are
# exposed through metadata so the ship can scale them with thrust.
class_name ShipModel
extends RefCounted


static func build(team: Dictionary) -> Node3D:
	var root := Node3D.new()
	root.name = "Model"
	var color: Color = team["color"]
	var accent: Color = team["accent"]
	var hull_mat := Mats.painted("aluminium", color * Color(1.25, 1.25, 1.25), 0.4, 0.2)
	var pod_mat := Mats.painted("scificar", accent.lerp(Color.WHITE, 0.3) * Color(1.2, 1.2, 1.2), 0.5, 0.1)
	var wing_mat := Mats.painted("carbon_fiber", Color(2.2, 2.2, 2.2), 0.35, 0.3)
	var canopy_mat := StandardMaterial3D.new()
	canopy_mat.albedo_color = Color(0.05, 0.08, 0.12)
	canopy_mat.metallic = 0.9
	canopy_mat.roughness = 0.1
	var engine_mat := Mats.glow(accent.lerp(Color.WHITE, 0.3), 3.0, false)

	# Hull rings: [z, half width, top height, bottom depth]
	var rings := [
		[-2.7, 0.10, 0.06, -0.04],
		[-2.0, 0.50, 0.20, -0.16],
		[-1.1, 0.95, 0.40, -0.30],
		[0.2, 1.10, 0.50, -0.34],
		[1.5, 0.95, 0.44, -0.30],
		[2.3, 0.62, 0.28, -0.22],
	]
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var prev: Array = []
	var prev_v := 0.0
	for r in rings:
		var pts := _ring(r[0], r[1], r[2], r[3])
		var v: float = (r[0] + 2.7) / 2.5
		if not prev.is_empty():
			for k in pts.size():
				var k2 := (k + 1) % pts.size()
				_quad(st, prev[k], prev[k2], pts[k2], pts[k], Vector2(float(k) / pts.size() * 2.0, prev_v),
					Vector2(float(k + 1) / pts.size() * 2.0, prev_v), Vector2(float(k + 1) / pts.size() * 2.0, v),
					Vector2(float(k) / pts.size() * 2.0, v))
		prev = pts
		prev_v = v
	# Tail cap.
	var tail_c := Vector3(0, 0.02, 2.3)
	for k in prev.size():
		var k2 := (k + 1) % prev.size()
		_tri(st, tail_c, prev[k2], prev[k], Vector2(0.5, 0.5), Vector2(0, 1), Vector2(1, 1))
	_commit(root, st, hull_mat, "Hull")

	# Pods.
	for side in [-1.0, 1.0]:
		var ps := SurfaceTool.new()
		ps.begin(Mesh.PRIMITIVE_TRIANGLES)
		var cx: float = 1.65 * side
		var segs := 8
		var pr := [[-0.9, 0.16], [-0.4, 0.40], [1.2, 0.44], [2.1, 0.36]]
		var pprev: Array = []
		var pv := 0.0
		for r in pr:
			var pts := []
			for k in segs:
				var a := TAU * float(k) / segs
				pts.append(Vector3(cx + cos(a) * r[1], sin(a) * r[1] * 0.8 + 0.02, r[0]))
			var v: float = (r[0] + 0.9) / 3.0
			if not pprev.is_empty():
				for k in segs:
					var k2 := (k + 1) % segs
					_quad(ps, pprev[k], pprev[k2], pts[k2], pts[k], Vector2(float(k) / segs * 1.5, pv),
						Vector2(float(k + 1) / segs * 1.5, pv), Vector2(float(k + 1) / segs * 1.5, v), Vector2(float(k) / segs * 1.5, v))
			pprev = pts
			pv = v
		var nose_c := Vector3(cx, 0.02, -1.1)
		var first := []
		for k in segs:
			var a := TAU * float(k) / segs
			first.append(Vector3(cx + cos(a) * 0.16, sin(a) * 0.13 + 0.02, -0.9))
		for k in segs:
			var k2 := (k + 1) % segs
			_tri(ps, nose_c, first[k], first[k2], Vector2(0.5, 0.5), Vector2(0, 0), Vector2(1, 0))
		var back_c := Vector3(cx, 0.02, 2.1)
		for k in segs:
			var k2 := (k + 1) % segs
			_tri(ps, back_c, pprev[k2], pprev[k], Vector2(0.5, 0.5), Vector2(0, 0), Vector2(1, 0))
		_commit(root, ps, pod_mat, "Pod")
		# Wing joining hull to pod.
		var ws := SurfaceTool.new()
		ws.begin(Mesh.PRIMITIVE_TRIANGLES)
		var ix: float = 0.9 * side
		var ox: float = (1.65 - 0.2) * side
		_box(ws, Vector3((ix + ox) * 0.5, 0.0, 0.7), Vector3(absf(ox - ix) * 0.5, 0.07, 1.1))
		_commit(root, ws, wing_mat, "Wing")
		# Fin on the pod.
		var fs := SurfaceTool.new()
		fs.begin(Mesh.PRIMITIVE_TRIANGLES)
		_box(fs, Vector3(cx + 0.12 * side, 0.42, 1.55), Vector3(0.04, 0.22, 0.42))
		_commit(root, fs, wing_mat, "Fin")
		# Engine glow: a small flattened sphere inside the pod mouth plus two
		# crossed additive flame quads trailing backwards (+Z).
		var glow := MeshInstance3D.new()
		var gm := SphereMesh.new()
		gm.radius = 0.24
		gm.height = 0.48
		gm.radial_segments = 10
		gm.rings = 5
		glow.mesh = gm
		glow.material_override = engine_mat
		glow.position = Vector3(cx, 0.02, 1.98)
		glow.scale = Vector3(1.0, 0.8, 0.6)
		glow.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		root.add_child(glow)
		var flame := MeshInstance3D.new()
		var fm := QuadMesh.new()
		fm.size = Vector2(0.5, 1.4)
		fm.center_offset = Vector3(0, 0.5, 0)
		flame.mesh = fm
		flame.material_override = Mats.sprite("flame", Color(accent.lerp(Color.WHITE, 0.35), 0.85), true, false)
		flame.position = Vector3(cx, 0.02, 2.05)
		flame.rotation_degrees = Vector3(90, 0, 0)
		flame.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		root.add_child(flame)
		var flame2 := flame.duplicate()
		flame2.rotate(Vector3(0, 0, 1), PI * 0.5)
		root.add_child(flame2)
		root.set_meta("flame_%s" % ("l" if side < 0 else "r"), [flame, flame2])
	# Canopy.
	var cs := SurfaceTool.new()
	cs.begin(Mesh.PRIMITIVE_TRIANGLES)
	var crings := [[-1.4, 0.05, 0.42], [-0.9, 0.30, 0.70], [-0.1, 0.34, 0.74], [0.6, 0.22, 0.56]]
	var cprev: Array = []
	for r in crings:
		var pts := []
		for k in 5:
			var a := PI * float(k) / 4.0
			pts.append(Vector3(cos(a) * r[1], 0.35 + sin(a) * (r[2] - 0.35), r[0]))
		if not cprev.is_empty():
			for k in 4:
				_quad(cs, cprev[k], cprev[k + 1], pts[k + 1], pts[k], Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO)
		cprev = pts
	_commit(root, cs, canopy_mat, "Canopy", false)
	# Blob shadow.
	var shadow := MeshInstance3D.new()
	var sm := QuadMesh.new()
	sm.size = Vector2(5.0, 6.0)
	shadow.mesh = sm
	var shm := StandardMaterial3D.new()
	shm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	shm.albedo_color = Color(0, 0, 0, 0.55)
	shm.albedo_texture = Mats.tex("smoke")
	shm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	shm.cull_mode = BaseMaterial3D.CULL_DISABLED
	shadow.material_override = shm
	shadow.rotation_degrees = Vector3(-90, 0, 0)
	shadow.name = "Shadow"
	shadow.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(shadow)
	root.set_meta("shadow", shadow)
	return root


static func _ring(z: float, w: float, top: float, bot: float) -> Array:
	return [
		Vector3(0, top, z),
		Vector3(w * 0.75, top * 0.55, z),
		Vector3(w, 0.0, z),
		Vector3(w * 0.75, bot * 0.6, z),
		Vector3(0, bot, z),
		Vector3(-w * 0.75, bot * 0.6, z),
		Vector3(-w, 0.0, z),
		Vector3(-w * 0.75, top * 0.55, z),
	]


static func _quad(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3,
		ua: Vector2, ub: Vector2, uc: Vector2, ud: Vector2) -> void:
	_tri(st, a, b, c, ua, ub, uc)
	_tri(st, a, c, d, ua, uc, ud)


static func _tri(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, ua: Vector2, ub: Vector2, uc: Vector2) -> void:
	var nrm := (b - a).cross(c - a).normalized()
	st.set_normal(nrm); st.set_uv(ua); st.add_vertex(a)
	st.set_normal(nrm); st.set_uv(ub); st.add_vertex(b)
	st.set_normal(nrm); st.set_uv(uc); st.add_vertex(c)


static func _box(st: SurfaceTool, c: Vector3, h: Vector3) -> void:
	var p := []
	for i in 8:
		p.append(c + Vector3(h.x * (1 if i & 1 else -1), h.y * (1 if i & 2 else -1), h.z * (1 if i & 4 else -1)))
	var faces := [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]]
	for f in faces:
		_quad(st, p[f[0]], p[f[1]], p[f[2]], p[f[3]], Vector2(0, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0, 1))


static func _commit(root: Node3D, st: SurfaceTool, mat: Material, name: String, tangents: bool = true) -> MeshInstance3D:
	st.index()
	if tangents:
		st.generate_tangents()
	var mesh := st.commit()
	mesh.surface_set_material(0, mat)
	var mi := MeshInstance3D.new()
	mi.name = name
	mi.mesh = mesh
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(mi)
	return mi
