import { GameEvent } from "../gameEvent.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AttackSystem } from "./attack.js";
import { DebrisSystem } from "./debris.js";

export const FireMissionSystem = function() {}

FireMissionSystem.getType = function(gameContext, fireMissionID) {
    const fireMission = gameContext.fireCallTypes[fireMissionID];

    if(!fireMission) {
        return null;
    }

    return fireMission;
} 

FireMissionSystem.isTargetable = function(entity) {
    if(entity.hasComponent(ArmyEntity.COMPONENT.TOWN)) {
        return false;
    }

    return true;
}

FireMissionSystem.getTargets = function(gameContext, fireMission, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return [];
    }

    const { damage = 0, dimX = 0, dimY = 0 } = fireMission;
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
            const targetState = AttackSystem.getState(entity, damage, false);
            const targetObject = AttackSystem.createTargetObject(entityID, damage, targetState);
    
            targetObjects.push(targetObject);
        }
    }

    return targetObjects;
}

FireMissionSystem.isBlocked = function(gameContext, fireMission, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return true;
    }

    let fullyClouded = true;
    const { dimX = 0, dimY = 0 } = fireMission;
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

FireMissionSystem.startFireMission = function(gameContext, missionID, tileX, tileY, targetObjects) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const fireMission = FireMissionSystem.getType(gameContext, missionID);
    
    for(let i = 0; i < targetObjects.length; i++) {
        AttackSystem.updateTarget(gameContext, targetObjects[i]);
    }

    soundPlayer.play(fireMission.sounds.fire);
}

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