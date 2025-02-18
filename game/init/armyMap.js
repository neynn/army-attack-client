import { Autotiler } from "../../source/tile/autotiler.js";
import { CAMERA_TYPES } from "../enums.js";
import { WorldMap } from "../../source/map/worldMap.js";
import { AllianceSystem } from "../systems/alliance.js";

export const ArmyMap = function() {
    WorldMap.call(this, null);
}

ArmyMap.AUTOTILER = {
    CLOUD: "cloud",
    BORDER: "border",
    RANGE: "range"
};

ArmyMap.prototype = Object.create(WorldMap.prototype);
ArmyMap.prototype.constructor = ArmyMap;

ArmyMap.prototype.reloadGraphics = function(gameContext) {
    const { world } = gameContext;
    const layerTypes = world.getConfig("LayerType");
    const teamLayerID = layerTypes["Team"].layerID;
    
    this.updateTiles((index, tileX, tileY) => {
        const teamID = this.getTile(teamLayerID, tileX, tileY);
        
        this.updateBorder(gameContext, tileX, tileY, 0);
        this.convertGraphics(gameContext, tileX, tileY, teamID);
    });
}

ArmyMap.prototype.convertGraphics = function(gameContext, tileX, tileY, teamID) {
    const { world, tileManager } = gameContext;
    const layerTypes = world.getConfig("LayerType");
    const teamMapping = world.getConfig("TeamTypeMapping");
    const tileConversions = world.getConfig("TileTeamConversion");
    const teamTypeID = teamMapping[teamID];

    for(const layerTypeID in layerTypes) {
        const layerType = layerTypes[layerTypeID];
        const { layerID, isConvertable } = layerType;

        if(!isConvertable) {
            continue;
        }

        const tileID = this.getTile(layerID, tileX, tileY);
        const conversion = tileConversions[tileID];

        if(!conversion) {
            continue;
        }

        const convertedTileID = conversion[teamTypeID];

        if(tileManager.hasTileMeta(convertedTileID)) {
            this.placeTile(convertedTileID, layerID, tileX, tileY);
        }
    }
}

ArmyMap.prototype.updateBorder = function(gameContext, tileX, tileY, range) {
    const { tileManager, world } = gameContext;
    const settings = world.getConfig("Settings");

    if(!settings.drawBorder || this.meta.disableBorder) {
        return;
    }

    const controllerFocus = gameContext.getCameraControllerFocus(CAMERA_TYPES.ARMY_CAMERA);

    if(!controllerFocus || !controllerFocus.teamID) {
        return;
    }

    const teamMapping = world.getConfig("TeamTypeMapping");
    const layerTypes = world.getConfig("LayerType");
    const tileTypes = world.getConfig("TileType");

    const typeLayerID = layerTypes["Type"].layerID;
    const borderLayerID = layerTypes["Border"].layerID;
    const teamLayerID = layerTypes["Team"].layerID;

    const startX = tileX - range;
    const startY = tileY - range;
    const endX = tileX + range;
    const endY = tileY + range;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const centerTypeID = this.getTile(typeLayerID, j, i);
            const centerType = tileTypes[centerTypeID];
        
            if(!centerType || !centerType.hasBorder) {
                continue;
            }

            const centerTeamID = this.getTile(teamLayerID, j, i);
            const isEnemy = AllianceSystem.isEnemy(gameContext, controllerFocus.teamID, teamMapping[centerTeamID]);

            if(isEnemy) {
                continue;
            }

            const nextIndex = Autotiler.autotile8Bits(j, i, (x, y) => {
                const neighborTypeID = this.getTile(typeLayerID, x, y);
                const neighborType = tileTypes[neighborTypeID];
        
                if(!neighborType || !neighborType.hasBorder) {
                    return Autotiler.RESPONSE.INVALID;
                }

                const neighborTeamID = this.getTile(teamLayerID, x, y);
                const isEnemy = AllianceSystem.isEnemy(gameContext, teamMapping[centerTeamID], teamMapping[neighborTeamID]);

                if(isEnemy) {
                    return Autotiler.RESPONSE.INVALID;
                }
    
                return Autotiler.RESPONSE.VALID;
            });

            const tileID = tileManager.getAutotilerID(ArmyMap.AUTOTILER.BORDER, nextIndex);

            this.placeTile(tileID, borderLayerID, j, i);
        }
    }
}