import { clampValue } from "../../source/math/math.js";

export const ConstructionComponent = function() {
    this.stepsRequired = 0;
    this.stepsCompleted = 0;
    this.result = null;
}

ConstructionComponent.CONSTRUCTION_FRAMES = [0, 0, 1, 1, 2];

ConstructionComponent.prototype.getResult = function() {
    return this.result;
}

ConstructionComponent.prototype.isComplete = function() {
    return this.stepsCompleted >= this.stepsRequired;
}

ConstructionComponent.prototype.getFrame = function() {
    const frameID = ConstructionComponent.CONSTRUCTION_FRAMES[this.stepsCompleted];

    if(frameID === undefined) {
        return 0;
    }

    return frameID;
}

ConstructionComponent.prototype.advance = function(deltaSteps = 0) {
    const nextValue = this.stepsCompleted + deltaSteps;
    const stepsCompleted = clampValue(nextValue, this.stepsRequired, 0);

    this.stepsCompleted = stepsCompleted;
}

ConstructionComponent.prototype.save = function() {
    return {
        "stepsCompleted": this.stepsCompleted
    }
}

ConstructionComponent.create = function(config = {}) {
    const constructionComponent = new ConstructionComponent();
    const {
        constructionSteps = 0,
        constructionResult = 0
    } = config;

    constructionComponent.stepsCompleted = 0;
    constructionComponent.stepsRequired = constructionSteps;
    constructionComponent.result = constructionResult;
    
    return constructionComponent;
}