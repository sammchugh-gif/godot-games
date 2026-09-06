shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_disabled, specular_schlick_ggx;

uniform vec4 color : source_color = vec4(0.18, 0.55, 0.92, 0.78);
uniform vec4 foam : source_color = vec4(0.92, 0.98, 1.0, 1.0);
uniform sampler2D noise_tex;
uniform float wave = 0.08;
uniform vec2 scroll = vec2(0.02, 0.015);
uniform float foam_lo = 0.6;
uniform float foam_hi = 0.72;

void vertex() {
	VERTEX.y += sin(TIME * 1.5 + VERTEX.x * 0.8 + VERTEX.z * 0.5) * wave + cos(TIME * 1.1 + VERTEX.z * 0.9 - VERTEX.x * 0.3) * wave * 0.7;
}

void fragment() {
	float n = texture(noise_tex, UV + scroll * TIME).r;
	float n2 = texture(noise_tex, UV * 1.7 - vec2(scroll.x * 0.8 * TIME, scroll.y * 0.4 * TIME)).r;
	float f = smoothstep(foam_lo, foam_hi, (n + n2) * 0.5);
	ALBEDO = mix(color.rgb, foam.rgb, f * 0.7);
	ALPHA = color.a + f * 0.15;
	ROUGHNESS = 0.12;
	SPECULAR = 0.7;
}
