import { getTeamName } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";

export const PlaceSystem = function() {}

PlaceSystem.BLOCK_STATE = {
    NONE: 0,
    DEBRIS: 1,
    TILE_TYPE: 2,
    ALLIANCE_DENY: 3,
    ENTITY_BODY: 4,
    ENTITY_ATTACK: 5
};

const getBlockState = function(gameContext, worldMap, tileX, tileY, teamName) {
    const { world } = gameContext;
    const { entityManager } = world;

    const hasDebris = worldMap.hasDebris(tileX, tileY);

    if(hasDebris) {
        return PlaceSystem.BLOCK_STATE.DEBRIS;
    }

    const typeID = worldMap.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
    const tileType = gameContext.getTileType(typeID);

    if(!tileType.allowPlacement) {
        return PlaceSystem.BLOCK_STATE.TILE_TYPE;
    }

    const teamID = worldMap.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const isPlaceable = AllianceSystem.isPlaceable(gameContext, teamName, getTeamName(teamID));

    if(!isPlaceable) {
        return PlaceSystem.BLOCK_STATE.ALLIANCE_DENY;
    }

    const entityID = worldMap.getTopEntity(tileX, tileY);
    const entity = entityManager.getEntity(entityID);

    if(entity !== null) {
        return PlaceSystem.BLOCK_STATE.ENTITY_BODY;
    }

    const startX = tileX - 1;
    const startY = tileY - 1;
    const endX = tileX + 1;
    const endY = tileY + 1;

    for(let y = startY; y <= endY; y++) {
        for(let x = startX; x <= endX; x++) {
            if(worldMap.isTileOutOfBounds(x, y)) {
                continue;
            }

            const nextEntityID = worldMap.getTopEntity(x, y);
            const nextEntity = entityManager.getEntity(nextEntityID);

            if(!nextEntity || !nextEntity.hasComponent(ArmyEntity.COMPONENT.ATTACK)) {
                continue;
            }

            const teamComponent = nextEntity.getComponent(ArmyEntity.COMPONENT.TEAM);
            const isEnemy = AllianceSystem.isEnemy(gameContext, teamName, teamComponent.teamID);

            if(isEnemy) {
                return PlaceSystem.BLOCK_STATE.ENTITY_ATTACK;
            }
        }
    }

    return PlaceSystem.BLOCK_STATE.NONE;
}

PlaceSystem.getBlockedPlaceIndices = function(gameContext, teamName) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const blockedIndices = [];

    if(!worldMap) {
        return blockedIndices;
    }

    for(let i = 0; i < worldMap.height; i++) {
        for(let j = 0; j < worldMap.width; j++) {
            const blockState = getBlockState(gameContext, worldMap, j, i, teamName);

            if(blockState !== PlaceSystem.BLOCK_STATE.NONE) {
                const index = i * worldMap.width + j;

                blockedIndices.push(index, blockState);
            }
        }
    }

    return blockedIndices;
}

PlaceSystem.isEntityPlaceable = function(gameContext, tileX, tileY, sizeX, sizeY, teamName) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return false;
    }

    const endX = tileX + sizeX;
    const endY = tileY + sizeY;

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            const blockState = getBlockState(gameContext, worldMap, j, i, teamName);

            if(blockState !== PlaceSystem.BLOCK_STATE.NONE) {
                return false;
            }
        }
    }

    return true;
}