// Boost aura: a soft rim-lit shell around Sonic that flickers with noise.
shader_type spatial;
render_mode cull_back, depth_draw_never, blend_add, unshaded;

uniform vec3 color : source_color = vec3(0.35, 0.7, 1.0);
uniform float strength = 1.0;
uniform sampler2D noise_tex : filter_linear, repeat_enable;

void fragment() {
	float rim = pow(1.0 - clamp(dot(normalize(NORMAL), normalize(-VERTEX)), 0.0, 1.0), 2.0);
	float n = texture(noise_tex, UV * 2.0 + vec2(0.0, -TIME * 2.5)).r;
	ALBEDO = color * (rim * 1.6 + 0.15) * (0.6 + 0.6 * n) * strength;
	ALPHA = clamp(rim * 0.9 + 0.1, 0.0, 1.0) * strength;
}
