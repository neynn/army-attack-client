export const FireMissionSystem = function() {}

const getSurroundingEntities = function(worldMap, tileX, tileY, dimX, dimY) {
    const endX = tileX + dimX;
    const endY = tileY + dimY;
    const entities = worldMap.getAllEntitiesInRange(tileX, tileY, endX, endY);

    return entities;
}

/**
 * Checks if the entity can be targeted by a firecall.
 * 
 * Some entities, like TOWNS, cannot be targeted by them, even though war-crimes are fun!
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns 
 */
const isFireCallValid = function(gameContext, entity) {
    console.log(entity);
    
    return true;
}

FireMissionSystem.getOutcome = function(gameContext, fireMissionID, tileX, tileY) {

}

FireMissionSystem.isValid = function(gameContext, fireMissionID, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return false;
    }

    const fireMission = gameContext.fireCallTypes[fireMissionID];

    if(!fireMission) {
        return false;
    }

    const { dimX, dimY } = fireMission;
    const entities = getSurroundingEntities(worldMap, tileX, tileY, dimX, dimY);

    for(let i = 0; i < entities.length; i++) {
        const entityID = entities[i];
        const entity = entityManager.getEntity(entityID);
        const isValid = isFireCallValid(gameContext, entity);

        if(!isValid) {
            return false;
        }
    }

    return true;
}
