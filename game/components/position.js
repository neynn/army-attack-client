import { Component } from "../../source/component/component.js";

export const PositionComponent = function() {
    this.positionX = 0;
    this.positionY = 0;
    this.tileX = 0;
    this.tileY = 0;
}

PositionComponent.prototype = Object.create(Component.prototype);
PositionComponent.prototype.constructor = PositionComponent;

PositionComponent.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;
}

PositionComponent.prototype.setTile = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
}

PositionComponent.prototype.updatePosition = function(deltaX, deltaY) {
    this.positionX += deltaX;
    this.positionY += deltaY;
}

PositionComponent.prototype.updateTile = function(deltaX, deltaY) {
    this.tileX += deltaX;
    this.tileY += deltaY;
}