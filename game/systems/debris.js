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
    eventBus.emit(GameEvent.TYPE.DEBRIS_REMOVED, { tileX, tileY, cleanerID });
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