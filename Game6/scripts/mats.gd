# Material library. No files: every colour is authored here and the only
# texture is a tileable noise generated at start-up.
class_name Mats
extends RefCounted

static var _noise: ImageTexture
static var _cache := {}


static func noise() -> ImageTexture:
	if _noise == null:
		var n := FastNoiseLite.new()
		n.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
		n.seed = 1991
		n.frequency = 0.03
		n.fractal_octaves = 3
		var img := n.get_seamless_image(128, 128)
		_noise = ImageTexture.create_from_image(img)
	return _noise


# Plain surfaces for props and characters. Cached by parameters.
static func pbr(color: Color, rough: float = 0.7, metal: float = 0.0) -> StandardMaterial3D:
	var key := "pbr|%s|%s|%s" % [color, rough, metal]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = rough
	m.metallic = metal
	_cache[key] = m
	return m


# Soft toy-like character surface with a little rim light.
static func skin(color: Color, rough: float = 0.55) -> StandardMaterial3D:
	var key := "skin|%s|%s" % [color, rough]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = rough
	m.rim_enabled = true
	m.rim = 0.3
	m.rim_tint = 0.5
	_cache[key] = m
	return m


static func glow(color: Color, energy: float = 1.6, rough: float = 0.4) -> StandardMaterial3D:
	var key := "glow|%s|%s|%s" % [color, energy, rough]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = rough
	m.emission_enabled = true
	m.emission = color
	m.emission_energy_multiplier = energy
	_cache[key] = m
	return m


static func unshaded(color: Color) -> StandardMaterial3D:
	var key := "unsh|%s" % [color]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = color
	if color.a < 1.0:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_cache[key] = m
	return m


# Terrain and anything else painted per vertex.
static func vertex_painted(rough: float = 0.95) -> StandardMaterial3D:
	var key := "vtx|%s" % rough
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.vertex_color_use_as_albedo = true
	m.roughness = rough
	_cache[key] = m
	return m


static func water(deep: bool = false) -> ShaderMaterial:
	var key := "water|%s" % deep
	if _cache.has(key):
		return _cache[key]
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/water.gdshader")
	m.set_shader_parameter("noise_tex", noise())
	if deep:
		m.set_shader_parameter("color", Color(0.08, 0.3, 0.6, 0.9))
	_cache[key] = m
	return m


static func waterfall() -> ShaderMaterial:
	if _cache.has("waterfall"):
		return _cache["waterfall"]
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/waterfall.gdshader")
	m.set_shader_parameter("noise_tex", noise())
	_cache["waterfall"] = m
	return m
