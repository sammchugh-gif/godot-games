// The running surface: a packed sand-and-earth path down the middle fading
// into grass verges, with a subtle centre line of lighter dust so the racing
// line reads at speed. UV.x runs across the road (0..1), UV.y along it in
// metres. Vertex colour red = baked AO (tunnels, under bridges).
shader_type spatial;
render_mode cull_back, depth_draw_opaque, specular_schlick_ggx;

uniform sampler2D noise_tex : filter_linear_mipmap, repeat_enable;
uniform vec3 path_a : source_color = vec3(0.90, 0.74, 0.46);
uniform vec3 path_b : source_color = vec3(0.78, 0.58, 0.34);
uniform vec3 grass_a : source_color = vec3(0.17, 0.52, 0.15);
uniform vec3 grass_b : source_color = vec3(0.36, 0.72, 0.20);
uniform float verge = 0.16;
uniform float grass_mix = 1.0;

varying vec3 wpos;
varying float ao;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	ao = COLOR.r;
}

void fragment() {
	float n1 = texture(noise_tex, vec2(UV.x * 3.0, UV.y * 0.08)).r;
	float n2 = texture(noise_tex, wpos.xz * 0.35 + wpos.y * 0.1).r;
	float n3 = texture(noise_tex, vec2(UV.x * 9.0, UV.y * 0.4)).r;
	float across = abs(UV.x - 0.5) * 2.0;
	vec3 path = mix(path_a, path_b, n2 * 0.7 + n3 * 0.3);
	// Tyre-track style darker lanes either side of a lighter centre.
	path *= 1.0 - 0.12 * smoothstep(0.25, 0.45, across) * (1.0 - smoothstep(0.55, 0.8, across));
	vec3 grass = mix(grass_a, grass_b, smoothstep(0.35, 0.65, n2));
	float g = smoothstep(1.0 - verge - 0.1 + (n1 - 0.5) * 0.12, 1.0 - verge + 0.08, across) * grass_mix;
	vec3 col = mix(path, grass, g);
	ALBEDO = col;
	ROUGHNESS = 0.9;
	SPECULAR = 0.2;
	AO = mix(0.5, 1.0, ao);
	AO_LIGHT_AFFECT = 0.4;
}
