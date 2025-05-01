import { GAME_EVENT } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";

export const ConquerSystem = function() {}

ConquerSystem.conquer = function(gameContext, entity, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager, eventBus } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const typeID = worldMap.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);

    if(typeID !== ArmyMap.TILE_TYPE.GROUND) {
        return;
    }

    const teamID = worldMap.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamComponent.teamID, ArmyMap.TEAM_TYPE[teamID]);

    if(!isEnemy) {
        return;
    }

    worldMap.placeTile(ArmyMap.TEAM_TO_WORLD[teamComponent.teamID], ArmyMap.LAYER.TEAM, tileX, tileY);
    worldMap.updateShoreTiles(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
    worldMap.updateBorder(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
    worldMap.convertGraphicToTeam(gameContext, tileX, tileY);
    eventBus.emit(GAME_EVENT.TILE_CAPTURED, { "teamID": teamComponent.teamID, tileX, tileY });
}