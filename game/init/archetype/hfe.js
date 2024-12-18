import { DefaultArchetype } from "./default.js";

export const HFEArchetype = function() {}

HFEArchetype.prototype = Object.create(DefaultArchetype.prototype);
HFEArchetype.prototype.constructor = HFEArchetype;