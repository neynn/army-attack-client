import { Autotiler } from "../../source/tile/autotiler.js";

import { TeamComponent } from "../components/team.js";
import { TeamSystem } from "./team.js";

export const ConquerSystem = function() {}

ConquerSystem.convertTileGraphics = function(gameContext, tileX, tileY, teamID) {
    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return;
    }

    const layerTypes = world.getConfig("layerTypes");
    const convertableLayerTypes = world.getConfig("convertableLayerTypes");
    const tileConversions = world.getConfig("tileConversions");

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
}

ConquerSystem.updateBorder = function(gameContext, tileX, tileY, teamID) {
    const { tileManager, world } = gameContext;
    const { mapManager } = world;
    const settings = world.getConfig("settings");

    if(!settings.drawBorder) {
        return;
    }

    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return;
    }

    const tileTypes = world.getConfig("tileTypes");
    const layerTypes = world.getConfig("layerTypes");
    const teamLayerID = layerTypes.team.layerID;
    const typeLayerID = layerTypes.type.layerID;
    const borderLayerID = layerTypes.border.layerID;
    const centerTypeID = activeMap.getTile(typeLayerID, tileX, tileY);
    const centerTeamID = activeMap.getTile(teamLayerID, tileX, tileY);
    const centerType = tileTypes[centerTypeID];

    if(!centerType || !centerType.hasBorder) {
        return;
    }

    if(!TeamSystem.isAllied(gameContext, teamID, centerTeamID)) {
        return;
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

    const autotilerTypes = world.getConfig("autotilerTypes");
    const borderAutotilerID = autotilerTypes.border.autotilerID;
    const tileID = tileManager.getAutotilerID(borderAutotilerID, autoIndex);

    activeMap.placeTile(tileID, borderLayerID, tileX, tileY);
}

ConquerSystem.reloadGraphics = function(gameContext, mapID) {
    const { world } = gameContext;
    const { mapManager, controllerManager } = world;
    const worldMap = mapManager.getLoadedMap(mapID);

    if(!worldMap) {
        return;
    }

    const controller = controllerManager.getController("neyn"); //TODO <-- Set player controller as main?
    const layerTypes = world.getConfig("layerTypes");
    const teamLayerID = layerTypes.team.layerID;
    const teamComponent = controller.getComponent(TeamComponent);

    worldMap.updateTiles((index, tileX, tileY) => {
        const teamID = worldMap.getTile(teamLayerID, tileX, tileY);
        
        ConquerSystem.updateBorder(gameContext, tileX, tileY, teamComponent.teamID);
        ConquerSystem.convertTileGraphics(gameContext, tileX, tileY, teamID);
    });
}