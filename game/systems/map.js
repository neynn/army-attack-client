import { MapParser } from "../../source/map/mapParser.js";
import { Autotiler } from "../../source/tile/autotiler.js";

import { CAMERA_TYPES } from "../enums.js";
import { ConquerSystem } from "./conquer.js";
import { AllianceSystem } from "./alliance.js";

export const MapSystem = function() {}

MapSystem.loadEmptyMapByData = function(gameContext, mapID, mapData) {
    const { world } = gameContext;
    const { layers, meta } = mapData;
    const worldMap = MapParser.parseMap2DEmpty(mapID, layers, meta);

    world.loadMap(mapID, worldMap);
    MapSystem.initializeMap(gameContext, worldMap);

    return worldMap;
}

MapSystem.loadMapByID = async function(gameContext, mapID) {
    const { world } = gameContext;
    const worldMap = await world.parseMap(mapID, MapParser.parseMap2D);

    if(!worldMap) {
        return null;
    }

    world.loadMap(mapID, worldMap);
    MapSystem.initializeMap(gameContext, worldMap);

    return worldMap;
}

MapSystem.loadMapByData = function(gameContext, mapID, mapData) {
    const { world } = gameContext;
    const { layers, meta } = mapData;
    const worldMap = MapParser.parseMap2D(mapID, layers, meta);

    world.loadMap(mapID, worldMap);
    MapSystem.initializeMap(gameContext, worldMap);

    return worldMap;
}

MapSystem.initializeMap = function(gameContext, worldMap) {
    const { renderer, client } = gameContext;
    const { width, height, meta } = worldMap;
    const { music } = meta;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    if(camera) {
        camera.loadWorld(width, height);
        renderer.reloadCamera(CAMERA_TYPES.ARMY_CAMERA);
    }

    if(music) {
        client.musicPlayer.loadTrack(music);
        client.musicPlayer.swapTrack(music);
    }
}

MapSystem.reloadGraphics = function(gameContext, controller, mapID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getLoadedMap(mapID);

    if(!worldMap) {
        return;
    }

    const layerTypes = world.getConfig("LayerTypes");
    const teamLayerID = layerTypes["Team"].layerID;

    worldMap.updateTiles((index, tileX, tileY) => {
        const teamID = worldMap.getTile(teamLayerID, tileX, tileY);
        
        MapSystem.updateBorder(gameContext, tileX, tileY, 0, controller.teamID);
        ConquerSystem.convertTileGraphics(gameContext, tileX, tileY, teamID);
    });
}

MapSystem.updateBorder = function(gameContext, tileX, tileY, range = 0, teamID) {
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
            const alliance = AllianceSystem.getAlliance(gameContext, teamID, teamMapping[centerTeamID]);

            if(alliance.isEnemy) {
                continue;
            }

            const autoIndex = Autotiler.autotile8Bits(j, i, (center, neighbor) => {
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

            const tileID = tileManager.getAutotilerID(borderAutotilerID, autoIndex);

            activeMap.placeTile(tileID, borderLayerID, j, i);
        }
    }
}