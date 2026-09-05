// Palm fronds, flowers and grass tufts: a wind sway keyed off world position
// and a bend away from the player so vegetation reacts to Sonic charging
// past. Vertex colour red = how much the vertex is free to move (0 at the
// root, 1 at the tip). Two-sided, alpha-scissored leaf shapes.
shader_type spatial;
render_mode cull_disabled, depth_draw_opaque, specular_schlick_ggx;

global uniform vec3 player_pos;
global uniform float player_speed;

uniform vec3 color_a : source_color = vec3(0.15, 0.55, 0.16);
uniform vec3 color_b : source_color = vec3(0.55, 0.85, 0.25);
uniform float sway = 0.35;
uniform float react_radius = 5.0;
uniform float react_strength = 1.2;
uniform sampler2D noise_tex : filter_linear_mipmap, repeat_enable;
uniform float alpha_cut = 0.0;

varying float shade;

void vertex() {
	vec3 wp = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float free = COLOR.r;
	float t = TIME;
	float phase = wp.x * 0.35 + wp.z * 0.27;
	vec3 wind = vec3(sin(t * 1.3 + phase), 0.0, cos(t * 0.9 + phase * 1.7)) * sway;
	wind += vec3(sin(t * 4.1 + phase * 3.0), 0.0, 0.0) * sway * 0.25;
	vec3 to_player = wp - player_pos;
	float d = length(to_player);
	float react = (1.0 - smoothstep(0.0, react_radius, d)) * react_strength * (0.5 + min(player_speed, 40.0) / 40.0);
	vec3 push = normalize(vec3(to_player.x, 0.0, to_player.z) + vec3(0.001, 0.0, 0.0)) * react;
	push.y = -react * 0.5;
	vec3 disp = (wind + push) * free;
	VERTEX += (inverse(MODEL_MATRIX) * vec4(disp, 0.0)).xyz;
	shade = free;
}

void fragment() {
	vec3 col = mix(color_a, color_b, shade * 0.8 + 0.1);
	if (alpha_cut > 0.0) {
		float a = texture(noise_tex, UV).r;
		if (a < alpha_cut) { discard; }
	}
	ALBEDO = col;
	ROUGHNESS = 0.7;
	SPECULAR = 0.3;
	BACKLIGHT = vec3(0.35, 0.5, 0.2);
}
