import { Action } from "../../source/action/action.js";
import { AnimationSystem } from "../systems/animation.js";
import { ArmyEntity } from "../init/armyEntity.js";

export const ConstructionAction = function() {}

ConstructionAction.prototype = Object.create(Action.prototype);
ConstructionAction.prototype.constructor = ConstructionAction;

ConstructionAction.prototype.onStart = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = request;
    const entity = entityManager.getEntity(entityID);

    AnimationSystem.playConstruction(gameContext, entity);
}

ConstructionAction.prototype.onEnd = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, deltaSteps } = request;
    const entity = entityManager.getEntity(entityID);
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    constructionComponent.advance(deltaSteps);
    AnimationSystem.setConstructionFrame(gameContext, entity);
}

ConstructionAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    request.timePassed += deltaTime;
}

ConstructionAction.prototype.isFinished = function(gameContext, request) {
    const constructionDuration = gameContext.settings.iconDuration;

    return request.timePassed >= constructionDuration;
}

ConstructionAction.prototype.getValidated = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = request;
    const entity = entityManager.getEntity(entityID);
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(!constructionComponent || constructionComponent.isComplete()) {
        return null;
    }

    return {
        "timePassed": 0,
        "entityID": entityID,
        "deltaSteps": 1
    }
}

ConstructionAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}
