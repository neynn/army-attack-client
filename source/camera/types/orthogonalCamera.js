import { clampValue } from "../../math/math.js";
import { MoveableCamera } from "./moveableCamera.js";

export const OrthogonalCamera = function(positionX, positionY, viewportWidth, viewportHeight) {
    MoveableCamera.call(this, positionX, positionY, viewportWidth, viewportHeight);

    this.tileWidth = 0;
    this.tileHeight = 0;
    this.mapWidth = 0;
    this.mapHeight = 0;
}

OrthogonalCamera.prototype = Object.create(MoveableCamera.prototype);
OrthogonalCamera.prototype.constructor = OrthogonalCamera;

OrthogonalCamera.prototype.loadTile = function(tileWidth, tileHeight) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
}

OrthogonalCamera.prototype.loadWorld = function(mapWidth, mapHeight) {
    const worldWidth = mapWidth * this.tileWidth;
    const worldHeight = mapHeight * this.tileHeight;

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.reloadViewportLimit();
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