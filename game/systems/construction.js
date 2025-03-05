import { ACTION_TYPES } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { SpawnSystem } from "./spawn.js";

export const ConstructionSystem = function() {}

ConstructionSystem.onInteract = function(gameContext, entity) {
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(!constructionComponent) {
        return;
    }
    
    const { world } = gameContext;
    const { actionQueue, controllerManager } = world;
    
    if(constructionComponent.isComplete()) {
        if(!actionQueue.isRunning()) {
            const result = ConstructionSystem.getResult(gameContext, entity);

            if(result) {
                entity.die(gameContext);
                SpawnSystem.createEntity(gameContext, result);
            }
        }
    } else {
        const entityID = entity.getID();
        const ownerID = controllerManager.getOwnerID(entityID);

        actionQueue.addRequest(ACTION_TYPES.CONSTRUCTION, ownerID, entityID);
    }
}

ConstructionSystem.getResult = function(gameContext, entity) {
    const { world } = gameContext;
    const { controllerManager } = world;
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(!constructionComponent) {
        return null;
    }

    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { teamID } = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const entityID = entity.getID();
    const ownerID = controllerManager.getOwnerID(entityID);
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