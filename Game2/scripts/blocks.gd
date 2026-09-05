# Block table plus a procedurally painted texture atlas.
# The project ships no art files: every tile below is drawn in code at startup.
class_name Blocks
extends RefCounted

const AIR := 0
const GRASS := 1
const DIRT := 2
const STONE := 3
const DEEPSTONE := 4
const BEDROCK := 5
const CRYSTAL := 6
const MAGMA := 7
const ICE := 8
const MUSHROOM := 9
const SEAL := 10
const STARROCK := 11
const SAND := 12
const ROOT := 13
const GLOWMOSS := 14
const COUNT := 15

# Atlas is 4x4 tiles of 16x16 pixels.
const TILE_PX := 16
const ATLAS_TILES := 4
const ATLAS_PX := TILE_PX * ATLAS_TILES

const T_GRASS_TOP := 0
const T_GRASS_SIDE := 1
const T_DIRT := 2
const T_STONE := 3
const T_DEEPSTONE := 4
const T_BEDROCK := 5
const T_CRYSTAL := 6
const T_MAGMA := 7
const T_ICE := 8
const T_MUSHROOM := 9
const T_SEAL := 10
const T_STARROCK := 11
const T_SAND := 12
const T_ROOT_SIDE := 13
const T_ROOT_TOP := 14
const T_GLOWMOSS := 15

# "hardness" is dig-power-seconds to break. "glow" routes a block to the
# unshaded surface, so caves have things that read as their own light source.
const DATA := [
	{"name": "Air", "top": 0, "bottom": 0, "side": 0, "hardness": 0.0, "transparent": true, "glow": false, "color": Color(0, 0, 0, 0)},
	{"name": "Grass", "top": T_GRASS_TOP, "bottom": T_DIRT, "side": T_GRASS_SIDE, "hardness": 1.2, "transparent": false, "glow": false, "color": Color(0.38, 0.66, 0.3)},
	{"name": "Dirt", "top": T_DIRT, "bottom": T_DIRT, "side": T_DIRT, "hardness": 1.0, "transparent": false, "glow": false, "color": Color(0.46, 0.33, 0.22)},
	{"name": "Stone", "top": T_STONE, "bottom": T_STONE, "side": T_STONE, "hardness": 2.6, "transparent": false, "glow": false, "color": Color(0.52, 0.53, 0.56)},
	{"name": "Deepstone", "top": T_DEEPSTONE, "bottom": T_DEEPSTONE, "side": T_DEEPSTONE, "hardness": 4.2, "transparent": false, "glow": false, "color": Color(0.3, 0.31, 0.37)},
	{"name": "Bedrock", "top": T_BEDROCK, "bottom": T_BEDROCK, "side": T_BEDROCK, "hardness": 1000000000.0, "transparent": false, "glow": false, "color": Color(0.19, 0.19, 0.22)},
	{"name": "Crystal", "top": T_CRYSTAL, "bottom": T_CRYSTAL, "side": T_CRYSTAL, "hardness": 3.0, "transparent": false, "glow": true, "color": Color(0.5, 0.85, 1.0)},
	{"name": "Magma", "top": T_MAGMA, "bottom": T_MAGMA, "side": T_MAGMA, "hardness": 2.0, "transparent": false, "glow": true, "color": Color(1.0, 0.5, 0.16)},
	{"name": "Ice", "top": T_ICE, "bottom": T_ICE, "side": T_ICE, "hardness": 1.6, "transparent": true, "glow": false, "color": Color(0.7, 0.88, 1.0, 0.6)},
	{"name": "Mushroom", "top": T_MUSHROOM, "bottom": T_MUSHROOM, "side": T_MUSHROOM, "hardness": 0.6, "transparent": false, "glow": false, "color": Color(0.72, 0.35, 0.4)},
	{"name": "Sealstone", "top": T_SEAL, "bottom": T_SEAL, "side": T_SEAL, "hardness": 1000000000.0, "transparent": false, "glow": true, "color": Color(0.62, 0.4, 0.85)},
	{"name": "Star Rock", "top": T_STARROCK, "bottom": T_STARROCK, "side": T_STARROCK, "hardness": 3.4, "transparent": false, "glow": true, "color": Color(1.0, 0.83, 0.28)},
	{"name": "Sand", "top": T_SAND, "bottom": T_SAND, "side": T_SAND, "hardness": 0.8, "transparent": false, "glow": false, "color": Color(0.84, 0.78, 0.56)},
	{"name": "Root", "top": T_ROOT_TOP, "bottom": T_ROOT_TOP, "side": T_ROOT_SIDE, "hardness": 2.0, "transparent": false, "glow": false, "color": Color(0.44, 0.32, 0.2)},
	{"name": "Glowmoss", "top": T_GLOWMOSS, "bottom": T_GLOWMOSS, "side": T_GLOWMOSS, "hardness": 0.6, "transparent": false, "glow": true, "color": Color(0.55, 0.95, 0.6)},
]


static func name_of(id: int) -> String:
	return DATA[id]["name"]

static func hardness(id: int) -> float:
	return DATA[id]["hardness"]

static func is_transparent(id: int) -> bool:
	return DATA[id]["transparent"]

static func is_glow(id: int) -> bool:
	return DATA[id]["glow"]

static func color_of(id: int) -> Color:
	return DATA[id]["color"]

static func is_diggable(id: int) -> bool:
	return id != AIR and id != BEDROCK and id != SEAL

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

static func _speckle(img: Image, tile: int, base: Color, spots: int, delta: float, seed_v: int) -> void:
	for i in spots:
		var sx: int = int(_hash2(i, 3, seed_v) * float(TILE_PX))
		var sy: int = int(_hash2(i, 9, seed_v + 7) * float(TILE_PX))
		_paint(img, tile, sx, sy, _shade(base, delta))
		_paint(img, tile, sx + 1, sy, _shade(base, delta * 0.6))
		_paint(img, tile, sx, sy + 1, _shade(base, delta * 0.6))

# Concave four-point star, used for star rock and reused for the HUD icon.
static func _star_shape(img: Image, tile: int, cx: float, cy: float, r: float, c: Color) -> void:
	for y in TILE_PX:
		for x in TILE_PX:
			var dx: float = absf(float(x) - cx)
			var dy: float = absf(float(y) - cy)
			if dx + dy <= r and dx * dy <= r * r * 0.16:
				_paint(img, tile, x, y, c)

static func build_atlas() -> ImageTexture:
	var img := Image.create_empty(ATLAS_PX, ATLAS_PX, false, Image.FORMAT_RGBA8)
	img.fill(Color(1, 0, 1, 1))

	_fill_noise(img, T_GRASS_TOP, Color(0.36, 0.66, 0.28), 0.09, 11)
	_speckle(img, T_GRASS_TOP, Color(0.36, 0.66, 0.28), 10, 0.14, 41)
	_fill_noise(img, T_DIRT, Color(0.46, 0.33, 0.21), 0.08, 12)
	_speckle(img, T_DIRT, Color(0.46, 0.33, 0.21), 8, -0.12, 42)

	# Grass side: dirt with a ragged green lip along the top.
	_fill_noise(img, T_GRASS_SIDE, Color(0.46, 0.33, 0.21), 0.08, 12)
	for x in TILE_PX:
		var lip: int = 3 + int(_hash2(x, 0, 31) * 2.6)
		for y in lip:
			var n: float = (_hash2(x, y, 11) - 0.5) * 0.18
			_paint(img, T_GRASS_SIDE, x, y, _shade(Color(0.36, 0.66, 0.28), n))

	_fill_noise(img, T_STONE, Color(0.52, 0.53, 0.56), 0.1, 13)
	for i in 9:
		var sx: int = int(_hash2(i, 3, 77) * 13.0)
		var sy: int = int(_hash2(i, 9, 78) * 13.0)
		for k in 3:
			_paint(img, T_STONE, sx + k, sy, _shade(Color(0.52, 0.53, 0.56), -0.13))

	# Deepstone: darker, with pale mineral veins running diagonally.
	_fill_noise(img, T_DEEPSTONE, Color(0.3, 0.31, 0.37), 0.08, 51)
	for i in 3:
		var vx: int = int(_hash2(i, 5, 52) * 12.0)
		var vy: int = int(_hash2(i, 8, 53) * 6.0)
		for k in 7:
			_paint(img, T_DEEPSTONE, vx + k, vy + k, _shade(Color(0.3, 0.31, 0.37), 0.16))
			_paint(img, T_DEEPSTONE, vx + k, vy + k + 1, _shade(Color(0.3, 0.31, 0.37), 0.08))

	_fill_noise(img, T_BEDROCK, Color(0.2, 0.2, 0.23), 0.18, 15)
	_fill_noise(img, T_SAND, Color(0.84, 0.78, 0.56), 0.07, 14)

	# Crystal: faceted shards radiating from the middle.
	_fill_noise(img, T_CRYSTAL, Color(0.24, 0.5, 0.66), 0.05, 61)
	for y in TILE_PX:
		for x in TILE_PX:
			var d: float = Vector2(x - 7.5, y - 7.5).length()
			var facet: int = (x + y) / 3 + (x - y) / 5
			if d < 6.5:
				var b: float = 0.34 - d * 0.03 + (0.06 if facet % 2 == 0 else -0.04)
				_paint(img, T_CRYSTAL, x, y, _shade(Color(0.45, 0.8, 0.98), b))
	for k in 5:
		_paint(img, T_CRYSTAL, 5 + k, 7, Color(0.95, 1.0, 1.0))

	# Magma: dark crust cracked open over hot fissures.
	_fill_noise(img, T_MAGMA, Color(0.29, 0.16, 0.13), 0.07, 62)
	for y in TILE_PX:
		for x in TILE_PX:
			var v: float = _hash2(x / 2, y / 2, 63)
			if v > 0.62:
				var heat: float = (v - 0.62) / 0.38
				_paint(img, T_MAGMA, x, y, Color(1.0, 0.35 + heat * 0.45, 0.1 + heat * 0.2))

	# Ice: pale translucent pane with a couple of internal cracks.
	for y in TILE_PX:
		for x in TILE_PX:
			var edge: bool = x == 0 or y == 0 or x == TILE_PX - 1 or y == TILE_PX - 1
			if edge:
				_paint(img, T_ICE, x, y, Color(0.86, 0.95, 1.0, 0.85))
			elif x - y == 3 or y - x == 6:
				_paint(img, T_ICE, x, y, Color(1, 1, 1, 0.5))
			else:
				_paint(img, T_ICE, x, y, Color(0.72, 0.9, 1.0, 0.3))

	# Mushroom: pink cap with pale spots.
	_fill_noise(img, T_MUSHROOM, Color(0.7, 0.33, 0.38), 0.07, 64)
	_speckle(img, T_MUSHROOM, Color(0.95, 0.9, 0.85), 7, 0.0, 65)

	# Sealstone: violet slab carved with a locked rune ring.
	_fill_noise(img, T_SEAL, Color(0.26, 0.17, 0.36), 0.06, 66)
	for y in TILE_PX:
		for x in TILE_PX:
			var dr: float = Vector2(x - 7.5, y - 7.5).length()
			if dr > 4.6 and dr < 6.2:
				_paint(img, T_SEAL, x, y, Color(0.72, 0.45, 0.98))
			elif dr < 1.8:
				_paint(img, T_SEAL, x, y, Color(0.85, 0.6, 1.0))

	# Star rock: dull stone with a golden star locked inside.
	_fill_noise(img, T_STARROCK, Color(0.4, 0.36, 0.3), 0.08, 67)
	_star_shape(img, T_STARROCK, 7.5, 7.5, 7.0, Color(0.95, 0.72, 0.16))
	_star_shape(img, T_STARROCK, 7.5, 7.5, 4.6, Color(1.0, 0.9, 0.42))

	_fill_noise(img, T_ROOT_SIDE, Color(0.42, 0.31, 0.18), 0.07, 23)
	for x in TILE_PX:
		if x % 3 == 0:
			for y in TILE_PX:
				_paint(img, T_ROOT_SIDE, x, y, _shade(Color(0.42, 0.31, 0.18), -0.12))
	_fill_noise(img, T_ROOT_TOP, Color(0.6, 0.45, 0.27), 0.05, 24)
	for y in TILE_PX:
		for x in TILE_PX:
			var dt: float = Vector2(x - 7.5, y - 7.5).length()
			if int(dt) % 3 == 0:
				_paint(img, T_ROOT_TOP, x, y, _shade(Color(0.6, 0.45, 0.27), -0.13))

	# Glowmoss: dark rock smothered in luminous green fuzz.
	_fill_noise(img, T_GLOWMOSS, Color(0.16, 0.3, 0.19), 0.06, 68)
	for y in TILE_PX:
		for x in TILE_PX:
			var g: float = _hash2(x, y, 69)
			if g > 0.42:
				_paint(img, T_GLOWMOSS, x, y, Color(0.35 + g * 0.3, 0.85 + g * 0.15, 0.4 + g * 0.25))

	return ImageTexture.create_from_image(img)

static func atlas_uv(tile: int) -> Rect2:
	var s := 1.0 / float(ATLAS_TILES)
	# Quarter-texel inset stops neighbouring tiles bleeding in at glancing angles.
	var inset := 0.25 / float(ATLAS_PX)
	var u := float(tile % ATLAS_TILES) * s
	var v := float(tile / ATLAS_TILES) * s
	return Rect2(u + inset, v + inset, s - inset * 2.0, s - inset * 2.0)

static func atlas_region_px(tile: int) -> Rect2:
	return Rect2(
		float((tile % ATLAS_TILES) * TILE_PX),
		float((tile / ATLAS_TILES) * TILE_PX),
		float(TILE_PX), float(TILE_PX))
