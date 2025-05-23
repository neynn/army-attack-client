export const GameObjective = function() {}

GameObjective.TYPE = {
    DESTROY: "Destroy",
    CONQUER: "Conquer"
};

GameObjective.prototype.onEntityKill = function(gameContext, entity, actorID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.getActor(actorID);

    if(actor && actor.missions) {
        const entityType = entity.config.id;

        actor.missions.onObjective(gameContext, GameObjective.TYPE.DESTROY, entityType, 1, actorID);
    }
}

GameObjective.prototype.onTileCapture = function(gameContext, count, actorID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.getActor(actorID);

    if(actor && actor.missions) {
        actor.missions.onObjective(gameContext, GameObjective.TYPE.CONQUER, null, count, actorID);
    }
}