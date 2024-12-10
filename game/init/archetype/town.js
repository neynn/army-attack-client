import { DefaultArchetype } from "./default.js";

export const TownArchetype = function() {
    DefaultArchetype.call(this);
}

TownArchetype.prototype = Object.create(DefaultArchetype.prototype);
TownArchetype.prototype.constructor = TownArchetype;