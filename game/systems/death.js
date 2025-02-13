import { ArmyEntity } from "../init/armyEntity.js";
import { PlaceSystem } from "./place.js";

export const DeathSystem = function() {}

DeathSystem.destroyEntity = function(gameContext, entityID) {
    const { world, spriteManager } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);

    PlaceSystem.removeEntity(gameContext, entity);
    spriteManager.destroySprite(spriteComponent.spriteID);
    world.destroyEntity(entityID);
}