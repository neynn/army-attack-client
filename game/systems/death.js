import { ArmyEntity } from "../init/armyEntity.js";

export const DeathSystem = function() {}

DeathSystem.destroyEntity = function(gameContext, entityID) {
    const { world, spriteManager } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);

    entity.removeSelf(gameContext);
    spriteManager.destroySprite(spriteComponent.spriteID);
    world.destroyEntity(entityID);
}