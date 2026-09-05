# One place to ask "are we on a device that needs the cheap path?".
# The web export runs the Compatibility (WebGL 2) renderer on whatever GPU the
# tablet has, so the cheap path lowers the 3D render scale and particle counts.
class_name Quality
extends RefCounted

static var _cached := -1


static func lightweight() -> bool:
	if _cached < 0:
		_cached = 1 if (OS.has_feature("web") or OS.has_feature("mobile")) else 0
	return _cached == 1


static func force(on: bool) -> void:
	_cached = 1 if on else 0
