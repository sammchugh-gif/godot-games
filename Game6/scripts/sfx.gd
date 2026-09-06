# Procedural audio. Every effect and the music loop are synthesised into
# AudioStreamWAVs at startup: no audio files, small web build.
#
#   Sfx.play("coin")    Sfx.music(true)
class_name Sfx
extends Node

const RATE := 22050
const VOICES := 12

static var _inst: Sfx = null

var muted := false
var _streams := {}
var _players: Array[AudioStreamPlayer] = []
var _music: AudioStreamPlayer
var _next := 0


func _ready() -> void:
	_inst = self
	for i in VOICES:
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		_players.append(p)
	_music = AudioStreamPlayer.new()
	_music.volume_db = -9.0
	add_child(_music)
	_build_all()


static func play(name: String, volume_db: float = 0.0, pitch_jitter: float = 0.05) -> void:
	if _inst == null or _inst.muted:
		return
	var s: AudioStreamWAV = _inst._streams.get(name)
	if s == null:
		return
	var p: AudioStreamPlayer = _inst._players[_inst._next]
	_inst._next = (_inst._next + 1) % VOICES
	p.stream = s
	p.volume_db = volume_db
	p.pitch_scale = 1.0 + (randf() - 0.5) * 2.0 * pitch_jitter
	p.play()


static func music(on: bool) -> void:
	if _inst == null:
		return
	if on and not _inst._music.playing and not _inst.muted:
		_inst._music.stream = _inst._streams["music"]
		_inst._music.play()
	elif not on:
		_inst._music.stop()


static func toggle_mute() -> bool:
	if _inst == null:
		return false
	_inst.muted = not _inst.muted
	if _inst.muted:
		for p in _inst._players:
			p.stop()
		_inst._music.stop()
	else:
		music(true)
	return _inst.muted


# ------------------------------------------------------------ synthesis ---

func _build_all() -> void:
	_streams["coin"] = _wav(_arp([1318.5, 1760.0], 0.05, 0.35))
	_streams["purple"] = _wav(_arp([987.8, 1318.5, 1567.98], 0.06, 0.45))
	_streams["moon"] = _wav(_arp([523.3, 659.3, 784.0, 1046.5, 1318.5], 0.11, 1.4))
	_streams["multimoon"] = _wav(_arp([392.0, 523.3, 659.3, 784.0, 1046.5, 1318.5, 1568.0], 0.12, 1.8))
	_streams["jump"] = _wav(_tone(0.16, 380.0, 760.0, 0.4, 1.0))
	_streams["jump2"] = _wav(_tone(0.18, 460.0, 920.0, 0.4, 1.0))
	_streams["jump3"] = _wav(_mix([_tone(0.22, 520.0, 1180.0, 0.4, 1.0), _tone(0.22, 780.0, 1560.0, 0.15, 1.0)]))
	_streams["capjump"] = _wav(_mix([_tone(0.2, 300.0, 1000.0, 0.45, 0.9), _noise(0.06, 0.2, 2.0)]))
	_streams["land"] = _wav(_mix([_thump(0.08, 180.0, 70.0), _noise(0.05, 0.15, 3.0)]))
	_streams["pound"] = _wav(_mix([_thump(0.28, 160.0, 40.0), _noise(0.2, 0.6, 2.0)]))
	_streams["hurt"] = _wav(_mix([_tone(0.3, 300.0, 120.0, 0.5, 1.0), _noise(0.1, 0.3, 2.0)]))
	_streams["die"] = _wav(_arp([440.0, 415.3, 392.0, 349.2, 293.7], 0.16, 1.4))
	_streams["throw"] = _wav(_mix([_noise(0.22, 0.35, 1.4), _tone(0.22, 900.0, 400.0, 0.2, 1.0)]))
	_streams["catch"] = _wav(_tone(0.08, 600.0, 900.0, 0.35, 0.8))
	_streams["capture"] = _wav(_mix([_arp([392.0, 523.3, 784.0, 1046.5], 0.07, 0.6), _noise(0.25, 0.25, 1.5)]))
	_streams["release"] = _wav(_arp([784.0, 523.3, 392.0], 0.07, 0.5))
	_streams["stomp"] = _wav(_mix([_tone(0.12, 500.0, 150.0, 0.5, 1.5), _noise(0.08, 0.4, 2.5)]))
	_streams["break"] = _wav(_mix([_noise(0.25, 0.7, 1.6), _thump(0.15, 220.0, 60.0)]))
	_streams["bell"] = _wav(_mix([_tone(0.9, 1568.0, 1560.0, 0.35, 1.6), _tone(0.9, 2349.0, 2340.0, 0.15, 2.0)]))
	_streams["roar"] = _wav(_mix([_tone(0.7, 110.0, 70.0, 0.6, 0.7), _noise(0.7, 0.5, 0.8)]))
	_streams["bosshit"] = _wav(_mix([_thump(0.3, 200.0, 50.0), _arp([659.3, 880.0], 0.08, 0.5)]))
	_streams["bossdown"] = _wav(_arp([523.3, 493.9, 440.0, 392.0, 349.2, 329.6, 293.7, 261.6], 0.12, 1.6))
	_streams["checkpoint"] = _wav(_arp([659.3, 880.0, 1108.7], 0.07, 0.6))
	_streams["buy"] = _wav(_arp([880.0, 1108.7, 1318.5, 1760.0], 0.05, 0.5))
	_streams["deny"] = _wav(_mix([_tone(0.16, 190.0, 160.0, 0.5, 0.8), _tone(0.16, 197.0, 165.0, 0.5, 0.8)]))
	_streams["click"] = _wav(_tone(0.05, 1400.0, 900.0, 0.5, 0.2))
	_streams["splash"] = _wav(_noise(0.35, 0.45, 1.3))
	_streams["rocket"] = _wav(_mix([_noise(0.9, 0.6, 1.1), _tone(0.9, 100.0, 500.0, 0.3, 0.6)]))
	_streams["boing"] = _wav(_tone(0.35, 200.0, 900.0, 0.45, 0.9))
	_streams["stretch"] = _wav(_tone(0.3, 300.0, 700.0, 0.3, 0.8))
	_streams["heart"] = _wav(_arp([659.3, 784.0, 987.8, 1318.5], 0.06, 0.6))
	_streams["switch"] = _wav(_mix([_tone(0.1, 700.0, 300.0, 0.5, 1.0), _tone(0.12, 1000.0, 1200.0, 0.3, 1.0)]))
	_streams["tick"] = _wav(_tone(0.04, 1000.0, 1000.0, 0.35, 0.3))
	_streams["cleared"] = _wav(_arp([523.3, 659.3, 784.0, 1046.5, 784.0, 1046.5, 1318.5, 1568.0], 0.13, 2.0))
	_streams["music"] = _music_loop()


func _wav(samples: PackedFloat32Array, loop: bool = false) -> AudioStreamWAV:
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
	if loop:
		s.loop_mode = AudioStreamWAV.LOOP_FORWARD
		s.loop_begin = 0
		s.loop_end = samples.size()
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
	for i in n:
		out[i] = tanh(out[i] * 1.2)
	return out


func _env(t: float, dur: float, curve: float) -> float:
	var a := minf(t / 0.004, 1.0)
	return a * pow(maxf(1.0 - t / dur, 0.0), curve)


func _tone(dur: float, f0: float, f1: float, amp: float, curve: float) -> PackedFloat32Array:
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	var ph := 0.0
	for i in n:
		var t := float(i) / RATE
		var f := lerpf(f0, f1, t / dur)
		ph += TAU * f / RATE
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
	var last := 0.0
	for i in n:
		var t := float(i) / RATE
		# Slightly low-passed white noise so it is a whoosh, not a hiss.
		last = last * 0.6 + (randf() * 2.0 - 1.0) * 0.4
		out[i] = last * amp * _env(t, dur, curve)
	return out


func _arp(freqs: Array, step: float, tail: float) -> PackedFloat32Array:
	var dur := step * freqs.size() + tail
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	for k in freqs.size():
		var f: float = freqs[k]
		var start := int(k * step * RATE)
		var len := int((step + tail) * RATE) if k == freqs.size() - 1 else int(step * 1.3 * RATE)
		var ph := 0.0
		for i in len:
			if start + i >= n:
				break
			var t := float(i) / RATE
			ph += TAU * f / RATE
			var v := sin(ph) * 0.7 + sin(ph * 2.0) * 0.2
			out[start + i] += v * 0.45 * _env(t, float(len) / RATE, 1.2)
	return out


# A bouncy 8-bar loop at 140 BPM: square lead, triangle bass, kick, snare
# and hats. Written as eighth-note grids (0 = rest), MIDI note numbers.
func _music_loop() -> AudioStreamWAV:
	var bpm := 140.0
	var eighth := 60.0 / bpm * 0.5
	var lead := [
		72, 76, 79, 76, 72, 76, 79, 81,   79, 0, 76, 0, 74, 76, 74, 72,
		69, 72, 76, 72, 69, 72, 76, 77,   76, 0, 74, 0, 72, 74, 76, 79,
		77, 81, 84, 81, 77, 81, 84, 86,   84, 0, 83, 0, 81, 79, 76, 79,
		74, 77, 81, 77, 74, 76, 77, 79,   76, 0, 72, 0, 67, 0, 72, 0]
	var bass := [
		48, 0, 55, 0, 48, 0, 55, 0,   43, 0, 50, 0, 43, 0, 47, 0,
		45, 0, 52, 0, 45, 0, 52, 0,   48, 0, 55, 0, 48, 0, 52, 0,
		41, 0, 48, 0, 41, 0, 48, 0,   48, 0, 55, 0, 45, 0, 52, 0,
		50, 0, 57, 0, 50, 0, 57, 0,   43, 0, 50, 0, 48, 0, 55, 0]
	var steps := lead.size()
	var total := int(steps * eighth * RATE)
	var out := PackedFloat32Array()
	out.resize(total)
	var step_n := int(eighth * RATE)
	for s in steps:
		var base := s * step_n
		var ln: int = lead[s]
		if ln > 0:
			var f := 440.0 * pow(2.0, (ln - 69) / 12.0)
			var ph := 0.0
			var len := int(step_n * 0.92)
			for i in len:
				var t := float(i) / RATE
				ph += TAU * f / RATE
				var v := (0.6 if fmod(ph, TAU) < PI * 0.6 else -0.6)
				out[base + i] += v * 0.22 * _env(t, float(len) / RATE, 0.8)
		var bn: int = bass[s]
		if bn > 0:
			var f2 := 440.0 * pow(2.0, (bn - 69) / 12.0)
			var ph2 := 0.0
			var len2 := int(step_n * 1.8)
			for i in len2:
				if base + i >= total:
					break
				var t := float(i) / RATE
				ph2 += TAU * f2 / RATE
				var x := fmod(ph2, TAU) / TAU
				var tri := 4.0 * absf(x - 0.5) - 1.0
				out[base + i] += tri * 0.3 * _env(t, float(len2) / RATE, 1.0)
		# Drums: kick on 1 and 3, snare on 2 and 4, hats on every eighth.
		var beat := s % 8
		if beat == 0 or beat == 4:
			var kick := _thump(0.12, 150.0, 45.0)
			for i in kick.size():
				if base + i < total:
					out[base + i] += kick[i] * 0.6
		if beat == 2 or beat == 6:
			var sn := _noise(0.1, 0.5, 2.0)
			for i in sn.size():
				if base + i < total:
					out[base + i] += sn[i] * 0.5
		var hat := _noise(0.03, 0.25, 3.0)
		for i in hat.size():
			if base + i < total:
				out[base + i] += hat[i] * 0.4
	for i in total:
		out[i] = tanh(out[i] * 1.1)
	return _wav(out, true)
