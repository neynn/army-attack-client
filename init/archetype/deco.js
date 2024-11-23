import { DefaultArchetype } from "../defaultArchetype.js";

export const DecoArchetype = function() {
    DefaultArchetype.call(this);
}

DecoArchetype.prototype = Object.create(DefaultArchetype.prototype);
DecoArchetype.prototype.constructor = DecoArchetype;

DecoArchetype.prototype.onInitialize = function(gameContext, entity, sprite, type) {

}

DecoArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type) {

}