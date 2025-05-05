import { ArmyEntity } from "../init/armyEntity.js";

export const FireMissionSystem = function() {}

const getEntitiesInArea = function(gameContext, tileX, tileY, dimX, dimY) {
    const { world } = gameContext;
    const endX = tileX + dimX;
    const endY = tileY + dimY;
    const entities = world.getEntitiesInArea(tileX, tileY, endX, endY);

    return entities;
}

FireMissionSystem.isTargetable = function(entity) {
    if(entity.hasComponent(ArmyEntity.COMPONENT.TOWN)) {
        return false;
    }

    return true;
}

FireMissionSystem.getTargets = function(gameContext, fireMission, tileX, tileY) {
    const { dimX = 0, dimY = 0 } = fireMission;
    const entities = getEntitiesInArea(gameContext, tileX, tileY, dimX, dimY);
    const targets = [];

    for(let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const isTargetable = this.isTargetable(entity);

        if(isTargetable) {
            targets.push(entity);
        }
    }

    if(targets.length === 0) {
        return null;
    }

    return targets;
}

FireMissionSystem.isBlocked = function(gameContext, fireMission, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return true;
    }

    const { dimX = 0, dimY = 0 } = fireMission;
    const endX = tileX + dimX;
    const endY = tileY + dimY;

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            const isFullyClouded = worldMap.isFullyClouded(j, i);

            if(isFullyClouded) {
                return true;
            }

            const tileEntity = world.getTileEntity(j, i);

            if(tileEntity && !this.isTargetable(tileEntity)) {
                return true;
            }
        }
    }

    return false;
}

FireMissionSystem.isValid = function(gameContext, fireMissionID, tileX, tileY) {
    const fireMission = gameContext.fireCallTypes[fireMissionID];

    if(!fireMission) {
        return false;
    }

    const isBlocked = FireMissionSystem.isBlocked(gameContext, fireMission, tileX, tileY);

    return !isBlocked;
}
