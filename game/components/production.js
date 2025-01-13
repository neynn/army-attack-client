export const ProductionComponent = function() {
    this.passedTime = 0;
    this.state = ProductionComponent.STATE.NOT_PRODUCING;
}

ProductionComponent.STATE = {
    "NOT_PRODUCING": 0,
    "PRODUCING": 1,
    "FINISHED": 2
};

ProductionComponent.prototype.update = function(gameContext, maxTime) {
    if(this.state === ProductionComponent.STATE.PRODUCING) {
        const { timer } = gameContext;
        const deltaTime = timer.getFixedDeltaTime();
    
        this.passedTime += deltaTime;
    
        if(this.passedTime >= maxTime) {
            this.passedTime = maxTime;
            this.state = ProductionComponent.STATE.FINISHED;
        }
    }
}

ProductionComponent.prototype.isFinished = function() {
    return this.state === ProductionComponent.STATE.FINISHED;
}

ProductionComponent.create = function(config = {}) {
    const productionComponent = new ProductionComponent();
    const {
        //TODO
    } = config;

    return productionComponent;
}