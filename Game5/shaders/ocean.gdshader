// Tropical water: layered gerstner-ish sine waves for the surface normal,
// a deep-to-shallow colour ramp by fresnel, animated foam caps, and a
// specular sun glint. Reflection of the sky comes from the environment via
// low roughness + high specular. Alpha lets the sand fade through in the
// shallows.
shader_type spatial;
render_mode cull_disabled, depth_draw_opaque, specular_schlick_ggx, blend_mix;

uniform sampler2D noise_tex : filter_linear_mipmap, repeat_enable;
uniform vec3 deep : source_color = vec3(0.02, 0.22, 0.48);
uniform vec3 shallow : source_color = vec3(0.10, 0.72, 0.78);
uniform vec3 foam_col : source_color = vec3(0.95, 1.0, 1.0);
uniform float wave_height = 0.35;
uniform float wave_scale = 0.06;
uniform float speed = 1.0;

varying vec3 wpos;
varying float crest;

float wave(vec2 p, vec2 dir, float freq, float amp, float t, inout vec3 n) {
	float ph = dot(p, dir) * freq + t;
	float h = sin(ph) * amp;
	float d = cos(ph) * amp * freq;
	n.x -= dir.x * d;
	n.z -= dir.y * d;
	return h;
}

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float t = TIME * speed;
	vec3 n = vec3(0.0, 1.0, 0.0);
	float h = 0.0;
	h += wave(wpos.xz, normalize(vec2(1.0, 0.3)), wave_scale * 1.0, wave_height * 1.0, t * 1.1, n);
	h += wave(wpos.xz, normalize(vec2(-0.4, 1.0)), wave_scale * 1.9, wave_height * 0.55, t * 1.6, n);
	h += wave(wpos.xz, normalize(vec2(0.7, -0.8)), wave_scale * 3.7, wave_height * 0.25, t * 2.3, n);
	h += wave(wpos.xz, normalize(vec2(-1.0, -0.2)), wave_scale * 6.1, wave_height * 0.12, t * 3.1, n);
	VERTEX.y += h;
	NORMAL = normalize(n);
	crest = h / (wave_height * 1.9);
	wpos.y += h;
}

void fragment() {
	// Small ripples from the noise texture, scrolled two ways.
	float t = TIME * speed;
	vec2 uv1 = wpos.xz * 0.05 + vec2(t * 0.020, t * 0.012);
	vec2 uv2 = wpos.xz * 0.11 - vec2(t * 0.016, -t * 0.021);
	float r1 = texture(noise_tex, uv1).r;
	float r2 = texture(noise_tex, uv2).r;
	float rx = texture(noise_tex, uv1 + vec2(0.01, 0.0)).r - r1 + texture(noise_tex, uv2 + vec2(0.01, 0.0)).r - r2;
	float rz = texture(noise_tex, uv1 + vec2(0.0, 0.01)).r - r1 + texture(noise_tex, uv2 + vec2(0.0, 0.01)).r - r2;
	vec3 vn = normalize(NORMAL + (TANGENT * rx + BINORMAL * rz) * 2.5);

	vec3 view = normalize(-VERTEX);
	float fres = pow(1.0 - clamp(dot(vn, view), 0.0, 1.0), 3.0);
	vec3 col = mix(shallow, deep, clamp(fres * 1.4, 0.0, 1.0));

	float foam_n = texture(noise_tex, wpos.xz * 0.09 + vec2(t * 0.03, -t * 0.02)).r;
	float foam = smoothstep(0.55, 0.95, crest * 0.8 + foam_n * 0.6);
	col = mix(col, foam_col, foam * 0.85);

	ALBEDO = col;
	NORMAL = vn;
	METALLIC = 0.0;
	SPECULAR = 0.9;
	ROUGHNESS = mix(0.06, 0.35, foam);
	ALPHA = clamp(0.78 + fres * 0.25 + foam * 0.3, 0.0, 1.0);
	EMISSION = shallow * 0.06 * (1.0 - fres);
}
