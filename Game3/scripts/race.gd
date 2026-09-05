# One race: the circuit, eight ships, weapons in flight, mines, collisions,
# ranking, the chase camera and the countdown / finish state machine.
# step(dt) is separate from _process so the headless self-test can drive it.
class_name Race
extends Node3D

signal countdown_tick(n: int)
signal race_finished(results: Array)
signal notice(text: String, color: Color)
signal player_lap(lap: int, total: int, lap_time: float)
signal effect(kind: String, ship: Ship)

enum State { COUNTDOWN, RUNNING, FINISHED }

const ROCKET_DMG := 14.0
const MISSILE_DMG := 24.0
const MINE_DMG := 20.0

var track: Track
var ships: Array = []
var player: Ship
var state := State.COUNTDOWN
var race_time := 0.0
var countdown := 3.9
var laps := 3
var projectiles: Array = []
var mines: Array = []
var camera: Camera3D
var cam_shake := 0.0
var results: Array = []
var headless := false
var finish_order: Array = []
var _rank_t := 0.0
var _last_tick := 4
var _cam_pos := Vector3.ZERO
var _cam_init := false
var _explosions: Array = []
var _boost_glow := 0.0
var _finished_t := 0.0
var _results_sent := false
var cinematic := false
var _cine_t := 0.0


func build(track_def: Dictionary, player_team: int, teams: Array) -> void:
	track = Track.new()
	add_child(track)
	track.build(track_def)
	laps = int(track_def["laps"])
	# Player + 7 rivals in a shuffled grid; the player starts mid-pack.
	var order: Array = []
	for i in teams.size():
		if i != player_team:
			order.append(i)
	order.shuffle()
	var slot_list: Array = []
	for i in 8:
		slot_list.append(i)
	var player_slot := 5
	var k := 0
	for slot in 8:
		var team_idx: int
		var is_p := slot == player_slot
		if is_p:
			team_idx = player_team
		else:
			team_idx = order[k]
			k += 1
		var sh := Ship.new()
		add_child(sh)
		sh.setup(track, teams[team_idx], slot, is_p)
		sh.ai_skill = randf_range(0.55, 1.0)
		sh.place_on_grid(track.grid[slot])
		sh.fired.connect(_on_fired)
		sh.wall_hit.connect(_on_wall_hit)
		sh.landed.connect(_on_landed)
		sh.pad_taken.connect(_on_pad)
		sh.lap_done.connect(_on_lap)
		sh.damaged.connect(_on_damaged)
		ships.append(sh)
		if is_p:
			player = sh
	camera = Camera3D.new()
	camera.fov = 72.0
	camera.near = 0.3
	camera.far = 4000.0
	add_child(camera)
	camera.current = true
	_update_camera(0.0, true)
	_build_explosions()


func set_player_input(steer: float, brake: float, fire: bool, thrust: float = 1.0) -> void:
	if player == null or player.finished:
		return
	player.in_steer = steer
	player.in_brake = brake
	player.in_thrust = thrust
	if fire:
		player.in_fire = true


func _process(delta: float) -> void:
	if headless:
		return
	step(minf(delta, 0.05))


func step(dt: float) -> void:
	if state == State.COUNTDOWN:
		countdown -= dt
		var n := int(ceil(countdown))
		if n != _last_tick:
			_last_tick = n
			countdown_tick.emit(n)
		if countdown <= 0.0:
			state = State.RUNNING
			race_time = 0.0
			for sh in ships:
				sh.lap_start = 0.0
				sh.controls_locked = false
	elif state == State.RUNNING or state == State.FINISHED:
		race_time += dt
	var running := state != State.COUNTDOWN
	for sh in ships:
		sh.sim(dt, race_time, running, ships, player)
		if sh.scraping and not headless:
			sh.spark_scrape()
	_collide_ships()
	_step_projectiles(dt)
	_step_mines(dt)
	_rank_t -= dt
	if _rank_t <= 0.0:
		_rank_t = 0.15
		_rank()
	if state == State.FINISHED:
		_finished_t += dt
		if _finished_t > 2.5 and not _results_sent:
			_results_sent = true
			race_finished.emit(_make_results())
	if not headless:
		_update_camera(dt, false)
		for e in _explosions:
			pass
	cam_shake = maxf(cam_shake - dt * 2.0, 0.0)


# --------------------------------------------------------------- ranking ---

func _rank() -> void:
	var order := ships.duplicate()
	order.sort_custom(func(a, b):
		if a.finished != b.finished:
			return a.finished
		if a.finished and b.finished:
			return a.finish_time < b.finish_time
		return a.progress > b.progress)
	for i in order.size():
		order[i].set_meta("rank", i + 1)


func rank_of(sh: Ship) -> int:
	return int(sh.get_meta("rank", 8))


func _on_lap(sh: Ship) -> void:
	if sh.lap >= laps and not sh.finished:
		sh.finished = true
		sh.finish_time = race_time
		finish_order.append(sh)
		if sh == player:
			state = State.FINISHED
			_rank()
			notice.emit("FINISH!  P%d" % rank_of(player), Color(1.0, 0.9, 0.3))
			effect.emit("finish", player)
	elif sh == player:
		var lt: float = sh.lap_times[-1] if not sh.lap_times.is_empty() else 0.0
		player_lap.emit(sh.lap, laps, lt)
		if sh.lap == laps - 1:
			notice.emit("FINAL LAP", Color(1.0, 0.5, 0.2))
		effect.emit("lap", player)


func _make_results() -> Array:
	_rank()
	var order := ships.duplicate()
	order.sort_custom(func(a, b): return rank_of(a) < rank_of(b))
	var out: Array = []
	for sh in order:
		var t: float = sh.finish_time if sh.finished else -1.0
		out.append({"name": sh.team_name, "color": sh.team["color"], "time": t, "best": sh.best_lap, "player": sh == player, "rank": rank_of(sh), "laps": sh.lap})
	return out


# ----------------------------------------------------------- collisions ---

func _collide_ships() -> void:
	var cnt := ships.size()
	for i in cnt:
		var a: Ship = ships[i]
		for j in range(i + 1, cnt):
			var b: Ship = ships[j]
			var ds := track.wrap_s(b.s - a.s)
			if ds > track.length * 0.5:
				ds -= track.length
			if absf(ds) > 4.6 or absf(a.x - b.x) > 3.3 or absf(a.h - b.h) > 2.2:
				continue
			var sg := 1.0 if b.x >= a.x else -1.0
			var overlap := 3.3 - absf(a.x - b.x)
			a.x -= sg * overlap * 0.5
			b.x += sg * overlap * 0.5
			a.slide -= sg * 2.5
			b.slide += sg * 2.5
			var rel := absf(a.v - b.v)
			# Momentum goes from the faster ship to the slower one, once.
			var push := rel * 0.35
			if a.v > b.v:
				a.v -= push
				b.v += push * 0.6
			else:
				b.v -= push
				a.v += push * 0.6
			if rel > 4.0 or absf(a.x - b.x) < 2.0:
				effect.emit("bump", a if a == player or b == player else null)
				if a == player or b == player:
					cam_shake = maxf(cam_shake, 0.25)


# ------------------------------------------------------------- weapons ---

func _on_fired(sh: Ship, weapon: int) -> void:
	match weapon:
		Ship.Weapon.ROCKETS:
			for off in [-2.2, 0.0, 2.2]:
				_spawn_projectile(sh, "rocket", off)
			effect.emit("rocket", sh)
		Ship.Weapon.MISSILE:
			_spawn_projectile(sh, "missile", 0.0)
			effect.emit("missile", sh)
		Ship.Weapon.MINES:
			_spawn_mine(sh)
			effect.emit("mine", sh)
		Ship.Weapon.SHIELD:
			effect.emit("shield", sh)
		Ship.Weapon.TURBO:
			effect.emit("turbo", sh)


func _spawn_projectile(owner: Ship, kind: String, xoff: float) -> void:
	var node := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(0.35, 0.35, 1.6) if kind == "rocket" else Vector3(0.5, 0.5, 2.2)
	node.mesh = bm
	var col := Color(1.0, 0.55, 0.15) if kind == "rocket" else Color(0.3, 0.9, 1.0)
	node.material_override = Mats.glow(col, 4.0, false)
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(node)
	var target: Ship = null
	if kind == "missile":
		var best := 1e9
		for o in ships:
			if o == owner:
				continue
			var d := track.wrap_s(o.s - owner.s)
			if d > 6.0 and d < 220.0 and d < best:
				best = d
				target = o
	projectiles.append({
		"node": node, "kind": kind, "owner": owner, "target": target,
		"s": owner.s + 4.0, "x": clampf(owner.x + xoff, -track.limit_at(owner.s, 0.5), track.limit_at(owner.s, 0.5)),
		"h": owner.h + 0.2, "v": owner.v + (55.0 if kind == "rocket" else 48.0),
		"life": 2.6 if kind == "rocket" else 4.5, "age": 0.0,
	})


func _spawn_mine(owner: Ship) -> void:
	var node := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.7
	sm.height = 1.4
	sm.radial_segments = 10
	sm.rings = 6
	node.mesh = sm
	node.material_override = Mats.glow(Color(1.0, 0.2, 0.3), 3.0, false)
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(node)
	var s := track.wrap_s(owner.s - 6.0)
	node.global_transform = track.xform(s, owner.x, 0.9)
	mines.append({"node": node, "owner": owner, "s": s, "x": owner.x, "life": 35.0, "age": 0.0})


func _step_projectiles(dt: float) -> void:
	var i := projectiles.size() - 1
	while i >= 0:
		var p: Dictionary = projectiles[i]
		p["age"] += dt
		p["life"] -= dt
		p["s"] = track.wrap_s(p["s"] + p["v"] * dt)
		if p["kind"] == "missile" and p["target"] != null:
			var t: Ship = p["target"] as Ship
			p["x"] = move_toward(p["x"], t.x, 14.0 * dt)
			p["h"] = move_toward(p["h"], t.h + 0.2, 4.0 * dt)
		var lim := track.limit_at(p["s"], 0.3)
		var dead: bool = p["life"] <= 0.0
		var boom := false
		if absf(p["x"]) > lim:
			dead = true
			boom = true
		if not dead:
			for sh in ships:
				if sh == p["owner"] and p["age"] < 0.4:
					continue
				var ds := track.wrap_s(sh.s - p["s"])
				if ds > track.length * 0.5:
					ds -= track.length
				if absf(ds) < 3.4 and absf(sh.x - p["x"]) < 2.6 and absf(sh.h - p["h"]) < 2.2:
					var dmg := ROCKET_DMG if p["kind"] == "rocket" else MISSILE_DMG
					var landed: bool = sh.hit(dmg, 1.0 if sh.x < p["x"] else -1.0, p["kind"] == "missile")
					_explode(track.point(p["s"], p["x"], p["h"]), sh == player)
					effect.emit("hit" if landed else "shield_hit", sh)
					if sh == player:
						cam_shake = maxf(cam_shake, 0.9)
					dead = true
					boom = false
					break
		if dead:
			if boom:
				_explode(track.point(p["s"], p["x"], p["h"]), false)
			p["node"].queue_free()
			projectiles.remove_at(i)
		else:
			var xf := track.xform(p["s"], p["x"], p["h"])
			p["node"].global_transform = xf
		i -= 1


func _step_mines(dt: float) -> void:
	var i := mines.size() - 1
	while i >= 0:
		var m: Dictionary = mines[i]
		m["age"] += dt
		m["life"] -= dt
		var dead: bool = m["life"] <= 0.0
		if m["age"] > 0.9:
			for sh in ships:
				var ds := track.wrap_s(sh.s - m["s"])
				if ds > track.length * 0.5:
					ds -= track.length
				if absf(ds) < 3.2 and absf(sh.x - m["x"]) < 2.7 and sh.h < 2.2:
					var landed: bool = sh.hit(MINE_DMG, 1.0 if randf() < 0.5 else -1.0, true)
					_explode(m["node"].global_position, sh == player)
					effect.emit("hit" if landed else "shield_hit", sh)
					if sh == player:
						cam_shake = maxf(cam_shake, 1.0)
					dead = true
					break
		if dead:
			m["node"].queue_free()
			mines.remove_at(i)
		else:
			var b := 0.8 + 0.2 * sin(m["age"] * 9.0)
			m["node"].scale = Vector3(b, b, b)
		i -= 1


func _on_wall_hit(sh: Ship, impact: float) -> void:
	if sh == player:
		cam_shake = maxf(cam_shake, clampf(impact / 30.0, 0.2, 0.8))
	effect.emit("wall", sh)


func _on_landed(sh: Ship, impact: float) -> void:
	if sh == player:
		cam_shake = maxf(cam_shake, 0.3)
		effect.emit("land", sh)


func _on_pad(sh: Ship, kind: String) -> void:
	if sh == player:
		if kind == "boost":
			effect.emit("boost", sh)
		else:
			effect.emit("pickup", sh)
			notice.emit(sh.weapon_name(), Color(1.0, 0.3, 0.8))


func _on_damaged(sh: Ship, amount: float) -> void:
	if sh == player and sh.energy <= 0.0:
		notice.emit("ENERGY CRITICAL", Color(1.0, 0.25, 0.2))


# ----------------------------------------------------------- explosions ---

func _build_explosions() -> void:
	if headless:
		return
	for i in 4:
		var e := CPUParticles3D.new()
		e.emitting = false
		e.one_shot = true
		e.amount = 14
		e.lifetime = 0.65
		e.explosiveness = 1.0
		e.spread = 180.0
		e.direction = Vector3(0, 1, 0)
		e.initial_velocity_min = 3.0
		e.initial_velocity_max = 9.0
		e.gravity = Vector3(0, -3, 0)
		e.scale_amount_min = 1.5
		e.scale_amount_max = 4.0
		e.color = Color(1.0, 0.7, 0.4)
		var qm := QuadMesh.new()
		qm.size = Vector2(1.0, 1.0)
		e.mesh = qm
		e.mesh.surface_set_material(0, Mats.sprite("explosion", Color(1, 1, 1), true, true))
		add_child(e)
		_explosions.append(e)


var _expl_i := 0
func _explode(at: Vector3, big: bool) -> void:
	if headless or _explosions.is_empty():
		return
	var e: CPUParticles3D = _explosions[_expl_i % _explosions.size()]
	_expl_i += 1
	e.global_position = at
	e.scale = Vector3.ONE * (1.6 if big else 1.0)
	e.restart()
	e.emitting = true


# --------------------------------------------------------------- camera ---

func _update_camera(dt: float, snap: bool) -> void:
	if player == null:
		return
	var sh := player
	if cinematic:
		_cine_t += dt
		var ang := _cine_t * 0.25
		var cs0 := sh.s + cos(ang) * 16.0
		var cx0 := sin(ang) * 22.0
		var target0 := track.point(cs0, clampf(cx0, -sh.track.width_at(cs0) * 0.5 - 6.0, sh.track.width_at(cs0) * 0.5 + 6.0), 6.0 + 3.0 * sin(_cine_t * 0.4))
		if snap or not _cam_init:
			_cam_pos = target0
			_cam_init = true
		else:
			_cam_pos = _cam_pos.lerp(target0, 1.0 - exp(-3.0 * dt))
		camera.global_position = _cam_pos
		camera.look_at(sh.global_position + Vector3(0, 0.5, 0), Vector3.UP)
		camera.fov = 60.0
		return
	var back := 6.8 + sh.v * 0.022
	var cs := sh.s - back
	var target := track.point(cs, sh.x * 0.8, 2.7 + (sh.h - Ship.HOVER) * 0.5)
	if snap or not _cam_init:
		_cam_pos = target
		_cam_init = true
	else:
		_cam_pos = _cam_pos.lerp(target, 1.0 - exp(-9.0 * dt))
	var look := track.point(sh.s + 13.0, sh.x * 0.55, 1.5)
	var up := track.xform(cs).basis.y.lerp(Vector3.UP, 0.35).normalized()
	var shake := Vector3.ZERO
	if cam_shake > 0.0:
		shake = Vector3(randf_range(-1, 1), randf_range(-1, 1), randf_range(-1, 1)) * cam_shake * 0.35
	camera.global_position = _cam_pos + shake
	camera.look_at(look + shake * 0.5, up)
	var speed_frac := clampf(sh.v / sh.max_speed, 0.0, 1.3)
	var target_fov := 70.0 + speed_frac * 16.0 + (10.0 if sh.boost_t > 0.0 else 0.0)
	camera.fov = lerpf(camera.fov, target_fov, 1.0 - exp(-4.0 * dt)) if not snap else target_fov
