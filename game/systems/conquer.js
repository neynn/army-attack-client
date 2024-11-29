import { Autotiler } from "../../source/tile/autotiler.js";
import { TeamSystem } from "./team.js";

export const ConquerSystem = function() {}

ConquerSystem.convertTileGraphics = function(gameContext, tileX, tileY, teamID) {
    const { mapManager, tileManager } = gameContext;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const layerTypes = gameContext.getConfig("layerTypes");
    const convertableLayerTypes = gameContext.getConfig("convertableLayerTypes");
    const tileConversions = gameContext.getConfig("tileConversions");

    for(const convertableTypeID in convertableLayerTypes) {
        const { layerType } = convertableLayerTypes[convertableTypeID];
        const { layerID } = layerTypes[layerType];
        
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

    return true;
}

ConquerSystem.updateBorder = function(gameContext, tileX, tileY) {
    const { mapManager, tileManager, controllerManager } = gameContext;
    const settings = gameContext.getConfig("settings");
    const controller = controllerManager.getController("neyn"); //TODO <-- Set player controller as main?

    if(!settings.drawBorder) {
        return false;
    }

    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const tileTypes = gameContext.getConfig("tileTypes");
    const layerTypes = gameContext.getConfig("layerTypes");
    const teamLayerID = layerTypes.team.layerID;
    const typeLayerID = layerTypes.type.layerID;
    const borderLayerID = layerTypes.border.layerID;
    const centerTypeID = activeMap.getTile(typeLayerID, tileX, tileY);
    const centerTeamID = activeMap.getTile(teamLayerID, tileX, tileY);
    const centerType = tileTypes[centerTypeID];

    if(!centerType || !centerType.hasBorder) {
        return false;
    }

    if(!TeamSystem.isTeamFriendly(gameContext, controller, centerTeamID)) {
        return false;
    }

    const autoIndex = Autotiler.autotile8Bits(tileX, tileY, (center, neighbor) => {
        const neighborTeamID = activeMap.getTile(teamLayerID, neighbor.x, neighbor.y);

        if(neighborTeamID !== centerTeamID) {
            return 0;
        }

        const neighborTypeID = activeMap.getTile(typeLayerID, neighbor.x, neighbor.y);
        const neighborType = tileTypes[neighborTypeID];

        if(!neighborType || !neighborType.hasBorder) {
            return 0; 
        }

        return 1;
    });

    const autotilerTypes = gameContext.getConfig("autotilerTypes");
    const borderAutotilerID = autotilerTypes.border.autotilerID;
    const tileID = tileManager.getAutotilerID(borderAutotilerID, autoIndex);

    activeMap.placeTile(tileID, borderLayerID, tileX, tileY);
}