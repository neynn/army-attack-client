import { CardSystem } from "./card.js";

export const SpawnSystem = function() {}

SpawnSystem.createEntity = function(gameContext, config) {
    const { world } = gameContext;

    if(!config) {
        return null;
    }
    
    const { owner, id } = config;
    const entity = world.createEntity(gameContext, config, owner, id);

    if(!entity) {
        return null;
    }
    
    entity.placeOnMap(gameContext);
    CardSystem.generateStatCard(gameContext, entity);

    return entity;
}