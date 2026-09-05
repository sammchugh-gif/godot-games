# Circuit layouts. Each point: [x, y, z, bank_deg, width, tunnel]
# Ships travel in point order; the loop closes back to point 0. Bank > 0
# tilts the surface so the LEFT edge rises (use it on right-hand turns),
# bank < 0 raises the right edge (left-hand turns).
class_name TrackDefs
extends RefCounted


static func all() -> Array:
	return [marina(), cryo(), magma()]


static func marina() -> Dictionary:
	return {
		"id": "marina",
		"name": "MARINA BAY",
		"tagline": "Sunset harbour circuit. Fast sweepers, a sea bridge and a cliff tunnel.",
		"theme": "marina",
		"laps": 3,
		"points": [
			[0, 6, 0, 0, 26, false],
			[0, 6, -200, 0, 26, false],
			[40, 8, -320, 12, 24, false],
			[150, 12, -380, 22, 24, false],
			[260, 18, -340, 26, 24, false],
			[300, 24, -230, 20, 24, false],
			[260, 28, -120, 16, 24, false],
			[160, 26, -70, 4, 26, false],
			[60, 22, -90, -8, 26, false],
			[-40, 20, -150, -10, 26, false],
			[-140, 18, -220, -6, 24, false],
			[-230, 16, -300, -14, 24, true],
			[-300, 14, -400, -22, 24, true],
			[-330, 12, -500, -26, 24, true],
			[-260, 10, -580, -18, 24, false],
			[-150, 10, -560, 8, 24, false],
			[-80, 8, -480, 12, 24, false],
			[-70, 6, -360, 4, 26, false],
			[-90, 6, -220, 0, 26, false],
			[-90, 6, -80, 0, 26, false],
			[-70, 6, 60, -14, 24, false],
			[-20, 6, 150, -28, 22, false],
			[40, 6, 120, -24, 22, false],
			[30, 6, 40, -6, 26, false],
		],
	}


static func cryo() -> Dictionary:
	return {
		"id": "cryo",
		"name": "CRYO RIFT",
		"tagline": "Night race over a frozen canyon. Hairpins, a sky bridge and an ice tunnel.",
		"theme": "cryo",
		"laps": 3,
		"points": [
			[0, 10, 0, 0, 24, false],
			[0, 10, -160, 0, 24, false],
			[-30, 14, -260, -12, 22, false],
			[-20, 20, -360, 6, 22, false],
			[60, 26, -420, 22, 22, false],
			[160, 30, -400, 24, 22, false],
			[200, 34, -300, 28, 22, false],
			[150, 40, -200, 18, 22, false],
			[60, 44, -220, -12, 22, false],
			[-40, 48, -280, -8, 24, false],
			[-140, 50, -320, 0, 24, false],
			[-240, 46, -260, -20, 22, true],
			[-280, 40, -140, -26, 22, true],
			[-240, 34, -40, -18, 22, true],
			[-140, 28, 20, -6, 24, false],
			[-40, 22, 60, 0, 24, false],
			[60, 18, 60, 10, 24, false],
			[120, 16, 120, 24, 22, false],
			[100, 12, 220, 30, 22, false],
			[20, 10, 200, 20, 22, false],
			[-10, 10, 100, 4, 24, false],
		],
	}


static func magma() -> Dictionary:
	return {
		"id": "magma",
		"name": "MAGMA NEBULA",
		"tagline": "A volcanic moon under the Milky Way. Long straights, a huge crest and a lava tunnel.",
		"theme": "magma",
		"laps": 3,
		"points": [
			[0, 30, -40, 0, 26, false],
			[0, 30, -320, 0, 26, false],
			[30, 24, -460, 10, 24, false],
			[120, 20, -550, 22, 24, false],
			[240, 26, -530, 26, 24, false],
			[320, 40, -430, 24, 24, false],
			[330, 60, -280, 12, 24, false],
			[280, 72, -160, 0, 26, false],
			[200, 54, -80, 10, 26, false],
			[100, 52, -60, 6, 26, false],
			[0, 48, -110, -6, 26, false],
			[-110, 44, -160, -4, 26, false],
			[-220, 40, -140, -18, 24, false],
			[-300, 36, -40, -26, 24, false],
			[-300, 34, 80, -24, 24, false],
			[-220, 34, 160, -12, 24, false],
			[-100, 32, 180, 0, 24, true],
			[10, 30, 160, 12, 24, true],
			[100, 30, 110, 26, 22, false],
			[70, 30, 30, 22, 22, false],
		],
	}


# Ship teams: colour, and stats 0..1 (speed, thrust, handling, shield).
static func teams() -> Array:
	return [
		{"name": "FEISAR", "color": Color(0.15, 0.45, 1.0), "accent": Color(1, 1, 1), "speed": 0.7, "thrust": 0.75, "handling": 0.95, "shield": 0.85},
		{"name": "AURICOM", "color": Color(1.0, 0.85, 0.15), "accent": Color(0.9, 0.1, 0.1), "speed": 0.8, "thrust": 0.7, "handling": 0.7, "shield": 1.0},
		{"name": "QIREX", "color": Color(0.55, 0.15, 0.9), "accent": Color(0.2, 1.0, 0.9), "speed": 1.0, "thrust": 0.65, "handling": 0.6, "shield": 0.7},
		{"name": "PIRANHA", "color": Color(1.0, 0.2, 0.2), "accent": Color(1, 1, 1), "speed": 0.95, "thrust": 0.9, "handling": 0.55, "shield": 0.6},
		{"name": "ASSEGAI", "color": Color(0.1, 0.9, 0.4), "accent": Color(0.05, 0.05, 0.05), "speed": 0.75, "thrust": 0.95, "handling": 0.9, "shield": 0.65},
		{"name": "GOTEKI", "color": Color(1.0, 0.5, 0.1), "accent": Color(0.1, 0.1, 0.1), "speed": 0.85, "thrust": 0.8, "handling": 0.75, "shield": 0.8},
		{"name": "ICARAS", "color": Color(0.95, 0.95, 0.95), "accent": Color(0.0, 0.7, 1.0), "speed": 0.9, "thrust": 1.0, "handling": 0.5, "shield": 0.55},
		{"name": "TIGRON", "color": Color(0.0, 0.85, 0.95), "accent": Color(1.0, 0.2, 0.7), "speed": 0.8, "thrust": 0.85, "handling": 0.8, "shield": 0.75},
	]
