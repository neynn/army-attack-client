import { DefaultArchetype } from "./default.js";

export const BuildingArchetype = function() {}

BuildingArchetype.prototype = Object.create(DefaultArchetype.prototype);
BuildingArchetype.prototype.constructor = BuildingArchetype;