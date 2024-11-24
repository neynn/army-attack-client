export const ConstructionComponent = function() {
    this.stepsRequired = 0;
    this.stepsCompleted = 0;
}

ConstructionComponent.prototype.save = function() {
    return {
        "stepsCompleted": this.stepsCompleted
    }
}