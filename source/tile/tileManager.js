import { ImageSheet } from "../graphics/imageSheet.js";
import { Logger } from "../logger.js";
import { ImageManager } from "../resources/imageManager.js";

export const TileManager = function() {
    this.resources = new ImageManager();
    this.dynamicAnimations = {};
    this.tileTypes = {};
    this.tileMeta = {};
}

TileManager.prototype.getTileFrame = function(tileID) {
    const { set, animation } = this.getTileMeta(tileID);
    const tileBuffer = this.resources.getImage(set);

    if(!tileBuffer) {
        return [];
    }

    const tileType = this.getTileType(set);
    const tileAnimation = tileType.getAnimation(animation);
    const currentFrame = tileAnimation.getCurrentFrame();

    return currentFrame;
}

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
        this.tileMeta.inversion = this.getTileInversion();
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
    for(const typeID in this.dynamicAnimations) {
        const tileType = this.tileTypes[typeID];
        const animationIDs = this.dynamicAnimations[typeID];

        for(const animationID of animationIDs) {
            const animation = tileType.getAnimation(animationID);
            animation.updateFrameIndex(timestamp);
        }
    }
}

TileManager.prototype.getTileInversion = function() {
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
        return {
            "set": null,
            "animation": null
        };
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
            if(animation.frameCount <= 1) {
                continue;
            }

            if(!this.dynamicAnimations[typeID]) {
                this.dynamicAnimations[typeID] = [];
            }

            this.dynamicAnimations[typeID].push(animationID);
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
        return 0;
    }

    const metaID = metaSet[animationID];

    if(metaID === undefined) {
        return 0;
    }

    return metaID;
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