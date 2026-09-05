# Race HUD, drawn immediately every frame: position, lap, speed, energy,
# lap timer, weapon, minimap, countdown, notices and the boost / hit overlays.
class_name Hud
extends CanvasLayer

var race: Race
var _canvas: Control
var _font: Font
var _size := Vector2(1280, 720)
var _countdown_text := ""
var _countdown_t := 0.0
var _notice := ""
var _notice_col := Color.WHITE
var _notice_t := 0.0
var _touch := true
var _lap_flash := 0.0
var _clock := 0.0
var _map_points := PackedVector2Array()
var _map_rect := Rect2()
var _map_scale := 1.0
var _map_origin := Vector2.ZERO


func _ready() -> void:
	layer = 10
	_font = ThemeDB.fallback_font
	_canvas = Control.new()
	_canvas.set_anchors_preset(Control.PRESET_FULL_RECT)
	_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_canvas)
	_canvas.draw.connect(_draw_hud)
	get_viewport().size_changed.connect(_layout)
	_layout()
	visible = false


func attach(r: Race, touch: bool) -> void:
	race = r
	_touch = touch
	visible = r != null
	_countdown_text = ""
	_notice = ""
	if r != null:
		r.countdown_tick.connect(_on_tick)
		r.notice.connect(show_notice)
		r.player_lap.connect(_on_lap)
		_prepare_map()
	_layout()


func _layout() -> void:
	_size = get_viewport().get_visible_rect().size
	var msz := 170.0
	_map_rect = Rect2(_size.x - msz - 24.0, 96.0, msz, msz)
	if race != null:
		_prepare_map()


func _prepare_map() -> void:
	var b := race.track.minimap_bounds
	var msz := _map_rect.size.x - 20.0
	_map_scale = msz / maxf(b.size.x, b.size.y)
	var used := b.size * _map_scale
	_map_origin = _map_rect.position + Vector2(10, 10) + (Vector2(msz, msz) - used) * 0.5 - b.position * _map_scale
	_map_points = PackedVector2Array()
	for p in race.track.minimap:
		_map_points.append(_map_origin + p * _map_scale)
	if _map_points.size() > 1:
		_map_points.append(_map_points[0])


func _on_tick(n: int) -> void:
	_countdown_text = str(n) if n > 0 else "GO!"
	_countdown_t = 1.0


func _on_lap(_lap: int, _total: int, _t: float) -> void:
	_lap_flash = 1.5


func show_notice(text: String, col: Color) -> void:
	_notice = text
	_notice_col = col
	_notice_t = 2.2


func _process(delta: float) -> void:
	if race == null:
		return
	_clock += delta
	_countdown_t = maxf(_countdown_t - delta, 0.0)
	_notice_t = maxf(_notice_t - delta, 0.0)
	_lap_flash = maxf(_lap_flash - delta, 0.0)
	_canvas.queue_redraw()


static func fmt_time(t: float) -> String:
	if t < 0.0:
		return "--:--.--"
	var m := int(t / 60.0)
	var s := t - m * 60.0
	return "%d:%05.2f" % [m, s]


static func ordinal(n: int) -> String:
	match n:
		1: return "ST"
		2: return "ND"
		3: return "RD"
		_: return "TH"


func _text(text: String, at: Vector2, size: int, col: Color, align: int = 0, outline: int = 4) -> void:
	var w := _font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	var p := at
	if align == 1:
		p.x -= w * 0.5
	elif align == 2:
		p.x -= w
	if outline > 0:
		_canvas.draw_string_outline(_font, p, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, outline, Color(0, 0, 0, col.a * 0.85))
	_canvas.draw_string(_font, p, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, col)


func _draw_hud() -> void:
	if race == null or race.player == null:
		return
	var c := _canvas
	var p := race.player
	var w := _size.x
	var h := _size.y
	var cyan := Color(0.0, 0.95, 1.0)
	# Hit flash and boost overlays.
	if p.hit_flash > 0.0:
		c.draw_rect(Rect2(Vector2.ZERO, _size), Color(1.0, 0.15, 0.1, p.hit_flash * 0.35))
	if p.boost_t > 0.0:
		var a := clampf(p.boost_t, 0.0, 1.0) * 0.5
		for i in 3:
			var inset := 6.0 + i * 10.0
			c.draw_rect(Rect2(inset, inset, w - inset * 2.0, h - inset * 2.0), Color(cyan, a * (0.5 - i * 0.15)), false, 8.0)
	# Position and lap (top-left, right of the pause chip).
	var rank := race.rank_of(p)
	var px := 100.0 if _touch else 28.0
	_text(str(rank), Vector2(px, 82), 74, Color(1, 1, 1))
	var numw := _font.get_string_size(str(rank), HORIZONTAL_ALIGNMENT_LEFT, -1, 74).x
	_text(ordinal(rank), Vector2(px + numw + 6.0, 56), 26, Color(1, 1, 1, 0.9))
	var lap_n := clampi(p.lap + 1, 1, race.laps)
	var lap_col := Color(1.0, 0.8, 0.2) if _lap_flash > 0.0 and int(_lap_flash * 6.0) % 2 == 0 else Color(1, 1, 1, 0.9)
	_text("LAP %d/%d" % [lap_n, race.laps], Vector2(px, 118), 26, lap_col)
	# Energy bar (top centre).
	var bw := 300.0
	var bx := w * 0.5 - bw * 0.5
	c.draw_rect(Rect2(bx - 3, 19, bw + 6, 20), Color(0, 0, 0, 0.5))
	var e := p.energy / 100.0
	var ecol := Color(0.2, 1.0, 0.5).lerp(Color(1.0, 0.25, 0.2), clampf(1.0 - e * 1.4, 0.0, 1.0))
	if p.shield_t > 0.0:
		ecol = Color(0.5, 0.85, 1.0)
	c.draw_rect(Rect2(bx, 22, bw * e, 14), ecol)
	c.draw_rect(Rect2(bx - 3, 19, bw + 6, 20), Color(1, 1, 1, 0.6), false, 2.0)
	_text("SHIELD" if p.shield_t > 0.0 else "ENERGY", Vector2(w * 0.5, 58), 15, Color(1, 1, 1, 0.75), 1, 3)
	# Timer (top-right).
	var lt := race.race_time - p.lap_start if race.state != Race.State.COUNTDOWN else 0.0
	if p.finished:
		lt = p.finish_time
	_text(("TIME " if p.finished else "LAP ") + fmt_time(lt), Vector2(w - 24, 44), 26, Color(1, 1, 1), 2)
	_text("BEST " + (fmt_time(p.best_lap) if p.best_lap > 0.0 else "--:--.--"), Vector2(w - 24, 74), 20, Color(1, 1, 1, 0.8), 2)
	# Minimap.
	c.draw_rect(_map_rect, Color(0, 0, 0, 0.3))
	if _map_points.size() > 2:
		c.draw_polyline(_map_points, Color(1, 1, 1, 0.55), 3.0, true)
	for sh in race.ships:
		var mp := _map_origin + race.track.map_point(sh.global_position) * _map_scale
		if sh == p:
			c.draw_circle(mp, 6.0, Color(1, 1, 1))
			c.draw_circle(mp, 6.0, cyan, false, 2.0)
		else:
			c.draw_circle(mp, 4.0, sh.team["color"])
	# Speed (bottom centre).
	var kmh := p.speed_kmh()
	var sy := h - 44.0
	_text(str(kmh), Vector2(w * 0.5 - 8.0, sy), 60, Color(1, 1, 1), 2)
	_text("KM/H", Vector2(w * 0.5 + 2.0, sy), 20, Color(1, 1, 1, 0.8))
	if p.boost_t > 0.0:
		_text("BOOST", Vector2(w * 0.5, sy - 62.0), 28, cyan, 1)
	# Weapon.
	var wn := p.weapon_name()
	var wy := h - 250.0 if _touch else h - 60.0
	var wx := w - 130.0 if _touch else w - 24.0
	if wn != "":
		var pulse := 0.85 + 0.15 * sin(_clock * 8.0)
		_text(wn, Vector2(wx, wy), 26, Color(1.0, 0.3, 0.8) * Color(1, 1, 1, pulse), 1 if _touch else 2)
		if _touch:
			_text("tap FIRE", Vector2(wx, wy + 24.0), 15, Color(1, 1, 1, 0.75), 1, 3)
	# Countdown.
	if _countdown_t > 0.0 and _countdown_text != "":
		var a := clampf(_countdown_t * 1.6, 0.0, 1.0)
		var sz := 150 if _countdown_text != "GO!" else 130
		var col := Color(1, 1, 1, a) if _countdown_text != "GO!" else Color(0.3, 1.0, 0.5, a)
		_text(_countdown_text, Vector2(w * 0.5, h * 0.42), sz, col, 1, 8)
	elif race.state == Race.State.COUNTDOWN and _countdown_text == "":
		_text("GET READY", Vector2(w * 0.5, h * 0.42), 54, Color(1, 1, 1, 0.9), 1, 6)
	# Notice.
	if _notice_t > 0.0:
		var a := clampf(_notice_t * 2.0, 0.0, 1.0)
		_text(_notice, Vector2(w * 0.5, h * 0.27), 44, Color(_notice_col, a), 1, 6)
	if p.finished and race.state == Race.State.FINISHED:
		_text("FINISHED  %d%s" % [rank, ordinal(rank)], Vector2(w * 0.5, h * 0.42), 64, Color(1.0, 0.9, 0.3), 1, 8)
