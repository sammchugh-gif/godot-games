# Base for anything the hat can capture. Uncaptured it runs a little AI;
# captured it reads the player's inputs and moves itself, and the camera
# follows it instead of the kid.
class_name Capturable
extends CharacterBody3D

var kind := "thing"
var captured := false
var player: Player
var level: Node
var model: Node3D
var facing := 0.0
var focus_height := 1.2
var cam_distance := 8.0
var capture_radius := 1.4
var home := Vector3.ZERO
var anim_t := 0.0
var rng := RandomNumberGenerator.new()
var _col: CollisionShape3D


func setup(lvl: Node, p: Player) -> void:
	level = lvl
	player = p
	home = global_position
	rng.seed = int(global_position.x * 13.0 + global_position.z * 7.0)


func add_capsule(radius: float, height: float, y: float) -> void:
	_col = CollisionShape3D.new()
	var c := CapsuleShape3D.new()
	c.radius = radius
	c.height = height
	_col.shape = c
	_col.position = Vector3(0, y, 0)
	add_child(_col)
	floor_max_angle = deg_to_rad(47.0)


func capture() -> void:
	captured = true
	on_capture()


func release() -> void:
	captured = false
	on_release()


func can_release() -> bool:
	return true


func release_point() -> Vector3:
	return global_position + Vector3(0, 0.5, 0) - Vector3(-sin(facing), 0, -cos(facing)) * 1.2


func travel_dir() -> Vector3:
	return velocity


func hurt(_from: Vector3) -> void:
	pass


func on_capture() -> void:
	pass


func on_release() -> void:
	pass


func ai(_dt: float) -> void:
	pass


func drive(_dt: float) -> void:
	pass


func animate(_dt: float) -> void:
	pass


func face(dir: Vector3, dt: float, rate: float = 10.0) -> void:
	if dir.length() < 0.05:
		return
	facing = lerp_angle(facing, atan2(-dir.x, -dir.z), 1.0 - exp(-dt * rate))


func head_pos() -> Vector3:
	return global_position + Vector3(0, focus_height, 0)


func _physics_process(dt: float) -> void:
	anim_t += dt
	if captured:
		drive(dt)
	else:
		ai(dt)
	if model:
		model.rotation.y = facing
	animate(dt)
