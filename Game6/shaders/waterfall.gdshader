shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_disabled, unshaded;

uniform vec4 color : source_color = vec4(0.75, 0.9, 1.0, 0.7);
uniform sampler2D noise_tex;
uniform float speed = 0.9;

void fragment() {
	float n = texture(noise_tex, vec2(UV.x * 2.0, UV.y * 1.5 - TIME * speed)).r;
	float n2 = texture(noise_tex, vec2(UV.x * 3.1 + 0.3, UV.y * 2.5 - TIME * speed * 1.4)).r;
	float s = (n + n2) * 0.5;
	float streak = smoothstep(0.42, 0.7, s);
	ALBEDO = mix(color.rgb * 0.85, vec3(1.0), streak);
	ALPHA = color.a * (0.55 + streak * 0.45);
}
