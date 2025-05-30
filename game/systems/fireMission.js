import { DefaultTypes } from "../defaultTypes.js";
import { GameEvent } from "../gameEvent.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AttackSystem } from "./attack.js";
import { DebrisSystem } from "./debris.js";

/**
 * Collection of functions revolving around the fire missions.
 */
export const FireMissionSystem = function() {}

/**
 * Returns the config of a fire mission.
 * 
 * @param {*} gameContext 
 * @param {string} fireMissionID 
 * @returns {FireMissionType}
 */
FireMissionSystem.getType = function(gameContext, fireMissionID) {
    const fireMission = gameContext.fireCallTypes[fireMissionID];

    if(!fireMission) {
        return null;
    }

    return fireMission;
} 

/**
 * Checks if the entity is targetable by any fire mission.
 * 
 * @param {*} entity 
 * @returns {boolean}
 */
FireMissionSystem.isTargetable = function(entity) {
    if(entity.hasComponent(ArmyEntity.COMPONENT.TOWN)) {
        return false;
    }

    return true;
}

/**
 * Returns a list of all potential targets hit by the fire mission.
 * 
 * @param {*} gameContext 
 * @param {FireMissionType} fireMission 
 * @param {int} tileX 
 * @param {int} tileY 
 * @returns {TargetObject[]}
 */
FireMissionSystem.getTargets = function(gameContext, fireMission, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return [];
    }

    const { damage, dimX, dimY, isBulldozing } = fireMission;
    const endX = tileX + dimX;
    const endY = tileY + dimY;
    const entityList = new Map();

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            const isFullyClouded = worldMap.isFullyClouded(j, i);

            if(isFullyClouded) {
                continue;
            }

            const entityID = worldMap.getTopEntity(j, i);
            const entity = entityManager.getEntity(entityID);

            if(!entity) {
                continue;
            }

            const isTargetable = FireMissionSystem.isTargetable(entity);
            const isAlive = entity.isAlive();

            if(isTargetable && isAlive) {
                const currentDamage = damage; //TODO Calculate the damage.
                const entry = entityList.get(entityID);
    
                if(!entry) {
                    entityList.set(entityID, {
                        "entity": entity,
                        "damage": currentDamage
                    });
                } else {
                    entry.damage += currentDamage;
                }
            }
        }
    }

    const targetObjects = [];
    
    for(const [entityID, entry] of entityList) {
        const { entity, damage } = entry;

        if(damage !== 0) {
            const targetState = AttackSystem.getState(entity, damage, isBulldozing);
            const targetObject = DefaultTypes.createTargetObject(entityID, damage, targetState);
    
            targetObjects.push(targetObject);
        }
    }

    return targetObjects;
}

/**
 * Checks if the fire mission is blocked by the clouds or an entity.
 * 
 * @param {*} gameContext 
 * @param {FireMissionType} fireMission 
 * @param {int} tileX 
 * @param {int} tileY 
 * @returns {boolean}
 */
FireMissionSystem.isBlocked = function(gameContext, fireMission, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return true;
    }

    let fullyClouded = true;
    const { dimX, dimY } = fireMission;
    const endX = tileX + dimX;
    const endY = tileY + dimY;

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            const tileEntity = world.getTileEntity(j, i);

            if(tileEntity && !FireMissionSystem.isTargetable(tileEntity)) {
                return true;
            }

            const isFullyClouded = worldMap.isFullyClouded(j, i);

            if(!isFullyClouded) {
                fullyClouded = false;
            }
        }
    }

    return fullyClouded;
}

/**
 * Starts a fire mission.
 *  
 * @param {*} gameContext 
 * @param {string} missionID 
 * @param {int} tileX 
 * @param {int} tileY 
 * @param {TargetObject[]} targetObjects 
 */
FireMissionSystem.startFireMission = function(gameContext, missionID, tileX, tileY, targetObjects) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const fireMission = FireMissionSystem.getType(gameContext, missionID);
    
    for(let i = 0; i < targetObjects.length; i++) {
        AttackSystem.startAttack(gameContext, targetObjects[i]);
    }

    soundPlayer.play(fireMission.sounds.fire);
}

/**
 * Ends a fire mission. Emits an event for each target based on its state.
 * Also emite the DEBRIS_SPAWN event.
 * 
 * @param {*} gameContext 
 * @param {string} missionID 
 * @param {string} actorID 
 * @param {int} tileX 
 * @param {int} tileY 
 * @param {TargetObject[]} targetObjects 
 */
FireMissionSystem.endFireMission = function(gameContext, missionID, actorID, tileX, tileY, targetObjects) {
    const { world } = gameContext;
    const { entityManager, eventBus } = world;

    const fireMission = FireMissionSystem.getType(gameContext, missionID);
    const { dimX, dimY } = fireMission;

    for(let i = 0; i < targetObjects.length; i++) {
        const { id, state, damage } = targetObjects[i];
        const entity = entityManager.getEntity(id);

        switch(state) {
            case AttackSystem.OUTCOME_STATE.DEAD: {
                entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    
                eventBus.emit(GameEvent.TYPE.ENTITY_KILL, { 
                    "reason": GameEvent.KILL_REASON.FIRE_MISSION,
                    "entity": entity,
                    "damage": damage,
                    "actor": actorID
                });
                break;
            }
            case AttackSystem.OUTCOME_STATE.IDLE: {
                entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    
                eventBus.emit(GameEvent.TYPE.ENTITY_HIT, { 
                    "reason": GameEvent.KILL_REASON.FIRE_MISSION,
                    "entity": entity,
                    "damage": damage,
                    "actor": actorID
                });
                break;
            }
            case AttackSystem.OUTCOME_STATE.DOWN: {
                eventBus.emit(GameEvent.TYPE.ENTITY_DOWN, { 
                    "reason": GameEvent.KILL_REASON.FIRE_MISSION,
                    "entity": entity,
                    "damage": damage,
                    "actor": actorID
                });
    
                eventBus.emit(GameEvent.TYPE.ENTITY_HIT, { 
                    "reason": GameEvent.KILL_REASON.FIRE_MISSION,
                    "entity": entity,
                    "damage": damage,
                    "actor": actorID
                });
                break;
            }
        }
    }

    const debris = DebrisSystem.getDebrisSpawnLocations(gameContext, tileX, tileY, dimX, dimY);

    if(debris.length !== 0) {
        eventBus.emit(GameEvent.TYPE.DEBRIS_SPAWN, {
            "debris": debris
        });
    }
}