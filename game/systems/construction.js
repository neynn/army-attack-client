import { clampValue } from "../../source/math/math.js";

import { ConstructionComponent } from "../components/construction.js";
import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";
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


//GAME_EVENTS.INSTANCE_ENTITY -> get the constructionResult from the config
//GAME_EVENTS.REMOVE_ENTITY -> remove the construction site
ConstructionSystem.getConstructionResult = function(controller, entity) {
    const controllerID = controller.getID();
    const entityID = entity.getID();
    const entityConfig = entity.getConfig();
    const positionComponent = entity.getComponent(PositionComponent);
    const teamComponent = entity.getComponent(TeamComponent);

    
    return {
        "id": entityID,
        "team": teamComponent.teamID,
        "master": controllerID,
        "type": entityConfig.constructionResult,
        "tileX": positionComponent.tileX,
        "tileY": positionComponent.tileY,
        "mode": "story" //TODO gets determined by the client/server
    }
}
