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

ArmyMap.LAYER_TYPE = {
    GROUND: "ground",
    DECORATION: "decoration",
    BORDER: "border",
    CLOUD: "cloud",
    TYPE: "type",
    TEAM: "team"
};

ArmyMap.CONVERTABLE_LAYER = {
    GROUND: "ground",
    DECORATION: "decoration"
};

ArmyMap.BORDER_RANGE = {
    LOAD: 0,
    CAPTURE: 1
};

ArmyMap.prototype = Object.create(WorldMap.prototype);
ArmyMap.prototype.constructor = ArmyMap;

ArmyMap.prototype.conquer = function(gameContext, tileX, tileY, teamName) {
    const { world } = gameContext;
    const tileTeamID = this.getTile(ArmyMap.LAYER_TYPE.TEAM, tileX, tileY);
    const teamMapping = world.getConfig("TeamTypeMapping");
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamName, teamMapping[tileTeamID]);

    if(!isEnemy) {
        return;
    }

    const teamTypes = world.getConfig("TeamType");
    const worldID = teamTypes[teamName].worldID;

    this.placeTile(worldID, ArmyMap.LAYER_TYPE.TEAM, tileX, tileY);
    this.convertGraphics(gameContext, tileX, tileY, teamName);
    this.updateBorder(gameContext, tileX, tileY, ArmyMap.BORDER_RANGE.CAPTURE);
}

ArmyMap.prototype.reloadGraphics = function(gameContext) {
    const { world } = gameContext;
    const teamMapping = world.getConfig("TeamTypeMapping");

    this.updateTiles((index, tileX, tileY) => {
        const teamID = this.getTile(ArmyMap.LAYER_TYPE.TEAM, tileX, tileY);
        const teamName = teamMapping[teamID];

        this.updateBorder(gameContext, tileX, tileY, ArmyMap.BORDER_RANGE.LOAD);
        this.convertGraphics(gameContext, tileX, tileY, teamName);
    });
}

ArmyMap.prototype.convertGraphics = function(gameContext, tileX, tileY, teamName) {
    const { world, tileManager } = gameContext;
    const tileConversions = world.getConfig("TileTeamConversion");

    for(const key in ArmyMap.CONVERTABLE_LAYER) {
        const layerID = ArmyMap.CONVERTABLE_LAYER[key];
        const tileID = this.getTile(layerID, tileX, tileY);
        const conversion = tileConversions[tileID];

        if(conversion) {
            const convertedTileID = conversion[teamName];

            if(tileManager.hasTileMeta(convertedTileID)) {
                this.placeTile(convertedTileID, layerID, tileX, tileY);
            }
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
    const tileTypes = world.getConfig("TileType");

    const startX = tileX - range;
    const startY = tileY - range;
    const endX = tileX + range;
    const endY = tileY + range;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const centerTypeID = this.getTile(ArmyMap.LAYER_TYPE.TYPE, j, i);
            const centerType = tileTypes[centerTypeID];
        
            if(!centerType || !centerType.hasBorder) {
                continue;
            }

            const centerTeamID = this.getTile(ArmyMap.LAYER_TYPE.TEAM, j, i);
            const isEnemy = AllianceSystem.isEnemy(gameContext, controllerFocus.teamID, teamMapping[centerTeamID]);

            if(isEnemy) {
                continue;
            }

            const nextIndex = Autotiler.autotile8Bits(j, i, (x, y) => {
                const neighborTypeID = this.getTile(ArmyMap.LAYER_TYPE.TYPE, x, y);
                const neighborType = tileTypes[neighborTypeID];
        
                if(!neighborType || !neighborType.hasBorder) {
                    return Autotiler.RESPONSE.INVALID;
                }

                const neighborTeamID = this.getTile(ArmyMap.LAYER_TYPE.TEAM, x, y);
                const isEnemy = AllianceSystem.isEnemy(gameContext, teamMapping[centerTeamID], teamMapping[neighborTeamID]);

                if(isEnemy) {
                    return Autotiler.RESPONSE.INVALID;
                }
    
                return Autotiler.RESPONSE.VALID;
            });

            const tileID = tileManager.getAutotilerID(ArmyMap.AUTOTILER.BORDER, nextIndex);

            this.placeTile(tileID, ArmyMap.LAYER_TYPE.BORDER, j, i);
        }
    }
}