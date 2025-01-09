export const BulldozeComponent = function() {
    this.destroyUnit = false;
    this.destroyDeco = false;
    this.destroyBuilding = false;
}

BulldozeComponent.ARCHETYPE_BULLDOZE_MAP = {
    "Unit": "destroyUnit",
    "Deco": "destroyDeco",
    "Building": "destroyBuilding"
};

BulldozeComponent.prototype.isBulldozed = function(archetype) {
    const property = BulldozeComponent.ARCHETYPE_BULLDOZE_MAP[archetype];

    if(!property) {
        return false;
    }

    return this[property];
}

BulldozeComponent.isBulldozeable = function(archetype) {
    const property = BulldozeComponent.ARCHETYPE_BULLDOZE_MAP[archetype];

    if(!property) {
        return false;
    }

    return true;
}