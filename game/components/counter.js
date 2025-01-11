export const CounterComponent = function() {
    this.counterMove = false;
    this.counterAttack = false;
}

CounterComponent.prototype.isAttackCounterable = function() {
    return this.counterAttack;
}

CounterComponent.prototype.isMoveCounterable = function() {
    return this.counterMove;
}