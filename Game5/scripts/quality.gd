# One place to ask "are we on a device that needs the cheap path?".
# The web export runs the Compatibility (WebGL 2) renderer on whatever GPU the
# tablet has, so the cheap path lowers terrain density, vegetation counts,
# particle counts and the 3D render scale. Desktop gets everything.
class_name Quality
extends RefCounted

static var _cached := -1


static func lightweight() -> bool:
	if _cached < 0:
		_cached = 1 if (OS.has_feature("web") or OS.has_feature("mobile")) else 0
	return _cached == 1


static func force(on: bool) -> void:
	_cached = 1 if on else 0


# Forward+ only features (SSAO, volumetric fog, SDFGI) are silently ignored by
# the Compatibility renderer, but we still avoid paying for them there.
static func forward_plus() -> bool:
	var m := str(ProjectSettings.get_setting("rendering/renderer/rendering_method"))
	if OS.has_feature("web") or OS.has_feature("mobile"):
		return false
	return m == "forward_plus"


static func scale(a: int, b: int) -> int:
	return b if lightweight() else a
