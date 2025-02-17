import { ArmyEntity } from "../init/armyEntity.js";
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
    const layerTypes = world.getConfig("LayerType");
    const teamMapping = world.getConfig("TeamTypeMapping");
    const teamLayerID = layerTypes["Team"].layerID;
    const tileTeamID = activeMap.getTile(teamLayerID, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamComponent.teamID, teamMapping[tileTeamID]);

    if(!isEnemy) {
        return;
    }

    const BORDER_RANGE = 1;
    const teamTypes = world.getConfig("TeamType");
    const worldID = teamTypes[teamComponent.teamID].worldID;

    activeMap.placeTile(worldID, teamLayerID, tileX, tileY);
    activeMap.convertGraphics(gameContext, tileX, tileY, worldID);
    activeMap.updateBorder(gameContext, tileX, tileY, BORDER_RANGE);
}