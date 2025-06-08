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

        actor.missions.onObjective(GameObjective.TYPE.DESTROY, entityType, 1);
    }
}

GameObjective.prototype.onTileCapture = function(gameContext, count, actorID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.getActor(actorID);

    if(actor && actor.missions) {
        actor.missions.onObjective(GameObjective.TYPE.CONQUER, null, count);
    }
}