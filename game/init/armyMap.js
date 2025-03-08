import { Autotiler } from "../../source/tile/autotiler.js";
import { WorldMap } from "../../source/map/worldMap.js";
import { AllianceSystem } from "../systems/alliance.js";
import { TileManager } from "../../source/tile/tileManager.js";

export const ArmyMap = function() {
    WorldMap.call(this, null);

    this.music = null;
    this.type = ArmyMap.TYPE.NONE;
    this.flags = ArmyMap.FLAG.NONE;
}

ArmyMap.FLAG = {
    NONE: 0,
    ALLOW_PASSING: 1 << 0,
    ALLOW_BORDER: 1 << 1,
    ALLOW_DROPS: 1 << 2
};

ArmyMap.TYPE = {
    NONE: 0,
    VERSUS: 1,
    STORY: 2,
    STRIKE: 3,
    EMPTY_STORY: 4,
    EMPTY_VERSUS: 5
};

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
    SHORE: 3
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
    ArmyMap.LAYER.GROUND,
    ArmyMap.LAYER.DECORATION
];

ArmyMap.UPDATE_RANGE = {
    LOAD: 0,
    CAPTURE: 1
};

ArmyMap.prototype = Object.create(WorldMap.prototype);
ArmyMap.prototype.constructor = ArmyMap;

ArmyMap.prototype.saveFlags = function() {
    const flags = [];

    for(const flagID in ArmyMap.FLAG) {
        const flag = ArmyMap.FLAG[flagID];

        if((this.flags & flag) !== 0) {
            flags.push(flagID);
        }
    }

    return flags;
}

ArmyMap.prototype.loadMeta = function(meta) {
    if(!meta) {
        return;
    }

    const {
        flags = [],
        graphics = null,
        music = null
    } = meta;

    this.music = music;

    for(let i = 0; i < flags.length; i++) {
        const flagID = flags[i];
        const flag = ArmyMap.FLAG[flagID];
        
        if(flag) {
            this.flags |= flag;
        }
    }

    this.loadGraphics(graphics);
}

ArmyMap.prototype.reload = function(gameContext) {
    const tileTypes = gameContext.tileTypes;

    for(let i = 0; i < this.height; i++) {
        for(let j = 0; j < this.width; j++) {
            const typeID = this.getTile(ArmyMap.LAYER.TYPE, j, i);
            const tileType = tileTypes[typeID];
            const { defaultTeam } = tileType;

            if(defaultTeam) {
                const teamID = ArmyMap.TEAM_TO_WORLD[defaultTeam];

                this.placeTile(teamID, ArmyMap.LAYER.TEAM, j, i);
            }
        }
    }

    for(let i = 0; i < this.height; i++) {
        for(let j = 0; j < this.width; j++) {
            this.updateShoreTiles(gameContext, j, i, ArmyMap.UPDATE_RANGE.CAPTURE);
            this.updateBorder(gameContext, j, i, ArmyMap.UPDATE_RANGE.LOAD);
            this.convertGraphicToTeam(gameContext, j, i);
        }
    }
}

ArmyMap.prototype.getAnimationForm = function(gameContext, tileID) {
    const { tileManager } = gameContext;
    const { meta } = tileManager;
    const tileMeta = meta.getMeta(tileID);

    if(!tileMeta) {
        return null;
    }

    const { set, animation } = tileMeta;
    const setForm = gameContext.tileFormConditions[set];

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
    this.updateShoreTiles(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
    this.updateBorder(gameContext, tileX, tileY, ArmyMap.UPDATE_RANGE.CAPTURE);
    this.convertGraphicToTeam(gameContext, tileX, tileY);
}

ArmyMap.prototype.repaint = function(gameContext, centerX, centerY, layerID) {
    this.updateArea(centerX, centerY, 1, (index, tileX, tileY) => {
        const tileID = this.getTile(layerID, tileX, tileY);

        this.autotile(gameContext, tileX, tileY, tileID, layerID);
    });
}

ArmyMap.prototype.autotile = function(gameContext, centerX, centerY, tileID, layerID) {
    const { tileManager } = gameContext;
    const { meta } = tileManager; 
    const autotiler = meta.getAutotilerByTile(tileID);

    if(!autotiler) {
        return;
    }

    this.updateArea(centerX, centerY, 1, (index, tileX, tileY) => {
        const id = this.getTile(layerID, tileX, tileY);

        if(!autotiler.hasMember(id)) {
            return;
        }

        const responseID = autotiler.run(tileX, tileY, (x, y) => {
            const nextID = this.getTile(layerID, x, y);

            if(autotiler.hasMember(nextID) || nextID === null) {
                return Autotiler.RESPONSE.VALID;
            }

            return Autotiler.RESPONSE.INVALID;
        });

        if(responseID !== TileManager.TILE_ID.EMPTY) {
            this.placeTile(responseID, layerID, tileX, tileY);
        }
    });
}

ArmyMap.prototype.getConversionID = function(gameContext, tileID, teamID) {
    const teamConversions = gameContext.tileConversions[ArmyMap.TEAM_TYPE[teamID]];

    if(!teamConversions) {
        return TileManager.TILE_ID.EMPTY;
    }

    const convertedID = teamConversions[tileID];
    
    if(!convertedID) {
        return TileManager.TILE_ID.EMPTY;
    }

    return convertedID;
}

ArmyMap.prototype.updateShoreTiles = function(gameContext, centerX, centerY, range) {
    const { tileManager } = gameContext;
    const { meta } = tileManager;
    const teamID = this.getTile(ArmyMap.LAYER.TEAM, centerX, centerY);

    this.updateArea(centerX, centerY, range, (index, tileX, tileY) => {
        const typeID = this.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);

        if(typeID !== ArmyMap.TILE_TYPE.SHORE) {
            return;
        }

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
    
        if(meta.hasMeta(conversionID)) {
            this.placeTile(conversionID, ArmyMap.LAYER.GROUND, tileX, tileY);
        }
    });
}

ArmyMap.prototype.convertGraphicToTeam = function(gameContext, tileX, tileY) {
    const { tileManager } = gameContext;
    const { meta } = tileManager;

    for(let i = 0; i < ArmyMap.CONVERTABLE_LAYERS.length; i++) {
        const layerID = ArmyMap.CONVERTABLE_LAYERS[i];
        const tileID = this.getTile(layerID, tileX, tileY);
        const teamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
        const conversionID = this.getConversionID(gameContext, tileID, teamID);

        if(meta.hasMeta(conversionID)) {
            this.placeTile(conversionID, layerID, tileX, tileY);
        }
    }
}

ArmyMap.prototype.updateBorder = function(gameContext, centerX, centerY, range) {
    const { tileManager, world } = gameContext;
    const { turnManager } = world;
    const { meta } = tileManager;

    if(!gameContext.settings.drawBorder || (this.flags & ArmyMap.FLAG.ALLOW_BORDER) === 0) {
        return;
    }

    const player = turnManager.getController(gameContext.playerID);

    if(!player || !player.teamID) {
        return;
    }

    const autotiler = meta.getAutotilerByID(ArmyMap.AUTOTILER.BORDER);
    const tileTypes = gameContext.tileTypes;

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

        const tileID = autotiler.run(tileX, tileY, (x, y) => {
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

        this.placeTile(tileID, ArmyMap.LAYER.BORDER, tileX, tileY);
    });
}