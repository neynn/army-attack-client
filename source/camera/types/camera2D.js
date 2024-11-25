import { Camera } from "../camera.js";
import { clampValue, lerpValue } from "../../math/math.js";
import { EventEmitter } from "../../events/eventEmitter.js";

export const Camera2D = function(positionX, positionY, width, height) {
    Camera.call(this, positionX, positionY, width, height);

    this.viewportX_limit = 0;
    this.viewportY_limit = 0;

    this.mapWidth = 0;
    this.mapHeight = 0;

    this.isBound = false;
    this.isFixed = false;
    this.isFollowing = false;
    this.isDragging = true;

    this.targets = [];
    this.events.subscribe(Camera.EVENT_VIEWPORT_RESIZE, EventEmitter.SUPER_SUBSCRIBER_ID, (width, height) => this.loadViewport(this.mapWidth, this.mapHeight));
}

Camera2D.prototype = Object.create(Camera.prototype);
Camera2D.prototype.constructor = Camera2D;

Camera2D.prototype.getViewportBounds = function() {
    const offsetX = 0;
    const offsetY = 1;
    const startX = Math.floor(this.viewportX / Camera.TILE_WIDTH);
    const startY = Math.floor(this.viewportY / Camera.TILE_HEIGHT);
    const endX = Math.floor((this.viewportX + this.getViewportWidth()) / Camera.TILE_WIDTH) + offsetX;
    const endY = Math.floor((this.viewportY + this.getViewportHeight()) / Camera.TILE_HEIGHT) + offsetY;
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

Camera2D.prototype.centerOnMap = function() {
    const width = this.mapWidth * Camera.TILE_WIDTH;
    const height = this.mapHeight * Camera.TILE_HEIGHT;

    this.centerViewport(width / 2, height / 2);
}

Camera2D.prototype.loadViewport = function(mapWidth, mapHeight) {
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();
    const width = mapWidth * Camera.TILE_WIDTH;
    const height = mapHeight * Camera.TILE_HEIGHT;

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    if(width <= viewportWidth) {
        this.viewportX_limit = 0;
    } else {
        this.viewportX_limit = width - viewportWidth;
    }

    if(height <= viewportHeight) {
        this.viewportY_limit = 0;
    } else {
        this.viewportY_limit = height - viewportHeight;
    }

    this.limitViewport();
}

Camera2D.prototype.limitViewport = function() {
    if(!this.isBound) {
        return;
    }

    if(this.viewportX < 0) {
        this.viewportX = 0;
    } else if(this.viewportX >= this.viewportX_limit) {
        this.viewportX = this.viewportX_limit;
    }
  
    if(this.viewportY < 0) {
        this.viewportY = 0;
    } else if(this.viewportY >= this.viewportY_limit) {
        this.viewportY = this.viewportY_limit;
    }
}

Camera2D.prototype.moveViewport = function(viewportX, viewportY) {
    if(this.isFixed) {
        return;
    }

    this.viewportX = Math.trunc(viewportX);
    this.viewportY = Math.trunc(viewportY);

    this.limitViewport();
}

Camera2D.prototype.dragViewport = function(param_dragX, param_dragY) {
    if(!this.isDragging) {
        return;
    }

    const viewportX = this.viewportX + param_dragX / this.scale;
    const viewportY = this.viewportY + param_dragY / this.scale;
    
    this.moveViewport(viewportX, viewportY);
}

Camera2D.prototype.centerViewport = function(positionX, positionY) {
    const viewportX = positionX - this.getViewportWidth() / 2;
    const viewportY = positionY - this.getViewportHeight() / 2;

    this.moveViewport(viewportX, viewportY);
}

Camera2D.prototype.bindViewport = function() {
    this.isBound = true;
    this.loadViewport(this.mapWidth, this.mapHeight);
}

Camera2D.prototype.unbindViewport = function() {
    this.isBound = false;
    this.loadViewport(this.mapWidth, this.mapHeight);
}

Camera2D.prototype.addTarget = function(targetX = 0, targetY = 0, factor = 0) {
    if(!this.isFollowing) {
        return;
    }

    this.targets.push([targetX, targetY, factor]);
    this.isDragging = false;
}

Camera2D.prototype.followTargets = function(deltaTime) {
    if(!this.isFollowing || this.targets.length === 0) {
        return false;
    }

    const threshold = 10;
    const [positionX, positionY, factor] = this.targets[0];
    const smoothingFactor = factor * deltaTime;

    const targetX = positionX - this.getViewportWidth() / 2;
    const targetY = positionY - this.getViewportHeight() / 2;

    const distanceX = targetX - this.viewportX;
    const distanceY = targetY - this.viewportY;

    if(Math.abs(distanceX) < threshold && Math.abs(distanceY) < threshold) {
        this.moveViewport(targetX, targetY);
        this.targets.shift();
        
        if(this.targets.length === 0) {
            this.isDragging = true;
        }

        return true;
    }

    if(smoothingFactor !== 0) {
        const viewportX = lerpValue(this.viewportX, targetX, smoothingFactor);
        const viewportY = lerpValue(this.viewportY, targetY, smoothingFactor);
        this.moveViewport(viewportX, viewportY);
    } else {
        this.moveViewport(targetX, targetY);
    }

    return false;
}
