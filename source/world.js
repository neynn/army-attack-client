import { ClientQueue } from "./action/clientQueue.js";
import { ControllerManager } from "./controller/controllerManager.js";
import { EntityManager } from "./entity/entityManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { Logger } from "./logger.js";
import { MapManager } from "./map/mapManager.js";
import { QuestManager } from "./questManager.js";
import { SystemManager } from "./system/systemManager.js";

export const World = function() {
    this.config = {};
    this.actionQueue = new ClientQueue();
    this.mapManager = new MapManager();
    this.entityManager = new EntityManager();
    this.systemManager = new SystemManager();
    this.questManager = new QuestManager();
    this.controllerManager = new ControllerManager();
    this.events = new EventEmitter();

    this.events.listen(World.EVENT_MAP_LOAD);
    this.events.listen(World.EVENT_CONTROLLER_CREATE);
    this.events.listen(World.EVENT_CONTROLLER_DESTROY);
    this.events.listen(World.EVENT_ENTITY_CREATE);
    this.events.listen(World.EVENT_ENTITY_DESTROY);
}

World.CODE_PARSE_MAP_ERROR = 0;
World.CODE_PARSE_MAP_SUCCESS = 1;
World.EVENT_MAP_LOAD = "EVENT_MAP_LOAD";
World.EVENT_CONTROLLER_CREATE = "EVENT_CONTROLLER_CREATE";
World.EVENT_CONTROLLER_DESTROY = "EVENT_CONTROLLER_DESTROY";
World.EVENT_ENTITY_CREATE = "EVENT_ENTITY_CREATE";
World.EVENT_ENTITY_DESTROY = "EVENT_ENTITY_DESTROY";

World.prototype.update = function(gameContext) {
    this.actionQueue.update(gameContext);
    this.controllerManager.update(gameContext);
    this.systemManager.update(gameContext);
    this.entityManager.update(gameContext);
}

World.prototype.parseMap = async function(mapID, onParse) {
    if(!onParse) {
        Logger.log(false, "No parser given!", "World.prototype.parseMap", { mapID });

        return World.CODE_PARSE_MAP_ERROR;
    }

    const parsedMap = await this.mapManager.parseMap(mapID, onParse);

    if(!parsedMap) {
        Logger.log(false, "Map could not be parsed!", "World.prototype.parseMap", { mapID });

        return World.CODE_PARSE_MAP_ERROR;
    }

    this.loadMap(mapID, parsedMap);

    return World.CODE_PARSE_MAP_SUCCESS;
}

World.prototype.loadMap = function(mapID, worldMap) {
    if(!worldMap) {
        return;
    }
    
    this.mapManager.addMap(mapID, worldMap);
    this.mapManager.updateActiveMap(mapID);
    this.events.emit(World.EVENT_MAP_LOAD, worldMap);
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

World.prototype.createController = function(gameContext, setup) {
    if(typeof setup !== "object") {
        Logger.error(false, "Setup does not exist!", "World.prototype.createController", null);
        return null;
    }

    const { type, id } = setup;
    const controller = this.controllerManager.createController(type, id);

    if(!controller) {
        return null;
    }

    this.events.emit(World.EVENT_CONTROLLER_CREATE, controller);
    controller.onCreate(gameContext, setup);

    return controller;
}

World.prototype.destroyController = function(controllerID) {
    const controller = this.controllerManager.getController(controllerID);

    if(!controller) {
        return;
    }

    this.controllerManager.destroyController(controllerID);
    this.events.emit(World.EVENT_CONTROLLER_DESTROY, controller);
}

World.prototype.createEntity = function(gameContext, setup) {
    if(typeof setup !== "object") {
        Logger.error(false, "Setup does not exist!", "World.prototype.createEntity", null);
        return null;
    }

    const { type, master, id } = setup;
    const entity = this.entityManager.createEntity(type, id);
    const entityID = entity.getID();

    this.controllerManager.addEntity(master, entityID);
    this.entityManager.buildEntity(gameContext, entity, type, setup);
    this.events.emit(World.EVENT_ENTITY_CREATE, entity);

    return entity;
}

World.prototype.destroyEntity = function(entityID) {
    const entity = this.entityManager.getEntity(entityID);

    if(!entity) {
        return;
    }

    this.controllerManager.removeEntity(entityID);
    this.entityManager.destroyEntity(entityID);
    this.events.emit(World.EVENT_ENTITY_DESTROY, entity);
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