import { ActionQueue } from "./action/actionQueue.js";
import { TurnManager } from "./turn/turnManager.js";
import { EntityManager } from "./entity/entityManager.js";
import { EventBus } from "./events/eventBus.js";
import { Logger } from "./logger.js";
import { MapManager } from "./map/mapManager.js";

export const World = function() {
    this.actionQueue = new ActionQueue();
    this.turnManager = new TurnManager();
    this.entityManager = new EntityManager();
    this.mapManager = new MapManager();
    this.eventBus = new EventBus();

    this.turnManager.events.on(TurnManager.EVENT.ACTOR_DESTROY, (actorID) => this.entityManager.removeOwner(actorID), { permanent: true });
    this.entityManager.events.on(EntityManager.EVENT.ENTITY_DESTROY, (entityID) => this.turnManager.removeEntity(entityID), { permanent: true });
}

World.prototype.exit = function() {
    this.actionQueue.exit();
    this.entityManager.exit();
}

World.prototype.update = function(gameContext) {
    this.actionQueue.update(gameContext);
    this.turnManager.update(gameContext);
    this.entityManager.update(gameContext);
}

World.prototype.getTileEntity = function(tileX, tileY) {
    const activeMap = this.mapManager.getActiveMap();

    if(!activeMap) {
        Logger.log(Logger.CODE.ENGINE_WARN, "There is no active map!", "World.prototype.getTileEntity", null);
        return null;
    }

    const entityID = activeMap.getTopEntity(tileX, tileY);
    
    return this.entityManager.getEntity(entityID);
}