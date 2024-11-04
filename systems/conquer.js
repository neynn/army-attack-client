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
        const tileID = activeMap.getLayerTile(layerID, tileX, tileY);

        if(tileID === null) {
            continue;
        }

        const conversion = tileConversions[tileID];
        const nextTileID = conversion[teamID];

        if(!tileManager.hasTileMeta(nextTileID)) {
            continue;
        }

        activeMap.placeTile(nextTileID, layerID, tileX, tileY);
    }

    return true;
}

ConquerSystem.updateBorder = function(gameContext, tileX, tileY) {
    const { mapLoader, tileManager, controller } = gameContext;
    const settings = gameContext.getConfig("settings");
    const activeMap = mapLoader.getActiveMap();

    if(!settings.drawBorder) {
        return false;
    }

    if(!activeMap) {
        return false;
    }

    const centerTile = activeMap.getTile(tileX, tileY);

    if(!centerTile || !centerTile.hasBorder) {
        return false;
    }

    if(!TeamSystem.isTileFriendly(gameContext, controller, centerTile.team)) {
        return false;
    }

    const directions = Autotiler.getDirections(tileX, tileY);

    const autoIndex = Autotiler.autotile8Bits(directions, (center, neighbor) => {
        const neighborTile = activeMap.getTile(neighbor.x, neighbor.y);

        if(!neighborTile || !neighborTile.hasBorder) {
            return false;
        }

        return neighborTile.team === centerTile.team;
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