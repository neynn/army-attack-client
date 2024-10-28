import { Autotiler } from "../source/tile/autotiler.js";
import { TeamSystem } from "./team.js";

export const ConquerSystem = function() {
    this.id = "ConquerSystem";
}

ConquerSystem.convertTileGraphics = function(gameContext, tileX, tileY, teamID) {
    const { mapLoader } = gameContext;
    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const settings = gameContext.getConfig("settings");
    const tileConversions = gameContext.getConfig("tileConversions");

    for(const layerID in settings.convertableLayers) {
        const graphics = activeMap.getLayerTile(layerID, tileX, tileY);

        if(graphics === null) {
            continue;
        }

        const [setID, animationID] = graphics;
        const conversionSet = tileConversions[setID];

        if(!conversionSet) {
            continue; 
        }

        const conversionAnimation = conversionSet[animationID];

        if(!conversionAnimation) {
            continue;
        }

        const conversion = conversionAnimation[teamID];

        if(!conversion || !Array.isArray(conversion)) {
            continue;
        }

        activeMap.placeTile(conversion, layerID, tileX, tileY);
    }

    return true;
}

ConquerSystem.updateBorder = function(gameContext, tileX, tileY) {
    const { mapLoader, spriteManager, controller } = gameContext;
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
    const border = spriteManager.tileSprites["border"];
    const borderValue = border.autoTiler.values[autoIndex];
    
    if(borderValue) {
        const animationID = borderValue.type;

        if(animationID) {
            activeMap.placeTile(["border", animationID], "border", tileX, tileY);
        }
    }
}