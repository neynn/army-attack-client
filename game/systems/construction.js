import { ACTION_TYPES } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { SpawnSystem } from "./spawn.js";

export const ConstructionSystem = function() {}

ConstructionSystem.onInteract = function(gameContext, entity, controllerID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

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
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(!constructionComponent) {
        return;
    }

    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
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
    entity.die(gameContext);
    SpawnSystem.createEntity(gameContext, result);
}