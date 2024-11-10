import { EventEmitter } from "../events/eventEmitter.js";
import { Vec2 } from "../math/vec2.js";

export const Camera = function(positionX, positionY, width, height) {
    this.id = "CAMERA";
    this.position = new Vec2(positionX, positionY);
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.mode = Camera.MODE_AUTO;
    this.scale = 1;
    this.events = new EventEmitter();
    this.events.listen(Camera.EVENT_VIEWPORT_RESIZE);
}

Camera.EVENT_VIEWPORT_RESIZE = "EVENT_VIEWPORT_RESIZE";
Camera.MODE_AUTO = 0;
Camera.MODE_FIXED = 1;
Camera.MODE_FORCED = 2;
Camera.TILE_WIDTH = 96;
Camera.TILE_HEIGHT = 96;

Camera.prototype.update = function(gameContext) {}

Camera.prototype.screenToWorldTile = function(screenX, screenY) {
    const { x, y } = this.getViewportPosition();
    const worldTileX = Math.floor((screenX / this.scale + x) / Camera.TILE_WIDTH);
    const worldTileY = Math.floor((screenY / this.scale + y) / Camera.TILE_HEIGHT);

    return {
        "x": worldTileX,
        "y": worldTileY
    }
}

Camera.prototype.screenToWorld = function(screenX, screenY) {
    const { x, y } = this.getViewportPosition();
    const worldX = Math.floor(screenX / this.scale + x);
    const worldY = Math.floor(screenY / this.scale + y);

    return {
        "x": worldX,
        "y": worldY
    }
}

Camera.prototype.getBounds = function() {
    return {
        "x": this.position.x,
        "y": this.position.y,
        "w": this.viewportWidth,
        "h": this.viewportHeight
    }
}

Camera.prototype.setPosition = function(x = 0, y = 0) {
    if(this.mode === Camera.MODE_AUTO) {
        this.position.x = 0;
        this.position.y = 0;
    } else {
        this.position.x = Math.floor(x);
        this.position.y = Math.floor(y);
    }
}

Camera.prototype.getPosition = function() {
    return this.position;
}

Camera.prototype.getViewportPosition = function() {
    return {
        "x": this.viewportX - this.position.x,
        "y": this.viewportY - this.position.y
    }
}

Camera.prototype.getViewportWidth = function() {
    return this.viewportWidth / this.scale;
}

Camera.prototype.getViewportHeight = function() {
    return this.viewportHeight / this.scale;
}

Camera.prototype.onWindowResize = function(width, height) {
    if(this.mode === Camera.MODE_AUTO) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    } else if(this.mode === Camera.MODE_FIXED) {
        //keep anchor of camera
        //TODO
    }

    this.events.emit(Camera.EVENT_VIEWPORT_RESIZE);
}