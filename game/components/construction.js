import { Component } from "../../source/component/component.js";
import { clampValue } from "../../source/math/math.js";

export const ConstructionComponent = function() {
    this.stepsRequired = 0;
    this.stepsCompleted = 0;
    this.result = null;
}

ConstructionComponent.CONSTRUCTION_FRAMES = [0, 0, 1, 1, 2];

ConstructionComponent.prototype = Object.create(Component.prototype);
ConstructionComponent.prototype.constructor = ConstructionComponent;

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
    return [this.stepsCompleted];
}

ConstructionComponent.prototype.load = function(blob) {
    const [ stepsCompleted ] = blob;

    this.stepsCompleted = stepsCompleted;
}
