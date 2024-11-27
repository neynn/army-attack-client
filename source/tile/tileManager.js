import { ImageSheet } from "../graphics/imageSheet.js";
import { Logger } from "../logger.js";

export const TileManager = function() {
    this.tileTypes = {};
    this.tileMeta = {};
    this.dynamicTileTypes = {};
}

TileManager.prototype.load = function(tileTypes, tileMeta) {
    if(typeof tileTypes === "object") {
        this.loadTileTypes(tileTypes);
    } else {
        Logger.log(false, "TileTypes cannot be undefined!", "TileManager.prototype.load", null);
    }

    if(typeof tileMeta === "object") {
        this.tileMeta = tileMeta;
        this.invertTileMeta();
    } else {
        Logger.log(false, "TileMeta cannot be undefined!", "TileManager.prototype.load", null);
    }
}

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();

    this.updateDynamicTileTypes(realTime);
}

TileManager.prototype.end = function() {}

TileManager.prototype.updateDynamicTileTypes = function(timestamp) {
    for(const typeID in this.dynamicTileTypes) {
        const dynamicTileType = this.tileTypes[typeID];
        const dynamicAnimationList = this.dynamicTileTypes[typeID];

        for(const animationID of dynamicAnimationList) {
            const animation = dynamicTileType.getAnimation(animationID);
            animation.updateFrameIndex(timestamp);
        }
    }
}

TileManager.prototype.invertTileMeta = function() {
    for(const tileID in this.tileMeta.values) {
        const { id, set, animation } = this.tileMeta.values[tileID];

        if(this.tileMeta.inversion[set] === undefined) {
            this.tileMeta.inversion[set] = {};
        }

        this.tileMeta.inversion[set][animation] = id;
    }
}

TileManager.prototype.loadTileTypes = function(tileTypes) {
    for(const typeID in tileTypes) {
        this.dynamicTileTypes[typeID] = [];

        const tileType = tileTypes[typeID];
        const imageSheet = new ImageSheet(typeID);

        imageSheet.load(tileType);
        imageSheet.defineAnimations();
        imageSheet.defineDefaultAnimation();

        const animations = imageSheet.getAnimations();

        for(const [animationID, animation] of animations) {
            if(animation.frameCount > 1) {
                this.dynamicTileTypes[typeID].push(animationID);
            }
        }

        this.tileTypes[typeID] = imageSheet;
    }
}

TileManager.prototype.getTileMeta = function(tileID) {
    const meta = this.tileMeta.values[tileID];

    if(!meta) {
        return null;
    }

    return meta;
}

TileManager.prototype.getTileID = function(setID, animationID) {
    const metaSet = this.tileMeta.inversion[setID];

    if(!metaSet) {
        return 0;
    }

    const metaID = metaSet[animationID];

    if(metaID === undefined) {
        return 0;
    }

    return metaID;
}

TileManager.prototype.hasTileMeta = function(tileID) {
    return this.tileMeta.values[tileID] !== undefined;
}

TileManager.prototype.getAutotilerID = function(autotilerID, autoIndex) {
    const autotiler = this.tileMeta.autotilers[autotilerID];

    if(!autotiler) {
        return 0;
    }

    const meta = autotiler.values[autoIndex];

    if(!meta) {
        return 0;
    }

    const { set, animation } = meta;

    return this.getTileID(set, animation);;
}