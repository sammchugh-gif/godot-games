# Puzzle levels and the Stampede board.
#
# map: 9 rows of 12 characters. '.' floor, 'R' rocket, 'O' hole,
#   n/e/s/w lizard facing that way, N/E/S/W snake facing that way,
#   ^ > v < burrow (spawner) emitting that way, 0 1 2 3 a snake nest facing
#   N E S W (both Stampede only).
# walls: "V x y1 y2" = wall on the east edge of column x for rows y1..y2;
#   "H x1 x2 y" = wall on the south edge of row y for columns x1..x2.
# arrows: how many the player may place. solution: one known answer,
#   "x y d" with d in N E S W, checked by the self-test.
class_name Levels
extends RefCounted


static func puzzles() -> Array:
	return [
		{
			"name": "Lift Off",
			"hint": "Swipe on a tile to lay an arrow. Get the lizard to the rocket.",
			"arrows": 1,
			"map": [
				"............",
				"..........R.",
				"............",
				"............",
				".e..........",
				"............",
				"............",
				"............",
				"............",
			],
			"solution": ["10 4 N"],
		},
		{
			"name": "Two Ways",
			"hint": "Lizards walk straight until something turns them.",
			"arrows": 2,
			"map": [
				"............",
				".e..........",
				"............",
				"............",
				"......R.....",
				"............",
				"............",
				".e..........",
				"............",
			],
			"solution": ["6 1 S", "6 7 N"],
		},
		{
			"name": "Snake Eyes",
			"hint": "Snakes follow arrows too. Lizards are faster.",
			"arrows": 1,
			"map": [
				".....R......",
				"............",
				"............",
				"............",
				".e........W.",
				"............",
				"............",
				"............",
				"............",
			],
			"solution": ["5 4 N"],
		},
		{
			"name": "Long Way Round",
			"hint": "At a wall everyone turns right. Holes swallow snakes too.",
			"arrows": 1,
			"map": [
				"e...........",
				"............",
				"............",
				"............",
				"............",
				"............",
				"............",
				"............",
				"R....E.....O",
			],
			"solution": ["5 0 S"],
		},
		{
			"name": "The Wall",
			"hint": "If right is blocked, they turn left instead.",
			"arrows": 1,
			"map": [
				"............",
				"............",
				"e...........",
				"............",
				"e..........R",
				"............",
				"e...........",
				"............",
				"............",
			],
			"walls": ["V 5 0 7"],
			"solution": ["5 8 E"],
		},
		{
			"name": "Pit Stop",
			"hint": "Mind the holes. And the snake on the top row.",
			"arrows": 2,
			"map": [
				"...........W",
				"............",
				"............",
				"............",
				"e...O...O..R",
				"............",
				"............",
				"............",
				"............",
			],
			"solution": ["3 4 S", "3 8 E"],
		},
		{
			"name": "Crossfire",
			"hint": "Two lizards, two snakes, one rocket. Be quick.",
			"arrows": 2,
			"map": [
				"e..........S",
				"............",
				"............",
				"............",
				".....R......",
				"............",
				"............",
				"............",
				"N..........w",
			],
			"solution": ["5 0 S", "5 8 N"],
		},
		{
			"name": "Gauntlet",
			"hint": "Follow the walls in your head before you commit.",
			"arrows": 1,
			"map": [
				"e...........",
				"............",
				"............",
				"............",
				"............",
				"............",
				"............",
				".....E......",
				"R.O.........",
			],
			"walls": ["H 0 9 2", "H 2 11 5"],
			"solution": ["0 5 S"],
		},
		{
			"name": "Round Trip",
			"hint": "Four lizards, one door into the rocket pen.",
			"arrows": 1,
			"map": [
				"e..........s",
				"............",
				"............",
				"............",
				".....R......",
				"............",
				"............",
				"............",
				"n..........w",
			],
			"walls": ["V 4 4 4", "V 5 4 4", "H 5 5 3"],
			"solution": ["5 8 N"],
		},
		{
			"name": "Divide",
			"hint": "The snakes are coming up to meet them. Turn early.",
			"arrows": 3,
			"map": [
				"............",
				".s........s.",
				"............",
				"............",
				".....R......",
				"............",
				"............",
				".N........N.",
				"............",
			],
			"solution": ["1 3 E", "10 3 W", "5 3 S"],
		},
		{
			"name": "Maze",
			"hint": "Two lizards, one route out. The snake is not your problem.",
			"arrows": 2,
			"map": [
				"e..........R",
				"....O.......",
				"............",
				"............",
				"s....W......",
				"............",
				"............",
				"............",
				"............",
			],
			"walls": ["V 3 0 5", "V 7 3 8"],
			"solution": ["3 6 E", "7 6 N"],
		},
		{
			"name": "Snake Pit",
			"hint": "Send the snakes somewhere they will not come back from.",
			"arrows": 3,
			"map": [
				"E....R......",
				"............",
				"............",
				"............",
				"e..........w",
				"............",
				"............",
				"............",
				"..O..N...O..",
			],
			"solution": ["5 4 N", "5 6 E", "2 0 S"],
		},
	]


static func stampede() -> Dictionary:
	# Lizards run the outer ring from the four burrows. The rocket sits in a
	# walled pen with a gap in the middle of each side, so one arrow on the
	# ring in line with a gap diverts a whole stream into the rocket. Snakes
	# come out of the two nests and circle the inside of the pen, crossing
	# every route in.
	return {
		"name": "Stampede",
		"arrows": 3,
		"seed": 1234,
		"map": [
			">..........v",
			"............",
			"..1.........",
			"............",
			".....R......",
			"............",
			".........3..",
			"............",
			"^..........<",
		],
		"walls": ["H 2 4 1", "H 7 9 1", "H 2 4 6", "H 7 9 6", "V 1 2 3", "V 1 5 6", "V 9 2 3", "V 9 5 6"],
	}


static func parse_solution(sol: Array) -> Array:
	var out := []
	for s in sol:
		var p: PackedStringArray = (s as String).split(" ", false)
		out.append({"cell": Vector2i(int(p[0]), int(p[1])), "dir": "NESW".find(p[2])})
	return out
