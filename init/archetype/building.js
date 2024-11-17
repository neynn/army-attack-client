import { DefaultArchetype } from "../defaultArchetype.js";

export const BuildingArchetype = function() {
    DefaultArchetype.call(this);
}

BuildingArchetype.prototype = Object.create(DefaultArchetype.prototype);
BuildingArchetype.prototype.constructor = BuildingArchetype;

BuildingArchetype.prototype.onConstruct = function(gameContext, entity, sprite, type) {

}