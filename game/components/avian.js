import { Component } from "../../source/component/component.js";

export const AvianComponent = function() {
    this.state = AvianComponent.STATE_GROUNDED;
}

AvianComponent.STATE_GROUNDED = 0;
AvianComponent.STATE_FLYING = 1;

AvianComponent.prototype = Object.create(Component.prototype);
AvianComponent.prototype.constructor = AvianComponent;

AvianComponent.prototype.toGround = function() {
    this.state = AvianComponent.STATE_GROUNDED;
}

AvianComponent.prototype.toAir = function() {
    this.state = AvianComponent.STATE_FLYING;
}

AvianComponent.prototype.isFlying = function() {
    return this.state === AvianComponent.STATE_FLYING;
}