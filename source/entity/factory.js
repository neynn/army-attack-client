import { EventEmitter } from "../events/eventEmitter.js";

export const EntityFactory = function() {
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

EntityFactory.prototype.onCreate = function(gameContext, config) {}

EntityFactory.prototype.createEntity = function(gameContext, config) {
    const entity = this.onCreate(gameContext, config);

    if(!entity) {
        this.failCount++;
        this.events.emit(EntityFactory.EVENT.ENTITY_CREATE_FAILED, config);
        return null;
    }

    this.successCount++;
    this.events.emit(EntityFactory.EVENT.ENTITY_CREATE, entity, config);

    return entity;
} 