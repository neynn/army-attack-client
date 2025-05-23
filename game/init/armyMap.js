import { Autotiler } from "../../source/tile/autotiler.js";
import { WorldMap } from "../../source/map/worldMap.js";
import { AllianceSystem } from "../systems/alliance.js";
import { BorderSystem } from "../systems/border.js";
import { DropHandler } from "./armyMap/dropHandler.js";

export const ArmyMap = function() {
    WorldMap.call(this, null);

    this.music = null;
    this.type = ArmyMap.TYPE.NONE;
    this.flags = ArmyMap.FLAG.NONE;
    this.debris = new Map();
    this.drops = new DropHandler();
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

ArmyMap.TEAM_TYPE = {
    0: "Crimson",
    1: "Allies",
    2: "Neutral",
    3: "Versus"
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
    CLOUD: "cloud",
    TYPE: "type",
    TEAM: "team"
};

ArmyMap.CONVERTABLE_LAYERS = [
    ArmyMap.LAYER.GROUND,
    ArmyMap.LAYER.DECORATION
];

ArmyMap.prototype = Object.create(WorldMap.prototype);
ArmyMap.prototype.constructor = ArmyMap;

ArmyMap.prototype.update = function(gameContext) {
    this.drops.update(gameContext, this);
}

ArmyMap.prototype.save = function() {
    const debris = [];

    this.debris.forEach(({type, x, y}) => {
        debris.push({
            "type": type,
            "x": x,
            "y": y
        });
    });

    return {
        "debris": debris
    }
}

ArmyMap.prototype.isFullyClouded = function(tileX, tileY) {
    const tileID = this.getTile(ArmyMap.LAYER.CLOUD, tileX, tileY);

    if(tileID === 0) {
        return false;
    }

    const startX = tileX - 1;
    const startY = tileY - 1;
    const endX = tileX + 1;
    const endY = tileY + 1;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const nextID = this.getTile(ArmyMap.LAYER.CLOUD, j, i);

            if(nextID === 0) {
                return false;
            }
        }
    }

    return true;
}

ArmyMap.prototype.clearClouds = function(gameContext, tileX, tileY, width, height) {
    const { tileManager } = gameContext;
    const cloudAutotiler = tileManager.getAutotilerByID(ArmyMap.AUTOTILER.CLOUD);

    const endX = tileX + width;
    const endY = tileY + height;

    for(let i = tileY; i < endY; i++) {
        for(let j = tileX; j < endX; j++) {
            this.clearTile(ArmyMap.LAYER.CLOUD, j, i);
        }
    }

    this.updateClouds(cloudAutotiler, tileX, tileY, width, height);
}

ArmyMap.prototype.updateClouds = function(autotiler, tileX, tileY, width, height) {
    const startCornerX = tileX - 1;
    const startCornerY = tileY - 1;
    const endCornerX = tileX + width;
    const endCornerY = tileY + height;

    for(let i = startCornerY; i <= endCornerY; i++) {
        this.autotile(autotiler, startCornerX, i, ArmyMap.LAYER.CLOUD);
        this.autotile(autotiler, endCornerX, i, ArmyMap.LAYER.CLOUD);
    }

    for(let j = startCornerX; j <= endCornerX; j++) {
        this.autotile(autotiler, j, startCornerY, ArmyMap.LAYER.CLOUD);
        this.autotile(autotiler, j, endCornerY, ArmyMap.LAYER.CLOUD);
    }
}

ArmyMap.prototype.hasDebris = function(tileX, tileY) {
    const index = this.getListID(tileX, tileY);

    if(index === -1) {
        return false;
    }

    return this.debris.has(index);
}

ArmyMap.prototype.removeDebris = function(tileX, tileY) {
    const index = this.getListID(tileX, tileY);

    if(index === -1) {
        return;
    }

    if(this.debris.has(index)) {
        this.debris.delete(index);
    }
}

ArmyMap.prototype.addDebris = function(type, tileX, tileY) {
    const index = this.getListID(tileX, tileY);

    if(index === -1) {
        return;
    }

    if(!this.debris.has(index)) {
        this.debris.set(index, {
            "type": type,
            "x": tileX,
            "y": tileY
        });
    }   
}

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

ArmyMap.prototype.init = function(config = {}) {
    const {
        width = 0,
        height = 0,
        flags = [],
        music = null
    } = config;

    this.width = width;
    this.height = height;
    this.music = music;

    for(let i = 0; i < flags.length; i++) {
        const flagID = flags[i];
        const flag = ArmyMap.FLAG[flagID];
        
        if(flag) {
            this.flags |= flag;
        }
    }
}

ArmyMap.prototype.reload = function(gameContext) {
    for(let i = 0; i < this.height; i++) {
        for(let j = 0; j < this.width; j++) {
            this.updateShoreTiles(gameContext, j, i, 1);
            this.convertGraphicToTeam(gameContext, j, i);
            BorderSystem.updateBorder(gameContext, this, j, i, 0);
        }
    }
}

ArmyMap.prototype.getAnimationForm = function(gameContext, tileID) {
    const { tileManager } = gameContext;
    const tileMeta = tileManager.getMeta(tileID);

    if(!tileMeta) {
        return null;
    }

    const { graphics } = tileMeta;
    const [atlas, texture] = graphics;
    const setForm = gameContext.tileFormConditions[atlas];

    if(!setForm) {
        return null;
    }

    const animationForm = setForm[texture];

    if(!animationForm) {
        return null;
    }

    return animationForm;
}

ArmyMap.prototype.isFormValid = function(gameContext, groundID, tileX, tileY, teamID) {
    const animationForm = this.getAnimationForm(gameContext, groundID);

    if(!animationForm) {
        return false;
    }

    //May God forgive me.
    for(let n = 0; n < animationForm.length; n++) {
        if(animationForm[n] === 1) {
            const row = Math.floor(n / 3);
            const column = n % 3;
            const checkX = tileX + (column - 1);
            const checkY = tileY + (row - 1);
            const checkTeamID = this.getTile(ArmyMap.LAYER.TEAM, checkX, checkY);
                
            if(checkTeamID !== teamID) {
                return false;
            }
        }
    }

    return true;
}

ArmyMap.prototype.updateShoreTiles = function(gameContext, tileX, tileY, range) {
    const { tileManager } = gameContext;
    const teamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);

    const startX = tileX - range;
    const startY = tileY - range;
    const endX = tileX + range;
    const endY = tileY + range;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const typeID = this.getTile(ArmyMap.LAYER.TYPE, j, i);
            const tileType = gameContext.tileTypes[typeID];

            if(!tileType || !tileType.hasForm) {
                continue;
            }

            const groundID = this.getTile(ArmyMap.LAYER.GROUND, j, i);
            const isFormValid = this.isFormValid(gameContext, groundID, j, i, teamID);

            if(!isFormValid) {
                continue;
            }

            const conversionID = gameContext.getConversionID(groundID, teamID);
        
            if(tileManager.hasMeta(conversionID)) {
                this.placeTile(conversionID, ArmyMap.LAYER.GROUND, j, i);
            }
        }
    }
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

ArmyMap.prototype.getBorderType = function(gameContext, tileX, tileY, teamID) {
    if((this.flags & ArmyMap.FLAG.ALLOW_BORDER) === 0) {
        return 0;
    }

    const { tileManager } = gameContext;
    const tileTypes = gameContext.tileTypes;
    const autotiler = tileManager.getAutotilerByID(ArmyMap.AUTOTILER.BORDER);
    
    const centerTypeID = this.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
    const centerType = tileTypes[centerTypeID];

    if(!centerType || !centerType.hasBorder) {
        return 0;
    }

    const centerTeamID = this.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamID, ArmyMap.TEAM_TYPE[centerTeamID]);

    if(isEnemy) {
        return 0;
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

    return tileID;
}