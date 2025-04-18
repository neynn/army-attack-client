import { ACTION_TYPES } from "./enums.js";

export const DebugHelper = function() {}

DebugHelper.killAllEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager, actionQueue } = world;

    entityManager.forAllEntities((entityID, entity) => actionQueue.addImmediateRequest(ACTION_TYPES.DEATH, null, entityID));
}