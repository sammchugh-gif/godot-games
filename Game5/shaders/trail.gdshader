// Wind trail ribbon behind Sonic: additive, fading along its length (UV.y)
// and at the edges (UV.x).
shader_type spatial;
render_mode cull_disabled, depth_draw_never, blend_add, unshaded;

uniform vec3 color : source_color = vec3(0.5, 0.8, 1.0);
uniform float strength = 1.0;

void fragment() {
	float edge = 1.0 - abs(UV.x - 0.5) * 2.0;
	float along = 1.0 - UV.y;
	ALBEDO = color * strength;
	ALPHA = clamp(edge * edge * along * 0.9, 0.0, 1.0) * strength;
}
