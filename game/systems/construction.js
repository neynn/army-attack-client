import { ConstructionAction } from "../actions/constructionAction.js";
import { DefaultTypes } from "../defaultTypes.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { SpawnSystem } from "./spawn.js";

/**
 * Collection of functions revolving around the construction of buildings.
 */
export const ConstructionSystem = function() {}

/**
 * Returns a spawnable entity config.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns {SpawnConfigType | null}
 */
const getResult = function(gameContext, entity) {
    const { world } = gameContext;
    const { turnManager } = world;
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(!constructionComponent) {
        return null;
    }

    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { teamID } = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const entityID = entity.getID();
    const owners = turnManager.getOwnersOf(entityID);
    const type = entity.config.constructionResult;
    
    return DefaultTypes.createSpawnConfig(type, teamID, owners, tileX, tileY);
}

/**
 * Creates a build request for the entity or finishes up construction.
 * TODO: Create confirmation dialog & isolate to game event.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @param {string} actorID 
 * @returns {ConstructionRequest | null}
 */
ConstructionSystem.onInteract = function(gameContext, entity, actorID) {
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(!constructionComponent) {
        return null;
    }
    
    const { world } = gameContext;
    const { actionQueue } = world;
    
    if(constructionComponent.isComplete()) {
        if(!actionQueue.isRunning()) {
            const result = getResult(gameContext, entity);

            if(result) {
                SpawnSystem.destroyEntity(gameContext, entity);
                SpawnSystem.createEntity(gameContext, result);
            }
        }
    } else {
        const entityID = entity.getID();
        const request = ConstructionAction.createRequest(actorID, entityID);

        return request;
    }

    return null;
}