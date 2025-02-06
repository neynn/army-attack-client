import { EventEmitter } from "./events/eventEmitter.js";

export const Factory = function(DEBUG_NAME) {
    this.DEBUG_NAME = DEBUG_NAME;
    this.types = {};

    this.failCount = 0;
    this.successCount = 0;

    this.events = new EventEmitter();
    this.events.listen(Factory.EVENT.CREATE);
    this.events.listen(Factory.EVENT.CREATE_FAILED);
}

Factory.EVENT = {
    "CREATE": "CREATE",
    "CREATE_FAILED": "CREATE_FAILED"
};

Factory.prototype.load = function(types) {
    if(types) {
        this.types = types;
    }

    return this;
}

Factory.prototype.getType = function(typeID) {
    const type = this.types[typeID];

    if(!type) {
        return null;
    }

    return type;
}

Factory.prototype.onCreate = function(gameContext, config) {}

Factory.prototype.create = function(gameContext, config) {
    const product = this.onCreate(gameContext, config);

    if(!product) {
        this.failCount++;
        this.events.emit(Factory.EVENT.CREATE_FAILED, config);

        return null;
    }

    this.successCount++;
    this.events.emit(Factory.EVENT.CREATE, product, config);

    return product;
} 