# Debug: bake the level's terrain and print a height profile across the road
# at a given z.   godot --headless --path Game4 --script tools/dump_terrain.gd -- -1000 -140 -100
extends SceneTree

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	var z := float(args[0]) if args.size() > 0 else 0.0
	var xa := float(args[1]) if args.size() > 1 else -50.0
	var xb := float(args[2]) if args.size() > 2 else 50.0
	var lvl := Level.new()
	var t := Track.new()
	t.bake(lvl._route())
	lvl._shape_terrain()
	lvl.terrain.prepare(t)
	var x := xa
	var line := ""
	while x <= xb:
		line += "x=%5.0f h=%6.2f w=%.2f | " % [x, lvl.terrain.height_at(x, z), lvl.terrain.road_weight_at(x, z)]
		x += 2.0
	print(line)
	lvl.free()
	quit()
