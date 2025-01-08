export const CounterComponent = function() {
    this.type = CounterComponent.COUNTER_TYPE.NONE;
}

CounterComponent.COUNTER_TYPE = {
    NONE: 0,
    MOVE: 1,
    ATTACK: 2,
    ALL: 3
};