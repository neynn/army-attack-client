import { clampValue } from "../../math/math.js";
import { Renderer } from "../../renderer.js";
import { TileManager } from "../../tile/tileManager.js";
import { Camera } from "../camera.js";

export const OrthogonalCamera = function() {
    Camera.call(this);

    this.tileWidth = 0;
    this.tileHeight = 0;
    this.halfTileWidth = 0;
    this.halfTileHeight = 0;
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.overlays = [];
}

OrthogonalCamera.COLOR = {
    EMPTY_TILE_FIRST: "#000000",
    EMPTY_TILE_SECOND: "#701867"
};

OrthogonalCamera.MAP_OUTLINE = {
    LINE_SIZE: 2,
    COLOR: "#dddddd"
};

OrthogonalCamera.prototype = Object.create(Camera.prototype);
OrthogonalCamera.prototype.constructor = OrthogonalCamera;

OrthogonalCamera.prototype.addToOverlay = function(index, tileID, positionX, positionY) {
    if(index < 0 || index >= this.overlays.length || tileID === TileManager.TILE_ID.EMPTY) {
        return;
    }

    const overlayType = this.overlays[index];
    const element = {
        "id": tileID,
        "x": positionX,
        "y": positionY,
        "drawX": this.tileWidth * positionX,
        "drawY": this.tileHeight * positionY
    };

    overlayType.push(element);
}

OrthogonalCamera.prototype.clearOverlay = function(index) {
    if(index < 0 || index >= this.overlays.length) {
        return;
    }

    this.overlays[index].length = 0;
}

OrthogonalCamera.prototype.drawEmptyTile = function(context, renderX, renderY, scaleX = 1, scaleY = 1) {
    const scaledX = this.halfTileWidth * scaleX;
    const scaledY = this.halfTileHeight * scaleY;

    context.fillStyle = OrthogonalCamera.COLOR.EMPTY_TILE_FIRST;
    context.fillRect(renderX, renderY, scaledX, scaledY);
    context.fillRect(renderX + scaledX, renderY + scaledY, scaledX, scaledY);

    context.fillStyle = OrthogonalCamera.COLOR.EMPTY_TILE_SECOND;
    context.fillRect(renderX + scaledX, renderY, scaledX, scaledY);
    context.fillRect(renderX, renderY + scaledY, scaledX, scaledY);
}

OrthogonalCamera.prototype.drawTileGraphics = function(tileManager, context, tileID, renderX, renderY, scaleX = 1, scaleY = 1) {
    const { meta, resources, tileTypes } = tileManager;
    const tileMeta = meta.getMeta(tileID);

    if(tileMeta === null) {
        this.drawEmptyTile(context, renderX, renderY, scaleX, scaleY);
        return;
    }

    const { set, animation } = tileMeta;
    const tileBuffer = resources.getImage(set);

    if(tileBuffer === null) {
        this.drawEmptyTile(context, renderX, renderY, scaleX, scaleY);
        return;
    }

    const tileType = tileTypes[set];
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

OrthogonalCamera.prototype.drawOverlay = function(gameContext, renderContext, worldBounds, index) {
    if(index < 0 || index >= this.overlays.length) {
        return;
    }

    const { tileManager } = gameContext;
    const { startX, startY, endX, endY } = worldBounds;
    const overlay = this.overlays[index];

    for(let i = 0; i < overlay.length; i++) {
        const { id, x, y, drawX, drawY } = overlay[i];

        if(x >= startX && x <= endX && y >= startY && y <= endY) {
            const renderX = drawX - this.viewportX;
            const renderY = drawY - this.viewportY;
    
            this.drawTileGraphics(tileManager, renderContext, id, renderX, renderY);
        }
    }
}

OrthogonalCamera.prototype.drawLayer = function(gameContext, renderContext, layer, worldBounds) {
    const opacity = layer.getOpacity();

    if(opacity > 0) {
        const buffer = layer.getBuffer();
        const previousAlpha = renderContext.globalAlpha;

        renderContext.globalAlpha = opacity;

        this.drawTileBuffer(gameContext, renderContext, buffer, worldBounds);

        renderContext.globalAlpha = previousAlpha;
    }
}

OrthogonalCamera.prototype.drawTileBuffer = function(gameContext, renderContext, buffer, worldBounds) {
    const { tileManager } = gameContext;
    const { startX, startY, endX, endY } = worldBounds;
    const bufferSize = buffer.length;

    for(let i = startY; i <= endY; i++) {
        const tileRow = i * this.mapWidth;
        const renderY = i * this.tileHeight - this.viewportY;

        for(let j = startX; j <= endX; j++) {
            const index = tileRow + j;

            if(index >= 0 && index < bufferSize) {
                const tileID = buffer[index];

                if(tileID !== 0) {
                    const renderX = j * this.tileWidth - this.viewportX;
    
                    this.drawTileGraphics(tileManager, renderContext, tileID, renderX, renderY);
                }
            }
        }
    }
}

OrthogonalCamera.prototype.drawSpriteLayer = function(gameContext, renderContext, layerID) {
    const { timer, spriteManager } = gameContext;
    const spriteLayer = spriteManager.getLayer(layerID);
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();
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
        sprite.draw(renderContext, viewportLeftEdge, viewportTopEdge);
    }

    if(Renderer.DEBUG.SPRITES) {
        for(let i = 0; i < visibleSprites.length; i++) {
            const sprite = visibleSprites[i];
    
            sprite.debug(renderContext, viewportLeftEdge, viewportTopEdge);
        }
    }
}

OrthogonalCamera.prototype.drawBufferData = function(context, worldBounds, buffer, offsetX, offsetY) {
    const { startX, startY, endX, endY } = worldBounds;
    const bufferSize = buffer.length;
    const drawX = offsetX - this.viewportX;
    const drawY = offsetY - this.viewportY;

    for(let i = startY; i <= endY; i++) {
        const renderY = i * this.tileHeight + drawY;
        const tileRow = i * this.mapWidth;

        for(let j = startX; j <= endX; j++) {
            const index = tileRow + j;

            if(index >= 0 && index < bufferSize) {
                const renderX = j * this.tileWidth + drawX;
                const tileID = buffer[index];

                context.fillText(tileID, renderX, renderY);
            }
        }
    }
}

OrthogonalCamera.prototype.drawMapOutlines = function(context, worldBounds) {
    const { startX, startY, endX, endY } = worldBounds;
    const trueEndX = endX + 1;
    const trueEndY = endY + 1;

    context.fillStyle = OrthogonalCamera.MAP_OUTLINE.COLOR;

    for(let i = startY; i <= trueEndY; i++) {
        const renderY = i * this.tileHeight - this.viewportY;

        context.fillRect(0, renderY, this.viewportWidth, OrthogonalCamera.MAP_OUTLINE.LINE_SIZE);
    }

    for (let j = startX; j <= trueEndX; j++) {
        const renderX = j * this.tileWidth - this.viewportX;

        context.fillRect(renderX, 0, OrthogonalCamera.MAP_OUTLINE.LINE_SIZE, this.viewportHeight);
    }
}

OrthogonalCamera.prototype.loadTileDimensions = function(tileWidth, tileHeight) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.halfTileWidth = tileWidth / 2;
    this.halfTileHeight = tileHeight / 2;
}

OrthogonalCamera.prototype.loadWorld = function(mapWidth, mapHeight) {
    const worldWidth = mapWidth * this.tileWidth;
    const worldHeight = mapHeight * this.tileHeight;

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.reloadViewport();
}

OrthogonalCamera.prototype.getWorldBounds = function() {
    const offsetX = 0;
    const offsetY = 1;
    const startX = Math.floor(this.viewportX / this.tileWidth);
    const startY = Math.floor(this.viewportY / this.tileHeight);
    const endX = Math.floor((this.viewportX + this.viewportWidth) / this.tileWidth) + offsetX;
    const endY = Math.floor((this.viewportY + this.viewportHeight) / this.tileHeight) + offsetY;
    const clampedStartX = clampValue(startX, this.mapWidth - 1, 0);
    const clampedStartY = clampValue(startY, this.mapHeight - 1, 0);
    const clampedEndX = clampValue(endX, this.mapWidth - 1, 0);
    const clampedEndY = clampValue(endY, this.mapHeight - 1, 0);

    return {
        "startX": clampedStartX,
        "startY": clampedStartY,
        "endX": clampedEndX,
        "endY": clampedEndY
    }
}

OrthogonalCamera.prototype.getTileDimensions = function() {
    return {
        "width": this.tileWidth,
        "height": this.tileHeight,
        "halfWidth": this.halfTileWidth,
        "halfHeight": this.halfTileHeight
    }
}

OrthogonalCamera.prototype.transformTileToPosition = function(tileX, tileY) {
	const positionX = tileX * this.tileWidth;
	const positionY = tileY * this.tileHeight;

	return {
		"x": positionX,
		"y": positionY
	}
}

OrthogonalCamera.prototype.transformPositionToTile = function(positionX, positionY) {
    const tileX = Math.floor(positionX / this.tileWidth);
	const tileY = Math.floor(positionY / this.tileHeight);

	return {
		"x": tileX,
		"y": tileY 
	}
}

OrthogonalCamera.prototype.transformSizeToPositionOffsetCenter = function(sizeX, sizeY) {
    const xOffset = this.tileWidth * (sizeX / 2 - 0.5);
    const yOffset = this.tileHeight * (sizeY / 2 - 0.5);

    return { 
		"x": xOffset,
		"y": yOffset
	}
}

OrthogonalCamera.prototype.transformSizeToPositionOffset = function(sizeX, sizeY) {
    const xOffset = this.tileWidth * (sizeX - 1);
    const yOffset = this.tileHeight * (sizeY - 1);

    return { 
		"x": xOffset,
		"y": yOffset
	}
}

OrthogonalCamera.prototype.transformTileToPositionCenter = function(tileX, tileY) {
    const positionX = tileX * this.tileWidth + this.halfTileWidth;
	const positionY = tileY * this.tileHeight + this.halfTileHeight;

	return {
		"x": positionX,
		"y": positionY
	}
}