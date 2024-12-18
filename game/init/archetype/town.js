import { DefaultArchetype } from "./default.js";

export const TownArchetype = function() {}

TownArchetype.prototype = Object.create(DefaultArchetype.prototype);
TownArchetype.prototype.constructor = TownArchetype;