import { TileSheet } from "../graphics/tileSheet.js";
import { Logger } from "../logger.js";
import { ImageManager } from "../resources/imageManager.js";
import { TileMeta } from "./tileMeta.js";

export const TileManager = function() {
    this.meta = new TileMeta();
    this.resources = new ImageManager();
    this.dynamicAnimations = [];
    this.tileTypes = {};
    this.tileWidth = 0;
    this.tileHeight = 0;
}

TileManager.COLOR = {
    EMPTY_TILE_FIRST: "#000000",
    EMPTY_TILE_SECOND: "#701867"
};

TileManager.TILE_ID = {
    EMPTY: 0,
    INVALID: -1
};

TileManager.prototype.load = function(tileTypes, tileMeta) {
    if(typeof tileTypes === "object") {
        this.loadTileTypes(tileTypes);

        this.resources.createImages(tileTypes);
        this.resources.requestAllImages((key, image, sheet) => {
            sheet.toBuffer();
            sheet.removeImage();
            sheet.addReference();
        });

    } else {
        Logger.log(false, "TileTypes cannot be undefined!", "TileManager.prototype.load", null);
    }

    if(typeof tileMeta === "object") {
        this.meta.init(tileMeta);
    } else {
        Logger.log(false, "TileMeta cannot be undefined!", "TileManager.prototype.load", null);
    }
}

TileManager.prototype.loadTileDimensions = function(tileWidth, tileHeight) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
}

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();

    this.updateDynamicAnimations(realTime);
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
        const tileSheet = new TileSheet();

        tileSheet.init(tileType);

        const dynamicAnimations = tileSheet.getDynamicAnimations();

        for(let i = 0; i < dynamicAnimations.length; i++) {
            const animationID = dynamicAnimations[i];

            this.dynamicAnimations.push({
                "set": typeID,
                "animation": animationID
            });
        }

        this.tileTypes[typeID] = tileSheet;
    }
}

TileManager.prototype.drawEmptyTile = function(context, renderX, renderY, scaleX = 1, scaleY = 1) {
    const scaledX = (this.tileWidth * 0.5) * scaleX;
    const scaledY = (this.tileHeight * 0.5) * scaleY;

    context.fillStyle = TileManager.COLOR.EMPTY_TILE_FIRST;
    context.fillRect(renderX, renderY, scaledX, scaledY);
    context.fillRect(renderX + scaledX, renderY + scaledY, scaledX, scaledY);

    context.fillStyle = TileManager.COLOR.EMPTY_TILE_SECOND;
    context.fillRect(renderX + scaledX, renderY, scaledX, scaledY);
    context.fillRect(renderX, renderY + scaledY, scaledX, scaledY);
}

TileManager.prototype.drawTileGraphics = function(tileID, context, renderX, renderY, scaleX = 1, scaleY = 1) {
    const tileMeta = this.meta.getMeta(tileID);

    if(tileMeta === null) {
        this.drawEmptyTile(context, renderX, renderY, scaleX, scaleY);
        return;
    }

    const { set, animation } = tileMeta;
    const tileBuffer = this.resources.getImage(set);

    if(tileBuffer === null) {
        this.drawEmptyTile(context, renderX, renderY, scaleX, scaleY);
        return;
    }

    const tileType = this.tileTypes[set];
    const animationType = tileType.getAnimation(animation);
    const currentFrame = animationType.getCurrentFrame();

    for(let i = 0; i < currentFrame.length; i++) {
        const component = currentFrame[i];
        const { frameX, frameY, frameW, frameH, shiftX, shiftY } = component;
        const drawX = renderX + shiftX * scaleX;
        const drawY = renderY + shiftY * scaleY;
        const drawWidth = frameW * scaleX;
        const drawHeight = frameH * scaleY;

        context.drawImage(
            tileBuffer,
            frameX, frameY, frameW, frameH,
            drawX, drawY, drawWidth, drawHeight
        );
    }
}