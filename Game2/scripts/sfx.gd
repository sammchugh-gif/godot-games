# Procedural sound effects. Every sound is synthesised into an AudioStreamWAV
# at startup, so there are no audio files to ship and the web build stays
# small -- the same approach the games take with their textures.
#
# Usage:  Sfx.play("break")        Sfx.play("star", -4.0)
# One instance is added to the scene by the game; play() is static and finds
# it, so player, boss and creature scripts do not need a reference.
class_name Sfx
extends Node

const RATE := 22050
const VOICES := 12

static var _inst: Sfx = null

var muted := false
var _streams := {}
var _players: Array[AudioStreamPlayer] = []
var _next := 0


func _ready() -> void:
	_inst = self
	for i in VOICES:
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		_players.append(p)
	_build_all()


static func play(name: String, volume_db: float = 0.0, pitch_jitter: float = 0.06) -> void:
	if _inst == null or _inst.muted:
		return
	var s: AudioStreamWAV = _inst._streams.get(name)
	if s == null:
		return
	var p: AudioStreamPlayer = _inst._players[_inst._next]
	_inst._next = (_inst._next + 1) % VOICES
	p.stream = s
	p.volume_db = volume_db
	# A little random pitch stops a repeated sound turning into a machine gun.
	p.pitch_scale = 1.0 + (randf() - 0.5) * 2.0 * pitch_jitter
	p.play()


static func toggle_mute() -> bool:
	if _inst == null:
		return false
	_inst.muted = not _inst.muted
	if _inst.muted:
		for p in _inst._players:
			p.stop()
	return _inst.muted


# ------------------------------------------------------------ synthesis ---

func _build_all() -> void:
	_streams["click"] = _wav(_tone(0.05, 1400.0, 900.0, 0.5, 0.2))
	_streams["deny"] = _wav(_mix([_tone(0.16, 190.0, 160.0, 0.5, 0.8), _tone(0.16, 197.0, 165.0, 0.5, 0.8)]))
	_streams["place"] = _wav(_mix([_thump(0.12, 180.0, 70.0), _noise(0.05, 0.25, 1.0)]))
	_streams["break"] = _wav(_mix([_noise(0.22, 0.9, 2.0), _thump(0.1, 140.0, 60.0)]))
	_streams["dig"] = _wav(_noise(0.06, 0.5, 3.0))
	_streams["swing"] = _wav(_whoosh(0.18))
	_streams["hit"] = _wav(_mix([_thump(0.25, 120.0, 40.0), _noise(0.12, 0.6, 2.5)]))
	_streams["explosion"] = _wav(_mix([_noise(0.9, 1.0, 1.4), _thump(0.6, 70.0, 28.0)]))
	_streams["turret"] = _wav(_tone(0.11, 1800.0, 500.0, 0.3, 1.5))
	_streams["zap"] = _wav(_mix([_tone(0.14, 1200.0, 300.0, 0.5, 1.2), _noise(0.06, 0.3, 4.0)]))
	_streams["spit"] = _wav(_tone(0.12, 500.0, 220.0, 0.4, 1.0))
	_streams["pop"] = _wav(_mix([_tone(0.1, 700.0, 250.0, 0.6, 2.0), _noise(0.08, 0.5, 3.0)]))
	_streams["star"] = _wav(_arp([880.0, 1108.7, 1318.5], 0.09, 0.32))
	_streams["starrock"] = _wav(_mix([_arp([659.3, 880.0, 1318.5], 0.08, 0.5), _noise(0.25, 0.7, 2.0)]))
	_streams["seal"] = _wav(_mix([_arp([523.3, 659.3, 784.0, 1046.5, 1318.5], 0.12, 1.4), _shimmer(1.6)]))
	_streams["recall"] = _wav(_tone(0.45, 300.0, 1400.0, 0.3, 0.8))
	_streams["stomp"] = _wav(_mix([_thump(0.45, 60.0, 25.0), _noise(0.2, 0.5, 1.2)]))
	_streams["roar"] = _wav(_roar(0.9))
	_streams["win"] = _wav(_arp([523.3, 659.3, 784.0, 1046.5], 0.14, 1.2))
	_streams["lose"] = _wav(_arp([440.0, 415.3, 392.0, 349.2], 0.22, 1.6))


func _wav(samples: PackedFloat32Array) -> AudioStreamWAV:
	var s := AudioStreamWAV.new()
	s.format = AudioStreamWAV.FORMAT_16_BITS
	s.mix_rate = RATE
	s.stereo = false
	var bytes := PackedByteArray()
	bytes.resize(samples.size() * 2)
	for i in samples.size():
		var v := int(clampf(samples[i], -1.0, 1.0) * 32767.0)
		bytes.encode_s16(i * 2, v)
	s.data = bytes
	return s


func _mix(parts: Array) -> PackedFloat32Array:
	var n := 0
	for p in parts:
		n = maxi(n, (p as PackedFloat32Array).size())
	var out := PackedFloat32Array()
	out.resize(n)
	for p in parts:
		var a: PackedFloat32Array = p
		for i in a.size():
			out[i] += a[i]
	# Soft-clip so stacked layers do not crackle.
	for i in n:
		out[i] = tanh(out[i] * 1.2)
	return out


# Envelope: fast attack, exponential-ish decay. curve > 1 decays faster.
func _env(t: float, dur: float, curve: float) -> float:
	var a := minf(t / 0.004, 1.0)
	return a * pow(1.0 - t / dur, curve)


func _tone(dur: float, f0: float, f1: float, amp: float, curve: float) -> PackedFloat32Array:
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	var ph := 0.0
	for i in n:
		var t := float(i) / RATE
		var f := lerpf(f0, f1, t / dur)
		ph += TAU * f / RATE
		# Sine plus a little square for bite.
		var v := sin(ph) * 0.8 + signf(sin(ph)) * 0.2
		out[i] = v * amp * _env(t, dur, curve)
	return out


func _thump(dur: float, f0: float, f1: float) -> PackedFloat32Array:
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	var ph := 0.0
	for i in n:
		var t := float(i) / RATE
		var f := lerpf(f0, f1, minf(t / (dur * 0.35), 1.0))
		ph += TAU * f / RATE
		out[i] = sin(ph) * 0.9 * _env(t, dur, 1.6)
	return out


func _noise(dur: float, amp: float, curve: float) -> PackedFloat32Array:
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	var lp := 0.0
	for i in n:
		var t := float(i) / RATE
		# One-pole low-pass takes the hiss off white noise; it reads as rubble.
		lp = lp * 0.72 + (randf() * 2.0 - 1.0) * 0.28
		out[i] = lp * amp * _env(t, dur, curve)
	return out


func _whoosh(dur: float) -> PackedFloat32Array:
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	var lp := 0.0
	for i in n:
		var t := float(i) / RATE
		# Filter opens then closes: quiet-loud-quiet, which is what a swing is.
		var k := 0.55 + 0.4 * sin(PI * t / dur)
		lp = lp * (1.0 - k) + (randf() * 2.0 - 1.0) * k
		out[i] = lp * 0.5 * sin(PI * t / dur)
	return out


func _arp(freqs: Array, step: float, tail: float) -> PackedFloat32Array:
	var dur := step * freqs.size() + tail
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	for k in freqs.size():
		var f: float = freqs[k]
		var start := int(k * step * RATE)
		var ndur := (dur - k * step)
		var ph := 0.0
		for i in range(start, n):
			var t := float(i - start) / RATE
			ph += TAU * f / RATE
			var v := sin(ph) + 0.35 * sin(ph * 2.0)
			out[i] += v * 0.28 * _env(t, ndur, 2.2)
	return out


func _shimmer(dur: float) -> PackedFloat32Array:
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	var ph := 0.0
	for i in n:
		var t := float(i) / RATE
		var f := 2000.0 + 600.0 * sin(t * 9.0)
		ph += TAU * f / RATE
		out[i] = sin(ph) * 0.12 * _env(t, dur, 1.2)
	return out


func _roar(dur: float) -> PackedFloat32Array:
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	var ph := 0.0
	var lp := 0.0
	for i in n:
		var t := float(i) / RATE
		# Low sawtooth with vibrato, growl from noise underneath.
		var f := 62.0 + 18.0 * sin(t * 7.0) - 20.0 * t / dur
		ph += f / RATE
		var saw := 2.0 * (ph - floorf(ph)) - 1.0
		lp = lp * 0.85 + (randf() * 2.0 - 1.0) * 0.15
		var env := sin(PI * minf(t / dur, 1.0))
		out[i] = (saw * 0.45 + lp * 0.35) * env
	return out
