import { EventEmitter } from "../events/eventEmitter.js";
import { Entity } from "./entity.js";

export const EntityFactory = function(DEBUG_NAME) {
    this.DEBUG_NAME = DEBUG_NAME;
    this.entityTypes = {};

    this.failCount = 0;
    this.successCount = 0;

    this.events = new EventEmitter();
    this.events.listen(EntityFactory.EVENT.ENTITY_CREATE);
    this.events.listen(EntityFactory.EVENT.ENTITY_CREATE_FAILED);
}

EntityFactory.EVENT = {
    "ENTITY_CREATE": "ENTITY_CREATE",
    "ENTITY_CREATE_FAILED": "ENTITY_CREATE_FAILED"
};

EntityFactory.prototype.load = function(entityTypes) {
    if(entityTypes) {
        this.entityTypes = entityTypes;
    }

    return this;
}

EntityFactory.prototype.getEntityType = function(typeID) {
    const type = this.entityTypes[typeID];

    if(!type) {
        return null;
    }

    return type;
}

EntityFactory.prototype.onCreate = function(gameContext, config) {}

EntityFactory.prototype.createEntity = function(gameContext, config) {
    const entity = this.onCreate(gameContext, config);

    if(!(entity instanceof Entity)) {
        this.failCount++;
        this.events.emit(EntityFactory.EVENT.ENTITY_CREATE_FAILED, config);
        return null;
    }

    this.successCount++;
    this.events.emit(EntityFactory.EVENT.ENTITY_CREATE, entity, config);

    return entity;
} 