import { ActionQueue } from "./action/actionQueue.js";
import { ControllerManager } from "./controller/controllerManager.js";
import { EntityManager } from "./entity/entityManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { EventBus } from "./events/eventBus.js";
import { Logger } from "./logger.js";
import { MapManager } from "./map/mapManager.js";

export const World = function() {
    this.eventBus = new EventBus();
    this.actionQueue = new ActionQueue();
    this.controllerManager = new ControllerManager();
    this.entityManager = new EntityManager();
    this.mapManager = new MapManager();

    this.events = new EventEmitter();
    this.events.listen(World.EVENT.MAP_CREATE);
    this.events.listen(World.EVENT.CONTROLLER_CREATE);
    this.events.listen(World.EVENT.CONTROLLER_DESTROY);
    this.events.listen(World.EVENT.ENTITY_CREATE);
    this.events.listen(World.EVENT.ENTITY_DESTROY);
}

World.EVENT = {
    MAP_CREATE: "MAP_CREATE",
    CONTROLLER_CREATE: "CONTROLLER_CREATE",
    CONTROLLER_DESTROY: "CONTROLLER_DESTROY",
    ENTITY_CREATE: "ENTITY_CREATE",
    ENTITY_DESTROY: "ENTITY_DESTROY"
};

World.prototype.exit = function() {
    this.actionQueue.exit();
    this.entityManager.exit();
}

World.prototype.update = function(gameContext) {
    this.actionQueue.update(gameContext);
    this.controllerManager.update(gameContext);
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

World.prototype.createController = function(gameContext, config, controllerID) {
    const controller = this.controllerManager.createController(gameContext, config, controllerID);

    if(!controller) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Controller could not be created!", "World.prototype.createController", { "controllerID": controllerID });

        return null;
    }

    this.events.emit(World.EVENT.CONTROLLER_CREATE, controller);

    return controller;
}

World.prototype.destroyController = function(controllerID) {
    const controller = this.controllerManager.getController(controllerID);

    if(!controller) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Controller does not exist!", "World.prototype.destroyController", { "controllerID": controllerID });

        return;
    }

    this.controllerManager.destroyController(controllerID);
    this.events.emit(World.EVENT.CONTROLLER_DESTROY, controller);
}

World.prototype.createEntity = function(gameContext, config, ownerID, externalID) {
    const id = externalID === undefined ? EntityManager.INVALID_ID : externalID;
    const entity = this.entityManager.createEntity(gameContext, config, id);

    if(!entity) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Entity could not be created!", "World.prototype.createEntity", { "entityID": id });

        return null;
    }

    const entityID = entity.getID();

    this.controllerManager.addEntity(ownerID, entityID);
    this.events.emit(World.EVENT.ENTITY_CREATE, entity);

    return entity;
}

World.prototype.destroyEntity = function(entityID) {
    const entity = this.entityManager.getEntity(entityID);

    if(!entity) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Entity does not exist!", "World.prototype.destroyEntity", { "entityID": entityID });

        return;
    }

    this.controllerManager.removeEntity(entityID);
    this.entityManager.destroyEntity(entityID);
    this.events.emit(World.EVENT.ENTITY_DESTROY, entity);
}