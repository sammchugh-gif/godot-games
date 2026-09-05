# First-person digger. Walks, digs the voxel grid, and fires star bolts.
#
# There is deliberately no block placing and no flying: the only way down is to
# dig, and the only way back up is RECALL. That is what keeps "go underground"
# the whole shape of the game instead of an optional detour.
class_name Player
extends CharacterBody3D

signal hit_taken()
signal recalled()
signal blocked(reason: String)

const WALK_SPEED := 5.4
const SPRINT_SPEED := 7.6
const JUMP_VELOCITY := 7.7          # apex ~1.35m, so a single block step clears
const GRAVITY := 22.0
const ACCEL_GROUND := 15.0
const ACCEL_AIR := 4.0
const MOUSE_SENS := 0.0022
const REACH := 5.2
const DIG_POWER := 5.6
const FIRE_COOLDOWN := 0.26
const BOLT_DAMAGE := 12.0
const RECALL_COOLDOWN := 7.0
const INVULN := 1.2

const ProjectileScript = preload("res://scripts/projectile.gd")

var world: VoxelWorld
var game: Node
var debris: Debris
var touch: TouchControls          # null on desktop; drives input when active

var alive := true
# Held in place until the world's collision meshes exist. Without this the
# player falls through a half-built world, which is very visible on the web
# where the first frames are slow enough for gravity to run away.
var frozen := false
var can_recall := true
var invuln := 0.0
var recall_cool := 0.0
var target_block = null           # Vector3i or null

var camera: Camera3D
var lamp: SpotLight3D

var _pitch := 0.0
var _fire_timer := 0.0
var _bob := 0.0
var _zap_queued := false
var _recoil := 0.0
var _highlight: MeshInstance3D
var _tool: Node3D
var _tool_rest := Vector3(0.32, -0.29, -0.78)
var _swing := 0.0


func _ready() -> void:
	collision_layer = 2
	collision_mask = 1

	var shape := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.height = 1.7
	cap.radius = 0.32
	shape.shape = cap
	shape.position = Vector3(0, 0.85, 0)
	add_child(shape)

	camera = Camera3D.new()
	camera.position = Vector3(0, 1.5, 0)
	camera.fov = 76.0
	camera.far = 220.0
	add_child(camera)

	# The headlamp is what makes digging underground readable at all. Kept
	# fairly weak on purpose: crank it and every near wall blows out to white.
	lamp = SpotLight3D.new()
	lamp.light_color = Color(1.0, 0.95, 0.82)
	lamp.light_energy = 2.3
	lamp.spot_range = 22.0
	lamp.spot_angle = 38.0
	lamp.spot_angle_attenuation = 0.8
	lamp.spot_attenuation = 1.4
	lamp.shadow_enabled = false
	camera.add_child(lamp)

	# A dim fill so the edges of the cone are not pitch black.
	var glow := OmniLight3D.new()
	glow.light_color = Color(0.75, 0.85, 1.0)
	glow.light_energy = 0.3
	glow.omni_range = 7.0
	glow.shadow_enabled = false
	camera.add_child(glow)

	_build_tool()
	_build_highlight()


func _build_tool() -> void:
	_tool = Node3D.new()
	_tool.position = _tool_rest
	camera.add_child(_tool)

	var handle := MeshInstance3D.new()
	var hm := BoxMesh.new()
	hm.size = Vector3(0.05, 0.05, 0.34)
	handle.mesh = hm
	var hmat := StandardMaterial3D.new()
	hmat.albedo_color = Color(0.35, 0.28, 0.22)
	handle.set_surface_override_material(0, hmat)
	_tool.add_child(handle)

	var head := MeshInstance3D.new()
	var dm := BoxMesh.new()
	dm.size = Vector3(0.15, 0.1, 0.15)
	head.mesh = dm
	var mmat := StandardMaterial3D.new()
	mmat.albedo_color = Color(0.5, 0.54, 0.62)
	mmat.metallic = 0.6
	mmat.roughness = 0.35
	head.set_surface_override_material(0, mmat)
	head.position = Vector3(0, 0.02, -0.21)
	_tool.add_child(head)

	# A star chip set in the drill head, so the tool matches the currency.
	var chip := MeshInstance3D.new()
	chip.mesh = Star.build_star_mesh(0.02, 0.065)
	chip.set_surface_override_material(0, Star.build_material(Color(1.0, 0.82, 0.24)))
	chip.position = Vector3(0, 0.08, -0.21)
	_tool.add_child(chip)


func _build_highlight() -> void:
	_highlight = MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3.ONE * 1.02
	_highlight.mesh = bm
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(1, 1, 1, 0.16)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.cull_mode = BaseMaterial3D.CULL_BACK
	_highlight.set_surface_override_material(0, mat)
	_highlight.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_highlight.top_level = true
	_highlight.visible = false
	add_child(_highlight)


# ----------------------------------------------------------------- input ---

func _unhandled_input(event: InputEvent) -> void:
	if not alive:
		return
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		_look(-event.relative.x * MOUSE_SENS, -event.relative.y * MOUSE_SENS)


func _look(dx: float, dy: float) -> void:
	rotate_y(dx)
	_pitch = clampf(_pitch + dy, -1.45, 1.45)
	camera.rotation.x = _pitch


func _touch_active() -> bool:
	return touch != null and touch.active


# On touch there are no DIG/ZAP buttons: you act on the world directly, the
# way Minecraft does it -- hold to dig, tap to zap.
func _wants(action: String, touch_id: String) -> bool:
	if _touch_active():
		if touch_id == "dig":
			return touch.is_world_hold()
		if touch_id == "zap":
			return _zap_queued
		return touch.is_down(touch_id)
	return Input.is_action_pressed(action)


# Queued by a tap on the world; consumed by the next zap attempt.
func queue_zap() -> void:
	_zap_queued = true


# ------------------------------------------------------------------ tick ---

func _physics_process(delta: float) -> void:
	if not alive:
		return
	invuln = maxf(0.0, invuln - delta)
	recall_cool = maxf(0.0, recall_cool - delta)
	_fire_timer = maxf(0.0, _fire_timer - delta)
	_recoil = maxf(0.0, _recoil - delta * 4.0)
	_swing = maxf(0.0, _swing - delta * 3.0)

	if _touch_active():
		var look := touch.take_look_delta()
		if look != Vector2.ZERO:
			_look(-look.x * TouchControls.LOOK_SENS, -look.y * TouchControls.LOOK_SENS)

	_move(delta)
	_light_for_depth(delta)
	_aim()
	if _wants("dig", "dig"):
		_dig(delta)
	if _wants("zap", "zap"):
		_zap()
	_zap_queued = false          # a world tap fires exactly once
	_animate_tool(delta)


func _move(delta: float) -> void:
	if frozen:
		velocity = Vector3.ZERO
		return

	var input := Vector2.ZERO
	if _touch_active():
		var ax := touch.move_axis()
		input = Vector2(ax.x, ax.y)
	else:
		input = Input.get_vector("move_left", "move_right", "move_forward", "move_back")

	var dir := (transform.basis * Vector3(input.x, 0, input.y))
	dir.y = 0.0
	if dir.length() > 0.001:
		dir = dir.normalized()

	var sprint := false
	var sneak := false
	if _touch_active():
		sprint = touch.is_down("sprint")
		sneak = touch.is_down("sneak")
	else:
		sprint = Input.is_action_pressed("sprint")
		sneak = Input.is_action_pressed("sneak")
	var speed := SPRINT_SPEED if sprint else WALK_SPEED
	if sneak:
		# Minecraft-style crawl, for edging up to a drop while digging.
		speed = WALK_SPEED * 0.35
	var accel := ACCEL_GROUND if is_on_floor() else ACCEL_AIR
	velocity.x = move_toward(velocity.x, dir.x * speed, accel * speed * delta)
	velocity.z = move_toward(velocity.z, dir.z * speed, accel * speed * delta)

	if is_on_floor():
		velocity.y = -1.0
		if _wants("jump", "jump"):
			velocity.y = JUMP_VELOCITY
	else:
		velocity.y -= GRAVITY * delta
		velocity.y = maxf(velocity.y, -42.0)

	move_and_slide()

	if is_on_floor() and Vector2(velocity.x, velocity.z).length() > 0.6:
		_bob += delta * 9.0
	else:
		_bob = lerpf(_bob, 0.0, delta * 6.0)
	camera.position.y = 1.5 + sin(_bob * 2.0) * 0.045


# The lamp fades up as you go under. At full strength in daylight it just
# blows the ground in front of you out to white.
func _light_for_depth(delta: float) -> void:
	if lamp == null:
		return
	var t := clampf(depth_metres() / 7.0, 0.0, 1.0)
	lamp.light_energy = lerpf(lamp.light_energy, lerpf(0.25, 2.3, t), minf(1.0, delta * 3.0))


func _aim() -> void:
	target_block = null
	_highlight.visible = false
	if world == null:
		return
	var from := camera.global_position
	var dir := -camera.global_transform.basis.z
	var hit := world.raycast(from, dir, REACH)
	if hit.is_empty():
		return
	var p: Vector3i = hit["block"]
	if not Blocks.is_diggable(hit["id"]):
		# Still show where you are pointing, just in a "no" colour.
		_highlight.global_position = Vector3(p) + Vector3(0.5, 0.5, 0.5)
		_highlight.visible = true
		var m: StandardMaterial3D = _highlight.get_surface_override_material(0)
		m.albedo_color = Color(1.0, 0.3, 0.3, 0.18)
		return
	target_block = p
	_highlight.global_position = Vector3(p) + Vector3(0.5, 0.5, 0.5)
	_highlight.visible = true
	var mat: StandardMaterial3D = _highlight.get_surface_override_material(0)
	mat.albedo_color = Color(1, 1, 1, 0.16)


func _dig(delta: float) -> void:
	if target_block == null or world == null:
		return
	var p: Vector3i = target_block
	var id := world.get_blockv(p)
	_swing = 1.0
	if world.damage_block(p.x, p.y, p.z, DIG_POWER * delta, true):
		if debris != null:
			debris.emit_burst(Vector3(p) + Vector3(0.5, 0.5, 0.5),
				Blocks.color_of(id), 10, 4.5, 0.16)
	elif debris != null and randf() < 0.28:
		debris.emit_burst(Vector3(p) + Vector3(0.5, 0.5, 0.5),
			Blocks.color_of(id), 1, 2.2, 0.08)


func _zap() -> void:
	if _fire_timer > 0.0 or world == null:
		return
	_fire_timer = FIRE_COOLDOWN
	_recoil = 1.0
	var dir := -camera.global_transform.basis.z
	var b := Area3D.new()
	b.set_script(ProjectileScript)
	b.setup(BOLT_DAMAGE, Color(1.0, 0.85, 0.35), 52.0, true, 0.16)
	b.direction = dir
	b.world = world
	b.debris = debris
	b.life = 2.2
	get_parent().add_child(b)
	b.global_position = camera.global_position + dir * 0.6


func _animate_tool(delta: float) -> void:
	var sway := Vector3(
		sin(_bob) * 0.012,
		absf(cos(_bob)) * -0.012,
		0.0)
	var punch := Vector3(0, 0, _recoil * 0.09 + _swing * 0.05)
	_tool.position = _tool.position.lerp(_tool_rest + sway + punch, minf(1.0, delta * 14.0))
	_tool.rotation.x = lerpf(_tool.rotation.x, -_swing * 0.7, minf(1.0, delta * 16.0))


# ---------------------------------------------------------------- events ---

func take_hit(dir: Vector3) -> void:
	if not alive or invuln > 0.0:
		return
	invuln = INVULN
	velocity += dir.normalized() * 7.0 + Vector3.UP * 3.5
	emit_signal("hit_taken")


func recall() -> void:
	if not can_recall:
		emit_signal("blocked", "No recall during the boss fight")
		return
	if recall_cool > 0.0:
		emit_signal("blocked", "Recall charging: %.0fs" % ceilf(recall_cool))
		return
	if world == null:
		return
	var x := clampi(floori(global_position.x), 3, VoxelWorld.SX - 4)
	var z := clampi(floori(global_position.z), 3, VoxelWorld.SZ - 4)
	var y := world.surface_y(x, z)
	global_position = Vector3(float(x) + 0.5, float(y) + 0.3, float(z) + 0.5)
	velocity = Vector3.ZERO
	recall_cool = RECALL_COOLDOWN
	if debris != null:
		debris.emit_burst(global_position, Color(0.6, 0.9, 1.0), 18, 5.0, 0.14)
	emit_signal("recalled")


func teleport(to: Vector3) -> void:
	global_position = to
	velocity = Vector3.ZERO
	if debris != null:
		debris.emit_burst(to, Color(0.8, 0.6, 1.0), 20, 5.5, 0.15)


func depth_metres() -> float:
	if world == null:
		return 0.0
	var x := clampi(floori(global_position.x), 0, VoxelWorld.SX - 1)
	var z := clampi(floori(global_position.z), 0, VoxelWorld.SZ - 1)
	return maxf(0.0, float(world.surface_y(x, z)) - global_position.y)
