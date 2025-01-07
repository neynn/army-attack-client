import { Autotiler } from "../../source/tile/autotiler.js";

import { TeamComponent } from "../components/team.js";
import { AllianceSystem } from "./alliance.js";

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
    const teamTypes = world.getConfig("TeamTypes");
    const teamLayerID = layerTypes["Team"].layerID;
    const worldID = teamTypes[teamComponent.teamID].worldID;

    ConquerSystem.convertTileGraphics(gameContext, tileX, tileY, worldID);
    activeMap.placeTile(worldID, teamLayerID, tileX, tileY);

    const startX = tileX - 1;
    const startY = tileY - 1;
    const endX = tileX + 1;
    const endY = tileY + 1;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            ConquerSystem.updateBorder(gameContext, j, i, teamComponent.teamID);
        }
    }
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

ConquerSystem.updateBorder = function(gameContext, tileX, tileY, teamID) {
    const { tileManager, world } = gameContext;
    const settings = world.getConfig("Settings");

    if(!settings.drawBorder) {
        return;
    }

    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return;
    }

    const layerTypes = world.getConfig("LayerTypes");
    const tileTypes = world.getConfig("TileTypes");
    const typeLayerID = layerTypes["Type"].layerID;
    const borderLayerID = layerTypes["Border"].layerID;
    const centerTypeID = activeMap.getTile(typeLayerID, tileX, tileY);
    const centerType = tileTypes[centerTypeID];

    if(!centerType || !centerType.hasBorder) {
        return;
    }

    const teamLayerID = layerTypes["Team"].layerID;
    const teamMapping = world.getConfig("TeamTypesMapping");
    const centerTeamID = activeMap.getTile(teamLayerID, tileX, tileY);
    const alliance = AllianceSystem.getAlliance(gameContext, teamID, teamMapping[centerTeamID]);

    if(alliance.isEnemy) {
        return;
    }

    const autoIndex = Autotiler.autotile8Bits(tileX, tileY, (center, neighbor) => {
        const { x, y } = neighbor;
        const neighborTeamID = activeMap.getTile(teamLayerID, x, y);

        if(neighborTeamID !== centerTeamID) {
            return 0;
        }

        const neighborTypeID = activeMap.getTile(typeLayerID, x, y);
        const neighborType = tileTypes[neighborTypeID];

        if(!neighborType || !neighborType.hasBorder) {
            return 0; 
        }

        return 1;
    });

    const autotilerTypes = world.getConfig("AutotilerTypes");
    const borderAutotilerID = autotilerTypes["Border"].autotilerID;
    const tileID = tileManager.getAutotilerID(borderAutotilerID, autoIndex);

    activeMap.placeTile(tileID, borderLayerID, tileX, tileY);
}