import { DefaultArchetype } from "./default.js";

export const DecoArchetype = function() {
    DefaultArchetype.call(this);
}

DecoArchetype.prototype = Object.create(DefaultArchetype.prototype);
DecoArchetype.prototype.constructor = DecoArchetype;