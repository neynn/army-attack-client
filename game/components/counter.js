import { Component } from "../../source/component/component.js";

export const CounterComponent = function() {
    this.counterMove = false;
    this.counterAttack = false;
}

CounterComponent.prototype = Object.create(Component.prototype);
CounterComponent.prototype.constructor = CounterComponent;

CounterComponent.prototype.isAttackCounterable = function() {
    return this.counterAttack;
}

CounterComponent.prototype.isMoveCounterable = function() {
    return this.counterMove;
}