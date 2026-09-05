// Full-screen overlay: thin radial streaks converging on a focus point,
// faded out of the centre so the road stays readable, plus a faint blue
// vignette during boost. Intensity is driven by the game each frame.
shader_type canvas_item;

uniform float intensity = 0.0;
uniform float boost = 0.0;
uniform vec2 focus = vec2(0.5, 0.45);
uniform sampler2D noise_tex : filter_linear, repeat_enable;

void fragment() {
	vec2 d = UV - focus;
	d.x *= 1.6;
	float r = length(d);
	float ang = atan(d.y, d.x);
	float t = TIME;
	float streak = texture(noise_tex, vec2(ang * 3.0 / 6.2831, r * 0.6 - t * 2.4)).r;
	float streak2 = texture(noise_tex, vec2(ang * 7.0 / 6.2831 + 0.3, r * 0.9 - t * 3.7)).r;
	float s = pow(max(streak, streak2 * 0.9), 6.0);
	float ring = smoothstep(0.22, 0.62, r);
	float a = s * ring * intensity;
	vec3 col = mix(vec3(1.0), vec3(0.55, 0.8, 1.0), boost);
	float vig = smoothstep(0.45, 0.95, r) * boost * 0.35;
	COLOR = vec4(col, clamp(a * 0.9 + vig, 0.0, 1.0));
}
