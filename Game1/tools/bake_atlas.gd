# Bakes the block atlas from real photographic textures.
#
#   godot --headless --path Game1 --script tools/bake_atlas.gd
#   godot --headless --path Game1 --script tools/bake_atlas.gd -- /path/to/GameAssets
#
# Reads the CC0 material library (default ~/Documents/GameAssets), crops and
# downsamples one Color map per block into a 4x4 atlas at PHOTO_TILE_PX per
# tile, and writes res://textures/block_atlas.png. Blocks.build_atlas() picks
# that file up at runtime when it exists and falls back to the painted 16px
# atlas when it does not, so the game never depends on the library being
# installed -- only this tool does.
#
# Tiles with no sensible photo (leaves, glass, and the three gameplay blocks)
# are taken from the painted atlas and upscaled with nearest-neighbour, so they
# keep their pixel-art read against the photographic surfaces.
extends SceneTree

const PHOTO_TILE_PX := 128

# tile id -> material folder. The Color map is <name>_1K-JPG_Color.jpg.
const SOURCES := {
	Blocks.T_GRASS_TOP: "Grass004",
	Blocks.T_DIRT: "Ground037",
	Blocks.T_STONE: "Concrete034",
	Blocks.T_PLANKS: "Planks011",
	Blocks.T_LOG_SIDE: "Wood062",
	Blocks.T_LOG_TOP: "WoodFloor041",
	Blocks.T_BRICK: "Bricks023",
	Blocks.T_METAL: "Metal032",
	Blocks.T_SAND: "Ground033",
	Blocks.T_BEDROCK: "Rock030",
}


func _initialize() -> void:
	var lib := OS.get_environment("HOME") + "/Documents/GameAssets"
	for a in OS.get_cmdline_user_args():
		if a.begins_with("/"):
			lib = a

	var n := Blocks.ATLAS_TILES
	var px := PHOTO_TILE_PX
	var out := Image.create_empty(n * px, n * px, false, Image.FORMAT_RGBA8)
	out.fill(Color(1, 0, 1, 1))

	# The painted atlas is the fallback for every tile we have no photo for.
	var painted: Image = Blocks.build_painted_atlas().get_image()

	for tile in n * n:
		var img: Image
		if SOURCES.has(tile):
			img = _load_photo(lib, SOURCES[tile], px)
		if img == null:
			img = _upscale_painted(painted, tile, px)
		out.blit_rect(img, Rect2i(0, 0, px, px), Vector2i((tile % n) * px, (tile / n) * px))

	# Grass side: dirt with a band of grass across the top, as the painted
	# version does. Blended over a few rows so it does not read as a hard cut.
	var dirt := _load_photo(lib, SOURCES[Blocks.T_DIRT], px)
	var grass := _load_photo(lib, SOURCES[Blocks.T_GRASS_TOP], px)
	if dirt != null and grass != null:
		var side := dirt.duplicate()
		var band := int(px * 0.3)
		var fade := int(px * 0.08)
		for y in band + fade:
			var t := 1.0 if y < band else 1.0 - float(y - band) / float(fade)
			for x in px:
				side.set_pixel(x, y, dirt.get_pixel(x, y).lerp(grass.get_pixel(x, y), t))
		var tile := Blocks.T_GRASS_SIDE
		out.blit_rect(side, Rect2i(0, 0, px, px), Vector2i((tile % n) * px, (tile / n) * px))

	DirAccess.make_dir_recursive_absolute("res://textures")
	var err := out.save_png("res://textures/block_atlas.png")
	if err != OK:
		printerr("save failed: %d" % err)
		quit(1)
		return
	print("wrote res://textures/block_atlas.png  (%dx%d, %d px per tile)" % [out.get_width(), out.get_height(), px])
	quit(0)


func _load_photo(lib: String, name: String, px: int) -> Image:
	var path := "%s/textures/%s/%s_1K-JPG_Color.jpg" % [lib, name, name]
	var img := Image.load_from_file(path)
	if img == null:
		printerr("missing: ", path)
		return null
	img.convert(Image.FORMAT_RGBA8)
	# Take a square crop from the middle before resizing, then a quality
	# downsample. Photo textures are already tileable so any crop tiles too.
	var s := mini(img.get_width(), img.get_height())
	var crop := img.get_region(Rect2i((img.get_width() - s) / 2, (img.get_height() - s) / 2, s, s))
	crop.resize(px, px, Image.INTERPOLATE_LANCZOS)
	return crop


func _upscale_painted(painted: Image, tile: int, px: int) -> Image:
	var r := Blocks.atlas_region_px_painted(tile)
	var t := painted.get_region(Rect2i(int(r.position.x), int(r.position.y), int(r.size.x), int(r.size.y)))
	t.resize(px, px, Image.INTERPOLATE_NEAREST)
	return t
