import { ActionQueue } from "./action/actionQueue.js";
import { TurnManager } from "./turn/turnManager.js";
import { EntityManager } from "./entity/entityManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { EventBus } from "./events/eventBus.js";
import { Logger } from "./logger.js";
import { MapManager } from "./map/mapManager.js";

export const World = function() {
    this.actionQueue = new ActionQueue();
    this.turnManager = new TurnManager();
    this.entityManager = new EntityManager();
    this.mapManager = new MapManager();
    this.eventBus = new EventBus();

    this.events = new EventEmitter();
    this.events.listen(World.EVENT.MAP_CREATE);
    this.events.listen(World.EVENT.ACTOR_CREATE);
    this.events.listen(World.EVENT.ACTOR_DESTROY);
    this.events.listen(World.EVENT.ENTITY_CREATE);
    this.events.listen(World.EVENT.ENTITY_DESTROY);
}

World.EVENT = {
    MAP_CREATE: "MAP_CREATE",
    ACTOR_CREATE: "ACTOR_CREATE",
    ACTOR_DESTROY: "ACTOR_DESTROY",
    ENTITY_CREATE: "ENTITY_CREATE",
    ENTITY_DESTROY: "ENTITY_DESTROY"
};

World.prototype.exit = function() {
    this.actionQueue.exit();
    this.entityManager.exit();
}

World.prototype.update = function(gameContext) {
    this.actionQueue.update(gameContext);
    this.turnManager.update(gameContext);
    this.entityManager.update(gameContext);
}

World.prototype.createMapByID = async function(gameContext, mapID) {
    const mapData = await this.mapManager.fetchMapData(mapID);

    if(!mapData) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "MapData does not exist!", "World.prototype.createMapByID", { "mapID": mapID });

        return null;
    }

    const worldMap = this.createMap(gameContext, mapID, mapData);

    return worldMap;
}

World.prototype.createMap = function(gameContext, mapID, mapData) {
    const worldMap = this.mapManager.createMap(gameContext, mapID, mapData);

    if(!worldMap) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Map could not be created!", "World.prototype.createMap", { "mapID": mapID });

        return null;
    }

    this.mapManager.addMap(mapID, worldMap);
    this.mapManager.updateActiveMap(mapID);
    this.events.emit(World.EVENT.MAP_CREATE, worldMap);

    return worldMap;
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

World.prototype.createActor = function(gameContext, config, actorID) {
    const actor = this.turnManager.createActor(gameContext, config, actorID);

    if(!actor) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Actor could not be created!", "World.prototype.createActor", { "actorID": actorID });
        return null;
    }

    this.events.emit(World.EVENT.ACTOR_CREATE, actor);

    return actor;
}

World.prototype.removeOwners = function(actorID) {
    const actor = this.turnManager.getActor(actorID);

    if(!actor) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Actor does not exist!", "World.prototype.removeOwners", { "actorID": actorID });
        return;
    }

    for(const entityID of actor.entities) {
        const entity = this.entityManager.getEntity(entityID);

        if(entity) {
            const ownerID = entity.getOwner();

            if(ownerID === actorID) {
                entity.setOwner(null);
            }
        }
    }
}

World.prototype.destroyActor = function(actorID) {
    const actor = this.turnManager.getActor(actorID);

    if(!actor) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Actor does not exist!", "World.prototype.destroyActor", { "actorID": actorID });
        return;
    }

    this.removeOwners(actorID);
    this.turnManager.destroyActor(actorID);
    this.events.emit(World.EVENT.ACTOR_DESTROY, actor);
}

World.prototype.createEntity = function(gameContext, config, ownerID, externalID) {
    const id = externalID === undefined ? EntityManager.INVALID_ID : externalID;
    const entity = this.entityManager.createEntity(gameContext, config, id);

    if(!entity) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Entity could not be created!", "World.prototype.createEntity", { "entityID": id });
        return null;
    }

    if(ownerID !== undefined && ownerID !== null) {
        const entityID = entity.getID();
        
        this.turnManager.addEntity(ownerID, entityID);

        entity.setOwner(ownerID);
    }

    this.events.emit(World.EVENT.ENTITY_CREATE, entity);

    return entity;
}

World.prototype.destroyEntity = function(entityID) {
    const entity = this.entityManager.getEntity(entityID);

    if(!entity) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Entity does not exist!", "World.prototype.destroyEntity", { "entityID": entityID });
        return;
    }

    const ownerID = entity.getOwner();

    this.turnManager.removeEntity(ownerID, entityID);
    this.entityManager.destroyEntity(entityID);
    this.events.emit(World.EVENT.ENTITY_DESTROY, entity);
}