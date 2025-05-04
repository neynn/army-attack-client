import { ActionQueue } from "./action/actionQueue.js";
import { TurnManager } from "./turn/turnManager.js";
import { EntityManager } from "./entity/entityManager.js";
import { WorldEventHandler } from "./worldEventHandler.js";
import { Logger } from "./logger.js";
import { MapManager } from "./map/mapManager.js";

export const World = function() {
    this.actionQueue = new ActionQueue();
    this.turnManager = new TurnManager();
    this.entityManager = new EntityManager();
    this.mapManager = new MapManager();
    this.eventBus = new WorldEventHandler();

    this.entityManager.events.on(EntityManager.EVENT.ENTITY_DESTROY, (entityID) => this.turnManager.removeEntity(entityID), { permanent: true });
    
    //this.addDebug();
}

World.DEBUG = {
    LOG_ACTION_EVENTS: 1,
    LOG_TURN_EVENTS: 1,
    LOG_ENTITY_EVENTS: 1,
    LOG_MAP_EVENTS: 1
};

World.prototype.addDebug = function() {
    if(World.DEBUG.LOG_ACTION_EVENTS) {
        this.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_DEFER, (item, request) => console.log(item, request), { permanent: true });
        this.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_ERROR, (request, type) => console.log(request, type), { permanent: true });
        this.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_RUNNING, (item) => console.log(item), { permanent: true });
        this.actionQueue.events.on(ActionQueue.EVENT.QUEUE_ERROR, (error) => console.log(error), { permanent: true });
    }

    if(World.DEBUG.LOG_TURN_EVENTS) {
        this.turnManager.events.on(TurnManager.EVENT.ACTIONS_CLEAR, (actor, remainder) => console.log(actor, remainder), { permanent: true });
        this.turnManager.events.on(TurnManager.EVENT.ACTIONS_REDUCE, (actor, remainder) => console.log(actor, remainder), { permanent: true });
        this.turnManager.events.on(TurnManager.EVENT.ACTOR_CHANGE, (current, next) => console.log(current, next), { permanent: true });
        this.turnManager.events.on(TurnManager.EVENT.ACTOR_CREATE, (id, actor) => console.log(id, actor), { permanent: true });
        this.turnManager.events.on(TurnManager.EVENT.ACTOR_DESTROY, (id) => console.log(id), { permanent: true });
    }

    if(World.DEBUG.LOG_ENTITY_EVENTS) {
        this.entityManager.events.on(EntityManager.EVENT.ENTITY_CREATE, (id, entity) => console.log(id, entity), { permanent: true });
        this.entityManager.events.on(EntityManager.EVENT.ENTITY_DESTROY, (id) => console.log(id), { permanent: true });
    }

    if(World.DEBUG.LOG_MAP_EVENTS) {
        this.mapManager.events.on(MapManager.EVENT.MAP_CREATE, (id, map) => console.log(id, map), { permanent: true });
        this.mapManager.events.on(MapManager.EVENT.MAP_DESTROY, (id) => console.log(id), { permanent: true });
    }
}

World.prototype.exit = function() {
    this.actionQueue.exit();
    this.turnManager.exit();
    this.entityManager.exit();
    this.mapManager.exit();
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