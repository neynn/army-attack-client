import { Autotiler } from "../../source/tile/autotiler.js";
import { WorldMap } from "../../source/map/worldMap.js";
import { AllianceSystem } from "../systems/alliance.js";
import { TileManager } from "../../source/tile/tileManager.js";

export const ArmyMap = function() {
    WorldMap.call(this, null);
}

ArmyMap.TEAM_TO_WORLD = {
    "Crimson": 0,
    "Allies": 1,
    "Neutral": 2,
    "Wrath": 3
};

ArmyMap.TEAM_TYPE = {
    0: "Crimson",
    1: "Allies",
    2: "Neutral",
    3: "Wrath"
};

ArmyMap.TILE_TYPE = {
    GROUND: 0,
    MOUNTAIN: 1,
    SEA: 2,
    DESERT_SHORE: 3
};

ArmyMap.AUTOTILER = {
    CLOUD: "cloud",
    BORDER: "border",
    RANGE: "range",
    DESERT_SHORE: "shore"
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

ArmyMap.UPDATE_RANGE = {
    LOAD: 0,
    CAPTURE: 1
};

ArmyMap.prototype = Object.create(WorldMap.prototype);
ArmyMap.prototype.constructor = ArmyMap;

ArmyMap.prototype.reloadGraphics = function(gameContext) {
    this.updateTiles((index, tileX, tileY) => {
        this.updateAutotiler(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.LOAD);
        this.updateBorder(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.LOAD);
        this.convertGraphics(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.LOAD);
    });
}

ArmyMap.prototype.conquer = function(gameContext, tileX, tileY, teamName) {
    const teamID = this.getTile(ArmyMap.LAYER_TYPE.TEAM, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamName, ArmyMap.TEAM_TYPE[teamID]);

    if(!isEnemy) {
        return;
    }

    this.placeTile(ArmyMap.TEAM_TO_WORLD[teamName], ArmyMap.LAYER_TYPE.TEAM, tileX, tileY);
    this.updateAutotiler(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
    this.autoForm(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
    this.updateBorder(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
    this.convertGraphics(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
}

ArmyMap.prototype.autoForm = function(gameContext, centerX, centerY, range) {
    const { world, tileManager } = gameContext;
    const formConditions = world.getConfig("TileFormCondition");
    const teamID = this.getTile(ArmyMap.LAYER_TYPE.TEAM, centerX, centerY);

    this.updateArea(centerX, centerY, range, (index, tileX, tileY) => {
        const nextTypeID = this.getTile(ArmyMap.LAYER_TYPE.TYPE, tileX, tileY);

        switch(nextTypeID) {
            case ArmyMap.TILE_TYPE.DESERT_SHORE: {
                const currentGroundID = this.getTile(ArmyMap.LAYER_TYPE.GROUND, tileX, tileY);
                const currentGroundMeta = tileManager.getTileMeta(currentGroundID);

                if(!currentGroundMeta) {
                    return;
                }

                const { set, animation } = currentGroundMeta;
                const setForm = formConditions[set];

                if(!setForm) {
                    return;
                }

                const animationForm = setForm[animation];

                if(!animationForm) {
                    return;
                }

                for(let i = 0; i < 3; i++) {
                    for(let j = 0; j < 3; j++) {
                        const index = i * 3 + j;

                        if(animationForm[index] === 1) {
                            const checkX = tileX + (j - 1);
                            const checkY = tileY + (i - 1);
                            const checkTeamID = this.getTile(ArmyMap.LAYER_TYPE.TEAM, checkX, checkY);
                            
                            if(checkTeamID !== teamID) {
                                return;
                            }
                        }
                    }
                }

                this.placeTile(teamID, ArmyMap.LAYER_TYPE.TEAM, tileX, tileY);
                break;
            }
        }
    });
}

ArmyMap.prototype.autotileDesertShore = function(gameContext, tileX, tileY) {
    const { tileManager } = gameContext;

    const index = Autotiler.autotile8Bits(tileX, tileY, (x, y) => {
        const nextTypeID = this.getTile(ArmyMap.LAYER_TYPE.TYPE, x, y);

        if(nextTypeID === ArmyMap.TILE_TYPE.DESERT_SHORE) {
            return Autotiler.RESPONSE.VALID;
        }

        return Autotiler.RESPONSE.INVALID;
    });

    const tileID = tileManager.getAutotilerID(ArmyMap.AUTOTILER.DESERT_SHORE, Autotiler.VALUES_8[index]);
    
    this.placeTile(tileID, ArmyMap.LAYER_TYPE.GROUND, tileX, tileY);
}

ArmyMap.prototype.updateAutotiler = function(gameContext, centerX, centerY, range) {
    this.updateArea(centerX, centerY, range, (index, tileX, tileY) => {
        const typeID = this.getTile(ArmyMap.LAYER_TYPE.TYPE, tileX, tileY);

        switch(typeID) {
            case ArmyMap.TILE_TYPE.DESERT_SHORE: {
                this.autotileDesertShore(gameContext, tileX, tileY);
                break;
            }
        }
    });
}

ArmyMap.prototype.convertGraphics = function(gameContext, centerX, centerY, range) {
    const { world, tileManager } = gameContext;
    const tileConversions = world.getConfig("TileTeamConversion");

    this.updateArea(centerX, centerY, range, (index, tileX, tileY) => {
        for(const key in ArmyMap.CONVERTABLE_LAYER) {
            const layerID = ArmyMap.CONVERTABLE_LAYER[key];
            const tileID = this.getTile(layerID, tileX, tileY);
            const conversion = tileConversions[tileID];
    
            if(conversion) {
                const teamID = this.getTile(ArmyMap.LAYER_TYPE.TEAM, tileX, tileY);
                const teamName = ArmyMap.TEAM_TYPE[teamID];
                const convertedTileID = conversion[teamName];
    
                if(tileManager.hasTileMeta(convertedTileID)) {
                    this.placeTile(convertedTileID, layerID, tileX, tileY);
                }
            }
        }
    });
}

ArmyMap.prototype.updateBorder = function(gameContext, centerX, centerY, range) {
    const { tileManager, world } = gameContext;
    const { controllerManager } = world;
    const settings = world.getConfig("Settings");

    if(!settings.drawBorder || this.meta.disableBorder) {
        return;
    }

    const player = controllerManager.getController(gameContext.player);

    if(!player || !player.teamID) {
        return;
    }

    const tileTypes = world.getConfig("TileType");

    this.updateArea(centerX, centerY, range, (index, tileX, tileY) => {
        const centerTypeID = this.getTile(ArmyMap.LAYER_TYPE.TYPE, tileX, tileY);
        const centerType = tileTypes[centerTypeID];
    
        if(!centerType || !centerType.hasBorder) {
            return;
        }

        const centerTeamID = this.getTile(ArmyMap.LAYER_TYPE.TEAM, tileX, tileY);
        const isEnemy = AllianceSystem.isEnemy(gameContext, player.teamID, ArmyMap.TEAM_TYPE[centerTeamID]);

        if(isEnemy) {
            return;
        }

        const nextIndex = Autotiler.autotile8Bits(tileX, tileY, (x, y) => {
            const neighborTypeID = this.getTile(ArmyMap.LAYER_TYPE.TYPE, x, y);
            const neighborType = tileTypes[neighborTypeID];
    
            if(!neighborType || !neighborType.hasBorder) {
                return Autotiler.RESPONSE.INVALID;
            }

            const neighborTeamID = this.getTile(ArmyMap.LAYER_TYPE.TEAM, x, y);
            const isEnemy = AllianceSystem.isEnemy(gameContext, ArmyMap.TEAM_TYPE[centerTeamID], ArmyMap.TEAM_TYPE[neighborTeamID]);

            if(isEnemy) {
                return Autotiler.RESPONSE.INVALID;
            }

            return Autotiler.RESPONSE.VALID;
        });

        const tileID = tileManager.getAutotilerID(ArmyMap.AUTOTILER.BORDER, Autotiler.VALUES_8[nextIndex]);

        this.placeTile(tileID, ArmyMap.LAYER_TYPE.BORDER, tileX, tileY);
    });
}