# Material library. Every surface in the game is a real photographic / PBR
# texture set (albedo + normal + ORM, sometimes emission) loaded from
# res://assets/textures. Sets are named by prefix, e.g. "asphalt" ->
# asphalt_albedo.jpg, asphalt_normal.jpg, asphalt_orm.jpg.
class_name Mats
extends RefCounted

static var _tex_cache := {}
static var _mat_cache := {}


static func has_tex(name: String) -> bool:
	return ResourceLoader.exists("res://assets/textures/%s.jpg" % name) \
		or ResourceLoader.exists("res://assets/textures/%s.png" % name)


static func tex(name: String) -> Texture2D:
	if _tex_cache.has(name):
		return _tex_cache[name]
	var path := "res://assets/textures/%s.jpg" % name
	if not ResourceLoader.exists(path):
		path = "res://assets/textures/%s.png" % name
	var t: Texture2D = load(path)
	_tex_cache[name] = t
	return t


static func sky_tex(name: String) -> Texture2D:
	return load("res://assets/sky/%s.jpg" % name)


# A full PBR set. uv is the tiling factor (meters per tile is decided by the
# mesh builder, this just scales). tint multiplies albedo.
static func pbr(base: String, tint: Color = Color.WHITE, uv: Vector3 = Vector3.ONE,
		emission_energy: float = 0.0, emission_color: Color = Color.WHITE,
		aniso: bool = false) -> ORMMaterial3D:
	var key := "%s|%s|%s|%s|%s|%s" % [base, tint, uv, emission_energy, emission_color, aniso]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := ORMMaterial3D.new()
	m.albedo_texture = tex(base + "_albedo")
	m.albedo_color = tint
	if has_tex(base + "_normal"):
		m.normal_enabled = true
		m.normal_texture = tex(base + "_normal")
		m.normal_scale = 1.0
	if has_tex(base + "_orm"):
		m.orm_texture = tex(base + "_orm")
	elif has_tex(base + "_rough"):
		# Roughness-only sets: pack via the roughness slot of a Standard-like lookup.
		m.orm_texture = null
	if has_tex(base + "_emission") and emission_energy > 0.0:
		m.emission_enabled = true
		m.emission_texture = tex(base + "_emission")
		m.emission = emission_color
		m.emission_energy_multiplier = emission_energy
	m.uv1_scale = uv
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC if aniso \
		else BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_mat_cache[key] = m
	return m


# Painted panel material for ships: albedo + normal from the set, with fixed
# low metallic so the hull keeps its team colour under any sky.
static func painted(base: String, tint: Color = Color.WHITE, roughness: float = 0.45, metallic: float = 0.15) -> StandardMaterial3D:
	var key := "P|%s|%s|%s|%s" % [base, tint, roughness, metallic]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_texture = tex(base + "_albedo")
	m.albedo_color = tint
	if has_tex(base + "_normal"):
		m.normal_enabled = true
		m.normal_texture = tex(base + "_normal")
	m.roughness = roughness
	m.metallic = metallic
	m.metallic_specular = 0.6
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_mat_cache[key] = m
	return m


# Plain albedo (+ optional normal / roughness) material for terrain-type sets.
static func simple(base: String, tint: Color = Color.WHITE, uv: Vector3 = Vector3.ONE,
		roughness: float = 0.9, metallic: float = 0.0) -> StandardMaterial3D:
	var key := "S|%s|%s|%s|%s|%s" % [base, tint, uv, roughness, metallic]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_texture = tex(base + "_albedo")
	m.albedo_color = tint
	if has_tex(base + "_normal"):
		m.normal_enabled = true
		m.normal_texture = tex(base + "_normal")
	if has_tex(base + "_rough"):
		m.roughness_texture = tex(base + "_rough")
	m.roughness = roughness
	m.metallic = metallic
	m.uv1_scale = uv
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_mat_cache[key] = m
	return m


# Self-lit neon strip. Uses the real emission mask of the trim set so the
# lights have physical shape, tinted to the requested colour.
static func neon(color: Color, energy: float = 3.0, uv: Vector3 = Vector3.ONE) -> ORMMaterial3D:
	var key := "N|%s|%s|%s" % [color, energy, uv]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := ORMMaterial3D.new()
	m.albedo_texture = tex("trim_lights_albedo")
	m.albedo_color = Color(0.6, 0.6, 0.6)
	m.normal_enabled = true
	m.normal_texture = tex("trim_lights_normal")
	m.orm_texture = tex("trim_lights_orm")
	m.emission_enabled = true
	m.emission_texture = tex("trim_lights_emission")
	m.emission = color
	m.emission_energy_multiplier = energy
	m.uv1_scale = uv
	_mat_cache[key] = m
	return m


# Flat glowing unlit colour (engine exhaust, pads, beams).
static func glow(color: Color, energy: float = 2.0, additive: bool = true) -> StandardMaterial3D:
	var key := "G|%s|%s|%s" % [color, energy, additive]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = color
	m.emission_enabled = true
	m.emission = color
	m.emission_energy_multiplier = energy
	if additive:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.no_depth_test = false
	_mat_cache[key] = m
	return m


# Unlit textured sprite-ish material (billboard particles, pads with alpha).
static func sprite(texname: String, color: Color = Color.WHITE, additive: bool = true,
		billboard: bool = true) -> StandardMaterial3D:
	var key := "SP|%s|%s|%s|%s" % [texname, color, additive, billboard]
	if _mat_cache.has(key):
		return _mat_cache[key]
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_texture = tex(texname)
	m.albedo_color = color
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	if additive:
		m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	if billboard:
		m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.vertex_color_use_as_albedo = true
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.disable_receive_shadows = true
	_mat_cache[key] = m
	return m


static func clear_cache() -> void:
	_mat_cache.clear()
