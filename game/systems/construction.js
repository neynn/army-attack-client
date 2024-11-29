import { clampValue } from "../../source/math/math.js";

import { ConstructionComponent } from "../components/construction.js";
import { AnimationSystem } from "./animation.js";

export const ConstructionSystem = function() {

}

ConstructionSystem.isConstruction = function(entity) {
    return entity.hasComponent(ConstructionComponent);
}

ConstructionSystem.isComplete = function(entity) {
    const constructionComponent = entity.getComponent(ConstructionComponent);
    const isComplete = constructionComponent.stepsCompleted >= constructionComponent.stepsRequired;

    return isComplete;
}

ConstructionSystem.advanceConstruction = function(gameContext, entity, deltaSteps) {
    const constructionComponent = entity.getComponent(ConstructionComponent);
    const stepsCompleted = clampValue(constructionComponent.stepsCompleted + deltaSteps, constructionComponent.stepsRequired, 0);

    AnimationSystem.advanceConstructionFrame(gameContext, entity, stepsCompleted);
    constructionComponent.stepsCompleted = stepsCompleted;
}