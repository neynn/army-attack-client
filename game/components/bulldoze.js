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