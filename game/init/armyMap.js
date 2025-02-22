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
    SHORE: 3,
    DESERT_SHORE: 4
};

ArmyMap.AUTOTILER = {
    CLOUD: "cloud",
    BORDER: "border",
    RANGE: "range",
    DESERT_SHORE: "shore"
};

ArmyMap.LAYER = {
    GROUND: "ground",
    DECORATION: "decoration",
    BORDER: "border",
    CLOUD: "cloud",
    TYPE: "type",
    TEAM: "team"
};

ArmyMap.CONVERTABLE_LAYERS = [
    "ground",
    "decoration"
];

ArmyMap.UPDATE_RANGE = {
    LOAD: 0,
    CAPTURE: 1
};

ArmyMap.prototype = Object.create(WorldMap.prototype);
ArmyMap.prototype.constructor = ArmyMap;

ArmyMap.prototype.reload = function(gameContext) {
    const { world } = gameContext;
    const tileTypes = world.getConfig("TileType");

    for(let i = 0; i < this.height; i++) {
        for(let j = 0; j < this.width; j++) {
            const typeID = this.getTile(ArmyMap.LAYER.TYPE, j, i);
            const tileType = tileTypes[typeID];

            if(tileType.defaultTeam) {
                const teamID = ArmyMap.TEAM_TO_WORLD[tileType.defaultTeam];

                this.placeTile(teamID, ArmyMap.LAYER.TEAM, j, i);
            }

            this.updateAutotiler(gameContext, j, i, ArmyMap.UPDATE_RANGE.LOAD);
        }
    }

    for(let i = 0; i < this.height; i++) {
        for(let j = 0; j < this.width; j++) {
            this.autoFormShoreTiles(gameContext, j, i, ArmyMap.UPDATE_RANGE.CAPTURE);
            this.updateBorder(gameContext, j, i, ArmyMap.UPDATE_RANGE.LOAD);
            this.convertGraphicToTeam(gameContext, j, i);
        }
    }
}

ArmyMap.prototype.getAnimationForm = function(gameContext, tileID) {
    const { tileManager, world } = gameContext;
    const tileMeta = tileManager.getTileMeta(tileID);

    if(!tileMeta) {
        return null;
    }

    const formConditions = world.getConfig("TileFormCondition");
    const { set, animation } = tileMeta;
    const setForm = formConditions[set];

    if(!setForm) {
        return null;
    }

    const animationForm = setForm[animation];

    if(!animationForm) {
        return null;
    }

    return animationForm;
}

ArmyMap.prototype.conquer = function(gameContext, tileX, tileY, teamName) {
    const teamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamName, ArmyMap.TEAM_TYPE[teamID]);

    if(!isEnemy) {
        return;
    }

    this.placeTile(ArmyMap.TEAM_TO_WORLD[teamName], ArmyMap.LAYER.TEAM, tileX, tileY);
    //this.updateAutotiler(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
    this.autoFormShoreTiles(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
    this.updateBorder(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
    this.convertGraphicToTeam(gameContext, tileX, tileY);
}

ArmyMap.prototype.getConversionID = function(gameContext, tileID, teamID) {
    const { world } = gameContext;
    const tileConversions = world.getConfig("TileTeamConversion");
    const conversion = tileConversions[tileID];

    if(!conversion) {
        return TileManager.TILE_ID.EMPTY;
    }

    const convertedID = conversion[ArmyMap.TEAM_TYPE[teamID]];

    return convertedID;
}

ArmyMap.prototype.autoFormShoreTiles = function(gameContext, centerX, centerY, range) {
    const { tileManager } = gameContext;
    const teamID = this.getTile(ArmyMap.LAYER.TEAM, centerX, centerY);

    this.updateArea(centerX, centerY, range, (index, tileX, tileY) => {
        const typeID = this.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);

        switch(typeID) {
            case ArmyMap.TILE_TYPE.DESERT_SHORE: {
                const groundID = this.getTile(ArmyMap.LAYER.GROUND, tileX, tileY);
                const animationForm = this.getAnimationForm(gameContext, groundID);

                if(!animationForm) {
                    return;
                }

                //May God forgive me.
                for(let i = 0; i < animationForm.length; i++) {
                    if(animationForm[i] === 1) {
                        const row = Math.floor(i / 3);
                        const column = i % 3;
                        const checkX = tileX + (column - 1);
                        const checkY = tileY + (row - 1);
                        const checkTeamID = this.getTile(ArmyMap.LAYER.TEAM, checkX, checkY);
                            
                        if(checkTeamID !== teamID) {
                            return;
                        }
                    }
                }

                const conversionID = this.getConversionID(gameContext, groundID, teamID);
            
                if(tileManager.hasTileMeta(conversionID)) {
                    this.placeTile(conversionID, ArmyMap.LAYER.GROUND, tileX, tileY);
                }

                break;
            }
        }
    });
}

ArmyMap.prototype.autotileDesertShore = function(gameContext, tileX, tileY) {
    const { tileManager } = gameContext;

    const index = Autotiler.autotile8Bits(tileX, tileY, (x, y) => {
        const nextTypeID = this.getTile(ArmyMap.LAYER.TYPE, x, y);

        if(nextTypeID === ArmyMap.TILE_TYPE.DESERT_SHORE) {
            return Autotiler.RESPONSE.VALID;
        }

        return Autotiler.RESPONSE.INVALID;
    });

    const tileID = tileManager.getAutotilerID(ArmyMap.AUTOTILER.DESERT_SHORE, Autotiler.VALUES_8[index]);
    
    this.placeTile(tileID, ArmyMap.LAYER.GROUND, tileX, tileY);
}

ArmyMap.prototype.updateAutotiler = function(gameContext, centerX, centerY, range) {
    this.updateArea(centerX, centerY, range, (index, tileX, tileY) => {
        const typeID = this.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);

        switch(typeID) {
            case ArmyMap.TILE_TYPE.DESERT_SHORE: {
                this.autotileDesertShore(gameContext, tileX, tileY);
                break;
            }
        }
    });
}

ArmyMap.prototype.convertGraphicToTeam = function(gameContext, tileX, tileY) {
    const { tileManager } = gameContext;

    for(let i = 0; i < ArmyMap.CONVERTABLE_LAYERS.length; i++) {
        const layerID = ArmyMap.CONVERTABLE_LAYERS[i];
        const tileID = this.getTile(layerID, tileX, tileY);
        const teamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
        const conversionID = this.getConversionID(gameContext, tileID, teamID);

        if(tileManager.hasTileMeta(conversionID)) {
            this.placeTile(conversionID, layerID, tileX, tileY);
        }
    }
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
        const centerTypeID = this.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
        const centerType = tileTypes[centerTypeID];
    
        if(!centerType || !centerType.hasBorder) {
            return;
        }

        const centerTeamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
        const isEnemy = AllianceSystem.isEnemy(gameContext, player.teamID, ArmyMap.TEAM_TYPE[centerTeamID]);

        if(isEnemy) {
            return;
        }

        const nextIndex = Autotiler.autotile8Bits(tileX, tileY, (x, y) => {
            const neighborTypeID = this.getTile(ArmyMap.LAYER.TYPE, x, y);
            const neighborType = tileTypes[neighborTypeID];
    
            if(!neighborType || !neighborType.hasBorder) {
                return Autotiler.RESPONSE.INVALID;
            }

            const neighborTeamID = this.getTile(ArmyMap.LAYER.TEAM, x, y);
            const isEnemy = AllianceSystem.isEnemy(gameContext, ArmyMap.TEAM_TYPE[centerTeamID], ArmyMap.TEAM_TYPE[neighborTeamID]);

            if(isEnemy) {
                return Autotiler.RESPONSE.INVALID;
            }

            return Autotiler.RESPONSE.VALID;
        });

        const tileID = tileManager.getAutotilerID(ArmyMap.AUTOTILER.BORDER, Autotiler.VALUES_8[nextIndex]);

        this.placeTile(tileID, ArmyMap.LAYER.BORDER, tileX, tileY);
    });
}