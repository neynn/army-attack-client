import { DefaultArchetype } from "./default.js";

export const DecoArchetype = function() {}

DecoArchetype.prototype = Object.create(DefaultArchetype.prototype);
DecoArchetype.prototype.constructor = DecoArchetype;