# Sound manager: a pool of one-shot players, looping engine / whine / scrape
# layers driven by the player's ship, and music. Everything is a real audio
# file under res://assets/audio (see CREDITS.md).
class_name Sfx
extends Node

const VOICES := 10

var enabled := true
var music_enabled := true
var _streams := {}
var _pool: Array = []
var _engine: AudioStreamPlayer
var _whine: AudioStreamPlayer
var _scrape: AudioStreamPlayer
var _music: AudioStreamPlayer
var _music_name := ""
var _engine_on := false


func _ready() -> void:
	for i in VOICES:
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		_pool.append(p)
	_engine = _loop_player("engine_loop", -80.0)
	_whine = _loop_player("whine_loop", -80.0)
	_scrape = _loop_player("scrape_loop", -80.0)
	_music = AudioStreamPlayer.new()
	_music.volume_db = -9.0
	add_child(_music)


func _loop_player(name: String, db: float) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.stream = _stream(name)
	p.volume_db = db
	add_child(p)
	return p


func _stream(name: String) -> AudioStream:
	if _streams.has(name):
		return _streams[name]
	var path := "res://assets/audio/%s.wav" % name
	if not ResourceLoader.exists(path):
		path = "res://assets/audio/%s.ogg" % name
	var st: AudioStream = load(path)
	_streams[name] = st
	return st


func play(name: String, db: float = 0.0, pitch: float = 1.0) -> void:
	if not enabled:
		return
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
	var p: AudioStreamPlayer = _pool[0]
	p.stream = st
	p.volume_db = db
	p.pitch_scale = pitch
	p.play()


func engine(on: bool) -> void:
	_engine_on = on
	if on:
		if not _engine.playing:
			_engine.play()
		if not _whine.playing:
			_whine.play()
		if not _scrape.playing:
			_scrape.play()
	else:
		_engine.stop()
		_whine.stop()
		_scrape.stop()


# speed 0..1.3 (fraction of top speed), boost 0/1, scrape 0..1
func engine_state(speed: float, boost: float, scrape: float) -> void:
	if not _engine_on or not enabled:
		return
	_engine.pitch_scale = clampf(0.75 + speed * 0.9 + boost * 0.35, 0.5, 2.6)
	_engine.volume_db = linear_to_db(clampf(0.25 + speed * 0.5, 0.0, 1.0)) - 6.0
	_whine.pitch_scale = clampf(0.6 + speed * 1.1, 0.4, 2.2)
	_whine.volume_db = linear_to_db(clampf(speed * 0.35 + boost * 0.3, 0.001, 1.0)) - 12.0
	_scrape.volume_db = linear_to_db(clampf(scrape, 0.001, 1.0)) - 4.0


func music(name: String) -> void:
	if name == _music_name and _music.playing:
		return
	_music_name = name
	if not music_enabled or name == "":
		_music.stop()
		return
	_music.stream = _stream(name)
	_music.play()


func set_music_enabled(on: bool) -> void:
	music_enabled = on
	if not on:
		_music.stop()
	elif _music_name != "":
		_music.stream = _stream(_music_name)
		_music.play()


func set_enabled(on: bool) -> void:
	enabled = on
	if not on:
		for p in _pool:
			p.stop()
		_engine.volume_db = -80.0
		_whine.volume_db = -80.0
		_scrape.volume_db = -80.0
