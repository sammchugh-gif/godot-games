# First-person builder/fighter. Handles movement, voxel editing against the
# VoxelWorld grid, and the axe used for both mining and fighting the boss.
class_name Player
extends CharacterBody3D

signal health_changed(current: float, maximum: float)
signal died()
signal looked_at_block(id: int)
signal build_rejected(reason: String)

const WALK_SPEED := 5.6
const SPRINT_SPEED := 8.6
const FLY_SPEED := 12.0
const FLY_SPRINT := 24.0
const JUMP_VELOCITY := 8.6
const GRAVITY := 24.0
const ACCEL_GROUND := 14.0
const ACCEL_AIR := 3.5
const MOUSE_SENS := 0.0022
const REACH := 7.0
const MAX_HEALTH := 100.0

# Axe: one animation drives both mining and combat.
const SWING_TIME := 0.46
const SWING_IMPACT := 0.42      # fraction of the swing where the head lands
const AXE_DAMAGE := 22.0
const MELEE_REACH := 4.2
const DOUBLE_TAP_MS := 320

var world: VoxelWorld
var game: Node
var touch: TouchControls          # null on desktop; drives input when active

var health := MAX_HEALTH
var flying := false
var can_fly := true
var can_fight := false
var can_build := true
var selected_slot := 0
var alive := true
# Held in place until the world's collision meshes exist. Without this the
# player falls through a half-built world, which is very visible on the web
# where the first frames are slow enough for gravity to run away.
var frozen := false

var _pitch := 0.0
var _regen_delay := 0.0
var _bob := 0.0
var _place_repeat := 0.0
var _last_jump_ms := 0

var _swinging := false
var _swing_t := 0.0
var _swing_hit_done := false

var camera: Camera3D
var _highlight: MeshInstance3D
var _axe: Node3D
var _axe_rest := Vector3(0.32, -0.30, -0.62)


func _ready() -> void:
	collision_layer = 2
	collision_mask = 1

	var shape := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.height = 1.8
	cap.radius = 0.34
	shape.shape = cap
	shape.position = Vector3(0, 0.9, 0)
	add_child(shape)

	camera = Camera3D.new()
	camera.position = Vector3(0, 1.62, 0)
	camera.fov = 74.0
	camera.far = 400.0
	add_child(camera)

	_build_highlight()
	_build_axe()
	floor_max_angle = deg_to_rad(50)
	floor_snap_length = 0.4


func _build_highlight() -> void:
	_highlight = MeshInstance3D.new()
	var im := ImmediateMesh.new()
	_highlight.mesh = im
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.vertex_color_use_as_albedo = true
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.albedo_color = Color(0, 0, 0, 0.85)
	_highlight.material_override = mat
	_highlight.visible = false
	_highlight.top_level = true
	add_child(_highlight)


# Blocky woodcutter's axe: haft, steel head, and a bevelled cutting edge.
func _build_axe() -> void:
	_axe = Node3D.new()
	_axe.position = _axe_rest
	_axe.rotation = Vector3(0.0, -0.22, 0.32)
	camera.add_child(_axe)

	var haft := _box(Vector3(0.036, 0.42, 0.036), Color(0.42, 0.29, 0.17))
	haft.position = Vector3(0, -0.06, 0)
	_axe.add_child(haft)

	var grip := _box(Vector3(0.042, 0.11, 0.042), Color(0.24, 0.16, 0.11))
	grip.position = Vector3(0, -0.22, 0)
	_axe.add_child(grip)

	var collar := _box(Vector3(0.055, 0.05, 0.055), Color(0.3, 0.32, 0.36))
	collar.position = Vector3(0, 0.13, 0)
	_axe.add_child(collar)

	var head := _box(Vector3(0.05, 0.14, 0.17), Color(0.52, 0.55, 0.61))
	head.position = Vector3(0, 0.16, -0.07)
	_axe.add_child(head)

	var edge := _box(Vector3(0.026, 0.19, 0.05), Color(0.82, 0.86, 0.92))
	edge.position = Vector3(0, 0.16, -0.155)
	_axe.add_child(edge)

	var back := _box(Vector3(0.05, 0.09, 0.06), Color(0.38, 0.4, 0.45))
	back.position = Vector3(0, 0.16, 0.045)
	_axe.add_child(back)


func _box(size: Vector3, col: Color) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	mi.mesh = bm
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.roughness = 0.55
	mi.set_surface_override_material(0, mat)
	return mi


func spawn_at(p: Vector3) -> void:
	global_position = p
	velocity = Vector3.ZERO
	health = MAX_HEALTH
	alive = true
	flying = false
	_swinging = false
	_swing_t = 0.0
	emit_signal("health_changed", health, MAX_HEALTH)


# -------------------------------------------------------------- input -----

func _unhandled_input(event: InputEvent) -> void:
	if not alive:
		return
	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		_apply_look(event.relative)
		return

	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			cycle_slot(-1)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			cycle_slot(1)

	if Input.get_mouse_mode() != Input.MOUSE_MODE_CAPTURED:
		return

	if event.is_action_pressed("toggle_fly"):
		toggle_fly()

	# Double-tap Space toggles flight, the way creative mode does.
	if event.is_action_pressed("jump"):
		var now := Time.get_ticks_msec()
		if now - _last_jump_ms < DOUBLE_TAP_MS:
			toggle_fly()
			_last_jump_ms = 0
		else:
			_last_jump_ms = now
	if event.is_action_pressed("break_block"):
		swing()
	if event.is_action_pressed("place_block"):
		_try_place()
	if event.is_action_pressed("pick_block"):
		_try_pick()

	for i in 9:
		if event.is_action_pressed("slot_%d" % (i + 1)):
			selected_slot = i


func _apply_look(delta_px: Vector2) -> void:
	rotate_y(-delta_px.x * MOUSE_SENS)
	_pitch = clampf(_pitch - delta_px.y * MOUSE_SENS, -1.5, 1.5)
	camera.rotation.x = _pitch


# Unified "is this control held" across mouse/keyboard and the touch overlay.
#
# Keyboard controls answer regardless of pointer lock; only the mouse-button
# ones require it, so that clicking to grab the pointer does not also swing
# the axe, and so that clicking on menus never reaches the world.
func _held(what: String) -> bool:
	if touch != null and touch.active:
		match what:
			"jump":
				return touch.is_down("jump")
			"crouch":
				return touch.is_down("sneak")
			"primary":
				# Minecraft's hold-to-mine: a finger resting on the world.
				return touch.is_world_hold()
		return false
	match what:
		"jump":
			return Input.is_action_pressed("jump")
		"crouch":
			return Input.is_action_pressed("crouch")
		"primary":
			if Input.get_mouse_mode() != Input.MOUSE_MODE_CAPTURED:
				return false
			return Input.is_action_pressed("break_block")
	return false


func toggle_fly() -> void:
	if not can_fly:
		return
	flying = not flying
	if flying:
		velocity.y = 0.0


func cycle_slot(dir: int) -> void:
	selected_slot = wrapi(selected_slot + dir, 0, Blocks.HOTBAR.size())


func selected_block() -> int:
	return Blocks.HOTBAR[selected_slot]


# ------------------------------------------------------------ movement ----

func _physics_process(delta: float) -> void:
	if not alive:
		return

	var touch_on: bool = touch != null and touch.active

	if touch_on:
		_apply_look(touch.take_look_delta() * (TouchControls.LOOK_SENS / MOUSE_SENS))

	if frozen:
		velocity = Vector3.ZERO
		_update_highlight()
		return

	# The keyboard is never gated on pointer lock. Browsers refuse to grant it
	# until the player clicks, so gating movement on it leaves them frozen on
	# load with no way to tell why. Only mouse-look needs capture.
	var input_dir := Vector2.ZERO
	if touch_on:
		input_dir = touch.move_axis()
	else:
		input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var wish := (transform.basis * Vector3(input_dir.x, 0, input_dir.y))
	wish.y = 0
	wish = wish.normalized()
	var sprinting := false
	if touch_on:
		sprinting = touch.is_down("sprint")
	else:
		sprinting = Input.is_action_pressed("sprint")

	if flying and can_fly:
		var fs: float = FLY_SPRINT if sprinting else FLY_SPEED
		var vertical := 0.0
		if _held("jump"):
			vertical += 1.0
		if _held("crouch"):
			vertical -= 1.0
		var target := wish * fs + Vector3.UP * vertical * fs
		velocity = velocity.lerp(target, clampf(delta * 12.0, 0.0, 1.0))
	else:
		if not is_on_floor():
			velocity.y -= GRAVITY * delta
		elif _held("jump"):
			velocity.y = JUMP_VELOCITY

		var speed: float = SPRINT_SPEED if sprinting else WALK_SPEED
		var accel: float = ACCEL_GROUND if is_on_floor() else ACCEL_AIR
		var target_h := wish * speed
		var vh := Vector3(velocity.x, 0, velocity.z)
		vh = vh.lerp(target_h, clampf(delta * accel, 0.0, 1.0))
		velocity.x = vh.x
		velocity.z = vh.z

	move_and_slide()
	_clamp_to_arena()

	# View bob keeps walking readable without an animation system.
	var hspeed := Vector2(velocity.x, velocity.z).length()
	if is_on_floor() and hspeed > 0.5:
		_bob += delta * hspeed * 1.5
	else:
		_bob = lerpf(_bob, 0.0, delta * 6.0)
	camera.position.y = 1.62 + sin(_bob) * 0.045

	# Holding the attack control keeps swinging.
	if _held("primary") and not _swinging:
		swing()
	_update_swing(delta)


	if _regen_delay > 0.0:
		_regen_delay -= delta
	elif health < MAX_HEALTH:
		health = minf(MAX_HEALTH, health + delta * 6.0)
		emit_signal("health_changed", health, MAX_HEALTH)

	_update_highlight()

	if global_position.y < -8.0:
		take_damage(9999.0)


# A quick tap on the world places, the way Minecraft's touch controls do.
func place_from_touch() -> void:
	if alive and not frozen:
		_try_place()


func _clamp_to_arena() -> void:
	var p := global_position
	p.x = clampf(p.x, 2.5, float(VoxelWorld.SX) - 2.5)
	p.z = clampf(p.z, 2.5, float(VoxelWorld.SZ) - 2.5)
	if p.y > float(VoxelWorld.SY) - 2.0:
		p.y = float(VoxelWorld.SY) - 2.0
		velocity.y = minf(velocity.y, 0.0)
	global_position = p


# ---------------------------------------------------------------- axe -----

func swing() -> void:
	if _swinging or not alive:
		return
	_swinging = true
	_swing_t = 0.0
	_swing_hit_done = false
	Sfx.play("swing", -7.0, 0.12)


func _update_swing(delta: float) -> void:
	if not _swinging:
		# Idle sway.
		_axe.position = _axe_rest + Vector3(0, sin(_bob) * 0.013, 0)
		_axe.rotation.x = lerpf(_axe.rotation.x, 0.0, delta * 8.0)
		_axe.rotation.z = lerpf(_axe.rotation.z, 0.32, delta * 8.0)
		return

	_swing_t += delta
	var t: float = clampf(_swing_t / SWING_TIME, 0.0, 1.0)

	# Wind up over the shoulder, then chop through.
	if t < 0.3:
		var k: float = t / 0.3
		_axe.rotation.x = lerpf(0.0, -1.15, ease(k, 0.6))
		_axe.rotation.z = lerpf(0.32, 0.62, k)
		_axe.position = _axe_rest + Vector3(0.04, 0.07, 0.05) * k
	else:
		var k: float = (t - 0.3) / 0.7
		_axe.rotation.x = lerpf(-1.15, 1.5, ease(k, 0.32))
		_axe.rotation.z = lerpf(0.62, 0.08, ease(k, 0.4))
		_axe.position = _axe_rest + Vector3(0.04, 0.07, 0.05) * (1.0 - ease(k, 0.4))

	if not _swing_hit_done and t >= SWING_IMPACT:
		_swing_hit_done = true
		_resolve_hit()

	if t >= 1.0:
		_swinging = false


# One swing hits whichever is closer along the aim ray: the boss or a block.
func _resolve_hit() -> void:
	var from := camera.global_position
	var dir := -camera.global_transform.basis.z

	var voxel := world.raycast(from, dir, REACH) if world != null else {}
	var voxel_dist := INF
	if not voxel.is_empty():
		voxel_dist = from.distance_to(voxel["point"])

	var boss_hit := {}
	var boss_dist := INF
	if can_fight:
		var space := get_world_3d().direct_space_state
		var q := PhysicsRayQueryParameters3D.create(from, from + dir * MELEE_REACH)
		q.collide_with_areas = true
		q.collide_with_bodies = false
		q.collision_mask = 8              # boss hurtboxes
		boss_hit = space.intersect_ray(q)
		if not boss_hit.is_empty():
			boss_dist = from.distance_to(boss_hit["position"])

	if not boss_hit.is_empty() and boss_dist <= voxel_dist:
		var area: Node = boss_hit["collider"]
		var mult: float = float(area.get_meta("dmg_mult", 1.0))
		var boss_node: Node = area.get_parent()
		if boss_node != null and boss_node.has_method("apply_damage"):
			boss_node.apply_damage(AXE_DAMAGE * mult, boss_hit["position"], mult > 1.0)
		return

	if not voxel.is_empty() and voxel_dist <= REACH:
		_mine(voxel)


func _mine(hit: Dictionary) -> void:
	if not can_build:
		return
	var b: Vector3i = hit["block"]
	var id: int = hit["id"]
	if id == Blocks.BEDROCK:
		emit_signal("build_rejected", "Bedrock will not break.")
		return
	var was_placed: bool = world.placed.has(VoxelWorld.idx(b.x, b.y, b.z))
	world.set_block(b.x, b.y, b.z, Blocks.AIR)
	Sfx.play("break", -2.0)
	if was_placed and game != null and game.has_method("refund"):
		game.refund(Blocks.cost(id))
	if game != null and game.has_method("spawn_break_particles"):
		game.spawn_break_particles(Vector3(b) + Vector3(0.5, 0.5, 0.5), id, 6)


# --------------------------------------------------------- block edits ----

func _aim_ray() -> Dictionary:
	if world == null:
		return {}
	var from := camera.global_position
	var dir := -camera.global_transform.basis.z
	return world.raycast(from, dir, REACH)


func _update_highlight() -> void:
	var hit := _aim_ray()
	if hit.is_empty():
		_highlight.visible = false
		emit_signal("looked_at_block", -1)
		return
	emit_signal("looked_at_block", int(hit["id"]))
	var b: Vector3i = hit["block"]
	_highlight.visible = true
	_draw_box(Vector3(b) + Vector3(0.5, 0.5, 0.5), 1.004)


func _draw_box(centre: Vector3, size: float) -> void:
	var im: ImmediateMesh = _highlight.mesh
	im.clear_surfaces()
	im.surface_begin(Mesh.PRIMITIVE_LINES)
	var h := size * 0.5
	var c := Color(0.06, 0.06, 0.08, 0.9)
	var corners := []
	for i in 8:
		corners.append(centre + Vector3(
			h if (i & 1) else -h,
			h if (i & 2) else -h,
			h if (i & 4) else -h))
	var edges := [
		[0, 1], [2, 3], [4, 5], [6, 7],
		[0, 2], [1, 3], [4, 6], [5, 7],
		[0, 4], [1, 5], [2, 6], [3, 7],
	]
	for e in edges:
		im.surface_set_color(c)
		im.surface_add_vertex(corners[e[0]])
		im.surface_set_color(c)
		im.surface_add_vertex(corners[e[1]])
	im.surface_end()


func _try_place() -> void:
	if not can_build:
		return
	var hit := _aim_ray()
	if hit.is_empty():
		return
	var b: Vector3i = hit["block"]
	var n: Vector3i = hit["normal"]
	var target := b + n
	if not VoxelWorld.in_bounds(target.x, target.y, target.z):
		return
	if world.get_blockv(target) != Blocks.AIR:
		return
	if _would_trap_self(target):
		emit_signal("build_rejected", "You are standing there.")
		return
	var id := selected_block()
	if game != null and game.has_method("try_spend"):
		if not game.try_spend(Blocks.cost(id)):
			emit_signal("build_rejected", "Not enough credits for %s." % Blocks.name_of(id))
			return
	world.set_block(target.x, target.y, target.z, id, true)
	Sfx.play("place", -5.0)


func _would_trap_self(target: Vector3i) -> bool:
	# Block AABB vs the player capsule's bounding box.
	var bmin := Vector3(target)
	var bmax := bmin + Vector3.ONE
	var pmin := global_position + Vector3(-0.36, 0.0, -0.36)
	var pmax := global_position + Vector3(0.36, 1.85, 0.36)
	return (pmin.x < bmax.x and pmax.x > bmin.x
		and pmin.y < bmax.y and pmax.y > bmin.y
		and pmin.z < bmax.z and pmax.z > bmin.z)


func _try_pick() -> void:
	var hit := _aim_ray()
	if hit.is_empty():
		return
	var id: int = hit["id"]
	var i := Blocks.HOTBAR.find(id)
	if i >= 0:
		selected_slot = i


# ------------------------------------------------------------ damage -----

func take_damage(amount: float) -> void:
	if not alive:
		return
	health -= amount
	_regen_delay = 4.0
	if amount > 0.5:
		Sfx.play("hit", -2.0)
	emit_signal("health_changed", maxf(health, 0.0), MAX_HEALTH)
	if health <= 0.0:
		alive = false
		emit_signal("died")


func knockback(dir: Vector3, force: float) -> void:
	if flying:
		return
	velocity += dir.normalized() * force
	velocity.y = maxf(velocity.y, force * 0.35)
