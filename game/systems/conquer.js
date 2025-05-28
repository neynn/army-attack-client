import { GameEvent } from "../gameEvent.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";
import { BorderSystem } from "./border.js";

/**
 * Collection of functions revolving around the capture of tiles.
 */
export const ConquerSystem = function() {}

/**
 * Checks if the tile is conquerable.
 * 
 * @param {*} gameContext 
 * @param {*} worldMap 
 * @param {int} tileX 
 * @param {int} tileY 
 * @param {string} captureTeamID 
 * @returns 
 */
const isTileConquerable = function(gameContext, worldMap, tileX, tileY, captureTeamID) {
    const typeID = worldMap.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
    const tileType = gameContext.tileTypes[typeID];

    if(!tileType || !tileType.isConquerable) {
        return false;
    }

    const teamID = worldMap.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, captureTeamID, ArmyMap.TEAM_TYPE[teamID]);

    return isEnemy; 
}

/**
 * Changes the specified tiles to the specified team.
 * Updates the tiles apperance.
 * 
 * @param {*} gameContext 
 * @param {string} teamID 
 * @param {int[]} tiles [x, y, x, y, ...]
 * @returns 
 */
ConquerSystem.conquer = function(gameContext, teamID, tiles) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    for(let i = 0; i < tiles.length; i += 2) {
        const x = tiles[i];
        const y = tiles[i + 1];

        worldMap.placeTile(gameContext.getTeamID(teamID), ArmyMap.LAYER.TEAM, x, y);
        worldMap.updateShoreTiles(gameContext, x, y, 1);
        worldMap.convertGraphicToTeam(gameContext, x, y);
        BorderSystem.updateBorder(gameContext, worldMap, x, y, 1);
    }
}

/**
 * Tries creating a list of tiles to be conquered based on entity size.
 * Emits the TILE_CAPTURED event.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @param {int} tileX 
 * @param {int} tileY 
 * @param {string} actorID 
 * @returns 
 */
ConquerSystem.tryConquering = function(gameContext, entity, tileX, tileY, actorID) {
    const { world } = gameContext;
    const { mapManager, eventBus } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const { teamID } = teamComponent;
    const endX = tileX + entity.config.dimX;
    const endY = tileY + entity.config.dimY;
    const tiles = [];

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            const isConquerable = isTileConquerable(gameContext, worldMap, j, i, teamID);

            if(isConquerable) {
                tiles.push(j, i);
            }
        }
    }

    if(tiles.length !== 0) {
        eventBus.emit(GameEvent.TYPE.TILE_CAPTURE, {
            "actorID": actorID,
            "teamID": teamID,
            "count": tiles.length / 2,
            "tiles": tiles,
        });
    }
}