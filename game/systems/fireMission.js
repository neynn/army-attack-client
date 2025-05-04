import { ArmyEntity } from "../init/armyEntity.js";

export const FireMissionSystem = function() {}

FireMissionSystem.TARGET_STATE = {
    NONE: 0,
    VALID: 1,
    INVALID: 2
};

const getEntitiesInArea = function(gameContext, tileX, tileY, dimX, dimY) {
    const { world } = gameContext;
    const endX = tileX + dimX;
    const endY = tileY + dimY;
    const entities = world.getEntitiesInArea(tileX, tileY, endX, endY);

    return entities;
}

const getFireCallState = function(gameContext, entity) {
    if(entity.hasComponent(ArmyEntity.COMPONENT.TOWN)) {
        return FireMissionSystem.TARGET_STATE.INVALID;
    }


    return FireMissionSystem.TARGET_STATE.VALID;
}

FireMissionSystem.getTargets = function(gameContext, fireMission, tileX, tileY) {
    const { dimX = 0, dimY = 0 } = fireMission;
    const entities = getEntitiesInArea(gameContext, tileX, tileY, dimX, dimY);
    const targets = [];

    for(let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const state = getFireCallState(gameContext, entity);

        targets.push({
            "state": state,
            "entity": entity
        });
    }

    console.log(targets);

    return targets;
}

FireMissionSystem.getOutcome = function(gameContext, fireMissionID, tileX, tileY) {}

FireMissionSystem.isValid = function(gameContext, fireMissionID, tileX, tileY) {
    const fireMission = gameContext.fireCallTypes[fireMissionID];

    if(!fireMission) {
        return false;
    }

    const targets = FireMissionSystem.getTargets(gameContext, fireMission, tileX, tileY);

    if(targets.length === 0) {
        return true;
    }

    for(let i = 0; i < targets.length; i++) {
        const { state, entity } = targets[i];

        if(state === FireMissionSystem.TARGET_STATE.INVALID) {
            return false;
        }
    }

    return true;
}
