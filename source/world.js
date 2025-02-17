import { RequestQueue } from "./action/requestQueue.js";
import { ControllerManager } from "./controller/controllerManager.js";
import { EntityManager } from "./entity/entityManager.js";
import { EventManager } from "./eventManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { Logger } from "./logger.js";
import { MapManager } from "./map/mapManager.js";

export const World = function() {
    this.config = {};
    this.actionQueue = new RequestQueue();
    this.mapManager = new MapManager();
    this.entityManager = new EntityManager();
    this.controllerManager = new ControllerManager();
    this.eventManager = new EventManager();

    this.events = new EventEmitter();
    this.events.listen(World.EVENT.MAP_LOAD);
    this.events.listen(World.EVENT.CONTROLLER_CREATE);
    this.events.listen(World.EVENT.CONTROLLER_DESTROY);
    this.events.listen(World.EVENT.ENTITY_CREATE);
    this.events.listen(World.EVENT.ENTITY_DESTROY);
}

World.EVENT = {
    "MAP_LOAD": "MAP_LOAD",
    "CONTROLLER_CREATE": "CONTROLLER_CREATE",
    "CONTROLLER_DESTROY": "CONTROLLER_DESTROY",
    "ENTITY_CREATE": "ENTITY_CREATE",
    "ENTITY_DESTROY": "ENTITY_DESTROY"
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
        return null;
    }

    const worldMap = this.createMap(gameContext, mapID, mapData);

    return worldMap;
}

World.prototype.createMap = function(gameContext, mapID, mapData) {
    const worldMap = this.mapManager.createMap(gameContext, mapID, mapData);

    if(!worldMap) {
        return null;
    }

    this.mapManager.addMap(mapID, worldMap);
    this.mapManager.updateActiveMap(mapID);
    this.events.emit(World.EVENT.MAP_LOAD, worldMap);

    return worldMap;
}

World.prototype.getTileEntity = function(tileX, tileY) {
    const activeMap = this.mapManager.getActiveMap();

    if(!activeMap) {
        return null;
    }

    const entityID = activeMap.getTopEntity(tileX, tileY);
    
    return this.entityManager.getEntity(entityID);
}

World.prototype.getTileEntityList = function(tileX, tileY) {
    const activeMap = this.mapManager.getActiveMap();

    if(!activeMap) {
        return [];
    }

    const entityList = activeMap.getEntities(tileX, tileY);
    
    return entityList;
}

World.prototype.createController = function(gameContext, config) {
    if(typeof config !== "object") {
        Logger.error(false, "Config must be an object!", "World.prototype.createController", null);
        return null;
    }

    const { id } = config;
    const controller = this.controllerManager.createController(gameContext, config, id);

    if(!controller) {
        return null;
    }

    this.events.emit(World.EVENT.CONTROLLER_CREATE, controller);

    return controller;
}

World.prototype.destroyController = function(controllerID) {
    const controller = this.controllerManager.getController(controllerID);

    if(!controller) {
        return;
    }

    this.controllerManager.destroyController(controllerID);
    this.events.emit(World.EVENT.CONTROLLER_DESTROY, controller);
}

World.prototype.createEntity = function(gameContext, config) {
    if(!config) {
        Logger.error(false, "Config does not exist!", "World.prototype.createEntity", null);
        return null;
    }

    const { owner, id } = config;
    const entity = this.entityManager.createEntity(gameContext, config, id);

    if(!entity) {
        Logger.error(false, "Entity creation failed!", "World.prototype.createEntity", null);
        return null;
    }

    const entityID = entity.getID();

    this.controllerManager.addEntity(owner, entityID);
    this.events.emit(World.EVENT.ENTITY_CREATE, entity);

    return entity;
}

World.prototype.destroyEntity = function(entityID) {
    const entity = this.entityManager.getEntity(entityID);
    const owner = this.controllerManager.getOwnerOf(entityID);

    if(owner) {
        owner.selector.removeEntity(entityID);
    }

    if(entity) {
        this.entityManager.destroyEntity(entityID);
        this.events.emit(World.EVENT.ENTITY_DESTROY, entity);
    }
}

World.prototype.getConfig = function(elementID) {
    if(!elementID) {
        return this.config;
    }

    if(this.config[elementID]) {
        return this.config[elementID];
    }

    Logger.error(false, "Element does not exist!", "World.prototype.getConfig", { elementID });

    return null;
}