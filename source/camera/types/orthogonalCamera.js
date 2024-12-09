import { clampValue } from "../../math/math.js";
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

OrthogonalCamera.prototype.drawEmptyTile = function(context, renderX, renderY, scaleX = 1, scaleY = 1) {
    const scaledX = this.halfTileWidth * scaleX;
    const scaledY = this.halfTileHeight * scaleY;

    context.fillStyle = "#000000";
    context.fillRect(renderX, renderY, scaledX, scaledY);
    context.fillRect(renderX + scaledX, renderY + scaledY, scaledX, scaledY);

    context.fillStyle = "#701867";
    context.fillRect(renderX + scaledX, renderY, scaledX, scaledY);
    context.fillRect(renderX, renderY + scaledY, scaledX, scaledY);
}