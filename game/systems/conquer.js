import { GameEvent } from "../gameEvent.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";
import { BorderSystem } from "./border.js";

export const ConquerSystem = function() {}

const isTileConquerable = function(gameContext, tileX, tileY, captureTeamID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return false;
    }

    const typeID = worldMap.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
    const tileType = gameContext.tileTypes[typeID];

    if(!tileType || !tileType.isConquerable) {
        return false;
    }

    const teamID = worldMap.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, captureTeamID, ArmyMap.TEAM_TYPE[teamID]);

    return isEnemy; 
}

ConquerSystem.conquer = function(gameContext, entity, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager, eventBus } = world;

    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const { teamID } = teamComponent;

    const isConquerable = isTileConquerable(gameContext, tileX, tileY, teamID);

    if(!isConquerable) {
        return;
    }

    const worldMap = mapManager.getActiveMap();
    
    worldMap.placeTile(gameContext.getTeamID(teamID), ArmyMap.LAYER.TEAM, tileX, tileY);
    worldMap.updateShoreTiles(gameContext, tileX, tileY, 1);
    worldMap.convertGraphicToTeam(gameContext, tileX, tileY);
    BorderSystem.updateBorder(gameContext, worldMap, tileX, tileY, 1);

    eventBus.emit(GameEvent.TYPE.TILE_CAPTURED, { "teamID": teamID, tileX, tileY });
}