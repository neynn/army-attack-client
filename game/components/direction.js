import { Component } from "../../source/component/component.js";

export const DirectionComponent = function() {
    this.directionX = DirectionComponent.DIRECTION_EAST;
    this.directionY = DirectionComponent.DIRECTION_SOUTH;
}

DirectionComponent.DIRECTION_NORTH = 0;
DirectionComponent.DIRECTION_EAST = 1;
DirectionComponent.DIRECTION_SOUTH = 2;
DirectionComponent.DIRECTION_WEST = 3;

DirectionComponent.prototype = Object.create(Component.prototype);
DirectionComponent.prototype.constructor = DirectionComponent;

DirectionComponent.prototype.toWest = function() {
    this.directionX = DirectionComponent.DIRECTION_WEST;
}

DirectionComponent.prototype.toEast = function() {
    this.directionX = DirectionComponent.DIRECTION_EAST;
}

DirectionComponent.prototype.toNorth = function() {
    this.directionY = DirectionComponent.DIRECTION_NORTH;
}

DirectionComponent.prototype.toSouth = function() {
    this.directionY = DirectionComponent.DIRECTION_SOUTH;
}

DirectionComponent.create = function() {
    return new DirectionComponent();
}