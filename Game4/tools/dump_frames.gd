# Debug: bake the route and print the frames between two distances.
#   godot --headless --path Game4 --script tools/dump_frames.gd -- 1070 1110
extends SceneTree

func _init() -> void:
	var args := OS.get_cmdline_user_args()
	var s0 := float(args[0]) if args.size() > 0 else 0.0
	var s1 := float(args[1]) if args.size() > 1 else 100.0
	var lvl := Level.new()
	var t := Track.new()
	t.bake(lvl._route())
	for fr in t.frames:
		if fr["s"] >= s0 and fr["s"] <= s1:
			print("s=%7.1f %-8s w=%4.1f p=%s f=%s r=%s u=%s" % [fr["s"], fr["kind"], fr["w"], (fr["p"] as Vector3).snapped(Vector3.ONE * 0.01), (fr["f"] as Vector3).snapped(Vector3.ONE * 0.01), (fr["r"] as Vector3).snapped(Vector3.ONE * 0.01), (fr["u"] as Vector3).snapped(Vector3.ONE * 0.01)])
	lvl.free()
	quit()
