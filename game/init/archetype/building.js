import { DefaultArchetype } from "./default.js";

export const BuildingArchetype = function() {
    DefaultArchetype.call(this);
}

BuildingArchetype.prototype = Object.create(DefaultArchetype.prototype);
BuildingArchetype.prototype.constructor = BuildingArchetype;

BuildingArchetype.prototype.onInitialize = function(gameContext, entity, sprite, type) {

}

BuildingArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type) {

}