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
    return {
        "tileX": this.tileX,
        "tileY": this.tileY
    }
}

PositionComponent.create = function() {
    return new PositionComponent();
}