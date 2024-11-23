import { DefaultArchetype } from "../defaultArchetype.js";

export const TownArchetype = function() {
    DefaultArchetype.call(this);
}

TownArchetype.prototype = Object.create(DefaultArchetype.prototype);
TownArchetype.prototype.constructor = TownArchetype;

TownArchetype.prototype.onInitialize = function(gameContext, entity, sprite, type) {

}

TownArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type) {

}