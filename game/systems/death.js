import { GAME_EVENT } from "../enums.js";
import { AnimationSystem } from "./animation.js";
import { SpawnSystem } from "./spawn.js";

export const DeathSystem = function() {}

DeathSystem.killEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { eventBus } = world;

    AnimationSystem.playDeath(gameContext, entity);
    
    SpawnSystem.destroyEntity(gameContext, entity);

    eventBus.emit(GAME_EVENT.ENTITY_DEATH, entity);
}