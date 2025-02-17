import { CardSystem } from "./card.js";

export const SpawnSystem = function() {}

SpawnSystem.createEntity = function(gameContext, config) {
    const { world } = gameContext; 
    const entity = world.createEntity(gameContext, config);

    if(!entity) {
        return null;
    }
    
    entity.placeSelf(gameContext);
    CardSystem.generateStatCard(gameContext, entity);

    return entity;
}