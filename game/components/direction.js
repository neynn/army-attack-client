import { Component } from "../../source/component/component.js";

export const DirectionComponent = function() {
    this.directionX = DirectionComponent.DIRECTION.EAST;
    this.directionY = DirectionComponent.DIRECTION.SOUTH;
}

DirectionComponent.DIRECTION = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3
};

DirectionComponent.prototype = Object.create(Component.prototype);
DirectionComponent.prototype.constructor = DirectionComponent;

DirectionComponent.prototype.toWest = function() {
    this.directionX = DirectionComponent.DIRECTION.WEST;
}

DirectionComponent.prototype.toEast = function() {
    this.directionX = DirectionComponent.DIRECTION.EAST;
}

DirectionComponent.prototype.toNorth = function() {
    this.directionY = DirectionComponent.DIRECTION.NORTH;
}

DirectionComponent.prototype.toSouth = function() {
    this.directionY = DirectionComponent.DIRECTION.SOUTH;
}