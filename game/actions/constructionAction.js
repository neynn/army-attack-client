import { Action } from "../../source/action/action.js";

import { AnimationSystem } from "../systems/animation.js";
import { ArmyEntity } from "../init/armyEntity.js";

export const ConstructionAction = function() {
    this.timePassed = 0;
}

ConstructionAction.prototype = Object.create(Action.prototype);
ConstructionAction.prototype.constructor = ConstructionAction;

ConstructionAction.prototype.onClear = function() {
    this.timePassed = 0;
}

ConstructionAction.prototype.onStart = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = request;
    const entity = entityManager.getEntity(entityID);

    AnimationSystem.playConstruction(gameContext, entity);
}

ConstructionAction.prototype.onEnd = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, deltaSteps } = request;
    const entity = entityManager.getEntity(entityID);
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    constructionComponent.advance(deltaSteps);
    AnimationSystem.setConstructionFrame(gameContext, entity);
}

ConstructionAction.prototype.onUpdate = function(gameContext, request, messengerID) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    this.timePassed += deltaTime;
}

ConstructionAction.prototype.isFinished = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const settings = world.getConfig("Settings");
    const constructionDuration = settings.iconDuration;

    return this.timePassed >= constructionDuration;
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
        "entityID": entityID,
        "deltaSteps": 1
    }
}

ConstructionAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}
