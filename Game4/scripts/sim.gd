# The board simulation: a 12 x 9 grid with walls on tile edges, a rocket,
# holes, spawners, arrows the player places, and creatures that walk the
# grid ChuChu Rocket style. Pure logic, no rendering; the view reads it and
# the headless self-test drives it.
#
# Rules (same for lizards and snakes):
#   - creatures walk in straight lines at constant speed;
#   - at a tile centre an arrow turns them to point its way;
#   - a wall ahead makes them turn right; if right is blocked, left; then back;
#   - a snake hitting an arrow head-on wears it down (two hits break it);
#   - snakes eat lizards they touch; holes swallow anyone;
#   - a lizard reaching the rocket is saved; a snake reaching it is bad news.
class_name Sim
extends RefCounted

const W := 12
const H := 9
const DIRS: Array[Vector2i] = [Vector2i(0, -1), Vector2i(1, 0), Vector2i(0, 1), Vector2i(-1, 0)]
const LIZARD_SPEED := 3.0
const SNAKE_SPEED := 2.0
const ARROW_LIFE := 10.0
const ARROW_MAX_LIVE := 3
const PUZZLE_TIMEOUT := 45.0
const ARCADE_LENGTH := 90.0
const SNAKE_LIFE := 30.0

enum Tile { EMPTY, ROCKET, HOLE, SPAWN, NEST }
enum Kind { LIZARD, SNAKE, GOLD }


class Creature:
	var kind: int
	var cell: Vector2i
	var dir: int
	var t := 0.0			# 0 = at the centre of cell, 1 = centre of the next
	var angle := 0.0		# display heading (radians), smoothed by the view
	var phase := 0.0		# leg / tail animation
	var tint := 0.0
	var age := 0.0
	var stuck := false
	var id := 0

	func pos() -> Vector2:
		return Vector2(cell) + Vector2(Sim.DIRS[dir]) * t

	func speed() -> float:
		return Sim.SNAKE_SPEED if kind == Sim.Kind.SNAKE else Sim.LIZARD_SPEED


class Arrow:
	var cell: Vector2i
	var dir: int
	var hp := 2
	var age := 0.0
	var order := 0


var tiles: Array[int] = []
var spawn_dir: Array[int] = []
var vwall: Array[bool] = []		# wall on the east edge of (x, y), x < W-1
var hwall: Array[bool] = []		# wall on the south edge of (x, y), y < H-1
var creatures: Array = []
var arrows: Array = []
var events: Array = []			# {type, pos, kind} consumed by the view each frame
var arcade := false
var running := false
var time := 0.0
var saved := 0
var score := 0
var lost := 0
var arrow_budget := 0
var failed := ""
var won := false
var rocket_cells: Array[Vector2i] = []
var spawners: Array[Vector2i] = []
var nests: Array[Vector2i] = []
var level: Dictionary = {}
var rng := RandomNumberGenerator.new()
var _next_id := 0
var _arrow_order := 0
var _spawn_t := 0.0
var _spawn_i := 0
var _snake_t := 4.0
var _gold_t := 12.0


# ----------------------------------------------------------------- setup ---

func load_level(def: Dictionary, arcade_mode: bool) -> void:
	level = def
	arcade = arcade_mode
	tiles.resize(W * H)
	spawn_dir.resize(W * H)
	vwall.resize((W - 1) * H)
	hwall.resize(W * (H - 1))
	tiles.fill(Tile.EMPTY)
	spawn_dir.fill(-1)
	vwall.fill(false)
	hwall.fill(false)
	creatures.clear()
	arrows.clear()
	events.clear()
	rocket_cells.clear()
	spawners.clear()
	nests.clear()
	time = 0.0
	saved = 0
	score = 0
	lost = 0
	failed = ""
	won = false
	running = false
	arrow_budget = int(def.get("arrows", 0))
	_spawn_t = 0.0
	_spawn_i = 0
	_snake_t = 5.0
	_gold_t = 12.0
	rng.seed = int(def.get("seed", 7))
	var map: Array = def["map"]
	assert(map.size() == H)
	for y in H:
		var row: String = map[y]
		assert(row.length() == W)
		for x in W:
			var ch := row[x]
			var c := Vector2i(x, y)
			match ch:
				"R":
					tiles[_i(c)] = Tile.ROCKET
					rocket_cells.append(c)
				"O":
					tiles[_i(c)] = Tile.HOLE
				"^", ">", "v", "<":
					tiles[_i(c)] = Tile.SPAWN
					spawn_dir[_i(c)] = "^>v<".find(ch)
					spawners.append(c)
				"0", "1", "2", "3":
					tiles[_i(c)] = Tile.NEST
					spawn_dir[_i(c)] = "0123".find(ch)
					nests.append(c)
				"n", "e", "s", "w":
					_spawn(Kind.LIZARD, c, "nesw".find(ch))
				"N", "E", "S", "W":
					_spawn(Kind.SNAKE, c, "NESW".find(ch))
	for w in def.get("walls", []):
		var p: PackedStringArray = (w as String).split(" ", false)
		if p[0] == "V":
			var x := int(p[1])
			for y in range(int(p[2]), int(p[3]) + 1):
				vwall[x + y * (W - 1)] = true
		elif p[0] == "H":
			var y := int(p[3])
			for x in range(int(p[1]), int(p[2]) + 1):
				hwall[x + y * W] = true


# Puts the creatures back where the level started them, keeps the arrows.
func reset_run() -> void:
	var arr: Array = arrows.duplicate()
	load_level(level, arcade)
	for a in arr:
		a.hp = 2
		a.age = 0.0
	arrows = arr


func start() -> void:
	running = true
	for c in creatures:
		_decide(c)


func _i(c: Vector2i) -> int:
	return c.x + c.y * W


func tile(c: Vector2i) -> int:
	return tiles[_i(c)]


func in_bounds(c: Vector2i) -> bool:
	return c.x >= 0 and c.y >= 0 and c.x < W and c.y < H


func blocked(c: Vector2i, d: int) -> bool:
	match d:
		0:
			return c.y == 0 or hwall[c.x + (c.y - 1) * W]
		1:
			return c.x == W - 1 or vwall[c.x + c.y * (W - 1)]
		2:
			return c.y == H - 1 or hwall[c.x + c.y * W]
		_:
			return c.x == 0 or vwall[(c.x - 1) + c.y * (W - 1)]


func _spawn(kind: int, c: Vector2i, d: int) -> Creature:
	var cr := Creature.new()
	cr.kind = kind
	cr.cell = c
	cr.dir = d
	cr.angle = dir_angle(d)
	cr.phase = rng.randf() * TAU
	cr.tint = rng.randf()
	cr.id = _next_id
	_next_id += 1
	creatures.append(cr)
	return cr


static func dir_angle(d: int) -> float:
	return [-PI / 2.0, 0.0, PI / 2.0, PI][d]


# ---------------------------------------------------------------- arrows ---

func arrow_at(c: Vector2i) -> Arrow:
	for a in arrows:
		if a.cell == c:
			return a
	return null


func can_place(c: Vector2i) -> bool:
	if not in_bounds(c) or tile(c) != Tile.EMPTY:
		return false
	if won or failed != "":
		return false
	if not arcade and running:
		return false
	return true


func arrows_left() -> int:
	return arrow_budget - arrows.size()


# Returns "placed", "turned", "full" or "no".
func place_arrow(c: Vector2i, d: int) -> String:
	if not can_place(c):
		return "no"
	var a := arrow_at(c)
	if a != null:
		a.dir = d
		a.hp = 2
		a.age = 0.0
		return "turned"
	if arcade:
		while arrows.size() >= ARROW_MAX_LIVE:
			_remove_oldest_arrow()
	elif arrows.size() >= arrow_budget:
		return "full"
	a = Arrow.new()
	a.cell = c
	a.dir = d
	a.order = _arrow_order
	_arrow_order += 1
	arrows.append(a)
	return "placed"


func remove_arrow(c: Vector2i) -> bool:
	if not arcade and running:
		return false
	var a := arrow_at(c)
	if a == null:
		return false
	arrows.erase(a)
	return true


func clear_arrows() -> void:
	if not arcade and running:
		return
	arrows.clear()


func _remove_oldest_arrow() -> void:
	var oldest: Arrow = null
	for a in arrows:
		if oldest == null or a.order < oldest.order:
			oldest = a
	if oldest != null:
		arrows.erase(oldest)


# ------------------------------------------------------------ simulation ---

func step(dt: float) -> void:
	if not running or won or failed != "":
		return
	time += dt
	if arcade:
		_arcade_spawns(dt)
		for a in arrows:
			a.age += dt
		var i := arrows.size() - 1
		while i >= 0:
			if arrows[i].age >= ARROW_LIFE:
				arrows.remove_at(i)
			i -= 1
	for c in creatures:
		_move(c, dt)
	_collisions()
	_cull()
	if arcade:
		if time >= ARCADE_LENGTH:
			won = true
			running = false
	else:
		var lizards := 0
		for c in creatures:
			if c.kind != Kind.SNAKE:
				lizards += 1
		if lizards == 0 and failed == "":
			won = true
			running = false
		elif time >= PUZZLE_TIMEOUT and failed == "":
			failed = "Round and round they go. Try a different route."
			running = false


func _move(c: Creature, dt: float) -> void:
	c.age += dt
	if c.stuck:
		return
	c.phase += dt * c.speed() * 4.0
	c.t += c.speed() * dt
	while c.t >= 1.0 and not c.stuck:
		c.t -= 1.0
		c.cell += DIRS[c.dir]
		if _arrive(c):
			return
		_decide(c)


# Tile events at a centre. Returns true if the creature is gone.
func _arrive(c: Creature) -> bool:
	match tile(c.cell):
		Tile.ROCKET:
			if c.kind == Kind.SNAKE:
				events.append({"type": "rocket_hit", "pos": Vector2(c.cell)})
				if arcade:
					var penalty := score / 3
					score -= penalty
					events.append({"type": "penalty", "pos": Vector2(c.cell), "n": penalty})
				else:
					failed = "A snake got into the rocket!"
					running = false
			else:
				saved += 1
				score += 10 if c.kind == Kind.GOLD else 1
				events.append({"type": "saved", "pos": Vector2(c.cell), "kind": c.kind})
			c.stuck = true
			c.age = -1.0
			return true
		Tile.HOLE:
			events.append({"type": "hole", "pos": Vector2(c.cell), "kind": c.kind})
			if c.kind != Kind.SNAKE:
				lost += 1
				if not arcade:
					failed = "A lizard fell down a hole."
					running = false
			c.stuck = true
			c.age = -1.0
			return true
	return false


func _decide(c: Creature) -> void:
	var a := arrow_at(c.cell)
	if a != null:
		if c.kind == Kind.SNAKE and a.dir == (c.dir + 2) % 4:
			a.hp -= 1
			if a.hp <= 0:
				arrows.erase(a)
				events.append({"type": "arrow_broken", "pos": Vector2(c.cell)})
			else:
				events.append({"type": "arrow_hit", "pos": Vector2(c.cell)})
		c.dir = a.dir
	if blocked(c.cell, c.dir):
		var r := (c.dir + 1) % 4
		var l := (c.dir + 3) % 4
		var b := (c.dir + 2) % 4
		if not blocked(c.cell, r):
			c.dir = r
		elif not blocked(c.cell, l):
			c.dir = l
		elif not blocked(c.cell, b):
			c.dir = b
		else:
			c.stuck = true


func _collisions() -> void:
	for s: Creature in creatures:
		if s.kind != Kind.SNAKE or s.age < 0.0:
			continue
		var sp := s.pos()
		for l: Creature in creatures:
			if l.kind == Kind.SNAKE or l.age < 0.0:
				continue
			if sp.distance_squared_to(l.pos()) < 0.45 * 0.45:
				l.age = -1.0
				l.stuck = true
				lost += 1
				events.append({"type": "eaten", "pos": l.pos(), "kind": l.kind})
				if not arcade:
					failed = "A lizard got eaten!"
					running = false


func _cull() -> void:
	var i := creatures.size() - 1
	while i >= 0:
		var c: Creature = creatures[i]
		if c.age < 0.0 or (arcade and c.kind == Kind.SNAKE and c.age > SNAKE_LIFE):
			creatures.remove_at(i)
		i -= 1


func _arcade_spawns(dt: float) -> void:
	if spawners.is_empty():
		return
	_spawn_t -= dt
	if _spawn_t <= 0.0:
		_spawn_t = 0.42
		var sc := spawners[_spawn_i % spawners.size()]
		_spawn_i += 1
		_spawn_from(Kind.LIZARD, sc)
	_snake_t -= dt
	if _snake_t <= 0.0:
		_snake_t = 8.0
		var n := 0
		for c in creatures:
			if c.kind == Kind.SNAKE:
				n += 1
		if n < 3:
			var src := nests if not nests.is_empty() else spawners
			var sc: Vector2i = src[rng.randi_range(0, src.size() - 1)]
			_spawn_from(Kind.SNAKE, sc)
			events.append({"type": "snake", "pos": Vector2(sc)})
	_gold_t -= dt
	if _gold_t <= 0.0:
		_gold_t = 11.0
		var sc := spawners[rng.randi_range(0, spawners.size() - 1)]
		_spawn_from(Kind.GOLD, sc)


func _spawn_from(kind: int, sc: Vector2i) -> void:
	var c := _spawn(kind, sc, spawn_dir[_i(sc)])
	_decide(c)


func time_left() -> float:
	return maxf(ARCADE_LENGTH - time, 0.0)


func count(kind: int) -> int:
	var n := 0
	for c in creatures:
		if c.kind == kind:
			n += 1
	return n
