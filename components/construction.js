export const ConstructionComponent = function() {
    this.stepsRequired = 0;
    this.stepsCompleted = 0;
    this.isComplete = false;
}

ConstructionComponent.prototype.save = function() {
    return {
        "stepsCompleted": this.stepsCompleted
    }
}