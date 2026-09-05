# Dash pads: a glowing arrowed plate that snaps Sonic to a direction and
# speed. Lays flush with whatever surface it sits on.
class_name DashPad
extends Area3D

var dir := Vector3.FORWARD
var spd := 48.0
var _arrow: MeshInstance3D
var _t := 0.0


static func make(pos: Vector3, direction: Vector3, speed: float = 48.0, up: Vector3 = Vector3.UP) -> DashPad:
	var d := DashPad.new()
	d.dir = direction.normalized()
	d.spd = speed
	d.position = pos
	d.basis = MeshLib.basis_forward(d.dir, up)
	return d


func _ready() -> void:
	collision_layer = 8
	collision_mask = 2
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = Vector3(3.6, 1.6, 3.0)
	cs.shape = sh
	cs.position = Vector3(0, 0.6, 0)
	add_child(cs)
	var b := MeshLib.Builder.new()
	b.box(Vector3(0, 0.05, 0), Vector3(3.4, 0.1, 2.8))
	add_child(b.commit(Mats.pbr(Color(0.15, 0.17, 0.2), 0.5, 0.6), "Plate"))
	var a := MeshLib.Builder.new()
	# Chevron pair pointing -Z (forward).
	for i in 2:
		var z := 0.6 - i * 1.0
		a.quad(Vector3(-1.2, 0.11, z + 0.5), Vector3(0, 0.11, z - 0.3), Vector3(0, 0.11, z + 0.1), Vector3(-1.2, 0.11, z + 0.9))
		a.quad(Vector3(0, 0.11, z - 0.3), Vector3(1.2, 0.11, z + 0.5), Vector3(1.2, 0.11, z + 0.9), Vector3(0, 0.11, z + 0.1))
	_arrow = a.commit(Mats.glow(Color(1.0, 0.85, 0.2), 2.5, 0.3), "Arrows")
	add_child(_arrow)
	body_entered.connect(_on_body)


func _process(dt: float) -> void:
	_t += dt
	var m := _arrow.material_override as StandardMaterial3D
	m.emission_energy_multiplier = 1.8 + 1.2 * (0.5 + 0.5 * sin(_t * 9.0))


func _on_body(b: Node3D) -> void:
	if b is Player:
		(b as Player).dash_pad(dir, spd)
		var lvl := get_tree().get_first_node_in_group("level")
		if lvl and lvl.has_method("dash_fx"):
			lvl.call("dash_fx", global_position, dir)
