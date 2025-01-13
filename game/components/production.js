export const ProductionComponent = function() {
    this.state = ProductionComponent.STATE.IDLE;
}

ProductionComponent.STATE = {
    "IDLE": 0,
    "PRODUCING": 1
}