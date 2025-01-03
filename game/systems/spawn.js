import { CardSystem } from "./card.js";
import { PlaceSystem } from "./place.js";

export const SpawnSystem = function() {}

SpawnSystem.createEntity = function(gameContext, config) {
    const { world } = gameContext; 
    const entity = world.createEntity(gameContext, config);

    PlaceSystem.placeEntity(gameContext, entity);
    CardSystem.generateStatCard(gameContext, entity);

    return entity;
}