export const GameObjective = function() {}

GameObjective.TYPE = {
    DESTROY: "Destroy"
}

GameObjective.prototype.onEntityKill = function(gameContext, entity, actorID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(activeMap) {
        const entityType = entity.config.id;

        activeMap.missions.onObjective(gameContext, GameObjective.TYPE.DESTROY, entityType, actorID);
    }
}