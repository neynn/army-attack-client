export const FactoryOwner = function() {
    this.factories = new Map();
    this.selectedFactory = null;
}

FactoryOwner.prototype.registerFactory = function(factoryID, factory) {
    if(this.factories.has(factoryID)) {
        return;
    }

    this.factories.set(factoryID, factory);
}

FactoryOwner.prototype.selectFactory = function(factoryID) {
    if(!this.factories.has(factoryID)) {
        return;
    }

    this.selectedFactory = factoryID;
}

FactoryOwner.prototype.deselectFactory = function() {
    this.selectFactory = null;
}

FactoryOwner.prototype.createProduct = function(gameContext, config) {
    const factory = this.factories.get(this.selectedFactory);

    if(!factory) {
        return null;
    }

    const product = factory.create(gameContext, config);

    return product;
}