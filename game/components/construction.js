export const ConstructionComponent = function() {
    this.stepsRequired = 0;
    this.stepsCompleted = 0;
}

ConstructionComponent.CONSTRUCTION_FRAMES = [0, 0, 1, 1, 2];

ConstructionComponent.prototype.save = function() {
    return {
        "stepsCompleted": this.stepsCompleted
    }
}

ConstructionComponent.create = function(setup = {}) {
    const constructionComponent = new ConstructionComponent();
    const { constructionSteps } = setup;

    constructionComponent.stepsRequired = constructionSteps;
    constructionComponent.stepsCompleted = 0;
    
    return constructionComponent;
}