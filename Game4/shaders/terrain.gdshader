// Island terrain: lush grass on gentle ground, the classic orange/brown
// checker rock on cliffs, pale sand near the water line. Blends are driven by
// slope and world height so the mesh needs no splat maps. Vertex colour red
// carries baked ambient occlusion from the terrain builder, green is a
// "wetness" band near the road / shoreline.
shader_type spatial;
render_mode cull_back, depth_draw_opaque, specular_schlick_ggx;

uniform sampler2D noise_tex : filter_linear_mipmap, repeat_enable;
uniform vec3 grass_a : source_color = vec3(0.22, 0.62, 0.18);
uniform vec3 grass_b : source_color = vec3(0.42, 0.80, 0.22);
uniform vec3 rock_a : source_color = vec3(0.72, 0.38, 0.12);
uniform vec3 rock_b : source_color = vec3(0.92, 0.60, 0.22);
uniform vec3 sand_a : source_color = vec3(0.95, 0.86, 0.62);
uniform vec3 sand_b : source_color = vec3(0.87, 0.74, 0.50);
uniform float checker_size = 3.0;
uniform float sea_level = 0.0;

varying vec3 wpos;
varying vec3 wnorm;
varying float ao;
varying float wet;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	wnorm = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
	ao = COLOR.r;
	wet = COLOR.g;
}

float checker(vec2 p) {
	vec2 c = floor(p / checker_size);
	return mod(c.x + c.y, 2.0);
}

void fragment() {
	float n1 = texture(noise_tex, wpos.xz * 0.02).r;
	float n2 = texture(noise_tex, wpos.xz * 0.11 + 0.3).r;
	float n3 = texture(noise_tex, wpos.xz * 0.45).r;
	float slope = 1.0 - clamp(wnorm.y, 0.0, 1.0);

	// Grass with patchy tone variation and fine speckle.
	vec3 grass = mix(grass_a, grass_b, smoothstep(0.3, 0.7, n1) * 0.7 + n3 * 0.3);
	grass *= 0.9 + 0.2 * n2;

	// Checker rock: two-tone squares in world space, projected along the
	// dominant axis so cliffs read as blocks, with a little grime.
	vec3 an = abs(wnorm);
	vec2 proj = an.y > max(an.x, an.z) ? wpos.xz : (an.x > an.z ? wpos.zy : wpos.xy);
	float ch = checker(proj);
	vec3 rock = mix(rock_a, rock_b, ch);
	rock *= 0.85 + 0.3 * n3;
	rock = mix(rock, rock * 0.75, smoothstep(0.55, 0.9, n2) * 0.5);

	// Sand near sea level, only on shallow ground.
	vec3 sand = mix(sand_a, sand_b, n2);
	float sand_w = (1.0 - smoothstep(sea_level + 1.5, sea_level + 6.0, wpos.y)) * (1.0 - smoothstep(0.35, 0.6, slope));

	float rock_w = smoothstep(0.32, 0.55, slope + (n2 - 0.5) * 0.12);
	vec3 col = mix(grass, rock, rock_w);
	col = mix(col, sand, sand_w);
	// Dark wet band where terrain meets the water.
	float shore = 1.0 - smoothstep(sea_level - 0.3, sea_level + 0.9, wpos.y);
	col = mix(col, col * 0.6, shore * 0.8);
	col = mix(col, col * 0.85, wet * 0.5);

	ALBEDO = col;
	ROUGHNESS = mix(0.95, 0.45, shore) - 0.1 * rock_w;
	SPECULAR = 0.25;
	AO = mix(0.55, 1.0, ao);
	AO_LIGHT_AFFECT = 0.4;
}
