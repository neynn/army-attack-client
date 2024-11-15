import { ImageSheet } from "../graphics/imageSheet.js";
import { Logger } from "../logger.js";

export const TileManager = function() {
    this.tileTypes = {};
    this.tileMeta = {};
    this.dynamicTileTypes = {};
}

TileManager.prototype.load = function(tileTypes, tileMeta) {
    if(typeof tileTypes === "object") {
        this.tileTypes = tileTypes;
        this.loadDynamicTileTypes();
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
            const currentFrameTime = timestamp % animation.frameTimeTotal;
            const frameIndex = Math.floor(currentFrameTime / animation.frameTime);

            animation.setFrameIndex(frameIndex);
        }
    }
}

TileManager.prototype.drawTileGraphics = function(tileID, context, renderX, renderY, scaleX = 1, scaleY = 1) {
    const { set, animation } = this.getTileMeta(tileID);
    
    const tileType = this.tileTypes[set];
    const tileBuffer = tileType.getImage();
    const tileAnimation = tileType.getAnimation(animation);
    const currentFrame = tileAnimation.getCurrentFrame();

    for(const component of currentFrame) {
        const { id, shiftX, shiftY } = component;
        const { x, y, w, h, offset } = tileType.getFrameByID(id);
        const drawX = renderX + offset.x + shiftX;
        const drawY = renderY + offset.y + shiftY;
        const drawWidth = w * scaleX;
        const drawHeight = h * scaleY;

        context.drawImage(
            tileBuffer,
            x, y, w, h,
            drawX, drawY, drawWidth, drawHeight
        );
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

TileManager.prototype.loadDynamicTileTypes = function() {
    for(const typeID in this.tileTypes) {
        const tileSet = this.tileTypes[typeID];
        const animations = tileSet.getAnimations();

        for(const [animationID, animation] of animations) {
            if(animation.frameCount > 1) {
                if(this.dynamicTileTypes[typeID] === undefined) {
                    this.dynamicTileTypes[typeID] = [];
                }

                this.dynamicTileTypes[typeID].push(animationID);
            }
        }
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