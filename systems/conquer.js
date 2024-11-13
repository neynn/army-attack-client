import { Autotiler } from "../source/tile/autotiler.js";
import { TeamSystem } from "./team.js";

export const ConquerSystem = function() {}

ConquerSystem.convertTileGraphics = function(gameContext, tileX, tileY, teamID) {
    const { mapLoader, tileManager } = gameContext;
    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const settings = gameContext.getConfig("settings");
    const tileConversions = gameContext.getConfig("tileConversions");

    for(const layerID in settings.convertableLayers) {
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
    const { mapLoader, tileManager, controllerManager } = gameContext;
    const settings = gameContext.getConfig("settings");
    const tileTypes = gameContext.getConfig("tileTypes");
    const controller = controllerManager.getController("neyn"); //TODOOOOOO!!!

    if(!settings.drawBorder) {
        return false;
    }

    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const centerTypeID = activeMap.getTile(settings.typeLayerID, tileX, tileY);
    const centerTeamID = activeMap.getTile(settings.teamLayerID, tileX, tileY);
    const centerType = tileTypes[centerTypeID];

    if(!centerType || !centerType.hasBorder) {
        return false;
    }

    if(!TeamSystem.isTeamFriendly(gameContext, controller, centerTeamID)) {
        return false;
    }

    const autoIndex = Autotiler.autotile8Bits(tileX, tileY, (center, neighbor) => {
        const neighborTeamID = activeMap.getTile(settings.teamLayerID, neighbor.x, neighbor.y);

        if(neighborTeamID !== centerTeamID) {
            return 0;
        }

        const neighborTypeID = activeMap.getTile(settings.typeLayerID, neighbor.x, neighbor.y);
        const neighborType = tileTypes[neighborTypeID];

        if(!neighborType || !neighborType.hasBorder) {
            return 0; 
        }

        return 1;
    });

    //HÄCK
    const borderAutoTiler = tileManager.tileMeta.autotilers["border"];
    const borderConfig = borderAutoTiler.values[autoIndex];
    
    if(borderConfig) {
        const { set, animation } = borderConfig;
        const tileID = tileManager.getTileID(set, animation);

        activeMap.placeTile(tileID, "border", tileX, tileY);
    }
}