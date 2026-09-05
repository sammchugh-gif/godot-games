# Material library. Nothing here is loaded from disk except the shader
# sources: every texture is generated at start-up from FastNoiseLite and
# every colour is authored in code, so the project has no binary art assets.
class_name Mats
extends RefCounted

static var _noise: ImageTexture
static var _noise_soft: ImageTexture
static var _cache := {}


# Tileable fractal noise, shared by every shader.
static func noise() -> ImageTexture:
	if _noise == null:
		var n := FastNoiseLite.new()
		n.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
		n.seed = 1991
		n.frequency = 0.02
		n.fractal_octaves = 4
		n.fractal_lacunarity = 2.1
		n.fractal_gain = 0.55
		var img := n.get_seamless_image(256, 256)
		_noise = ImageTexture.create_from_image(img)
	return _noise


static func noise_soft() -> ImageTexture:
	if _noise_soft == null:
		var n := FastNoiseLite.new()
		n.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
		n.seed = 7
		n.frequency = 0.008
		n.fractal_octaves = 2
		var img := n.get_seamless_image(256, 256)
		_noise_soft = ImageTexture.create_from_image(img)
	return _noise_soft


static func shader(name: String, params: Dictionary = {}) -> ShaderMaterial:
	var key := name + "|" + str(params)
	if _cache.has(key):
		return _cache[key]
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/%s.gdshader" % name)
	m.set_shader_parameter("noise_tex", noise())
	for k in params:
		m.set_shader_parameter(k, params[k])
	_cache[key] = m
	return m


static func terrain() -> ShaderMaterial:
	return shader("terrain")


static func checker(a: Color = Color(0.72, 0.38, 0.12), b: Color = Color(0.94, 0.62, 0.22), size: float = 2.5) -> ShaderMaterial:
	return shader("checker", {"color_a": a, "color_b": b, "checker_size": size})


static func road(grass_mix: float = 1.0) -> ShaderMaterial:
	return shader("road", {"grass_mix": grass_mix})


static func ocean() -> ShaderMaterial:
	return shader("ocean")


static func waterfall() -> ShaderMaterial:
	return shader("waterfall")


static func foliage(a: Color, b: Color, sway: float = 0.35, react: float = 1.2) -> ShaderMaterial:
	return shader("foliage", {"color_a": a, "color_b": b, "sway": sway, "react_strength": react})


static func rail() -> ShaderMaterial:
	return shader("rail")


static func trail(color: Color) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/trail.gdshader")
	m.set_shader_parameter("color", color)
	return m


static func boost_aura() -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/sonic_boost.gdshader")
	m.set_shader_parameter("noise_tex", noise())
	return m


# Plain PBR surfaces for props and the character. Cached by parameters.
static func pbr(color: Color, rough: float = 0.6, metal: float = 0.0, spec: float = 0.5) -> StandardMaterial3D:
	var key := "pbr|%s|%s|%s|%s" % [color, rough, metal, spec]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = rough
	m.metallic = metal
	m.metallic_specular = spec
	_cache[key] = m
	return m


# Glossy toon-ish character surface: a touch of rim light and clearcoat
# gives the quills the "moulded plastic" sheen of the modern renders.
static func skin(color: Color, rough: float = 0.45, rim: float = 0.35) -> StandardMaterial3D:
	var key := "skin|%s|%s|%s" % [color, rough, rim]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = rough
	m.metallic = 0.0
	m.metallic_specular = 0.6
	m.rim_enabled = true
	m.rim = rim
	m.rim_tint = 0.6
	m.clearcoat_enabled = true
	m.clearcoat = 0.4
	m.clearcoat_roughness = 0.3
	_cache[key] = m
	return m


static func glow(color: Color, energy: float = 2.0, rough: float = 0.4) -> StandardMaterial3D:
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


static func unshaded(color: Color, additive: bool = false) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = color
	if additive:
		m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	elif color.a < 1.0:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.no_depth_test = false
	return m


# Soft round particle sprite drawn procedurally (used by every CPUParticles3D).
static var _puff: ImageTexture
static func puff() -> ImageTexture:
	if _puff == null:
		var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
		for y in 64:
			for x in 64:
				var d := Vector2(x - 31.5, y - 31.5).length() / 32.0
				var a := clampf(1.0 - d * d, 0.0, 1.0)
				a = a * a
				img.set_pixel(x, y, Color(1, 1, 1, a))
		_puff = ImageTexture.create_from_image(img)
	return _puff


static func particle_mat(color: Color, additive: bool = true) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_texture = puff()
	m.albedo_color = color
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	if additive:
		m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.vertex_color_use_as_albedo = true
	m.disable_receive_shadows = true
	return m
