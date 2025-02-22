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

OrthogonalCamera.prototype = Object.create(Camera.prototype);
OrthogonalCamera.prototype.constructor = OrthogonalCamera;

OrthogonalCamera.MAP_OUTLINE_COLOR = "#dddddd";

OrthogonalCamera.EMPTY_TILE_COLOR = {
    FIRST: "#000000",
    SECOND: "#701867"
};

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
    
            this.drawTileGraphics(tileManager, id, renderContext, renderX, renderY);
        }
    }
}

OrthogonalCamera.prototype.drawCustom = function(worldBounds, onDraw) {
    const { startX, startY, endX, endY } = worldBounds;

    for(let i = startY; i <= endY; i++) {
        const row = i * this.mapWidth;
        const renderY = i * this.tileHeight - this.viewportY;

        for(let j = startX; j <= endX; j++) {
            const index = row + j;
            const renderX = j * this.tileWidth - this.viewportX;

            onDraw(index, renderX, renderY);
        }
    }
}

OrthogonalCamera.prototype.drawTileLayer = function(gameContext, renderContext, layer, worldBounds) {
    const { tileManager } = gameContext;
    const { startX, startY, endX, endY } = worldBounds;

    for(let i = startY; i <= endY; i++) {
        const row = i * this.mapWidth;
        const renderY = i * this.tileHeight - this.viewportY;

        for(let j = startX; j <= endX; j++) {
            const index = row + j;
            const id = layer[index];

            if(id === 0) {
                continue;
            }

            const renderX = j * this.tileWidth - this.viewportX;

            this.drawTileGraphics(tileManager, id, renderContext, renderX, renderY);
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

    for(let j = 0; j < spriteLayer.length; j++) {
        const sprite = spriteLayer[j];
        const { x, y, w, h } = sprite.getBounds();
        const inBounds = x < viewportRightEdge && x + w > viewportLeftEdge && y < viewportBottomEdge && y + h > viewportTopEdge;

        if(inBounds) {
            visibleSprites.push(sprite);
        }
    }

    visibleSprites.sort((current, next) => current.position.y - next.position.y);
    
    for(let j = 0; j < visibleSprites.length; j++) {
        const sprite = visibleSprites[j];

        sprite.update(realTime, deltaTime);
        sprite.draw(renderContext, viewportLeftEdge, viewportTopEdge);
    }

    if((Renderer.DEBUG.VALUE & Renderer.DEBUG.SPRITES) !== 0) {
        for(let j = 0; j < visibleSprites.length; j++) {
            const sprite = visibleSprites[j];
    
            sprite.debug(renderContext, viewportLeftEdge, viewportTopEdge);
        }
    }
}

OrthogonalCamera.prototype.drawTileGraphics = function(tileManager, tileID, context, renderX, renderY, scaleX = 1, scaleY = 1) {
    const tileMeta = tileManager.getTileMeta(tileID);

    if(tileMeta === null) {
        this.drawEmptyTile(context, renderX, renderY, scaleX, scaleY);
        return;
    }

    const { set, animation } = tileMeta;
    const tileBuffer = tileManager.resources.getImage(set);

    if(!tileBuffer) {
        this.drawEmptyTile(context, renderX, renderY, scaleX, scaleY);
        return;
    }

    const tileType = tileManager.getTileType(set);
    const tileAnimation = tileType.getAnimation(animation);
    const currentFrame = tileAnimation.getCurrentFrame();

    for(let i = 0; i < currentFrame.length; i++) {
        const component = currentFrame[i];
        const { shiftX, shiftY, frame } = component;
        const { x, y, w, h } = frame;
        const drawX = renderX + shiftX * scaleX;
        const drawY = renderY + shiftY * scaleY;
        const drawWidth = w * scaleX;
        const drawHeight = h * scaleY;

        context.drawImage(
            tileBuffer,
            x, y, w, h,
            drawX, drawY, drawWidth, drawHeight
        );
    }
}

OrthogonalCamera.prototype.drawEmptyTile = function(context, renderX, renderY, scaleX = 1, scaleY = 1) {
    const scaledX = this.halfTileWidth * scaleX;
    const scaledY = this.halfTileHeight * scaleY;

    context.fillStyle = OrthogonalCamera.EMPTY_TILE_COLOR.FIRST;
    context.fillRect(renderX, renderY, scaledX, scaledY);
    context.fillRect(renderX + scaledX, renderY + scaledY, scaledX, scaledY);

    context.fillStyle = OrthogonalCamera.EMPTY_TILE_COLOR.SECOND;
    context.fillRect(renderX + scaledX, renderY, scaledX, scaledY);
    context.fillRect(renderX, renderY + scaledY, scaledX, scaledY);
}

OrthogonalCamera.prototype.drawTileOutlines = function(context, worldBounds) {
    const { startX, startY, endX, endY } = worldBounds;
    const adjustedEndX = endX + 1;
    const adjustedEndY = endY + 1;
    const LINE_SIZE = 2;

    context.fillStyle = OrthogonalCamera.MAP_OUTLINE_COLOR;

    for(let i = startY; i <= adjustedEndY; i++) {
        const renderY = i * this.tileHeight - this.viewportY;
        context.fillRect(0, renderY, this.viewportWidth, LINE_SIZE);
    }

    for (let j = startX; j <= adjustedEndX; j++) {
        const renderX = j * this.tileWidth - this.viewportX;
        context.fillRect(renderX, 0, LINE_SIZE, this.viewportHeight);
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