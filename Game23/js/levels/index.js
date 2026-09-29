// Each era's level, by its id in story.js.
import { buildDino } from "./dino.js";
import { buildIceAge } from "./iceage.js";
import { buildEgypt } from "./egypt.js";
import { buildGreece } from "./greece.js";
import { buildAqueduct } from "./aqueduct.js";
import { buildFjord } from "./fjord.js";
export const LEVELS = { dino: buildDino, iceage: buildIceAge, egypt: buildEgypt, greece: buildGreece, aqueduct: buildAqueduct, fjord: buildFjord };
