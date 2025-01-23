import { Autotiler } from "../../source/tile/autotiler.js";

import { CAMERA_TYPES } from "../enums.js";
import { ConquerSystem } from "./conquer.js";
import { AllianceSystem } from "./alliance.js";

export const MapSystem = function() {}

MapSystem.reloadGraphics = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const BORDER_RANGE = 0;
    const layerTypes = world.getConfig("LayerTypes");
    const teamLayerID = layerTypes["Team"].layerID;

    worldMap.updateTiles((index, tileX, tileY) => {
        const teamID = worldMap.getTile(teamLayerID, tileX, tileY);
        
        MapSystem.updateBorder(gameContext, tileX, tileY, BORDER_RANGE);
        ConquerSystem.convertTileGraphics(gameContext, tileX, tileY, teamID);
    });
}

MapSystem.updateBorder = function(gameContext, tileX, tileY, range = 0) {
    const { tileManager, world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();
    const settings = world.getConfig("Settings");

    if(!settings.drawBorder || !activeMap || activeMap.meta.disableBorder) {
        return;
    }

    const controllerFocus = gameContext.getCameraControllerFocus(CAMERA_TYPES.ARMY_CAMERA);

    if(!controllerFocus || !controllerFocus.teamID) {
        return;
    }

    const teamMapping = world.getConfig("TeamTypesMapping");
    const autotilerTypes = world.getConfig("AutotilerTypes");
    const layerTypes = world.getConfig("LayerTypes");
    const tileTypes = world.getConfig("TileTypes");

    const typeLayerID = layerTypes["Type"].layerID;
    const borderLayerID = layerTypes["Border"].layerID;
    const teamLayerID = layerTypes["Team"].layerID;
    const borderAutotilerID = autotilerTypes["Border"].autotilerID;

    const startX = tileX - range;
    const startY = tileY - range;
    const endX = tileX + range;
    const endY = tileY + range;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const centerTypeID = activeMap.getTile(typeLayerID, j, i);
            const centerType = tileTypes[centerTypeID];
        
            if(!centerType || !centerType.hasBorder) {
                continue;
            }

            const centerTeamID = activeMap.getTile(teamLayerID, j, i);
            const isEnemy = AllianceSystem.isEnemy(gameContext, controllerFocus.teamID, teamMapping[centerTeamID]);

            if(isEnemy) {
                continue;
            }

            const nextIndex = Autotiler.autotile8Bits(j, i, (next) => {
                const { x, y } = next;
                const neighborTypeID = activeMap.getTile(typeLayerID, x, y);
                const neighborType = tileTypes[neighborTypeID];
        
                if(!neighborType || !neighborType.hasBorder) {
                    return 0; 
                }

                const neighborTeamID = activeMap.getTile(teamLayerID, x, y);
                const isEnemy = AllianceSystem.isEnemy(gameContext, teamMapping[centerTeamID], teamMapping[neighborTeamID]);

                if(isEnemy) {
                    return 0;
                }
    
                return 1;
            });

            const tileID = tileManager.getAutotilerID(borderAutotilerID, nextIndex);

            activeMap.placeTile(tileID, borderLayerID, j, i);
        }
    }
}