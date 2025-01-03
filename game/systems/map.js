import { MapParser } from "../../source/map/mapParser.js";

import { CAMERA_TYPES } from "../enums.js";

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