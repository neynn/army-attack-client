import { DefaultArchetype } from "../defaultArchetype.js";

export const HFEArchetype = function() {
    DefaultArchetype.call(this);
}

HFEArchetype.prototype = Object.create(DefaultArchetype.prototype);
HFEArchetype.prototype.constructor = HFEArchetype;

HFEArchetype.prototype.onConstruct = function(gameContext, entity, sprite, type) {

}