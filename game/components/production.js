import { AnimationSystem } from "../systems/animation.js";

export const ProductionComponent = function() {
    this.passedTime = 0;
    this.state = ProductionComponent.STATE.NOT_PRODUCING;
}

ProductionComponent.STATE = {
    NOT_PRODUCING: 0,
    PRODUCING: 1,
    FINISHED: 2
};

ProductionComponent.prototype.update = function(gameContext, entity) {
    if(this.state === ProductionComponent.STATE.PRODUCING) {
        const { timer } = gameContext;
        const deltaTime = timer.getFixedDeltaTime();
    
        this.passedTime += deltaTime;
    
        if(this.passedTime >= entity.config.collectableTimeSeconds) {
            this.passedTime = entity.config.collectableTimeSeconds;
            this.state = ProductionComponent.STATE.FINISHED;

            AnimationSystem.playAttention(gameContext, entity);
        }
    }
}

ProductionComponent.prototype.reset = function() {
    this.passedTime = 0;
    this.state = ProductionComponent.STATE.NOT_PRODUCING;
}

ProductionComponent.prototype.start = function() {
    this.state = ProductionComponent.STATE.PRODUCING;
}

ProductionComponent.prototype.isFinished = function() {
    return this.state === ProductionComponent.STATE.FINISHED;
}

ProductionComponent.prototype.init = function(config) {
    const { producing } = config;

    if(producing) {
        this.state = ProductionComponent.STATE.PRODUCING;
    }
}