import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";

export const ConquerSystem = function() {}

ConquerSystem.conquerTile = function(gameContext, tileX, tileY, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return;
    }

    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const teamMapping = world.getConfig("TeamTypeMapping");
    const tileTeamID = activeMap.getTile(ArmyMap.LAYER_TYPE.TEAM, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamComponent.teamID, teamMapping[tileTeamID]);

    if(!isEnemy) {
        return;
    }

    const BORDER_RANGE = 1;
    const teamTypes = world.getConfig("TeamType");
    const worldID = teamTypes[teamComponent.teamID].worldID;

    activeMap.placeTile(worldID, ArmyMap.LAYER_TYPE.TEAM, tileX, tileY);
    activeMap.convertGraphics(gameContext, tileX, tileY, worldID);
    activeMap.updateBorder(gameContext, tileX, tileY, BORDER_RANGE);
}