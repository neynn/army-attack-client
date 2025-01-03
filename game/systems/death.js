import { SpriteComponent } from "../components/sprite.js";
import { PlaceSystem } from "./place.js";

export const DeathSystem = function() {}

DeathSystem.destroyEntity = function(gameContext, entityID) {
    const { world, spriteManager } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);
    const spriteComponent = entity.getComponent(SpriteComponent);

    PlaceSystem.removeEntity(gameContext, entity);
    spriteManager.destroySprite(spriteComponent.spriteID);
    world.destroyEntity(entityID);
}