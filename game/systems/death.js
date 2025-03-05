import { GAME_EVENT } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AnimationSystem } from "./animation.js";

export const DeathSystem = function() {}

DeathSystem.remove = function(gameContext, entity) {
    const { world, spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);

    entity.removeFromMap(gameContext);

    spriteManager.destroySprite(spriteComponent.spriteID);

    world.destroyEntity(entity.id);
}

DeathSystem.killEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { eventBus } = world;

    AnimationSystem.playDeath(gameContext, entity);
    DeathSystem.remove(gameContext, entity);
    eventBus.emit(GAME_EVENT.ENTITY_DEATH, entity);
}