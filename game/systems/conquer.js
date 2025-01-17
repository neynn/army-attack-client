import { TeamComponent } from "../components/team.js";
import { AllianceSystem } from "./alliance.js";
import { MapSystem } from "./map.js";

export const ConquerSystem = function() {}

ConquerSystem.conquerTile = function(gameContext, tileX, tileY, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return;
    }

    const teamComponent = entity.getComponent(TeamComponent);
    const layerTypes = world.getConfig("LayerTypes");
    const teamMapping = world.getConfig("TeamTypesMapping");
    const teamLayerID = layerTypes["Team"].layerID;
    const tileTeamID = activeMap.getTile(teamLayerID, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamComponent.teamID, teamMapping[tileTeamID]);

    if(!isEnemy) {
        return;
    }

    const BORDER_RANGE = 1;
    const teamTypes = world.getConfig("TeamTypes");
    const worldID = teamTypes[teamComponent.teamID].worldID;

    activeMap.placeTile(worldID, teamLayerID, tileX, tileY);
    ConquerSystem.convertTileGraphics(gameContext, tileX, tileY, worldID);
    MapSystem.updateBorder(gameContext, tileX, tileY, BORDER_RANGE);
}

ConquerSystem.convertTileGraphics = function(gameContext, tileX, tileY, teamID) {
    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return;
    }

    const layerTypes = world.getConfig("LayerTypes");
    const tileConversions = world.getConfig("TileConversions");

    for(const layerTypeID in layerTypes) {
        const layerType = layerTypes[layerTypeID];
        const { layerID, isConvertable } = layerType;

        if(!isConvertable) {
            continue;
        }

        const tileID = activeMap.getTile(layerID, tileX, tileY);
        const conversion = tileConversions[tileID];

        if(!conversion) {
            continue;
        }

        const convertedTileID = conversion[teamID];

        if(!tileManager.hasTileMeta(convertedTileID)) {
            continue;
        }

        activeMap.placeTile(convertedTileID, layerID, tileX, tileY);
    }
}