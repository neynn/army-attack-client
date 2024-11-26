import { Vec2 } from "../math/vec2.js";

export const Camera = function(positionX, positionY, viewportWidth, viewportHeight) {
    this.position = new Vec2(positionX, positionY);
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.viewportMode = Camera.VIEWPORT_MODE_AUTO;
    this.scale = 1;
}

Camera.VIEWPORT_MODE_AUTO = 0;
Camera.VIEWPORT_MODE_FIXED = 1;
Camera.VIEWPORT_MODE_FORCED = 2;
Camera.TILE_WIDTH = 96;
Camera.TILE_HEIGHT = 96;
Camera.TILE_WIDTH_HALF = 48;
Camera.TILE_HEIGHT_HALF = 48;

Camera.prototype.update = function(gameContext) {}

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

Camera.prototype.onViewportLoad = function() {} 

Camera.prototype.onWindowResize = function(width, height) {
    if(this.viewportMode === Camera.VIEWPORT_MODE_AUTO) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    } else if(this.viewportMode === Camera.VIEWPORT_MODE_FIXED) {
        //TODO
    }

    this.onViewportLoad(this.viewportWidth, this.viewportHeight);
}