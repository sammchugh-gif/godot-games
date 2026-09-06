# Every character and pickup in the game, built from primitives. Each builder
# returns a Node3D whose animated parts are children named so the owner can
# find them: get_node("body"), get_node("legL") and so on.
class_name Models
extends RefCounted

const SKIN := Color(0.98, 0.8, 0.62)
const HAIR := Color(0.36, 0.22, 0.12)
const TROUSERS := Color(0.2, 0.32, 0.7)
const SHOE := Color(0.45, 0.25, 0.12)
const EYE_WHITE := Color(0.98, 0.98, 0.98)
const EYE_BLACK := Color(0.08, 0.08, 0.1)

const CAP_COLOURS := {
	"red": Color(0.9, 0.16, 0.14),
	"blue": Color(0.2, 0.45, 0.95),
	"green": Color(0.2, 0.7, 0.3),
	"purple": Color(0.6, 0.25, 0.85),
	"gold": Color(1.0, 0.8, 0.2),
	"dino": Color(0.3, 0.62, 0.28),
}
const SHIRT_COLOURS := {
	"red": Color(0.85, 0.2, 0.18),
	"yellow": Color(0.95, 0.8, 0.2),
	"cyan": Color(0.2, 0.75, 0.85),
	"white": Color(0.95, 0.95, 0.95),
	"black": Color(0.12, 0.12, 0.14),
}


static func pivot(parent: Node3D, name: String, pos: Vector3) -> Node3D:
	var p := Node3D.new()
	p.name = name
	p.position = pos
	parent.add_child(p)
	return p


static func part(parent: Node3D, b: MeshLib.Builder, mat: Material, name: String = "Part") -> MeshInstance3D:
	var mi := b.commit(mat, name)
	parent.add_child(mi)
	return mi


static func eyes(parent: Node3D, center: Vector3, spread: float, r: float, forward: Vector3 = Vector3.FORWARD, pupil: float = 0.5) -> void:
	var side := forward.cross(Vector3.UP).normalized()
	for s in [-1.0, 1.0]:
		var b := MeshLib.Builder.new()
		b.ellipsoid(center + side * spread * s, Vector3(r, r * 1.15, r * 0.7), 10, 8)
		part(parent, b, Mats.pbr(EYE_WHITE, 0.3), "eye")
		var p := MeshLib.Builder.new()
		p.ellipsoid(center + side * spread * s + forward * r * 0.55, Vector3(r * pupil, r * pupil * 1.1, r * 0.3), 8, 6)
		part(parent, p, Mats.pbr(EYE_BLACK, 0.2), "pupil")


# ------------------------------------------------------------------ cap ---

# The living cap. Dome plus brim, with eyes on the front. Front is -Z.
static func cap(colour: Color, with_eyes: bool = true, scale: float = 1.0) -> Node3D:
	var root := Node3D.new()
	root.name = "Cap"
	var b := MeshLib.Builder.new()
	var prof := []
	for i in 7:
		var t := float(i) / 6.0
		prof.append(Vector2(0.3 * cos(t * PI * 0.5) * scale, (0.02 + 0.26 * sin(t * PI * 0.5)) * scale))
	prof.push_front(Vector2(0.31 * scale, 0.0))
	b.lathe(prof, 18)
	part(root, b, Mats.skin(colour, 0.5), "dome")
	var br := MeshLib.Builder.new()
	br.box(Vector3(0, 0.02 * scale, -0.34 * scale), Vector3(0.44 * scale, 0.045 * scale, 0.3 * scale))
	part(root, br, Mats.skin(colour.darkened(0.1), 0.5), "brim")
	var but := MeshLib.Builder.new()
	but.ellipsoid(Vector3(0, 0.29 * scale, 0), Vector3(0.05, 0.04, 0.05) * scale, 8, 6)
	part(root, but, Mats.pbr(colour.darkened(0.3)), "button")
	if with_eyes:
		eyes(root, Vector3(0, 0.13 * scale, -0.26 * scale), 0.1 * scale, 0.07 * scale, Vector3.FORWARD, 0.5)
	return root


# ----------------------------------------------------------------- hero ---

# Dylan. Origin at the feet, faces -Z. Pivots: body, head, armL, armR,
# legL, legR, cap (child of head).
static func hero(shirt: Color, cap_colour: Color) -> Node3D:
	var root := Node3D.new()
	root.name = "Hero"
	var body := pivot(root, "body", Vector3(0, 0.62, 0))
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 0.26, 0), Vector3(0.27, 0.3, 0.2), 14, 10)
	part(body, b, Mats.skin(shirt), "torso")
	var sh := MeshLib.Builder.new()
	sh.ellipsoid(Vector3(0, 0.02, 0), Vector3(0.26, 0.16, 0.2), 12, 8)
	part(body, sh, Mats.skin(TROUSERS), "shorts")
	var head := pivot(body, "head", Vector3(0, 0.5, 0))
	var h := MeshLib.Builder.new()
	h.ellipsoid(Vector3(0, 0.24, 0), Vector3(0.27, 0.26, 0.26), 16, 12)
	part(head, h, Mats.skin(SKIN), "face")
	var hair := MeshLib.Builder.new()
	hair.ellipsoid(Vector3(0, 0.32, 0.03), Vector3(0.28, 0.2, 0.27), 14, 8)
	part(head, hair, Mats.skin(HAIR), "hair")
	eyes(head, Vector3(0, 0.26, -0.2), 0.1, 0.06, Vector3.FORWARD, 0.55)
	var nose := MeshLib.Builder.new()
	nose.ellipsoid(Vector3(0, 0.18, -0.26), Vector3(0.04, 0.035, 0.04), 8, 6)
	part(head, nose, Mats.skin(SKIN.darkened(0.08)), "nose")
	var mouth := MeshLib.Builder.new()
	mouth.box(Vector3(0, 0.1, -0.245), Vector3(0.1, 0.025, 0.02))
	part(head, mouth, Mats.pbr(Color(0.5, 0.15, 0.15)), "mouth")
	var capn := cap(cap_colour, true, 1.05)
	capn.position = Vector3(0, 0.43, 0.0)
	capn.rotation.x = -0.12
	head.add_child(capn)
	for s in [-1.0, 1.0]:
		var nm := "armL" if s < 0 else "armR"
		var arm := pivot(body, nm, Vector3(0.3 * s, 0.4, 0))
		var a := MeshLib.Builder.new()
		a.cylinder(Vector3.ZERO, Vector3(0.04 * s, -0.36, 0), 0.07, 0.06, 10)
		part(arm, a, Mats.skin(shirt), "sleeve")
		var hand := MeshLib.Builder.new()
		hand.ellipsoid(Vector3(0.04 * s, -0.4, 0), Vector3(0.08, 0.08, 0.08), 10, 8)
		part(arm, hand, Mats.skin(SKIN), "hand")
		var lnm := "legL" if s < 0 else "legR"
		var leg := pivot(root, lnm, Vector3(0.12 * s, 0.62, 0))
		var l := MeshLib.Builder.new()
		l.cylinder(Vector3(0, 0.05, 0), Vector3(0, -0.5, 0), 0.095, 0.075, 10)
		part(leg, l, Mats.skin(TROUSERS.darkened(0.15)), "leg")
		var shoe := MeshLib.Builder.new()
		shoe.ellipsoid(Vector3(0, -0.55, -0.05), Vector3(0.11, 0.09, 0.19), 10, 8)
		part(leg, shoe, Mats.skin(SHOE, 0.45), "shoe")
	return root


# ----------------------------------------------------------- pickups -----

static func coin_mesh(purple: bool = false) -> ArrayMesh:
	var b := MeshLib.Builder.new()
	if purple:
		b.lathe([Vector2(0.0, -0.06), Vector2(0.38, -0.06), Vector2(0.38, 0.06), Vector2(0.0, 0.06)], 6)
	else:
		b.lathe([Vector2(0.0, -0.05), Vector2(0.34, -0.05), Vector2(0.34, 0.05), Vector2(0.0, 0.05)], 16)
	return b.commit_mesh()


static func moon_mesh() -> ArrayMesh:
	var b := MeshLib.Builder.new()
	var segs := 28
	var outer: Array[Vector2] = []
	var inner: Array[Vector2] = []
	var c := Vector2(0.42, 0.0)
	var ri := 0.78
	var a0 := 0.62
	for i in segs + 1:
		var a := a0 + (TAU - 2.0 * a0) * float(i) / segs
		var d := Vector2(cos(a), sin(a))
		outer.append(d)
		# Ray from the origin along d meets the inner circle |t d - c| = ri.
		var bq := -2.0 * d.dot(c)
		var cq := c.length_squared() - ri * ri
		var disc := bq * bq - 4.0 * cq
		var t := 0.0
		if disc > 0.0:
			t = (-bq + sqrt(disc)) * 0.5
		inner.append(d * maxf(t, 0.0))
	var th := 0.16
	for i in segs:
		var o0 := Vector3(outer[i].x, outer[i].y, th)
		var o1 := Vector3(outer[i + 1].x, outer[i + 1].y, th)
		var i0 := Vector3(inner[i].x, inner[i].y, th)
		var i1 := Vector3(inner[i + 1].x, inner[i + 1].y, th)
		b.quad(i0, o0, o1, i1)
		var bo0 := o0 - Vector3(0, 0, 2 * th)
		var bo1 := o1 - Vector3(0, 0, 2 * th)
		var bi0 := i0 - Vector3(0, 0, 2 * th)
		var bi1 := i1 - Vector3(0, 0, 2 * th)
		b.quad(bi1, bo1, bo0, bi0)
		b.quad(o0, bo0, bo1, o1)
		b.quad(i1, bi1, bi0, i0)
	return b.commit_mesh()


static func heart_mesh() -> ArrayMesh:
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3(-0.14, 0.1, 0), Vector3(0.17, 0.17, 0.12), 10, 8)
	b.ellipsoid(Vector3(0.14, 0.1, 0), Vector3(0.17, 0.17, 0.12), 10, 8)
	b.spike(Vector3(0, 0.12, 0), Vector3(0, -0.3, 0), 0.3, 10, 4)
	return b.commit_mesh()


# ---------------------------------------------------------- creatures -----

static func frog() -> Node3D:
	var root := Node3D.new()
	root.name = "Frog"
	var body := pivot(root, "body", Vector3(0, 0.3, 0))
	var green := Color(0.3, 0.75, 0.32)
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 0.05, 0), Vector3(0.5, 0.36, 0.55), 14, 10)
	part(body, b, Mats.skin(green), "torso")
	var belly := MeshLib.Builder.new()
	belly.ellipsoid(Vector3(0, -0.05, -0.1), Vector3(0.36, 0.25, 0.4), 12, 8)
	part(body, belly, Mats.skin(Color(0.8, 0.92, 0.6)), "belly")
	for s in [-1.0, 1.0]:
		var e := MeshLib.Builder.new()
		e.ellipsoid(Vector3(0.24 * s, 0.36, -0.2), Vector3(0.16, 0.16, 0.16), 10, 8)
		part(body, e, Mats.skin(green), "eyeball")
	eyes(body, Vector3(0, 0.38, -0.3), 0.24, 0.1, Vector3.FORWARD, 0.55)
	var mouth := MeshLib.Builder.new()
	mouth.box(Vector3(0, 0.02, -0.5), Vector3(0.4, 0.03, 0.08))
	part(body, mouth, Mats.pbr(Color(0.2, 0.4, 0.2)), "mouth")
	for s in [-1.0, 1.0]:
		var leg := pivot(root, "legL" if s < 0 else "legR", Vector3(0.42 * s, 0.22, 0.2))
		var l := MeshLib.Builder.new()
		l.ellipsoid(Vector3(0, 0, 0), Vector3(0.16, 0.14, 0.3), 10, 8)
		l.ellipsoid(Vector3(0.05 * s, -0.18, 0.05), Vector3(0.2, 0.06, 0.28), 10, 6)
		part(leg, l, Mats.skin(green.darkened(0.1)), "leg")
		var f := MeshLib.Builder.new()
		f.cylinder(Vector3(0.36 * s, 0.25, -0.25), Vector3(0.42 * s, 0.0, -0.3), 0.06, 0.07, 8)
		part(root, f, Mats.skin(green.darkened(0.1)), "arm")
	return root


static func rex(scale: float = 1.0, colour: Color = Color(0.36, 0.62, 0.3), crown: bool = false, metal: bool = false) -> Node3D:
	var root := Node3D.new()
	root.name = "Rex"
	root.scale = Vector3.ONE * scale
	var belly := colour.lerp(Color(0.9, 0.9, 0.6), 0.45)
	if metal:
		belly = colour.lerp(Color(0.3, 0.35, 0.4), 0.5)
	var m_body: Material = Mats.pbr(colour, 0.4, 0.5) if metal else Mats.skin(colour)
	var m_belly: Material = Mats.pbr(belly, 0.45, 0.45) if metal else Mats.skin(belly)
	var m_dark: Material = Mats.pbr(colour.darkened(0.12), 0.4, 0.5) if metal else Mats.skin(colour.darkened(0.1))
	var body := pivot(root, "body", Vector3(0, 2.1, 0))
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, 0, 0.2), Vector3(0.95, 1.0, 1.5), 16, 12)
	part(body, b, m_body, "torso")
	var bb := MeshLib.Builder.new()
	bb.ellipsoid(Vector3(0, -0.3, 0.0), Vector3(0.7, 0.75, 1.3), 14, 10)
	part(body, bb, m_belly, "belly")
	var tail := MeshLib.Builder.new()
	tail.spike(Vector3(0, 0.1, 1.4), Vector3(0, 0.6, 4.6), 0.8, 12, 8, Vector3(0, 0.5, 0))
	part(body, tail, m_body, "tail")
	var neck := MeshLib.Builder.new()
	neck.cylinder(Vector3(0, 0.3, -1.1), Vector3(0, 1.0, -1.8), 0.6, 0.5, 12)
	part(body, neck, m_body, "neck")
	var head := pivot(body, "head", Vector3(0, 1.1, -1.9))
	var h := MeshLib.Builder.new()
	h.ellipsoid(Vector3(0, 0.15, -0.5), Vector3(0.62, 0.55, 1.05), 16, 12)
	part(head, h, m_body, "skull")
	var jaw := pivot(head, "jaw", Vector3(0, -0.15, -0.2))
	var j := MeshLib.Builder.new()
	j.box(Vector3(0, -0.12, -0.7), Vector3(0.9, 0.3, 1.3))
	part(jaw, j, m_belly, "jaw")
	for i in 6:
		for s in [-1.0, 1.0]:
			var t := MeshLib.Builder.new()
			var x: float = 0.4 * s
			var z := -0.35 - i * 0.2
			t.spike(Vector3(x, -0.13, z), Vector3(x, -0.36, z), 0.07, 6, 2)
			part(head, t, Mats.pbr(Color(0.97, 0.97, 0.9), 0.3), "tooth")
	eyes(head, Vector3(0, 0.45, -0.55), 0.42, 0.15, Vector3.FORWARD, 0.5)
	for s in [-1.0, 1.0]:
		var brow := MeshLib.Builder.new()
		brow.box(Vector3(0.42 * s, 0.68, -0.6), Vector3(0.36, 0.08, 0.2), Basis(Vector3.FORWARD, -0.35 * s))
		part(head, brow, Mats.skin(colour.darkened(0.3)), "brow")
	if crown:
		var c := MeshLib.Builder.new()
		c.lathe([Vector2(0.0, 0.0), Vector2(0.5, 0.0), Vector2(0.5, 0.35), Vector2(0.0, 0.35)], 8, Vector3(0, 0.7, 0.05))
		for i in 8:
			var a := TAU * i / 8.0
			c.spike(Vector3(cos(a) * 0.45, 1.05, 0.05 + sin(a) * 0.45), Vector3(cos(a) * 0.5, 1.5, 0.05 + sin(a) * 0.5), 0.12, 6, 2)
		part(head, c, Mats.pbr(Color(1.0, 0.82, 0.2), 0.3, 0.8), "crown")
	for s in [-1.0, 1.0]:
		var arm := MeshLib.Builder.new()
		arm.cylinder(Vector3(0.7 * s, -0.1, -0.9), Vector3(0.85 * s, -0.5, -1.4), 0.16, 0.12, 8)
		arm.ellipsoid(Vector3(0.85 * s, -0.5, -1.45), Vector3(0.16, 0.14, 0.2), 8, 6)
		part(body, arm, m_body, "arm")
		var leg := pivot(root, "legL" if s < 0 else "legR", Vector3(0.75 * s, 2.0, 0.5))
		var l := MeshLib.Builder.new()
		l.ellipsoid(Vector3(0, -0.2, 0), Vector3(0.5, 0.75, 0.7), 12, 10)
		l.cylinder(Vector3(0, -0.8, 0.1), Vector3(0, -1.75, -0.15), 0.33, 0.3, 10)
		part(leg, l, m_dark, "thigh")
		var foot := MeshLib.Builder.new()
		foot.box(Vector3(0, -1.85, -0.35), Vector3(0.75, 0.32, 1.1))
		for k in 3:
			foot.spike(Vector3(-0.25 + 0.25 * k, -1.85, -0.9), Vector3(-0.28 + 0.28 * k, -1.9, -1.25), 0.1, 6, 2)
		part(leg, foot, m_dark, "foot")
	return root


static func rocket() -> Node3D:
	var root := Node3D.new()
	root.name = "Rocket"
	var body := pivot(root, "body", Vector3.ZERO)
	var b := MeshLib.Builder.new()
	b.cylinder(Vector3(0, 0, 1.2), Vector3(0, 0, -1.0), 0.48, 0.48, 16)
	part(body, b, Mats.skin(Color(0.2, 0.2, 0.26), 0.4), "hull")
	var nose := MeshLib.Builder.new()
	nose.spike(Vector3(0, 0, -1.0), Vector3(0, 0, -2.0), 0.48, 16, 4)
	part(body, nose, Mats.skin(Color(0.9, 0.2, 0.15), 0.4), "nose")
	for i in 4:
		var a := TAU * i / 4.0 + PI / 4.0
		var d := Vector3(cos(a), sin(a), 0)
		var fin := MeshLib.Builder.new()
		var p0 := d * 0.45 + Vector3(0, 0, 0.4)
		var p1 := d * 0.95 + Vector3(0, 0, 1.3)
		var p2 := d * 0.45 + Vector3(0, 0, 1.25)
		var w := d.cross(Vector3.FORWARD) * 0.04
		fin.quad(p0 + w, p1 + w, p2 + w, p0 + w)
		fin.quad(p0 - w, p2 - w, p1 - w, p0 - w)
		fin.tri(p0 + w, p1 + w, p2 + w)
		fin.tri(p0 - w, p2 - w, p1 - w)
		part(body, fin, Mats.skin(Color(0.9, 0.2, 0.15), 0.4), "fin")
	eyes(body, Vector3(0, 0.18, -0.9), 0.2, 0.11, Vector3.FORWARD, 0.5)
	var flame := MeshLib.Builder.new()
	flame.spike(Vector3(0, 0, 1.2), Vector3(0, 0, 2.3), 0.35, 10, 3)
	var fl := part(body, flame, Mats.glow(Color(1.0, 0.6, 0.15), 2.5), "flame")
	fl.name = "flame"
	return root


static func stilt() -> Node3D:
	var root := Node3D.new()
	root.name = "Stilt"
	var pot := MeshLib.Builder.new()
	pot.lathe([Vector2(0.0, 0.0), Vector2(0.45, 0.0), Vector2(0.55, 0.5), Vector2(0.6, 0.55), Vector2(0.0, 0.55)], 12)
	part(root, pot, Mats.skin(Color(0.7, 0.4, 0.25)), "pot")
	var legs := pivot(root, "legs", Vector3(0, 0.5, 0))
	for s in [-1.0, 1.0]:
		var l := MeshLib.Builder.new()
		l.cylinder(Vector3(0.2 * s, 0, 0), Vector3(0.2 * s, 1.0, 0), 0.07, 0.07, 8)
		part(legs, l, Mats.skin(Color(0.75, 0.6, 0.3)), "leg")
	var head := pivot(root, "head", Vector3(0, 1.5, 0))
	var h := MeshLib.Builder.new()
	h.ellipsoid(Vector3(0, 0.3, 0), Vector3(0.45, 0.42, 0.45), 14, 10)
	part(head, h, Mats.skin(Color(0.5, 0.8, 0.3)), "bulb")
	for i in 3:
		var a := TAU * i / 3.0
		var leaf := MeshLib.Builder.new()
		var d := Vector3(cos(a), 0, sin(a))
		leaf.spike(Vector3(0, 0.6, 0) + d * 0.1, Vector3(0, 1.2, 0) + d * 0.6, 0.16, 8, 3, Vector3(0, 0.2, 0))
		part(head, leaf, Mats.skin(Color(0.25, 0.65, 0.25)), "leaf")
	eyes(head, Vector3(0, 0.32, -0.36), 0.16, 0.09, Vector3.FORWARD, 0.5)
	var mouth := MeshLib.Builder.new()
	mouth.ellipsoid(Vector3(0, 0.15, -0.42), Vector3(0.1, 0.05, 0.03), 8, 4)
	part(head, mouth, Mats.pbr(Color(0.2, 0.3, 0.1)), "mouth")
	return root


static func bonk() -> Node3D:
	var root := Node3D.new()
	root.name = "Bonk"
	var body := pivot(root, "body", Vector3(0, 0.45, 0))
	var brown := Color(0.6, 0.38, 0.2)
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3.ZERO, Vector3(0.48, 0.42, 0.46), 14, 10)
	part(body, b, Mats.skin(brown), "torso")
	var cap_b := MeshLib.Builder.new()
	cap_b.ellipsoid(Vector3(0, 0.22, 0), Vector3(0.52, 0.22, 0.5), 14, 8)
	part(body, cap_b, Mats.skin(brown.darkened(0.25)), "top")
	eyes(body, Vector3(0, 0.08, -0.36), 0.16, 0.1, Vector3.FORWARD, 0.55)
	for s in [-1.0, 1.0]:
		var brow := MeshLib.Builder.new()
		brow.box(Vector3(0.17 * s, 0.22, -0.4), Vector3(0.2, 0.05, 0.05), Basis(Vector3.FORWARD, 0.5 * s))
		part(body, brow, Mats.pbr(EYE_BLACK), "brow")
		var foot := pivot(root, "legL" if s < 0 else "legR", Vector3(0.2 * s, 0.12, 0))
		var f := MeshLib.Builder.new()
		f.ellipsoid(Vector3(0, 0, -0.05), Vector3(0.16, 0.1, 0.22), 10, 6)
		part(foot, f, Mats.skin(Color(0.35, 0.2, 0.1)), "foot")
	var mouth := MeshLib.Builder.new()
	mouth.box(Vector3(0, -0.15, -0.44), Vector3(0.22, 0.04, 0.03))
	part(body, mouth, Mats.pbr(EYE_BLACK), "mouth")
	return root


static func spiny() -> Node3D:
	var root := Node3D.new()
	root.name = "Spiny"
	var body := pivot(root, "body", Vector3(0, 0.42, 0))
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3.ZERO, Vector3(0.42, 0.4, 0.42), 14, 10)
	part(body, b, Mats.skin(Color(0.85, 0.25, 0.2)), "torso")
	var sp := MeshLib.Builder.new()
	for i in 10:
		var a := TAU * i / 10.0
		var d := Vector3(cos(a) * 0.6, 0.8, sin(a) * 0.6).normalized()
		sp.spike(d * 0.32, d * 0.75, 0.09, 6, 2)
	sp.spike(Vector3(0, 0.35, 0), Vector3(0, 0.85, 0), 0.1, 6, 2)
	part(body, sp, Mats.pbr(Color(0.95, 0.9, 0.7), 0.4), "spikes")
	eyes(body, Vector3(0, 0.02, -0.33), 0.15, 0.09, Vector3.FORWARD, 0.55)
	for s in [-1.0, 1.0]:
		var foot := pivot(root, "legL" if s < 0 else "legR", Vector3(0.2 * s, 0.1, 0))
		var f := MeshLib.Builder.new()
		f.ellipsoid(Vector3(0, 0, -0.05), Vector3(0.14, 0.09, 0.2), 10, 6)
		part(foot, f, Mats.skin(Color(0.9, 0.6, 0.2)), "foot")
	return root


# The living taxi. Faces -Z. Pivots: body, wheelFL, wheelFR, wheelBL, wheelBR.
static func taxi() -> Node3D:
	var root := Node3D.new()
	root.name = "Taxi"
	var yellow := Color(0.98, 0.78, 0.12)
	var body := pivot(root, "body", Vector3(0, 0.45, 0))
	var b := MeshLib.Builder.new()
	b.box(Vector3(0, 0.45, 0), Vector3(2.0, 0.8, 4.3))
	b.box(Vector3(0, 1.15, 0.1), Vector3(1.75, 0.7, 2.3))
	part(body, b, Mats.skin(yellow, 0.4), "shell")
	var glass := MeshLib.Builder.new()
	glass.box(Vector3(0, 1.17, -0.75), Vector3(1.6, 0.55, 0.9))
	glass.box(Vector3(0, 1.17, 1.0), Vector3(1.6, 0.55, 0.6))
	glass.box(Vector3(0, 1.17, 0.1), Vector3(1.8, 0.5, 1.4))
	part(body, glass, Mats.pbr(Color(0.15, 0.25, 0.4), 0.2, 0.3), "glass")
	var trim := MeshLib.Builder.new()
	trim.box(Vector3(0, 0.15, -2.15), Vector3(2.1, 0.3, 0.2))
	trim.box(Vector3(0, 0.15, 2.15), Vector3(2.1, 0.3, 0.2))
	trim.box(Vector3(0, 0.6, 0), Vector3(2.06, 0.12, 3.6))
	part(body, trim, Mats.pbr(Color(0.15, 0.15, 0.17), 0.5), "trim")
	var sign := MeshLib.Builder.new()
	sign.box(Vector3(0, 1.62, 0.1), Vector3(0.9, 0.24, 0.35))
	part(body, sign, Mats.glow(Color(1.0, 0.95, 0.6), 1.2), "sign")
	for sx in [-0.65, 0.65]:
		var hl := MeshLib.Builder.new()
		hl.ellipsoid(Vector3(sx, 0.55, -2.15), Vector3(0.18, 0.14, 0.08), 8, 6)
		part(body, hl, Mats.glow(Color(1.0, 0.98, 0.85), 2.0), "headlight")
		var tl := MeshLib.Builder.new()
		tl.box(Vector3(sx, 0.55, 2.16), Vector3(0.3, 0.16, 0.06))
		part(body, tl, Mats.glow(Color(1.0, 0.2, 0.15), 1.5), "taillight")
	eyes(body, Vector3(0, 1.22, -1.18), 0.32, 0.15, Vector3.FORWARD, 0.5)
	for w in [["wheelFL", -1.0, -1.35], ["wheelFR", 1.0, -1.35], ["wheelBL", -1.0, 1.35], ["wheelBR", 1.0, 1.35]]:
		var wp := pivot(root, w[0], Vector3(0.95 * w[1], 0.42, w[2]))
		var wb := MeshLib.Builder.new()
		wb.cylinder(Vector3(-0.18, 0, 0), Vector3(0.18, 0, 0), 0.42, 0.42, 12)
		part(wp, wb, Mats.pbr(Color(0.1, 0.1, 0.12), 0.8), "tyre")
		var hub := MeshLib.Builder.new()
		hub.cylinder(Vector3(-0.19, 0, 0), Vector3(0.19, 0, 0), 0.22, 0.22, 8)
		part(wp, hub, Mats.pbr(Color(0.75, 0.75, 0.78), 0.3, 0.7), "hub")
	return root


# Sherman the tank. Faces -Z. Pivots: body, turret (barrel is a child).
static func tank() -> Node3D:
	var root := Node3D.new()
	root.name = "Tank"
	var olive := Color(0.42, 0.5, 0.3)
	var body := pivot(root, "body", Vector3.ZERO)
	var b := MeshLib.Builder.new()
	b.box(Vector3(0, 0.95, 0), Vector3(2.4, 0.8, 3.6))
	b.box(Vector3(0, 1.35, 0.6), Vector3(1.6, 0.3, 1.6))
	part(body, b, Mats.pbr(olive, 0.7), "hull")
	var tracks := MeshLib.Builder.new()
	for sx in [-1.35, 1.35]:
		tracks.box(Vector3(sx, 0.55, 0), Vector3(0.7, 1.1, 3.9))
		for i in 5:
			tracks.cylinder(Vector3(sx - 0.4, 0.5, -1.4 + i * 0.7), Vector3(sx + 0.4, 0.5, -1.4 + i * 0.7), 0.3, 0.3, 8)
	part(body, tracks, Mats.pbr(Color(0.18, 0.18, 0.2), 0.9), "tracks")
	var turret := pivot(body, "turret", Vector3(0, 1.45, 0.2))
	var t := MeshLib.Builder.new()
	t.lathe([Vector2(0.0, 0.0), Vector2(0.95, 0.0), Vector2(0.9, 0.55), Vector2(0.6, 0.75), Vector2(0.0, 0.75)], 14)
	part(turret, t, Mats.pbr(olive.darkened(0.1), 0.7), "dome")
	var barrel := MeshLib.Builder.new()
	barrel.cylinder(Vector3(0, 0.4, -0.5), Vector3(0, 0.4, -3.0), 0.16, 0.2, 10)
	barrel.cylinder(Vector3(0, 0.4, -2.6), Vector3(0, 0.4, -3.0), 0.26, 0.26, 10)
	part(turret, barrel, Mats.pbr(Color(0.25, 0.28, 0.25), 0.6), "barrel")
	eyes(turret, Vector3(0, 0.42, -0.72), 0.3, 0.13, Vector3.FORWARD, 0.5)
	var brow := MeshLib.Builder.new()
	brow.box(Vector3(0, 0.62, -0.72), Vector3(0.9, 0.06, 0.06))
	part(turret, brow, Mats.pbr(EYE_BLACK), "brow")
	return root


static func shell_mesh() -> ArrayMesh:
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3.ZERO, Vector3(0.22, 0.22, 0.32), 8, 6)
	return b.commit_mesh()


# A ring standing upright in the XY plane (normal along Z).
static func torus_mesh(R: float, r: float, segs: int = 24) -> ArrayMesh:
	var b := MeshLib.Builder.new()
	var prof := []
	for i in 13:
		var a := TAU * i / 12.0
		prof.append(Vector2(R + r * cos(a), r * sin(a)))
	b.lathe(prof, segs, Vector3.ZERO, Basis(Vector3.RIGHT, PI * 0.5), false)
	return b.commit_mesh()


# ------------------------------------------------------------- props -----

static func tree(kind: int, rng: RandomNumberGenerator) -> Node3D:
	var root := Node3D.new()
	root.name = "Tree"
	var h := rng.randf_range(3.0, 5.0)
	var trunk := MeshLib.Builder.new()
	trunk.cylinder(Vector3.ZERO, Vector3(0, h * 0.55, 0), 0.32, 0.22, 8)
	part(root, trunk, Mats.skin(Color(0.45, 0.3, 0.16)), "trunk")
	var leaf := MeshLib.Builder.new()
	var g := Color(0.22, 0.6, 0.24).lerp(Color(0.45, 0.72, 0.2), rng.randf())
	if kind == 0:
		leaf.ellipsoid(Vector3(0, h * 0.65, 0), Vector3(1.6, 1.4, 1.6) * (h / 4.0), 12, 8)
		leaf.ellipsoid(Vector3(0.7, h * 0.5, 0.3), Vector3(1.1, 0.9, 1.1) * (h / 4.0), 10, 6)
		leaf.ellipsoid(Vector3(-0.6, h * 0.55, -0.4), Vector3(1.0, 0.9, 1.0) * (h / 4.0), 10, 6)
	elif kind == 1:
		for i in 3:
			var y := h * 0.35 + i * h * 0.2
			leaf.spike(Vector3(0, y, 0), Vector3(0, y + h * 0.35, 0), (1.5 - i * 0.35) * (h / 4.0), 10, 3, Vector3.ZERO, 1.0)
	else:
		# Palm: bare trunk, fronds.
		for i in 6:
			var a := TAU * i / 6.0
			var d := Vector3(cos(a), 0, sin(a))
			leaf.spike(Vector3(0, h * 0.55, 0), Vector3(0, h * 0.55 - 0.6, 0) + d * 2.4, 0.35, 6, 4, Vector3(0, 0.9, 0))
	part(root, leaf, Mats.skin(g, 0.8), "leaves")
	return root


# One tree of each kind as a single vertex-coloured mesh (for multimeshes).
# Height 4; instances scale it.
static func tree_mesh(kind: int) -> ArrayMesh:
	var b := MeshLib.Builder.new()
	var h := 4.0
	b.color = Color(0.45, 0.3, 0.16)
	b.cylinder(Vector3.ZERO, Vector3(0, h * 0.55, 0), 0.32, 0.22, 8)
	b.color = Color(0.3, 0.64, 0.24)
	if kind == 0:
		b.ellipsoid(Vector3(0, h * 0.65, 0), Vector3(1.6, 1.4, 1.6), 12, 8)
		b.ellipsoid(Vector3(0.7, h * 0.5, 0.3), Vector3(1.1, 0.9, 1.1), 10, 6)
		b.ellipsoid(Vector3(-0.6, h * 0.55, -0.4), Vector3(1.0, 0.9, 1.0), 10, 6)
	elif kind == 1:
		b.color = Color(0.22, 0.55, 0.26)
		for i in 3:
			var y := h * 0.35 + i * h * 0.2
			b.spike(Vector3(0, y, 0), Vector3(0, y + h * 0.35, 0), 1.5 - i * 0.35, 10, 3, Vector3.ZERO, 1.0)
	else:
		b.color = Color(0.36, 0.7, 0.26)
		for i in 6:
			var a := TAU * i / 6.0
			var d := Vector3(cos(a), 0, sin(a))
			b.spike(Vector3(0, h * 0.55, 0), Vector3(0, h * 0.55 - 0.6, 0) + d * 2.4, 0.35, 6, 4, Vector3(0, 0.9, 0))
	return b.commit_mesh()


static func rock(rng: RandomNumberGenerator, size: float) -> ArrayMesh:
	var b := MeshLib.Builder.new()
	b.ellipsoid(Vector3(0, size * 0.25, 0), Vector3(size * rng.randf_range(0.8, 1.2), size * 0.7, size * rng.randf_range(0.8, 1.2)), 8, 5, Basis(Vector3.UP, rng.randf() * TAU))
	return b.commit_mesh()
