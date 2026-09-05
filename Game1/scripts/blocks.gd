# Block definitions plus the block texture atlas.
#
# Two atlases exist. The painted one is generated in code at startup and needs
# no files at all. The photo one, res://textures/block_atlas.png, is baked by
# tools/bake_atlas.gd from real CC0 textures and is used whenever it is
# present. Everything downstream reads the tile size from atlas_tile_px so
# either can be swapped in without touching the mesher or the HUD.
class_name Blocks
extends RefCounted

const AIR := 0
const GRASS := 1
const DIRT := 2
const STONE := 3
const PLANKS := 4
const LOG := 5
const LEAVES := 6
const BRICK := 7
const METAL := 8
const GLASS := 9
const SAND := 10
const BEDROCK := 11
const TNT := 12
const SPIKE := 13
const TURRET := 14
const COUNT := 15

# Atlas is 4x4 tiles of 16x16 pixels.
const TILE_PX := 16
const ATLAS_TILES := 4
const ATLAS_PX := TILE_PX * ATLAS_TILES

const T_GRASS_TOP := 0
const T_GRASS_SIDE := 1
const T_DIRT := 2
const T_STONE := 3
const T_PLANKS := 4
const T_LOG_SIDE := 5
const T_LOG_TOP := 6
const T_LEAVES := 7
const T_BRICK := 8
const T_METAL := 9
const T_GLASS := 10
const T_SAND := 11
const T_BEDROCK := 12
const T_TNT := 13
const T_SPIKE := 14
const T_TURRET := 15

const DATA := [
	{"name": "Air", "top": 0, "bottom": 0, "side": 0, "hardness": 0.0, "cost": 0, "transparent": true, "color": Color(0, 0, 0, 0)},
	{"name": "Grass", "top": T_GRASS_TOP, "bottom": T_DIRT, "side": T_GRASS_SIDE, "hardness": 2.0, "cost": 2, "transparent": false, "color": Color(0.36, 0.62, 0.28)},
	{"name": "Dirt", "top": T_DIRT, "bottom": T_DIRT, "side": T_DIRT, "hardness": 2.0, "cost": 2, "transparent": false, "color": Color(0.45, 0.33, 0.22)},
	{"name": "Stone", "top": T_STONE, "bottom": T_STONE, "side": T_STONE, "hardness": 9.0, "cost": 8, "transparent": false, "color": Color(0.53, 0.53, 0.55)},
	{"name": "Planks", "top": T_PLANKS, "bottom": T_PLANKS, "side": T_PLANKS, "hardness": 4.0, "cost": 4, "transparent": false, "color": Color(0.67, 0.5, 0.29)},
	{"name": "Log", "top": T_LOG_TOP, "bottom": T_LOG_TOP, "side": T_LOG_SIDE, "hardness": 6.0, "cost": 6, "transparent": false, "color": Color(0.45, 0.33, 0.19)},
	{"name": "Leaves", "top": T_LEAVES, "bottom": T_LEAVES, "side": T_LEAVES, "hardness": 1.0, "cost": 1, "transparent": true, "color": Color(0.27, 0.55, 0.22)},
	{"name": "Brick", "top": T_BRICK, "bottom": T_BRICK, "side": T_BRICK, "hardness": 14.0, "cost": 14, "transparent": false, "color": Color(0.6, 0.28, 0.23)},
	{"name": "Steel", "top": T_METAL, "bottom": T_METAL, "side": T_METAL, "hardness": 26.0, "cost": 30, "transparent": false, "color": Color(0.62, 0.65, 0.7)},
	{"name": "Glass", "top": T_GLASS, "bottom": T_GLASS, "side": T_GLASS, "hardness": 1.0, "cost": 5, "transparent": true, "color": Color(0.75, 0.88, 0.95, 0.45)},
	{"name": "Sand", "top": T_SAND, "bottom": T_SAND, "side": T_SAND, "hardness": 1.5, "cost": 2, "transparent": false, "color": Color(0.83, 0.77, 0.55)},
	{"name": "Bedrock", "top": T_BEDROCK, "bottom": T_BEDROCK, "side": T_BEDROCK, "hardness": 1000000000.0, "cost": 0, "transparent": false, "color": Color(0.22, 0.22, 0.24)},
	{"name": "TNT Charge", "top": T_TNT, "bottom": T_TNT, "side": T_TNT, "hardness": 3.0, "cost": 45, "transparent": false, "color": Color(0.72, 0.18, 0.14)},
	{"name": "Spike Trap", "top": T_SPIKE, "bottom": T_SPIKE, "side": T_SPIKE, "hardness": 7.0, "cost": 18, "transparent": false, "color": Color(0.55, 0.58, 0.62)},
	{"name": "Turret", "top": T_TURRET, "bottom": T_TURRET, "side": T_TURRET, "hardness": 9.0, "cost": 70, "transparent": false, "color": Color(0.3, 0.55, 0.72)},
]

# Blocks the player can select, in hotbar order (keys 1..9).
const HOTBAR := [PLANKS, LOG, STONE, BRICK, METAL, GLASS, TNT, SPIKE, TURRET]

const DESCRIPTIONS := {
	PLANKS: "Cheap filler. Splinters fast under the hammer.",
	LOG: "Sturdier wood, good for pillars.",
	STONE: "Solid all-rounder for walls.",
	BRICK: "Tough masonry. Costs more, holds longer.",
	METAL: "Toughest plating in the game.",
	GLASS: "See-through and fragile. Windows only.",
	TNT: "Detonates when the boss closes in. Huge damage.",
	SPIKE: "Wounds the boss whenever it stands next to it.",
	TURRET: "Auto-fires bolts at the boss while it stands.",
}

static func name_of(id: int) -> String:
	return DATA[id]["name"]

static func hardness(id: int) -> float:
	return DATA[id]["hardness"]

static func cost(id: int) -> int:
	return DATA[id]["cost"]

static func is_transparent(id: int) -> bool:
	return DATA[id]["transparent"]

static func color_of(id: int) -> Color:
	return DATA[id]["color"]

static func tile_for_face(id: int, face: int) -> int:
	# face: 0 +X, 1 -X, 2 +Y, 3 -Y, 4 +Z, 5 -Z
	if face == 2:
		return DATA[id]["top"]
	if face == 3:
		return DATA[id]["bottom"]
	return DATA[id]["side"]


# ---------------------------------------------------------------- atlas ----

static func _hash2(x: int, y: int, s: int) -> float:
	var h: int = x * 374761393 + y * 668265263 + s * 1442695040
	h = (h ^ (h >> 13)) * 1274126177
	h = h ^ (h >> 16)
	return float(h & 0xFFFF) / 65535.0

static func _shade(c: Color, amount: float) -> Color:
	return Color(
		clampf(c.r + amount, 0.0, 1.0),
		clampf(c.g + amount, 0.0, 1.0),
		clampf(c.b + amount, 0.0, 1.0),
		c.a)

static func _paint(img: Image, tile: int, x: int, y: int, c: Color) -> void:
	if x < 0 or y < 0 or x >= TILE_PX or y >= TILE_PX:
		return
	var ox: int = (tile % ATLAS_TILES) * TILE_PX
	var oy: int = (tile / ATLAS_TILES) * TILE_PX
	img.set_pixel(ox + x, oy + y, c)

static func _fill_noise(img: Image, tile: int, base: Color, amp: float, seed_v: int) -> void:
	for y in TILE_PX:
		for x in TILE_PX:
			var n: float = (_hash2(x, y, seed_v) - 0.5) * 2.0 * amp
			_paint(img, tile, x, y, _shade(base, n))

const PHOTO_ATLAS := "res://textures/block_atlas.png"

# Pixels per tile of whichever atlas build_atlas() returned last.
static var atlas_tile_px: int = TILE_PX


static func build_atlas() -> ImageTexture:
	if ResourceLoader.exists(PHOTO_ATLAS):
		var tex: Texture2D = load(PHOTO_ATLAS)
		if tex != null and tex.get_width() % ATLAS_TILES == 0:
			atlas_tile_px = tex.get_width() / ATLAS_TILES
			var img := tex.get_image()
			if img.is_compressed():
				img.decompress()
			return ImageTexture.create_from_image(img)
	atlas_tile_px = TILE_PX
	return build_painted_atlas()


static func build_painted_atlas() -> ImageTexture:
	var img := Image.create_empty(ATLAS_PX, ATLAS_PX, false, Image.FORMAT_RGBA8)
	img.fill(Color(1, 0, 1, 1))

	_fill_noise(img, T_GRASS_TOP, Color(0.35, 0.63, 0.26), 0.09, 11)
	_fill_noise(img, T_DIRT, Color(0.46, 0.33, 0.21), 0.08, 12)

	# Grass side: dirt with a ragged grass lip along the top.
	_fill_noise(img, T_GRASS_SIDE, Color(0.46, 0.33, 0.21), 0.08, 12)
	for x in TILE_PX:
		var lip: int = 3 + int(_hash2(x, 0, 31) * 2.6)
		for y in lip:
			var n: float = (_hash2(x, y, 11) - 0.5) * 0.18
			_paint(img, T_GRASS_SIDE, x, y, _shade(Color(0.35, 0.63, 0.26), n))

	_fill_noise(img, T_STONE, Color(0.53, 0.53, 0.55), 0.1, 13)
	for i in 9:
		var sx: int = int(_hash2(i, 3, 77) * 13.0)
		var sy: int = int(_hash2(i, 9, 78) * 13.0)
		for k in 3:
			_paint(img, T_STONE, sx + k, sy, _shade(Color(0.53, 0.53, 0.55), -0.13))

	_fill_noise(img, T_SAND, Color(0.84, 0.78, 0.56), 0.07, 14)
	_fill_noise(img, T_BEDROCK, Color(0.24, 0.24, 0.26), 0.16, 15)

	# Leaves: punched-out gaps so you can see through the canopy.
	for y in TILE_PX:
		for x in TILE_PX:
			var r: float = _hash2(x, y, 21)
			if r < 0.10:
				_paint(img, T_LEAVES, x, y, Color(0, 0, 0, 0))
			else:
				_paint(img, T_LEAVES, x, y, _shade(Color(0.24, 0.52, 0.2), (r - 0.5) * 0.16))

	# Planks: horizontal boards with dark seams and knots.
	_fill_noise(img, T_PLANKS, Color(0.68, 0.51, 0.3), 0.05, 22)
	for y in TILE_PX:
		if y % 4 == 3:
			for x in TILE_PX:
				_paint(img, T_PLANKS, x, y, _shade(Color(0.68, 0.51, 0.3), -0.22))
	for i in 4:
		var nx: int = int(_hash2(i, 1, 55) * 15.0)
		_paint(img, T_PLANKS, nx, i * 4 + 1, _shade(Color(0.68, 0.51, 0.3), -0.14))

	_fill_noise(img, T_LOG_SIDE, Color(0.42, 0.31, 0.18), 0.07, 23)
	for x in TILE_PX:
		if x % 3 == 0:
			for y in TILE_PX:
				_paint(img, T_LOG_SIDE, x, y, _shade(Color(0.42, 0.31, 0.18), -0.12))

	_fill_noise(img, T_LOG_TOP, Color(0.62, 0.47, 0.28), 0.05, 24)
	for y in TILE_PX:
		for x in TILE_PX:
			var d: float = Vector2(x - 7.5, y - 7.5).length()
			if int(d) % 3 == 0:
				_paint(img, T_LOG_TOP, x, y, _shade(Color(0.62, 0.47, 0.28), -0.13))

	# Brick: running bond with pale mortar.
	_fill_noise(img, T_BRICK, Color(0.6, 0.28, 0.23), 0.06, 25)
	for y in TILE_PX:
		var row: int = y / 4
		for x in TILE_PX:
			var offset: int = 0 if row % 2 == 0 else 4
			if y % 4 == 0 or (x + offset) % 8 == 0:
				_paint(img, T_BRICK, x, y, Color(0.78, 0.75, 0.71))

	# Steel: bevelled plate with rivets.
	_fill_noise(img, T_METAL, Color(0.6, 0.63, 0.69), 0.05, 26)
	for x in TILE_PX:
		_paint(img, T_METAL, x, 0, _shade(Color(0.6, 0.63, 0.69), 0.16))
		_paint(img, T_METAL, x, TILE_PX - 1, _shade(Color(0.6, 0.63, 0.69), -0.18))
		_paint(img, T_METAL, 0, x, _shade(Color(0.6, 0.63, 0.69), 0.1))
		_paint(img, T_METAL, TILE_PX - 1, x, _shade(Color(0.6, 0.63, 0.69), -0.14))
	for rv in [Vector2i(3, 3), Vector2i(12, 3), Vector2i(3, 12), Vector2i(12, 12)]:
		_paint(img, T_METAL, rv.x, rv.y, _shade(Color(0.6, 0.63, 0.69), -0.25))
		_paint(img, T_METAL, rv.x - 1, rv.y, _shade(Color(0.6, 0.63, 0.69), 0.18))

	# Glass: near-clear pane with a frame and a diagonal glint.
	for y in TILE_PX:
		for x in TILE_PX:
			var edge: bool = x == 0 or y == 0 or x == TILE_PX - 1 or y == TILE_PX - 1
			if edge:
				_paint(img, T_GLASS, x, y, Color(0.82, 0.92, 0.98, 0.85))
			elif x - y == 4 or x - y == 5:
				_paint(img, T_GLASS, x, y, Color(1, 1, 1, 0.45))
			else:
				_paint(img, T_GLASS, x, y, Color(0.75, 0.9, 1.0, 0.12))

	# TNT: dark crate wrapped in a hazard band.
	_fill_noise(img, T_TNT, Color(0.35, 0.28, 0.24), 0.06, 27)
	for y in range(5, 11):
		for x in TILE_PX:
			var stripe: bool = ((x + y) / 3) % 2 == 0
			_paint(img, T_TNT, x, y, Color(0.78, 0.16, 0.12) if stripe else Color(0.95, 0.78, 0.2))

	# Spike trap: dark base with pale teeth.
	_fill_noise(img, T_SPIKE, Color(0.3, 0.31, 0.34), 0.07, 28)
	for tx in 3:
		for row in 6:
			var cx: int = 2 + tx * 5
			for k in range(-row / 2, row / 2 + 1):
				_paint(img, T_SPIKE, cx + k, 12 - row, Color(0.85, 0.87, 0.9))

	# Turret: housing with a glowing barrel ring.
	_fill_noise(img, T_TURRET, Color(0.28, 0.34, 0.4), 0.06, 29)
	for y in TILE_PX:
		for x in TILE_PX:
			var d2: float = Vector2(x - 7.5, y - 7.5).length()
			if d2 < 2.4:
				_paint(img, T_TURRET, x, y, Color(0.2, 0.22, 0.26))
			elif d2 < 4.2:
				_paint(img, T_TURRET, x, y, Color(0.35, 0.85, 1.0))
			elif d2 < 5.4:
				_paint(img, T_TURRET, x, y, Color(0.45, 0.5, 0.58))

	return ImageTexture.create_from_image(img)

static func atlas_uv(tile: int) -> Rect2:
	var s := 1.0 / float(ATLAS_TILES)
	# Quarter-texel inset stops neighbouring tiles bleeding in at glancing angles.
	var inset := 0.25 / float(ATLAS_TILES * atlas_tile_px)
	var u := float(tile % ATLAS_TILES) * s
	var v := float(tile / ATLAS_TILES) * s
	return Rect2(u + inset, v + inset, s - inset * 2.0, s - inset * 2.0)

static func atlas_region_px(tile: int) -> Rect2:
	return Rect2(
		float((tile % ATLAS_TILES) * atlas_tile_px),
		float((tile / ATLAS_TILES) * atlas_tile_px),
		float(atlas_tile_px), float(atlas_tile_px))


# Region within the painted 16px atlas specifically, regardless of which atlas
# is active. Used by the bake tool to lift pixel-art tiles.
static func atlas_region_px_painted(tile: int) -> Rect2:
	return Rect2(
		float((tile % ATLAS_TILES) * TILE_PX),
		float((tile / ATLAS_TILES) * TILE_PX),
		float(TILE_PX), float(TILE_PX))
