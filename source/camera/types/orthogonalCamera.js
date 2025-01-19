import { clampValue } from "../../math/math.js";
import { Renderer } from "../../renderer.js";
import { MoveableCamera } from "./moveableCamera.js";

export const OrthogonalCamera = function() {
    MoveableCamera.call(this);

    this.tileWidth = 0;
    this.tileHeight = 0;
    this.halfTileWidth = 0;
    this.halfTileHeight = 0;
    this.mapWidth = 0;
    this.mapHeight = 0;
}

OrthogonalCamera.prototype = Object.create(MoveableCamera.prototype);
OrthogonalCamera.prototype.constructor = OrthogonalCamera;

OrthogonalCamera.MAP_OUTLINE_COLOR = "#dddddd";
OrthogonalCamera.EMPTY_TILE_COLOR = { "FIRST": "#000000", "SECOND": "#701867" };

OrthogonalCamera.prototype.drawCustomLayer = function(layer, worldBounds, onDraw) {
    const { startX, startY, endX, endY } = worldBounds;
    const { x, y } = this.getViewportPosition();

    for(let i = startY; i <= endY; i++) {
        const row = i * this.mapWidth;
        const renderY = i * this.tileHeight - y;

        for(let j = startX; j <= endX; j++) {
            const index = row + j;
            const id = layer[index];
            const renderX = j * this.tileWidth - x;

            onDraw(id, renderX, renderY);
        }
    }
}

OrthogonalCamera.prototype.drawTileLayer = function(gameContext, layer, worldBounds) {
    const { startX, startY, endX, endY } = worldBounds;
    const { x, y } = this.getViewportPosition();

    for(let i = startY; i <= endY; i++) {
        const row = i * this.mapWidth;
        const renderY = i * this.tileHeight - y;

        for(let j = startX; j <= endX; j++) {
            const index = row + j;
            const id = layer[index];

            if(id === 0) {
                continue;
            }

            const renderX = j * this.tileWidth - x;

            this.drawTileGraphics(gameContext, id, renderX, renderY);
        }
    }
}

OrthogonalCamera.prototype.drawSpriteLayers = function(gameContext, layers) {
    const { timer, renderer, spriteManager } = gameContext;
    const { x, y } = this.getViewportPosition(); 
    const context = renderer.getContext();
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();
    const viewportLeftEdge = this.viewportX;
    const viewportTopEdge = this.viewportY;
    const viewportRightEdge = viewportLeftEdge + this.getViewportWidth();
    const viewportBottomEdge = viewportTopEdge + this.getViewportHeight();

    for(let i = 0; i < layers.length; i++) {
        const visibleSprites = [];
        const spriteLayer = spriteManager.getLayer(layers[i]);

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
            sprite.draw(context, x, y);
        }
    
        if((Renderer.DEBUG & Renderer.DEBUG_SPRITES) !== 0) {
            for(let j = 0; j < visibleSprites.length; j++) {
                const sprite = visibleSprites[j];
        
                sprite.debug(context, x, y);
            }
        }
    }
}

OrthogonalCamera.prototype.drawTileGraphics = function(gameContext, tileID, renderX, renderY, scaleX = 1, scaleY = 1) {
    const { tileManager, renderer } = gameContext;
    const { resources } = tileManager;
    const { set, animation } = tileManager.getTileMeta(tileID);
    const tileBuffer = resources.getImage(set);

    if(!tileBuffer) {
        return;
    }

    const tileType = tileManager.tileTypes[set];
    const tileAnimation = tileType.getAnimation(animation);
    const currentFrame = tileAnimation.getCurrentFrame();
    const context = renderer.getContext();

    for(const component of currentFrame) {
        const { id, shiftX, shiftY } = component;
        const { x, y, w, h } = tileType.getFrameByID(id);
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

OrthogonalCamera.prototype.drawTileOutlines = function(context) {
    const { x, y } = this.getViewportPosition();
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();
    const lineSize = 1 / this.scale;

    context.fillStyle = OrthogonalCamera.MAP_OUTLINE_COLOR;

    for(let i = 0; i <= this.mapHeight; i++) {
        const renderY = i * this.tileHeight - y;
        context.fillRect(0, renderY, viewportWidth + this.tileHeight, lineSize);
    }

    for (let j = 0; j <= this.mapWidth; j++) {
        const renderX = j * this.tileWidth - x;
        context.fillRect(renderX, 0, lineSize, viewportHeight + this.tileHeight);
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

OrthogonalCamera.prototype.screenToWorldTile = function(screenX, screenY) {
    const { x, y } = this.getViewportPosition();
    const worldTileX = Math.floor((screenX / this.scale + x) / this.tileWidth);
    const worldTileY = Math.floor((screenY / this.scale + y) / this.tileHeight);

    return {
        "x": worldTileX,
        "y": worldTileY
    }
}

OrthogonalCamera.prototype.getWorldBounds = function() {
    const offsetX = 0;
    const offsetY = 1;
    const startX = Math.floor(this.viewportX / this.tileWidth);
    const startY = Math.floor(this.viewportY / this.tileHeight);
    const endX = Math.floor((this.viewportX + this.getViewportWidth()) / this.tileWidth) + offsetX;
    const endY = Math.floor((this.viewportY + this.getViewportHeight()) / this.tileHeight) + offsetY;
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
    const tileX = Math.trunc(positionX / this.tileWidth);
	const tileY = Math.trunc(positionY / this.tileHeight);

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