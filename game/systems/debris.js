import { GameEvent } from "../gameEvent.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";

export const DebrisSystem = function() {}

DebrisSystem.isCleanable = function(gameContext, tileX, tileY, actorID) {
    const { world } = gameContext;
    const { mapManager, turnManager } = world;

    const actor = turnManager.getActor(actorID);

    if(!actor) {
        return false;
    }

    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return false;
    }

    const hasDebris = worldMap.hasDebris(tileX, tileY);

    if(!hasDebris) {
        return false;
    }

    const isOccupied = worldMap.isTileOccupied(tileX, tileY);

    if(isOccupied) {
        return false;
    }

    const teamID = worldMap.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, actor.teamID, ArmyMap.TEAM_TYPE[teamID]);

    return !isEnemy;
}

DebrisSystem.endCleaning = function(gameContext, tileX, tileY, cleanerID) {
    const { world } = gameContext;
    const { mapManager, eventBus } = world;
    const worldMap = mapManager.getActiveMap();

    worldMap.removeDebris(tileX, tileY);
    eventBus.emit(GameEvent.TYPE.DEBRIS_REMOVED, { 
        "tileX": tileX,
        "tileY": tileY,
        "actor": cleanerID 
    });
}

DebrisSystem.spawnDebris = function(gameContext, debris) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    for(let i = 0; i < debris.length; i++) {
        const { x, y } = debris[i];

        worldMap.addDebris(1, x, y);
    }
}

DebrisSystem.canDebrisSpawn = function(gameContext, worldMap, tileX, tileY) {
    const typeID = worldMap.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
    const tileType = gameContext.tileTypes[typeID];

    if(!tileType || !tileType.canDebrisSpawn) {
        return false;
    }

    if(!worldMap.hasDebris(tileX, tileY)) {
        if(worldMap.getTopEntity(tileX, tileY) === null) {
            if(!worldMap.isFullyClouded(tileX, tileY)) {
                return true;
            }
        }
    }
    
    return false;
}

DebrisSystem.getDebrisSpawnLocations = function(gameContext, tileX, tileY, sizeX, sizeY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const debris = [];

    if(!worldMap) {
        return debris;
    }
    
    const endX = tileX + sizeX;
    const endY = tileY + sizeY;

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            const canSpawn = DebrisSystem.canDebrisSpawn(gameContext, worldMap, j, i);

            if(canSpawn) {
                debris.push({
                    "x": j,
                    "y": i
                });
            }
        }
    }

    return debris;
}