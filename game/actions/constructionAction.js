import { Action } from "../../source/action/action.js";

import { AnimationSystem } from "../systems/animation.js";
import { ConstructionSystem } from "../systems/construction.js";

export const ConstructionAction = function() {
    Action.call(this);
    this.timePassed = 0;
}

ConstructionAction.prototype = Object.create(Action.prototype);
ConstructionAction.prototype.constructor = ConstructionAction;

ConstructionAction.prototype.onClear = function() {
    this.timePassed = 0;
}

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

    ConstructionSystem.advanceConstruction(gameContext, entity, deltaSteps);
}

ConstructionAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    this.timePassed += deltaTime;
}

ConstructionAction.prototype.isFinished = function(gameContext, request) {
    const { world } = gameContext;
    const settings = world.getConfig("settings");
    const constructionDuration = settings.iconDuration;

    return this.timePassed >= constructionDuration;
}

ConstructionAction.prototype.isValid = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = request;
    const entity = entityManager.getEntity(entityID);

    if(!ConstructionSystem.isConstruction(entity)) {
        return false;
    }

    if(ConstructionSystem.isComplete(entity)) {
        return false;
    }

    request.deltaSteps = 1;

    return true;
}

ConstructionAction.prototype.createRequest = function(entityID) {
    return {
        "entityID": entityID,
        "deltaSteps": 0
    }
}
