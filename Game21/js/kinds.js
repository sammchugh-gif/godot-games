// Every kind of mission, by the name the story uses.
import { Cells, Roundup, Stack, Tractor, Drone, Lasers, Chase, Stealth, Boss, Drive } from "./missions.js";
import { Circuit, Codes, Tide, Morse } from "./missions2.js";
import { Dive, SubRings, BoatChase, SubChase, Sonar, Salvage, Escort, Surf, Divers } from "./missions3.js";
import { Valves, Airlock, Current } from "./missions4.js";
import { StarMap, Greenhouse, Climb } from "./missions5.js";
import { PuzzleMission } from "./clues.js";

export const KINDS = { puzzle: PuzzleMission, cells: Cells, roundup: Roundup, stack: Stack, tractor: Tractor, drone: Drone, lasers: Lasers, chase: Chase, stealth: Stealth, boss: Boss, circuit: Circuit, codes: Codes, drive: Drive,
  divers: Divers, tide: Tide, morse: Morse, dive: Dive, subrings: SubRings, boatchase: BoatChase, subchase: SubChase, sonar: Sonar, salvage: Salvage, escort: Escort, surf: Surf,
  valves: Valves, airlock: Airlock, current: Current,
  starmap: StarMap, greenhouse: Greenhouse, climb: Climb };
export function makeMission(g, def, data) { const K = KINDS[def.kind]; return K ? new K(g, def, data) : null; }
