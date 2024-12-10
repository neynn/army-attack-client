import { DefaultArchetype } from "./default.js";

export const HFEArchetype = function() {
    DefaultArchetype.call(this);
}

HFEArchetype.prototype = Object.create(DefaultArchetype.prototype);
HFEArchetype.prototype.constructor = HFEArchetype;