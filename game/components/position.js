import { Component } from "../../source/component/component.js";

export const PositionComponent = function() {
    this.positionX = 0;
    this.positionY = 0;
    this.tileX = 0;
    this.tileY = 0;
}

PositionComponent.prototype = Object.create(Component.prototype);
PositionComponent.prototype.constructor = PositionComponent;

PositionComponent.prototype.save = function() {
    return [this.tileX, this.tileY];
}

PositionComponent.prototype.load = function(blob) {
    const [ tileX, tileY ] = blob;

    this.tileX = tileX;
    this.tileY = tileY;
}