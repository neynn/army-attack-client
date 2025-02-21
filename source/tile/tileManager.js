import { ImageSheet } from "../graphics/imageSheet.js";
import { Logger } from "../logger.js";
import { ImageManager } from "../resources/imageManager.js";

export const TileManager = function() {
    this.resources = new ImageManager();
    this.dynamicAnimations = [];
    this.tileTypes = {};
    this.tileMeta = {};
}

TileManager.TILE_ID = {
    EMPTY: 0,
    INVALID: -1
};

TileManager.prototype.load = function(tileTypes, tileMeta) {
    if(typeof tileTypes === "object") {
        this.loadTileTypes(tileTypes);

        this.resources.loadImages(tileTypes, (key, image, sheet) => {
            sheet.toBuffer();
            this.resources.addReference(key);
        },
        (key, error) => console.error(key, error));

    } else {
        Logger.log(false, "TileTypes cannot be undefined!", "TileManager.prototype.load", null);
    }

    if(typeof tileMeta === "object") {
        this.tileMeta = tileMeta;
        this.tileMeta.inversion = this.getTileMetaInversion();
    } else {
        Logger.log(false, "TileMeta cannot be undefined!", "TileManager.prototype.load", null);
    }
}

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();

    this.updateDynamicAnimations(realTime);
}

TileManager.prototype.exit = function() {
    
}

TileManager.prototype.updateDynamicAnimations = function(timestamp) {
    for(let i = 0; i < this.dynamicAnimations.length; i++) {
        const { set, animation } = this.dynamicAnimations[i];
        const tileType = this.tileTypes[set];
        const animationType = tileType.getAnimation(animation);

        animationType.updateFrameIndex(timestamp);
    }
}

TileManager.prototype.getInvertedTileMeta = function() {
    return this.tileMeta.inversion;
}

TileManager.prototype.getTileMetaInversion = function() {
    const inversion = {};

    for(let i = 0; i < this.tileMeta.values.length; i++) {
        const { set, animation } = this.tileMeta.values[i];

        if(!inversion[set]) {
            inversion[set] = {};
        }

        inversion[set][animation] = i + 1;
    }

    return inversion;
}

TileManager.prototype.getTileMeta = function(tileID) {
    const tileIndex = tileID - 1;

    if(tileIndex < 0 || tileIndex >= this.tileMeta.values.length) {
        return null;
    }

    return this.tileMeta.values[tileIndex];
}

TileManager.prototype.hasTileMeta = function(tileID) {
    const tileIndex = tileID - 1;

    return tileIndex >= 0 && tileIndex < this.tileMeta.values.length;
}


TileManager.prototype.loadTileTypes = function(tileTypes) {
    for(const typeID in tileTypes) {
        const tileType = tileTypes[typeID];
        const imageSheet = new ImageSheet(typeID);

        imageSheet.load(tileType);
        imageSheet.defineAnimations();
        //imageSheet.defineDefaultAnimation();

        const animations = imageSheet.getAnimations();

        for(const [animationID, animation] of animations) {
            if(animation.frameCount > 1) {
                this.dynamicAnimations.push({
                    "set": typeID,
                    "animation": animationID
                });
            }
        }

        this.tileTypes[typeID] = imageSheet;
    }
}

TileManager.prototype.getTileType = function(typeID) {
    const type = this.tileTypes[typeID];

    if(!type) {
        return null;
    }

    return type;
}

TileManager.prototype.getTileID = function(setID, animationID) {
    const metaSet = this.tileMeta.inversion[setID];

    if(!metaSet) {
        return TileManager.TILE_ID.EMPTY;
    }

    const metaID = metaSet[animationID];

    if(metaID === undefined) {
        return TileManager.TILE_ID.EMPTY;
    }

    return metaID;
}

TileManager.prototype.getAutotilerID = function(autotilerID, autoIndex) {
    const autotiler = this.tileMeta.autotilers[autotilerID];

    if(!autotiler) {
        return TileManager.TILE_ID.EMPTY;
    }

    const meta = autotiler.values[autoIndex];

    if(!meta) {
        return TileManager.TILE_ID.EMPTY;
    }

    const { set, animation } = meta;

    return this.getTileID(set, animation);
}