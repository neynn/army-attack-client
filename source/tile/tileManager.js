import { ImageSheet } from "../graphics/imageSheet.js";
import { Logger } from "../logger.js";

export const TileManager = function() {
    this.id = "TILE_MANAGER";
    this.tileTypes = {};
    this.tileMeta = {};
}

TileManager.prototype.update = function(gameContext, realTime, deltaTime) {
    this.updateTileTypes(realTime);
}

TileManager.prototype.loadTileTypes = function(tileTypes) {
    if(!tileTypes) {
        Logger.log(false, "TileTypes cannot be undefined!", "TileManager.prototype.loadTileTypes", null);

        return false;
    }

    this.tileTypes = tileTypes;

    return true;
}

TileManager.prototype.loadTileMeta = function(tileMeta) {
    if(!tileMeta) {
        Logger.log(false, "TileMeta cannot be undefined!", "TileManager.prototype.loadTileMeta", null);

        return false;
    }

    this.tileMeta = tileMeta;
    this.invertTileMeta();

    return true;
}

TileManager.prototype.updateTileTypes = function(timestamp) {
    for(const key in this.tileTypes) {
        const tileSet = this.tileTypes[key];
        const animations = tileSet.getAnimations();

        for(const [animationID, animation] of animations) {
            if(animation.frameCount > 1) {
                const currentFrameTime = timestamp % animation.frameTimeTotal;
                const frameIndex = Math.floor(currentFrameTime / animation.frameTime);

                animation.setFrameIndex(frameIndex);
            }
        }
    }
}

TileManager.prototype.drawTileGraphics = function(tileID, context, renderX, renderY, scaleX = 1, scaleY = 1) {
    const { set, animation } = this.getTileMeta(tileID);
    const tileSet = this.tileTypes[set];
    const tileAnimation = tileSet.getAnimation(animation);
    const currentFrame = tileAnimation.getCurrentFrame();

    for(const component of currentFrame) {
        const { id, offsetX, offsetY } = component;
        const { width, height, offset, bitmap } = tileSet.getBuffersByID(id)[ImageSheet.BUFFER_NOT_FLIPPED];
        const drawX = renderX + offset.x + offsetX;
        const drawY = renderY + offset.y + offsetY;
        const drawWidth = width * scaleX;
        const drawHeight = height * scaleY;

        context.drawImage(
            bitmap,
            0, 0, width, height,
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
        return null;
    }

    const metaID = metaSet[animationID];

    if(metaID === undefined) {
        return null;
    }

    return metaID;
}

TileManager.prototype.hasTileMeta = function(tileID) {
    return this.tileMeta.values[tileID] !== undefined;
}