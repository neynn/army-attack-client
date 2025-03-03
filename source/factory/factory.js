export const Factory = function(DEBUG_NAME) {
    this.DEBUG_NAME = DEBUG_NAME;
    this.failCount = 0;
    this.successCount = 0;
    this.types = {};
}

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

        return null;
    }

    this.successCount++;

    return product;
} 