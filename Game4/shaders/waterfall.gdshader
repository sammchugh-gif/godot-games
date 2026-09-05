// A sheet of falling water: streaks scroll down a quad, thinning at the
// edges, whitening near the bottom where the plume breaks up.
shader_type spatial;
render_mode cull_disabled, depth_draw_opaque, blend_mix, specular_schlick_ggx;

uniform sampler2D noise_tex : filter_linear_mipmap, repeat_enable;
uniform vec3 tint : source_color = vec3(0.80, 0.95, 1.0);
uniform float speed = 1.6;
uniform float streaks = 6.0;

void fragment() {
	vec2 uv = UV;
	float t = TIME * speed;
	float s1 = texture(noise_tex, vec2(uv.x * streaks, uv.y * 1.5 - t)).r;
	float s2 = texture(noise_tex, vec2(uv.x * streaks * 2.3 + 0.4, uv.y * 3.0 - t * 1.4)).r;
	float s = s1 * 0.65 + s2 * 0.35;
	float edge = smoothstep(0.0, 0.18, uv.x) * smoothstep(0.0, 0.18, 1.0 - uv.x);
	float body = smoothstep(0.35, 0.75, s);
	float bottom = smoothstep(0.55, 1.0, uv.y);
	float a = clamp((body * 0.55 + 0.25 + bottom * 0.35) * edge, 0.0, 1.0);
	ALBEDO = tint * (0.85 + 0.25 * s);
	ALPHA = a;
	ROUGHNESS = 0.3;
	SPECULAR = 0.6;
	EMISSION = tint * 0.15 * (body + bottom);
}
