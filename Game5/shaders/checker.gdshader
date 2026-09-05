// The Green Hill checker: two-tone blocks in world space with edge wear.
// Used on loop and corkscrew sides, cliff faces, ruin blocks and road skirts.
shader_type spatial;
render_mode cull_back, depth_draw_opaque, specular_schlick_ggx;

uniform sampler2D noise_tex : filter_linear_mipmap, repeat_enable;
uniform vec3 color_a : source_color = vec3(0.72, 0.38, 0.12);
uniform vec3 color_b : source_color = vec3(0.94, 0.62, 0.22);
uniform float checker_size = 2.5;
uniform float wear = 0.35;

varying vec3 wpos;
varying vec3 wnorm;
varying float ao;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	wnorm = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
	ao = COLOR.r;
}

void fragment() {
	vec3 an = abs(wnorm);
	vec2 proj = an.y > max(an.x, an.z) ? wpos.xz : (an.x > an.z ? wpos.zy : wpos.xy);
	vec2 cell = floor(proj / checker_size);
	float ch = mod(cell.x + cell.y, 2.0);
	vec2 f = fract(proj / checker_size);
	float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
	float groove = 1.0 - smoothstep(0.0, 0.06, edge);
	float n = texture(noise_tex, wpos.xz * 0.3 + wpos.y * 0.13).r;
	vec3 col = mix(color_a, color_b, ch);
	col *= 0.85 + 0.3 * n;
	col = mix(col, col * 0.55, groove * wear);
	ALBEDO = col;
	ROUGHNESS = 0.85;
	SPECULAR = 0.2;
	AO = mix(0.6, 1.0, ao);
	AO_LIGHT_AFFECT = 0.35;
}
