import { Vec2 } from "../math/vec2.js";

export const Camera = function() {
    this.position = new Vec2(0, 0);
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.viewportMode = Camera.VIEWPORT_MODE_AUTO;
    this.scale = 1;
}

Camera.VIEWPORT_MODE_AUTO = 0;
Camera.VIEWPORT_MODE_FIXED = 1;
Camera.VIEWPORT_MODE_FORCED = 2;

Camera.prototype.update = function(gameContext) {}

Camera.prototype.getMode = function() {
    return this.viewportMode;
}

Camera.prototype.loadViewport = function(positionX = 0, positionY = 0, viewportWidth = 0, viewportHeight = 0) {
    this.position.x = positionX;
    this.position.y = positionY;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
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
    if(this.viewportMode === Camera.VIEWPORT_MODE_AUTO) {
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

Camera.prototype.getViewportWidth = function() {
    return this.viewportWidth / this.scale;
}

Camera.prototype.getViewportHeight = function() {
    return this.viewportHeight / this.scale;
}

Camera.prototype.onViewportResize = function() {} 

Camera.prototype.onWindowResize = function(width, height) {
    if(this.viewportMode === Camera.VIEWPORT_MODE_AUTO) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    } else if(this.viewportMode === Camera.VIEWPORT_MODE_FIXED) {
        //TODO
    }

    this.onViewportResize();
}