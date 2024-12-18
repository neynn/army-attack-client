import { DefaultArchetype } from "./default.js";

export const BuildingArchetype = function() {}

BuildingArchetype.prototype = Object.create(DefaultArchetype.prototype);
BuildingArchetype.prototype.constructor = BuildingArchetype;

BuildingArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type, setup) {
    this.createStatCard(gameContext, entity, sprite);
}