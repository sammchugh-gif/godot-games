# Draws the board and turns touches into arrow placements. Everything is
# drawn with CanvasItem primitives, so there are no art files to ship.
class_name BoardView
extends Node2D

signal swipe(cell: Vector2i, dir: int)
signal tap(cell: Vector2i)

const SAND_A := Color(0.93, 0.83, 0.62)
const SAND_B := Color(0.89, 0.78, 0.56)
const EDGE := Color(0.55, 0.38, 0.2)
const WALL := Color(0.45, 0.27, 0.14)
const WALL_HI := Color(0.62, 0.42, 0.24)

var sim: Sim
var area := Rect2(0, 0, 1280, 720)
var tile := 60.0
var origin := Vector2.ZERO
var launch_t := -1.0		# >= 0 while the rocket is taking off
var planning := false
var _touches := {}
var _fx: Array = []
var _time := 0.0
var _swipe_hint_t := 0.0


func _process(dt: float) -> void:
	_time += dt
	if sim != null:
		for c in sim.creatures:
			c.angle = lerp_angle(c.angle, Sim.dir_angle(c.dir), minf(1.0, dt * 14.0))
		for e in sim.events:
			_on_event(e)
		sim.events.clear()
	var i := _fx.size() - 1
	while i >= 0:
		_fx[i].t += dt
		if _fx[i].t > _fx[i].life:
			_fx.remove_at(i)
		i -= 1
	if launch_t >= 0.0:
		launch_t += dt
	queue_redraw()


func set_area(r: Rect2) -> void:
	area = r
	tile = floorf(minf(r.size.x / Sim.W, r.size.y / Sim.H))
	origin = r.position + (r.size - Vector2(Sim.W, Sim.H) * tile) * 0.5


func cell_center(c: Vector2) -> Vector2:
	return origin + (c + Vector2(0.5, 0.5)) * tile


func cell_at(p: Vector2) -> Vector2i:
	var q := (p - origin) / tile
	if q.x < 0.0 or q.y < 0.0 or q.x >= Sim.W or q.y >= Sim.H:
		return Vector2i(-1, -1)
	return Vector2i(int(q.x), int(q.y))


func flash_hint() -> void:
	_swipe_hint_t = 1.0


# ---------------------------------------------------------------- input ---

func _unhandled_input(event: InputEvent) -> void:
	if sim == null:
		return
	if event is InputEventScreenTouch:
		var ev := make_input_local(event) as InputEventScreenTouch
		if ev.pressed:
			_touches[ev.index] = {"start": ev.position, "cell": cell_at(ev.position), "done": false}
		elif _touches.has(ev.index):
			var t: Dictionary = _touches[ev.index]
			_touches.erase(ev.index)
			if not t.done and t.cell.x >= 0:
				var d: Vector2 = ev.position - t.start
				if d.length() >= tile * 0.3:
					swipe.emit(t.cell, _dir_of(d))
				else:
					tap.emit(t.cell)
		get_viewport().set_input_as_handled()
	elif event is InputEventScreenDrag:
		var ev := make_input_local(event) as InputEventScreenDrag
		if _touches.has(ev.index):
			var t: Dictionary = _touches[ev.index]
			if not t.done and t.cell.x >= 0:
				var d: Vector2 = ev.position - t.start
				if d.length() >= tile * 0.3:
					t.done = true
					swipe.emit(t.cell, _dir_of(d))
		get_viewport().set_input_as_handled()


static func _dir_of(d: Vector2) -> int:
	if absf(d.x) > absf(d.y):
		return 1 if d.x > 0.0 else 3
	return 2 if d.y > 0.0 else 0


# -------------------------------------------------------------- effects ---

func _on_event(e: Dictionary) -> void:
	var p: Vector2 = cell_center(e.pos)
	match e.type:
		"saved":
			var gold: bool = e.get("kind", 0) == Sim.Kind.GOLD
			_fx.append({"kind": "ring", "pos": p, "t": 0.0, "life": 0.5, "color": Color(1.0, 0.85, 0.3) if gold else Color(0.6, 1.0, 0.6)})
			_fx.append({"kind": "text", "pos": p, "t": 0.0, "life": 0.9, "text": "+10" if gold else "+1", "color": Color(1.0, 0.8, 0.2) if gold else Color(0.15, 0.5, 0.15)})
			Sfx.play("gold" if gold else "saved", -4.0)
		"eaten":
			_fx.append({"kind": "puff", "pos": p, "t": 0.0, "life": 0.6, "color": Color(0.9, 0.3, 0.3)})
			Sfx.play("eaten", -3.0)
		"hole":
			_fx.append({"kind": "puff", "pos": p, "t": 0.0, "life": 0.5, "color": Color(0.3, 0.2, 0.1)})
			Sfx.play("hole", -6.0)
		"rocket_hit":
			_fx.append({"kind": "puff", "pos": p, "t": 0.0, "life": 0.8, "color": Color(1.0, 0.4, 0.2)})
			Sfx.play("alarm", -2.0)
		"penalty":
			if e.n > 0:
				_fx.append({"kind": "text", "pos": p, "t": 0.0, "life": 1.2, "text": "-%d" % e.n, "color": Color(0.85, 0.1, 0.1)})
		"arrow_hit":
			Sfx.play("crack", -8.0)
		"arrow_broken":
			_fx.append({"kind": "puff", "pos": p, "t": 0.0, "life": 0.4, "color": Color(0.3, 0.5, 0.9)})
			Sfx.play("crack", -2.0)
		"snake":
			Sfx.play("hiss", -8.0)


# -------------------------------------------------------------- drawing ---

func _draw() -> void:
	if sim == null:
		return
	var W := Sim.W
	var H := Sim.H
	var board := Rect2(origin, Vector2(W, H) * tile)
	# Table under the board.
	draw_rect(board.grow(tile * 0.18), EDGE)
	for y in H:
		for x in W:
			var r := Rect2(origin + Vector2(x, y) * tile, Vector2(tile, tile))
			draw_rect(r, SAND_A if (x + y) % 2 == 0 else SAND_B)
	# Static tiles.
	for y in H:
		for x in W:
			var c := Vector2i(x, y)
			var p := cell_center(Vector2(c))
			match sim.tile(c):
				Sim.Tile.HOLE:
					_draw_hole(p)
				Sim.Tile.SPAWN:
					_draw_burrow(p, sim.spawn_dir[x + y * W], false)
				Sim.Tile.NEST:
					_draw_burrow(p, sim.spawn_dir[x + y * W], true)
	# Arrows.
	for a in sim.arrows:
		_draw_arrow(a)
	# Walls: inner ones, then the frame.
	var wt := tile * 0.13
	for y in H:
		for x in W - 1:
			if sim.vwall[x + y * (W - 1)]:
				var px := origin.x + (x + 1) * tile
				_wall_seg(Vector2(px, origin.y + y * tile), Vector2(px, origin.y + (y + 1) * tile), wt)
	for y in H - 1:
		for x in W:
			if sim.hwall[x + y * W]:
				var py := origin.y + (y + 1) * tile
				_wall_seg(Vector2(origin.x + x * tile, py), Vector2(origin.x + (x + 1) * tile, py), wt)
	var corners := [board.position, board.position + Vector2(board.size.x, 0), board.end, board.position + Vector2(0, board.size.y)]
	for i in 4:
		_wall_seg(corners[i], corners[(i + 1) % 4], wt * 1.2)
	# Creatures, snakes on top.
	for c in sim.creatures:
		if c.kind != Sim.Kind.SNAKE:
			_draw_lizard(c)
	for c in sim.creatures:
		if c.kind == Sim.Kind.SNAKE:
			_draw_snake(c)
	# Rocket last so it sits above walkers.
	for rc in sim.rocket_cells:
		_draw_rocket(cell_center(Vector2(rc)))
	# Effects.
	for f in _fx:
		_draw_fx(f)
	if _swipe_hint_t > 0.0:
		_swipe_hint_t -= get_process_delta_time()


func _wall_seg(a: Vector2, b: Vector2, w: float) -> void:
	draw_line(a, b, WALL, w)
	draw_circle(a, w * 0.5, WALL)
	draw_circle(b, w * 0.5, WALL)
	draw_line(a + Vector2(-w * 0.15, -w * 0.15), b + Vector2(-w * 0.15, -w * 0.15), WALL_HI, w * 0.3)


func _draw_hole(p: Vector2) -> void:
	var r := tile * 0.36
	draw_circle(p + Vector2(0, r * 0.08), r * 1.08, Color(0.6, 0.45, 0.25))
	draw_circle(p, r, Color(0.12, 0.08, 0.05))
	draw_circle(p + Vector2(-r * 0.2, -r * 0.2), r * 0.62, Color(0.05, 0.03, 0.02))


func _draw_burrow(p: Vector2, d: int, nest: bool) -> void:
	var r := tile * 0.34
	draw_circle(p, r * 1.15, Color(0.5, 0.3, 0.55) if nest else Color(0.62, 0.45, 0.25))
	draw_circle(p, r, Color(0.28, 0.18, 0.1))
	draw_circle(p + Vector2(0, -r * 0.15), r * 0.7, Color(0.16, 0.1, 0.06))
	var dv := Vector2(Sim.DIRS[d])
	var q := p + dv * r * 1.35
	var side := dv.orthogonal()
	draw_colored_polygon(PackedVector2Array([q + dv * r * 0.45, q + side * r * 0.35, q - side * r * 0.35]), Color(0.95, 0.9, 0.7, 0.9))


func _draw_arrow(a: Sim.Arrow) -> void:
	var p := cell_center(Vector2(a.cell))
	var s := tile * 0.42
	var col := Color(0.2, 0.5, 0.92)
	if a.hp < 2:
		s *= 0.72
		col = Color(0.45, 0.6, 0.85)
	if sim.arcade:
		var left := Sim.ARROW_LIFE - a.age
		if left < 2.5:
			col = col.lerp(Color(0.95, 0.55, 0.15), 0.6)
			if fmod(left, 0.4) < 0.2:
				col.a = 0.55
	var sb := StyleBoxFlat.new()
	sb.bg_color = col
	sb.set_corner_radius_all(int(s * 0.3))
	sb.draw(get_canvas_item(), Rect2(p - Vector2(s, s), Vector2(s, s) * 2.0))
	var dv := Vector2(Sim.DIRS[a.dir])
	var side := dv.orthogonal()
	var pts := PackedVector2Array([
		p + dv * s * 0.62,
		p - dv * s * 0.1 + side * s * 0.62,
		p - dv * s * 0.1 + side * s * 0.25,
		p - dv * s * 0.62 + side * s * 0.25,
		p - dv * s * 0.62 - side * s * 0.25,
		p - dv * s * 0.1 - side * s * 0.25,
		p - dv * s * 0.1 - side * s * 0.62,
	])
	draw_colored_polygon(pts, Color(1, 1, 1, 0.95))
	if a.hp < 2:
		draw_line(p - Vector2(s * 0.6, s * 0.2), p + Vector2(s * 0.1, s * 0.5), Color(0.1, 0.1, 0.2, 0.7), 2.0)


func _draw_rocket(p: Vector2) -> void:
	var s := tile * 0.5
	var lift := 0.0
	var flame := 0.55 + 0.25 * sin(_time * 22.0)
	if launch_t >= 0.0:
		lift = launch_t * launch_t * tile * 3.5
		flame = 1.2 + 0.4 * sin(_time * 40.0)
	elif sim.running:
		flame = 0.7 + 0.3 * sin(_time * 22.0)
	var q := p - Vector2(0, lift)
	# Landing pad.
	draw_circle(p + Vector2(0, s * 0.55), s * 0.75, Color(0.5, 0.5, 0.55))
	draw_circle(p + Vector2(0, s * 0.55), s * 0.55, Color(0.35, 0.35, 0.4))
	# Flame.
	var fl := PackedVector2Array([
		q + Vector2(-s * 0.3, s * 0.55), q + Vector2(0, s * 0.55 + s * flame), q + Vector2(s * 0.3, s * 0.55)])
	draw_colored_polygon(fl, Color(1.0, 0.55, 0.1, 0.9))
	var fl2 := PackedVector2Array([
		q + Vector2(-s * 0.15, s * 0.55), q + Vector2(0, s * 0.55 + s * flame * 0.6), q + Vector2(s * 0.15, s * 0.55)])
	draw_colored_polygon(fl2, Color(1.0, 0.9, 0.4, 0.95))
	# Fins.
	draw_colored_polygon(PackedVector2Array([q + Vector2(-s * 0.3, s * 0.1), q + Vector2(-s * 0.62, s * 0.7), q + Vector2(-s * 0.3, s * 0.6)]), Color(0.85, 0.2, 0.2))
	draw_colored_polygon(PackedVector2Array([q + Vector2(s * 0.3, s * 0.1), q + Vector2(s * 0.62, s * 0.7), q + Vector2(s * 0.3, s * 0.6)]), Color(0.85, 0.2, 0.2))
	# Body.
	var body := PackedVector2Array([
		q + Vector2(-s * 0.32, -s * 0.2), q + Vector2(-s * 0.32, s * 0.6),
		q + Vector2(s * 0.32, s * 0.6), q + Vector2(s * 0.32, -s * 0.2)])
	draw_colored_polygon(body, Color(0.9, 0.9, 0.95))
	draw_colored_polygon(PackedVector2Array([q + Vector2(-s * 0.32, -s * 0.2), q + Vector2(0, -s * 0.95), q + Vector2(s * 0.32, -s * 0.2)]), Color(0.9, 0.2, 0.2))
	draw_circle(q + Vector2(0, s * 0.1), s * 0.17, Color(0.3, 0.6, 0.9))
	draw_circle(q + Vector2(0, s * 0.1), s * 0.11, Color(0.6, 0.85, 1.0))
	if planning:
		var pulse := 0.5 + 0.5 * sin(_time * 3.0)
		draw_arc(p, s * 1.05 + pulse * s * 0.15, 0.0, TAU, 32, Color(1.0, 1.0, 1.0, 0.35 + 0.25 * pulse), 2.0)


func _draw_lizard(c: Sim.Creature) -> void:
	var p := cell_center(c.pos())
	var s := tile * 0.64
	var gold := c.kind == Sim.Kind.GOLD
	var base := Color(1.0, 0.8, 0.2) if gold else Color(0.3 + 0.15 * c.tint, 0.68 + 0.12 * c.tint, 0.25)
	var dark := base.darkened(0.25)
	var xf := Transform2D(c.angle, p)
	var wig := sin(c.phase)
	# Tail.
	var tail := PackedVector2Array()
	for i in 6:
		var u := float(i) / 5.0
		tail.append(xf * Vector2(-s * 0.35 - u * s * 0.55, sin(c.phase - u * 4.0) * s * 0.16 * u))
	draw_polyline(tail, dark, s * 0.16 * (1.0 - 0.0), true)
	# Legs.
	for i in 4:
		var fx := s * 0.22 if i < 2 else -s * 0.18
		var sy := 1.0 if i % 2 == 0 else -1.0
		var sw := wig if i % 2 == (0 if i < 2 else 1) else -wig
		var hip := xf * Vector2(fx, sy * s * 0.18)
		var knee := xf * Vector2(fx + sw * s * 0.12, sy * s * 0.42)
		var foot := xf * Vector2(fx + sw * s * 0.22, sy * s * 0.5)
		draw_line(hip, knee, dark, s * 0.11)
		draw_line(knee, foot, dark, s * 0.09)
	# Body and head.
	var body := PackedVector2Array()
	for i in 14:
		var a := TAU * i / 14.0
		body.append(xf * Vector2(cos(a) * s * 0.42, sin(a) * s * 0.22))
	draw_colored_polygon(body, base)
	var stripe := PackedVector2Array()
	for i in 10:
		var a := TAU * i / 10.0
		stripe.append(xf * Vector2(cos(a) * s * 0.3, sin(a) * s * 0.09))
	draw_colored_polygon(stripe, base.lightened(0.2))
	var head := xf * Vector2(s * 0.5, 0)
	draw_circle(head, s * 0.2, base)
	draw_circle(xf * Vector2(s * 0.56, -s * 0.1), s * 0.07, Color.WHITE)
	draw_circle(xf * Vector2(s * 0.56, s * 0.1), s * 0.07, Color.WHITE)
	draw_circle(xf * Vector2(s * 0.58, -s * 0.1), s * 0.035, Color.BLACK)
	draw_circle(xf * Vector2(s * 0.58, s * 0.1), s * 0.035, Color.BLACK)
	if gold:
		var tw := 0.5 + 0.5 * sin(_time * 9.0 + c.phase)
		draw_circle(p + Vector2(-s * 0.4, -s * 0.4), s * 0.06 * tw, Color(1, 1, 0.8))


func _draw_snake(c: Sim.Creature) -> void:
	var p := cell_center(c.pos())
	var s := tile * 0.62
	var base := Color(0.35, 0.22, 0.45)
	var band := Color(0.85, 0.65, 0.2)
	var xf := Transform2D(c.angle, p)
	# Body segments trail behind the head with a sideways wave.
	var n := 9
	for i in range(n - 1, -1, -1):
		var u := float(i) / float(n - 1)
		var q := xf * Vector2(s * 0.25 - u * s * 1.35, sin(c.phase * 0.8 - u * 5.0) * s * 0.2 * (0.3 + u))
		var r := s * (0.2 - u * 0.12)
		draw_circle(q, r, band if i % 2 == 1 else base)
	var head := xf * Vector2(s * 0.42, 0)
	draw_circle(head, s * 0.24, base)
	draw_circle(xf * Vector2(s * 0.5, -s * 0.11), s * 0.07, Color(1.0, 0.9, 0.3))
	draw_circle(xf * Vector2(s * 0.5, s * 0.11), s * 0.07, Color(1.0, 0.9, 0.3))
	draw_circle(xf * Vector2(s * 0.52, -s * 0.11), s * 0.03, Color.BLACK)
	draw_circle(xf * Vector2(s * 0.52, s * 0.11), s * 0.03, Color.BLACK)
	if fmod(c.phase, 3.0) < 0.9:
		var t0 := xf * Vector2(s * 0.66, 0)
		var t1 := xf * Vector2(s * 0.9, 0)
		draw_line(t0, t1, Color(0.9, 0.15, 0.2), s * 0.05)
		draw_line(t1, xf * Vector2(s * 1.0, -s * 0.07), Color(0.9, 0.15, 0.2), s * 0.05)
		draw_line(t1, xf * Vector2(s * 1.0, s * 0.07), Color(0.9, 0.15, 0.2), s * 0.05)


func _draw_fx(f: Dictionary) -> void:
	var u: float = f.t / f.life
	match f.kind:
		"ring":
			draw_arc(f.pos, tile * (0.2 + u * 0.6), 0.0, TAU, 32, Color(f.color, 1.0 - u), 3.0)
		"puff":
			for i in 6:
				var a := TAU * i / 6.0 + u
				var q: Vector2 = f.pos + Vector2(cos(a), sin(a)) * tile * u * 0.5
				draw_circle(q, tile * 0.12 * (1.0 - u), Color(f.color, 1.0 - u))
		"text":
			var font := ThemeDB.fallback_font
			var size := int(tile * 0.45)
			var pos: Vector2 = f.pos + Vector2(0, -tile * u * 0.8)
			var txt: String = f.text
			var w := font.get_string_size(txt, HORIZONTAL_ALIGNMENT_CENTER, -1, size).x
			draw_string(font, pos - Vector2(w * 0.5, 0), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, size, Color(f.color, 1.0 - u * u))
