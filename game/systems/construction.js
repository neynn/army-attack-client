import { ConstructionComponent } from "../components/construction.js";
import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";
import { ACTION_TYPES } from "../enums.js";
import { DeathSystem } from "./death.js";
import { SpawnSystem } from "./spawn.js";

export const ConstructionSystem = function() {}

ConstructionSystem.onInteract = function(gameContext, entity, controllerID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const constructionComponent = entity.getComponent(ConstructionComponent);

    if(!constructionComponent) {
        return;
    }

    const entityID = entity.getID();

    if(constructionComponent.isComplete()) {
        if(!actionQueue.isRunning()) {
            ConstructionSystem.finishConstruction(gameContext, entity, controllerID);
        }
    }  else {
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.CONSTRUCTION, entityID));
    }
}

ConstructionSystem.finishConstruction = function(gameContext, entity, controllerID) {        
    const constructionComponent = entity.getComponent(ConstructionComponent);

    if(!constructionComponent) {
        return;
    }

    const positionComponent = entity.getComponent(PositionComponent);
    const teamComponent = entity.getComponent(TeamComponent);
    const resultType = constructionComponent.getResult();
    const entityID = entity.getID();
    const result = {
        "id": entityID,
        "team": teamComponent.teamID,
        "owner": controllerID,
        "type": resultType,
        "tileX": positionComponent.tileX,
        "tileY": positionComponent.tileY,
        "mode": "story" //TODO gets determined by the client/server
    }

    //TODO: Open GUI and check if the controller has enough materials/resources.
    DeathSystem.destroyEntity(gameContext, entityID);
    SpawnSystem.createEntity(gameContext, result);
}