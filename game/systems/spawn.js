import { ArmyEntity } from "../init/armyEntity.js";
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

SpawnSystem.destroyEntity = function(gameContext, entity) {
    const { world, spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    
    entity.removeFromMap(gameContext);

    spriteManager.destroySprite(spriteComponent.spriteID);

    world.destroyEntity(entity.id);
}