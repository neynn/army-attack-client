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

Camera.prototype.cutViewport = function(windowWidth, windowHeight) {}

Camera.prototype.update = function(gameContext) {}

Camera.prototype.setMode = function(modeID = Camera.VIEWPORT_MODE_AUTO) {
    this.viewportMode = modeID;
}

Camera.prototype.getMode = function() {
    return this.viewportMode;
}

Camera.prototype.setViewport = function(viewportWidth = 0, viewportHeight = 0) {
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

Camera.prototype.centerPosition = function(windowWidth, windowHeight) {
    const offsetX = (windowWidth - this.viewportWidth) / 2;
    const offsetY = (windowHeight - this.viewportHeight) / 2;

    this.setPosition(offsetX, offsetY);
}

Camera.prototype.setPosition = function(x = 0, y = 0) {
    if(this.viewportMode === Camera.VIEWPORT_MODE_FORCED) {
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

Camera.prototype.reloadViewport = function() {} 

Camera.prototype.onWindowResize = function(width, height) {
    switch(this.viewportMode) {
        case Camera.VIEWPORT_MODE_AUTO: {
            this.setViewport(width, height);
            this.cutViewport(width, height);
            this.centerPosition(width, height);
            break;
        }
        case Camera.VIEWPORT_MODE_FORCED: {
            this.setViewport(width, height);
            break;
        }
    }

    this.reloadViewport();
}