import { clampValue } from "../../math/math.js";
import { Renderer } from "../../renderer.js";
import { Camera } from "../camera.js";
import { OverlayHandler } from "../overlay/overlayHandler.js";

export const Camera2D = function() {
    Camera.call(this);

    this.overlay = new OverlayHandler();
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.tileWidth = -1;
    this.tileHeight = -1;
    this.halfTileWidth = -1;
    this.halfTileHeight = -1;
    this.startX = -1;
    this.startY = -1;
    this.endX = -1;
    this.endY = -1;
    this.scaleX = 1;
    this.scaleY = 1;
}

Camera2D.COLOR = {
    EMPTY_TILE_FIRST: "#000000",
    EMPTY_TILE_SECOND: "#701867"
};

Camera2D.MAP_OUTLINE = {
    LINE_SIZE: 2,
    COLOR: "#dddddd"
};

Camera2D.prototype = Object.create(Camera.prototype);
Camera2D.prototype.constructor = Camera2D;

Camera2D.prototype.setRelativeScale = function(tileWidth, tileHeight) {
    this.scaleX = tileWidth / this.tileWidth;
    this.scaleY = tileHeight / this.tileHeight;
}

Camera.prototype.resetScale = function() {
    this.scaleX = 1;
    this.scaleY = 1;
}

Camera2D.prototype.pushOverlay = function(overlayID, tileID, positionX, positionY) {
    const overlay = this.overlay.getOverlay(overlayID);

    if(!overlay) {
        return;
    }

    overlay.add(tileID, positionX, positionY);
}

Camera2D.prototype.clearOverlay = function(overlayID) {
    this.overlay.clearOverlay(overlayID);
}

Camera2D.prototype.drawEmptyTile = function(context, renderX, renderY) {
    const width = this.halfTileWidth * this.scaleX;
    const height = this.halfTileHeight * this.scaleY;

    context.fillStyle = Camera2D.COLOR.EMPTY_TILE_FIRST;
    context.fillRect(renderX, renderY, width, height);
    context.fillRect(renderX + width, renderY + height, width, height);

    context.fillStyle = Camera2D.COLOR.EMPTY_TILE_SECOND;
    context.fillRect(renderX + width, renderY, width, height);
    context.fillRect(renderX, renderY + height, width, height);
}

Camera2D.prototype.drawTileEasy = function(graphics, tileID, context, renderX, renderY) {
    const container = graphics.getValidContainer(tileID);

    if(!container) {
        this.drawEmptyTile(context, renderX, renderY);
    } else {
        this.drawTile(container, context, renderX, renderY);
    }
}

Camera2D.prototype.drawTile = function(container, context, renderX, renderY) {
    const { texture, frames, frameIndex } = container;
    const { bitmap } = texture;
    const currentFrame = frames[frameIndex];
    const frameLength = currentFrame.length;
    const scaleX = this.scaleX;
    const scaleY = this.scaleY;

    for(let i = 0; i < frameLength; ++i) {
        const component = currentFrame[i];
        const { frameX, frameY, frameW, frameH, shiftX, shiftY } = component;
        const drawX = renderX + shiftX * scaleX;
        const drawY = renderY + shiftY * scaleY;
        const drawWidth = frameW * scaleX;
        const drawHeight = frameH * scaleY;

        context.drawImage(
            bitmap,
            frameX, frameY, frameW, frameH,
            drawX, drawY, drawWidth, drawHeight
        );
    }
}

Camera2D.prototype.drawOverlay = function(graphics, context, overlayID) {
    const overlay = this.overlay.getOverlay(overlayID);

    if(!overlay) {
        return;
    }

    const startX = this.startX;
    const startY = this.startY;
    const endX = this.endX;
    const endY = this.endY;
    const tileWidth = this.tileWidth;
    const tileHeight = this.tileHeight;
    const viewportX = this.viewportX;
    const viewportY = this.viewportY;
    const { elements, gap } = overlay;
    const length = elements.length;

    for(let i = 0; i < length; i += gap) {
        const id = elements[i];
        const x = elements[i + 1];
        const y = elements[i + 2];

        if(x >= startX && x <= endX && y >= startY && y <= endY) {
            const renderX = x * tileWidth - viewportX;
            const renderY = y * tileHeight - viewportY;

            this.drawTileEasy(graphics, id, context, renderX, renderY);
        }
    }
}

Camera2D.prototype.drawLayer = function(graphics, context, layer) {
    if(!layer) {
        return;
    }

    const opacity = layer.getOpacity();

    if(opacity <= 0) {
        return;
    }

    const buffer = layer.getBuffer();
    const previousAlpha = context.globalAlpha;

    context.globalAlpha = opacity;

    this.drawTileBuffer(graphics, context, buffer);

    context.globalAlpha = previousAlpha;
}

Camera2D.prototype.drawTileBuffer = function(graphics, context, buffer) {
    const startX = this.startX;
    const startY = this.startY;
    const endX = this.endX;
    const endY = this.endY;
    const mapWidth = this.mapWidth;
    const tileWidth = this.tileWidth;
    const tileHeight = this.tileHeight;
    const viewportX = this.viewportX;
    const viewportY = this.viewportY;
    const cache = Object.create(null);

    for(let i = startY; i <= endY; ++i) {
        const tileRow = i * mapWidth;
        const renderY = i * tileHeight - viewportY;

        for(let j = startX; j <= endX; ++j) {
            const index = tileRow + j;
            const tileID = buffer[index];

            if(tileID !== 0) {
                const renderX = j * tileWidth - viewportX;
                let container = cache[tileID];

                if(container === undefined) {
                    container = graphics.getValidContainer(tileID);
                    cache[tileID] = container;
                }

                if(container) {
                    this.drawTile(container, context, renderX, renderY);
                } else {
                    this.drawEmptyTile(context, renderX, renderY);
                }
            }
        }
    }
}

Camera2D.prototype.drawSprite = function(display, sprite, realTime, deltaTime) {
    const viewportLeftEdge = this.viewportX;
    const viewportTopEdge = this.viewportY;
    const viewportRightEdge = viewportLeftEdge + this.viewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.viewportHeight;
    const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

    if(isVisible) {
        sprite.update(realTime, deltaTime);
        sprite.draw(display, viewportLeftEdge, viewportTopEdge);
    }
}

Camera2D.prototype.drawSpriteLayer = function(display, spriteLayer, realTime, deltaTime) {
    const viewportLeftEdge = this.viewportX;
    const viewportTopEdge = this.viewportY;
    const viewportRightEdge = viewportLeftEdge + this.viewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.viewportHeight;
    const visibleSprites = [];
    const length = spriteLayer.length;

    for(let i = 0; i < length; ++i) {
        const sprite = spriteLayer[i];
        const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            visibleSprites.push(sprite);
        }
    }

    visibleSprites.sort((current, next) => current.positionY - next.positionY);
    
    for(let i = 0; i < visibleSprites.length; i++) {
        const sprite = visibleSprites[i];

        sprite.update(realTime, deltaTime);
        sprite.draw(display, viewportLeftEdge, viewportTopEdge);
    }

    if(Renderer.DEBUG.SPRITES) {
        for(let i = 0; i < visibleSprites.length; i++) {
            const sprite = visibleSprites[i];
    
            sprite.debug(display, viewportLeftEdge, viewportTopEdge);
        }
    }
}

Camera2D.prototype.drawBufferData = function(context, buffer, offsetX, offsetY) {
    const drawX = offsetX - this.viewportX;
    const drawY = offsetY - this.viewportY;

    for(let i = this.startY; i <= this.endY; i++) {
        const renderY = i * this.tileHeight + drawY;
        const tileRow = i * this.mapWidth;

        for(let j = this.startX; j <= this.endX; j++) {
            const renderX = j * this.tileWidth + drawX;
            const index = tileRow + j;
            const tileID = buffer[index];

            context.fillText(tileID, renderX, renderY);
        }
    }
}

Camera2D.prototype.drawMapOutlines = function(context) {
    const endX = this.endX + 1;
    const endY = this.endY + 1;

    context.fillStyle = Camera2D.MAP_OUTLINE.COLOR;

    for(let i = this.startY; i <= endY; i++) {
        const renderY = i * this.tileHeight - this.viewportY;

        context.fillRect(0, renderY, this.viewportWidth, Camera2D.MAP_OUTLINE.LINE_SIZE);
    }

    for (let j = this.startX; j <= endX; j++) {
        const renderX = j * this.tileWidth - this.viewportX;

        context.fillRect(renderX, 0, Camera2D.MAP_OUTLINE.LINE_SIZE, this.viewportHeight);
    }
}

Camera2D.prototype.setTileSize = function(tileWidth, tileHeight) {
    const worldWidth = this.mapWidth * tileWidth;
    const worldHeight = this.mapHeight * tileHeight;

    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.halfTileWidth = tileWidth / 2;
    this.halfTileHeight = tileHeight / 2;

    this.setWorldSize(worldWidth, worldHeight);
}

Camera2D.prototype.onMapSizeSet = function() {}

Camera2D.prototype.setMapSize = function(mapWidth, mapHeight) {
    const worldWidth = mapWidth * this.tileWidth;
    const worldHeight = mapHeight * this.tileHeight;

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    this.setWorldSize(worldWidth, worldHeight);
    this.onMapSizeSet();
}

Camera2D.prototype.updateWorldBounds = function() {
    const offsetX = 0;
    const offsetY = 1;

    this.startX = Math.floor(this.viewportX / this.tileWidth);
    this.startY = Math.floor(this.viewportY / this.tileHeight);
    this.endX = Math.floor((this.viewportX + this.viewportWidth) / this.tileWidth) + offsetX;
    this.endY = Math.floor((this.viewportY + this.viewportHeight) / this.tileHeight) + offsetY;
}

Camera2D.prototype.clampWorldBounds = function() {
    this.startX = clampValue(this.startX, this.mapWidth - 1, 0);
    this.startY = clampValue(this.startY, this.mapHeight - 1, 0);
    this.endX = clampValue(this.endX, this.mapWidth - 1, 0);
    this.endY = clampValue(this.endY, this.mapHeight - 1, 0);
}