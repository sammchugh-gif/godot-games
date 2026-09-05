// Metal grind rail with a brushed look and a subtle blue energy pulse.
shader_type spatial;
render_mode cull_back, depth_draw_opaque, specular_schlick_ggx;

uniform vec3 base : source_color = vec3(0.75, 0.78, 0.82);
uniform vec3 glow : source_color = vec3(0.2, 0.6, 1.0);
uniform float pulse = 0.35;

void fragment() {
	float p = 0.5 + 0.5 * sin(UV.y * 0.8 - TIME * 6.0);
	ALBEDO = base;
	METALLIC = 0.9;
	ROUGHNESS = 0.28;
	EMISSION = glow * p * pulse;
}
