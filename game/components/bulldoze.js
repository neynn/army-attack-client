import { Component } from "../../source/component/component.js";

export const BulldozeComponent = function() {
    this.destroyUnit = false;
    this.destroyDeco = false;
    this.destroyBuilding = false;
}

BulldozeComponent.prototype = Object.create(Component.prototype);
BulldozeComponent.prototype.constructor = BulldozeComponent;

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

    return property !== undefined;
}

BulldozeComponent.prototype.init = function(config) {
    const { unit, deco, building } = config;

    if(unit) {
        this.destroyUnit = true;
    }

    if(deco) {
        this.destroyDeco = true;
    }

    if(building) {
        this.destroyBuilding = true;
    }
}