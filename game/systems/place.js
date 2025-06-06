import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";

export const PlaceSystem = function() {}

PlaceSystem.BLOCK_STATE = {
    DEBRIS: 0,
    TILE_TYPE: 1,
    ALLIANCE_DENY: 2,
    ENTITY_BODY: 3,
    ENTITY_ATTACK: 4
};

const addStateIfNotPresent = function(hMap, id, state) {
    if(!hMap.has(id)) {
        hMap.set(id, state);
    }
}

const handleEnemyEntityFound = function(tileX, tileY, worldMap, blocked) {
    const startX = tileX - 1;
    const startY = tileY - 1;
    const endX = tileX + 1;
    const endY = tileY + 1;

    for(let y = startY; y <= endY; y++) {
        for(let x = startX; x <= endX; x++) {
            if(!worldMap.isTileOutOfBounds(x, y)) {
                const entityID = worldMap.getTopEntity(x, y);

                if(entityID === null) {
                    const nextIndex = y * worldMap.width + x;

                    addStateIfNotPresent(blocked, nextIndex, PlaceSystem.BLOCK_STATE.ENTITY_ATTACK);
                }
            }
        }
    }
}

PlaceSystem.getBlockedPlaceIndices = function(gameContext, teamName) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const blockedIndices = new Map();

    for(let i = 0; i < worldMap.height; i++) {
        for(let j = 0; j < worldMap.width; j++) {
            const index = i * worldMap.width + j;
            const hasDebris = worldMap.hasDebris(j, i);

            if(hasDebris) {
                addStateIfNotPresent(blockedIndices, index, PlaceSystem.BLOCK_STATE.DEBRIS);
                continue;
            }

            const typeID = worldMap.getTile(ArmyMap.LAYER.TYPE, j, i);
            const type = gameContext.tileTypes[typeID];

            if(!type || !type.allowPlacement) {
                addStateIfNotPresent(blockedIndices, index, PlaceSystem.BLOCK_STATE.TILE_TYPE);
                continue;
            }

            const teamID = worldMap.getTile(ArmyMap.LAYER.TEAM, j, i);
            const isPlaceable = AllianceSystem.isPlaceable(gameContext, teamName, ArmyMap.TEAM_TYPE[teamID]);

            if(!isPlaceable) {
                addStateIfNotPresent(blockedIndices, index, PlaceSystem.BLOCK_STATE.ALLIANCE_DENY);
                continue;
            }

            const entityID = worldMap.getTopEntity(j, i);
            const entity = entityManager.getEntity(entityID);

            if(entity !== null) {
                addStateIfNotPresent(blockedIndices, index, PlaceSystem.BLOCK_STATE.ENTITY_BODY);

                const hasAttack = entity.hasComponent(ArmyEntity.COMPONENT.ATTACK);

                if(hasAttack) {
                    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
                    const isEnemy = AllianceSystem.isEnemy(gameContext, teamName, teamComponent.teamID);

                    if(isEnemy) {
                        handleEnemyEntityFound(j, i, worldMap, blockedIndices);
                    }
                }
            }
        }
    }

    return blockedIndices;
}