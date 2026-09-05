# Sound: a pool of one-shot players, looping wind / rail / boost layers
# driven by the player's state, and the music loop. Every file under
# res://assets/audio was synthesised by tools/gen_audio.py (see CREDITS.md).
class_name Sfx
extends Node

const VOICES := 12

var music_enabled := true
var _streams := {}
var _pool: Array = []
var _wind: AudioStreamPlayer
var _rail: AudioStreamPlayer
var _boost: AudioStreamPlayer
var _music: AudioStreamPlayer
var _wind_v := -80.0
var _rail_v := -80.0
var _boost_v := -80.0


func _ready() -> void:
	for i in VOICES:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_pool.append(p)
	_wind = _loop("wind_loop")
	_rail = _loop("rail_loop")
	_boost = _loop("boost_loop")
	_music = AudioStreamPlayer.new()
	_music.volume_db = -8.0
	add_child(_music)


func _loop(name: String) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.stream = _stream(name)
	p.volume_db = -80.0
	add_child(p)
	return p


func _stream(name: String) -> AudioStream:
	if _streams.has(name):
		return _streams[name]
	var path := "res://assets/audio/%s.wav" % name
	if not ResourceLoader.exists(path):
		_streams[name] = null
		return null
	var st: AudioStream = load(path)
	if st is AudioStreamWAV:
		var w := st as AudioStreamWAV
		if name.ends_with("_loop") or name == "music":
			w.loop_mode = AudioStreamWAV.LOOP_FORWARD
			w.loop_begin = 0
			w.loop_end = w.data.size() / 2  # 16-bit mono samples
	_streams[name] = st
	return st


func play(name: String, db: float = 0.0, pitch: float = 1.0) -> void:
	var st := _stream(name)
	if st == null:
		return
	for p in _pool:
		if not p.playing:
			p.stream = st
			p.volume_db = db
			p.pitch_scale = pitch
			p.play()
			return
	var p0: AudioStreamPlayer = _pool[0]
	p0.stream = st
	p0.volume_db = db
	p0.pitch_scale = pitch
	p0.play()


func music(on: bool) -> void:
	music_enabled = on
	if on:
		if _music.stream == null:
			_music.stream = _stream("music")
		if _music.stream and not _music.playing:
			_music.play()
	else:
		_music.stop()


func set_music_volume(db: float) -> void:
	_music.volume_db = db


# Called every frame with the player's speed and state.
func update(dt: float, speed: float, on_rail: bool, boosting: bool, in_air: bool) -> void:
	var wind_t := clampf((speed - 18.0) / 45.0, 0.0, 1.0)
	var wind_db := lerpf(-80.0, -10.0, sqrt(wind_t)) if wind_t > 0.0 else -80.0
	_wind_v = lerpf(_wind_v, wind_db, 1.0 - exp(-4.0 * dt))
	_set(_wind, _wind_v, 0.8 + wind_t * 0.6)
	var rail_db := -14.0 if on_rail and speed > 4.0 else -80.0
	_rail_v = lerpf(_rail_v, rail_db, 1.0 - exp(-10.0 * dt))
	_set(_rail, _rail_v, 0.8 + clampf(speed / 60.0, 0.0, 1.0) * 0.7)
	var boost_db := -12.0 if boosting else -80.0
	_boost_v = lerpf(_boost_v, boost_db, 1.0 - exp(-8.0 * dt))
	_set(_boost, _boost_v, 1.0)


func _set(p: AudioStreamPlayer, db: float, pitch: float) -> void:
	if p.stream == null:
		return
	p.volume_db = db
	p.pitch_scale = pitch
	if db > -60.0 and not p.playing:
		p.play()
	elif db <= -60.0 and p.playing:
		p.stop()
