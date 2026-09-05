# Minimal static file server for testing the web export locally.
#
#   godot --headless --script tools/serve.gd
#
# Then open http://localhost:8060 (or http://<this-pc-ip>:8060 from an iPad on
# the same wifi). The build is exported without thread support, so it needs no
# COOP/COEP headers and works from any plain static host.
extends SceneTree

const ROOT := "res://build/web"
const DEFAULT_PORT := 8060

var _server := TCPServer.new()
var _clients: Array = []
var _port := DEFAULT_PORT

const MIME := {
	"html": "text/html; charset=utf-8",
	"js": "text/javascript; charset=utf-8",
	"json": "application/json",
	"wasm": "application/wasm",
	"pck": "application/octet-stream",
	"png": "image/png",
	"svg": "image/svg+xml",
	"ico": "image/x-icon",
	"css": "text/css; charset=utf-8",
	"webmanifest": "application/manifest+json",
}


func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.is_valid_int():
			_port = a.to_int()

	if not FileAccess.file_exists(ROOT + "/index.html"):
		printerr("No export found at %s/index.html — run the Web export first." % ROOT)
		quit(1)
		return

	# Bind on all interfaces so a tablet on the same network can reach it.
	var err := _server.listen(_port, "0.0.0.0")
	if err != OK:
		printerr("Could not listen on port %d (error %d)." % [_port, err])
		quit(1)
		return

	Engine.max_fps = 120
	print("Serving %s" % ROOT)
	print("  local:   http://localhost:%d/" % _port)
	for ip in IP.get_local_addresses():
		if ip.count(".") == 3 and not ip.begins_with("127."):
			print("  network: http://%s:%d/   <- open this one on the iPad" % [ip, _port])
	print("Ctrl+C to stop.")


func _process(_delta: float) -> bool:
	while _server.is_connection_available():
		_clients.append({"peer": _server.take_connection(), "buf": PackedByteArray()})

	var still: Array = []
	for c in _clients:
		var peer: StreamPeerTCP = c["peer"]
		peer.poll()
		if peer.get_status() != StreamPeerTCP.STATUS_CONNECTED:
			continue
		var avail := peer.get_available_bytes()
		if avail > 0:
			var got: Array = peer.get_partial_data(avail)
			c["buf"] = (c["buf"] as PackedByteArray) + (got[1] as PackedByteArray)
		var text: String = (c["buf"] as PackedByteArray).get_string_from_utf8()
		if text.find("\r\n\r\n") >= 0:
			_respond(peer, text)
			peer.disconnect_from_host()
			continue
		still.append(c)
	_clients = still
	return false


func _respond(peer: StreamPeerTCP, request: String) -> void:
	var parts := request.get_slice("\r\n", 0).split(" ")
	var path: String = "/" if parts.size() < 2 else parts[1]
	var q := path.find("?")
	if q >= 0:
		path = path.substr(0, q)
	path = path.uri_decode()
	if path == "" or path == "/":
		path = "/index.html"
	if path.contains(".."):
		_send(peer, 403, "text/plain", "forbidden".to_utf8_buffer())
		return

	var file := ROOT + path
	if not FileAccess.file_exists(file):
		print("404 ", path)
		_send(peer, 404, "text/plain", ("not found: " + path).to_utf8_buffer())
		return

	var f := FileAccess.open(file, FileAccess.READ)
	var body := f.get_buffer(f.get_length())
	f.close()
	print("200 ", path, "  (", body.size(), " bytes)")
	_send(peer, 200, _mime_for(path), body)


func _mime_for(path: String) -> String:
	var ext := path.get_extension().to_lower()
	return MIME.get(ext, "application/octet-stream")


func _send(peer: StreamPeerTCP, code: int, mime: String, body: PackedByteArray) -> void:
	var reason := "OK"
	if code == 404:
		reason = "Not Found"
	elif code == 403:
		reason = "Forbidden"
	var head := "HTTP/1.1 %d %s\r\n" % [code, reason]
	head += "Content-Type: %s\r\n" % mime
	head += "Content-Length: %d\r\n" % body.size()
	head += "Cache-Control: no-store\r\n"
	head += "Connection: close\r\n\r\n"
	peer.put_data(head.to_utf8_buffer())
	if body.size() > 0:
		peer.put_data(body)
