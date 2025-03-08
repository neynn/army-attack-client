import { ACTION_TYPES } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { SpawnSystem } from "./spawn.js";

export const ConstructionSystem = function() {}

const getResult = function(entity) {
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(!constructionComponent) {
        return null;
    }

    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { teamID } = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const entityID = entity.getID();
    const ownerID = entity.getOwner();
    const type = entity.config.constructionResult;

    return {
        "id": entityID,
        "team": teamID,
        "owner": ownerID,
        "type": type,
        "tileX": tileX,
        "tileY": tileY
    }
}

ConstructionSystem.onInteract = function(gameContext, entity) {
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(!constructionComponent) {
        return null;
    }
    
    const { world } = gameContext;
    const { actionQueue } = world;
    
    if(constructionComponent.isComplete()) {
        if(!actionQueue.isRunning()) {
            const result = getResult(entity);

            if(result) {
                SpawnSystem.destroyEntity(gameContext, entity);
                SpawnSystem.createEntity(gameContext, result);
            }
        }
    } else {
        const entityID = entity.getID();
        const request = actionQueue.createRequest(ACTION_TYPES.CONSTRUCTION, entityID);

        return request;
    }

    return null;
}