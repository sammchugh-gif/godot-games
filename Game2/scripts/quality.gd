# One place to ask "are we on a device that needs the cheap path?".
#
# The web export runs the Compatibility (WebGL 2) renderer on whatever GPU the
# tablet has. The thing that hurts most there is dynamic lights: every star,
# creature and bolt used to carry its own OmniLight3D, which blows past the
# renderer's per-object light limit and turns into visible stutter. On the
# cheap path those become emissive-only -- they still glow in a dark cave,
# they just stop lighting the rock around them.
class_name Quality
extends RefCounted

static var _cached := -1


static func lightweight() -> bool:
	if _cached < 0:
		_cached = 1 if (OS.has_feature("web") or OS.has_feature("mobile")) else 0
	return _cached == 1


# Lets the desktop build preview the mobile path with --lightweight.
static func force(on: bool) -> void:
	_cached = 1 if on else 0
