export const FactoryOwner = function() {
    this.factories = new Map();
    this.currentFactory = null;
}

FactoryOwner.prototype.registerFactory = function(factoryID, factory) {
    if(this.factories.has(factoryID)) {
        return;
    }

    this.factories.set(factoryID, factory);
}

FactoryOwner.prototype.selectFactory = function(factoryID) {
    const factory = this.factories.get(factoryID);

    if(!factory) {
        return;
    }

    this.currentFactory = factory;
}

FactoryOwner.prototype.deselectFactory = function() {
    this.currentFactory = null;
}

FactoryOwner.prototype.createProduct = function(gameContext, config) {
    if(!this.currentFactory) {
        return null;
    }

    const product = this.currentFactory.create(gameContext, config);

    return product;
}