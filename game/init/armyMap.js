import { Autotiler } from "../../source/tile/autotiler.js";
import { WorldMap } from "../../source/map/worldMap.js";
import { AllianceSystem } from "../systems/alliance.js";

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
    ALLOW_DROPS: 1 << 2,
    ALLOW_CAPTURE: 1 << 3,
    NEUTRAL: 1 << 4
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

    if(graphics) {
        const { background = [], foreground = [] } = graphics;

        this.loadGraphics(background, foreground);
    }
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
    const tileMeta = tileManager.getMeta(tileID);

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

ArmyMap.prototype.updateShoreTiles = function(gameContext, tileX, tileY, range) {
    const { tileManager } = gameContext;
    const teamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);

    this.updateArea(tileX, tileY, range, (index, nextX, nextY) => {
        const typeID = this.getTile(ArmyMap.LAYER.TYPE, nextX, nextY);

        if(typeID !== ArmyMap.TILE_TYPE.SHORE) {
            return;
        }

        const groundID = this.getTile(ArmyMap.LAYER.GROUND, nextX, nextY);
        const animationForm = this.getAnimationForm(gameContext, groundID);

        if(!animationForm) {
            return;
        }

        //May God forgive me.
        for(let i = 0; i < animationForm.length; i++) {
            if(animationForm[i] === 1) {
                const row = Math.floor(i / 3);
                const column = i % 3;
                const checkX = nextX + (column - 1);
                const checkY = nextY + (row - 1);
                const checkTeamID = this.getTile(ArmyMap.LAYER.TEAM, checkX, checkY);
                    
                if(checkTeamID !== teamID) {
                    return;
                }
            }
        }

        const conversionID = gameContext.getConversionID(groundID, teamID);
    
        if(tileManager.hasMeta(conversionID)) {
            this.placeTile(conversionID, ArmyMap.LAYER.GROUND, nextX, nextY);
        }
    });
}

ArmyMap.prototype.convertGraphicToTeam = function(gameContext, tileX, tileY) {
    const { tileManager } = gameContext;

    for(let i = 0; i < ArmyMap.CONVERTABLE_LAYERS.length; i++) {
        const layerID = ArmyMap.CONVERTABLE_LAYERS[i];
        const tileID = this.getTile(layerID, tileX, tileY);
        const teamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
        const conversionID = gameContext.getConversionID(tileID, teamID);

        if(tileManager.hasMeta(conversionID)) {
            this.placeTile(conversionID, layerID, tileX, tileY);
        }
    }
}

ArmyMap.prototype.updateBorder = function(gameContext, tileX, tileY, range) {
    const { tileManager } = gameContext;
    
    if(!gameContext.settings.drawBorder) {
        return;
    }

    if((this.flags & ArmyMap.FLAG.ALLOW_BORDER) === 0) {
        return;
    }

    const playerTeamID = gameContext.getPlayerTeamID();

    if(!playerTeamID) {
        return;
    }

    const autotiler = tileManager.getAutotilerByID(ArmyMap.AUTOTILER.BORDER);
    const tileTypes = gameContext.tileTypes;

    this.updateArea(tileX, tileY, range, (index, nextX, nextY) => {
        const centerTypeID = this.getTile(ArmyMap.LAYER.TYPE, nextX, nextY);
        const centerType = tileTypes[centerTypeID];
    
        if(!centerType || !centerType.hasBorder) {
            return;
        }

        const centerTeamID = this.getTile(ArmyMap.LAYER.TEAM, nextX, nextY);
        const isEnemy = AllianceSystem.isEnemy(gameContext, playerTeamID, ArmyMap.TEAM_TYPE[centerTeamID]);

        if(isEnemy) {
            return;
        }

        const tileID = autotiler.run(nextX, nextY, (x, y) => {
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

        this.placeTile(tileID, ArmyMap.LAYER.BORDER, nextX, nextY);
    });
}