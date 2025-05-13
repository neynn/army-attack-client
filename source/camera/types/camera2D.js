import { clampValue } from "../../math/math.js";
import { Renderer } from "../../renderer.js";
import { Camera } from "../camera.js";

export const Camera2D = function() {
    Camera.call(this);

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
    this.overlays = new Map();
}

Camera2D.MAP_OUTLINE = {
    LINE_SIZE: 2,
    COLOR: "#dddddd"
};

Camera2D.prototype = Object.create(Camera.prototype);
Camera2D.prototype.constructor = Camera2D;

Camera2D.prototype.createOverlay = function(overlayID) {
    if(this.overlays.has(overlayID)) {
        return;
    }

    this.overlays.set(overlayID, []);
}

Camera2D.prototype.destroyOverlay = function(overlayID) {
    if(!this.overlays.has(overlayID)) {
        return;
    }

    this.overlays.delete(overlayID);
}

Camera2D.prototype.pushOverlay = function(overlayID, tileID, positionX, positionY) {
    const overlay = this.overlays.get(overlayID);

    if(!overlay) {
        return;
    }

    const element = {
        "id": tileID,
        "x": positionX,
        "y": positionY,
        "drawX": this.tileWidth * positionX,
        "drawY": this.tileHeight * positionY
    };

    overlay.push(element);
}

Camera2D.prototype.clearOverlay = function(overlayID) {
    const overlay = this.overlays.get(overlayID);

    if(!overlay) {
        return;
    }

    overlay.length = 0;
}

Camera2D.prototype.drawEmptyTile = function(graphics, context, renderX, renderY, targetWidth = this.tileWidth, targetHeight = this.tileHeight) {
    const scaleX = targetWidth / this.tileWidth;
    const scaleY = targetHeight / this.tileHeight;

    graphics.drawEmptyTile(context, renderX, renderY, scaleX, scaleY, this.tileWidth, this.tileHeight);
}

Camera2D.prototype.drawTile = function(graphics, context, tileID, renderX, renderY, targetWidth = this.tileWidth, targetHeight = this.tileHeight) {
    const scaleX = targetWidth / this.tileWidth;
    const scaleY = targetHeight / this.tileHeight;

    graphics.drawTile(context, tileID, renderX, renderY, scaleX, scaleY, this.tileWidth, this.tileHeight);
}

Camera2D.prototype.drawOverlay = function(graphics, context, overlayID) {
    const overlay = this.overlays.get(overlayID);

    if(!overlay) {
        return;
    }

    for(let i = 0; i < overlay.length; i++) {
        const { id, x, y, drawX, drawY } = overlay[i];

        if(x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
            const renderX = drawX - this.viewportX;
            const renderY = drawY - this.viewportY;
    
            graphics.drawTile(context, id, renderX, renderY, 1, 1, this.tileWidth, this.tileHeight);
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
    for(let i = this.startY; i <= this.endY; ++i) {
        const tileRow = i * this.mapWidth;
        const renderY = i * this.tileHeight - this.viewportY;

        for(let j = this.startX; j <= this.endX; ++j) {
            const index = tileRow + j;
            const tileID = buffer[index];

            if(tileID !== 0) {
                const renderX = j * this.tileWidth - this.viewportX;

                graphics.drawTile(context, tileID, renderX, renderY, 1, 1, this.tileWidth, this.tileHeight);
            }
        }
    }
}

Camera2D.prototype.drawSpriteLayer = function(display, spriteLayer, realTime, deltaTime) {
    const viewportLeftEdge = this.viewportX;
    const viewportTopEdge = this.viewportY;
    const viewportRightEdge = viewportLeftEdge + this.viewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.viewportHeight;
    const visibleSprites = [];

    for(let i = 0; i < spriteLayer.length; i++) {
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

Camera2D.prototype.setMapSize = function(mapWidth, mapHeight) {
    const worldWidth = mapWidth * this.tileWidth;
    const worldHeight = mapHeight * this.tileHeight;

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    this.setWorldSize(worldWidth, worldHeight);
}

Camera2D.prototype.updateWorldBounds = function() {
    const offsetX = 0;
    const offsetY = 1;
    const startX = Math.floor(this.viewportX / this.tileWidth);
    const startY = Math.floor(this.viewportY / this.tileHeight);
    const endX = Math.floor((this.viewportX + this.viewportWidth) / this.tileWidth) + offsetX;
    const endY = Math.floor((this.viewportY + this.viewportHeight) / this.tileHeight) + offsetY;

    this.startX = clampValue(startX, this.mapWidth - 1, 0);
    this.startY = clampValue(startY, this.mapHeight - 1, 0);
    this.endX = clampValue(endX, this.mapWidth - 1, 0);
    this.endY = clampValue(endY, this.mapHeight - 1, 0);
}

Camera2D.prototype.getTileDimensions = function() {
    return {
        "width": this.tileWidth,
        "height": this.tileHeight,
        "halfWidth": this.halfTileWidth,
        "halfHeight": this.halfTileHeight
    }
}

Camera2D.prototype.transformTileToPosition = function(tileX, tileY) {
	const positionX = tileX * this.tileWidth;
	const positionY = tileY * this.tileHeight;

	return {
		"x": positionX,
		"y": positionY
	}
}

Camera2D.prototype.transformPositionToTile = function(positionX, positionY) {
    const tileX = Math.floor(positionX / this.tileWidth);
	const tileY = Math.floor(positionY / this.tileHeight);

	return {
		"x": tileX,
		"y": tileY 
	}
}

Camera2D.prototype.transformSizeToPositionOffsetCenter = function(sizeX, sizeY) {
    const xOffset = this.tileWidth * (sizeX / 2 - 0.5);
    const yOffset = this.tileHeight * (sizeY / 2 - 0.5);

    return { 
		"x": xOffset,
		"y": yOffset
	}
}

Camera2D.prototype.transformSizeToPositionOffset = function(sizeX, sizeY) {
    const xOffset = this.tileWidth * (sizeX - 1);
    const yOffset = this.tileHeight * (sizeY - 1);

    return { 
		"x": xOffset,
		"y": yOffset
	}
}

Camera2D.prototype.transformTileToPositionCenter = function(tileX, tileY) {
    const positionX = tileX * this.tileWidth + this.halfTileWidth;
	const positionY = tileY * this.tileHeight + this.halfTileHeight;

	return {
		"x": positionX,
		"y": positionY
	}
}

Camera2D.prototype.transformSizeToRandomOffset = function(sizeX, sizeY, maxOffsetX, maxOffsetY) {
    const offsetX = (Math.random() * 2 - 1) * maxOffsetX;
    const offsetY = (Math.random() * 2 - 1) * maxOffsetY;
    const randomX = Math.floor(Math.random() * sizeX);
    const randomY = Math.floor(Math.random() * sizeY);
    const { x, y } = this.transformTileToPosition(randomX, randomY);

    return {
        "x": x + offsetX,
        "y": y + offsetY
    }
}