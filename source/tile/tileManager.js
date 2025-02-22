import { ImageSheet } from "../graphics/imageSheet.js";
import { Logger } from "../logger.js";
import { ImageManager } from "../resources/imageManager.js";
import { Autotiler } from "./autotiler.js";
import { TileMeta } from "./tileMeta.js";

export const TileManager = function() {
    this.meta = new TileMeta();
    this.autotilers = new Map();
    this.resources = new ImageManager();
    this.dynamicAnimations = [];
    this.tileTypes = {};
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
        this.meta.init(tileMeta.values);
        this.loadAutotilers(tileMeta.autotilers);
    } else {
        Logger.log(false, "TileMeta cannot be undefined!", "TileManager.prototype.load", null);
    }
}

TileManager.prototype.loadAutotilers = function(autotilers) {
    for(const autotilerID in autotilers) {
        const autotiler = new Autotiler(autotilerID);
        const config = autotilers[autotilerID];

        autotiler.init(this, config);

        this.autotilers.set(autotilerID, autotiler);
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

TileManager.prototype.getAutotilerByID = function(autotilerID) {
    const autotiler = this.autotilers.get(autotilerID);

    if(!autotiler) {
        return null;
    }

    return autotiler;
}

TileManager.prototype.getAutotilerByTile = function(tileID) {
    const tileMeta = this.meta.getMeta(tileID);

    if(!tileMeta) {
        return null;
    }

    const autotilerID = tileMeta.autotiler;
    const autotiler = this.getAutotilerByID(autotilerID);

    return autotiler;
}