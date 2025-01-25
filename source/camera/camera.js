import { lerpValue } from "../math/math.js";

export const Camera = function() {    
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportX_limit = 0;
    this.viewportY_limit = 0;
    this.viewportWidth = 0;
    this.viewportHeight = 0;

    this.worldWidth = 0;
    this.worldHeight = 0;

    this.viewportMode = Camera.VIEWPORT_MODE.DRAG;
    this.viewportType = Camera.VIEWPORT_TYPE.BOUND;
}

Camera.VIEWPORT_TYPE = {
    FREE: 0,
    BOUND: 1
};

Camera.VIEWPORT_MODE = {
    FIXED: 0,
    FOLLOW: 1,
    DRAG: 2
};

Camera.prototype.update = function(gameContext, renderContext) {}

Camera.prototype.loadWorld = function(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
}

Camera.prototype.centerWorld = function() {
    const positionX = this.worldWidth / 2;
    const positionY = this.worldHeight / 2;

    this.centerViewport(positionX, positionY);
}

Camera.prototype.reloadViewport = function() {
    if(this.worldWidth <= this.viewportWidth) {
        this.viewportX_limit = 0;
    } else {
        this.viewportX_limit = this.worldWidth - this.viewportWidth;
    }

    if(this.worldHeight <= this.viewportHeight) {
        this.viewportY_limit = 0;
    } else {
        this.viewportY_limit = this.worldHeight - this.viewportHeight;
    }

    this.limitViewport();
}

Camera.prototype.alignViewport = function() {
    if(this.worldWidth < this.viewportWidth) {
        this.viewportWidth = this.worldWidth;
    }

    if(this.worldHeight < this.viewportHeight) {
        this.viewportHeight = this.worldHeight;
    }
}

Camera.prototype.limitViewport = function() {
    if(this.viewportType !== Camera.VIEWPORT_TYPE.BOUND) {
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

Camera.prototype.moveViewport = function(viewportX, viewportY) {
    if(this.viewportMode === Camera.VIEWPORT_MODE.FIXED) {
        return;
    }

    this.viewportX = Math.trunc(viewportX);
    this.viewportY = Math.trunc(viewportY);

    this.limitViewport();
}

Camera.prototype.setViewport = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
}

Camera.prototype.dragViewport = function(dragX, dragY) {
    if(this.viewportMode !== Camera.VIEWPORT_MODE.DRAG) {
        return;
    }

    const positionX = this.viewportX + dragX;
    const positionY = this.viewportY + dragY;
    
    this.moveViewport(positionX, positionY);
}

Camera.prototype.centerViewport = function(positionX, positionY) {
    const viewportX = positionX - this.viewportWidth / 2;
    const viewportY = positionY - this.viewportHeight / 2;

    this.moveViewport(viewportX, viewportY);
}

Camera.prototype.bindViewport = function() {
    this.viewportType = Camera.VIEWPORT_TYPE.BOUND;
    this.limitViewport();
}

Camera.prototype.unbindViewport = function() {
    this.viewportType = Camera.VIEWPORT_TYPE.FREE;
    this.limitViewport();
}

Camera.prototype.getViewport = function() {
    return {
        "x": this.viewportX,
        "y": this.viewportY,
        "w": this.viewportWidth,
        "h": this.viewportHeight
    }
}

Camera.prototype.addTarget = function(targetX = 0, targetY = 0, factor = 0) {
    if(this.viewportMode !== Camera.VIEWPORT_MODE.FOLLOW) {
        return;
    }

    this.targets.push([targetX, targetY, factor]);
}

Camera.prototype.followTargets = function(deltaTime) {
    if(this.viewportMode !== Camera.VIEWPORT_MODE.FOLLOW || this.targets.length === 0) {
        return;
    }

    const threshold = 10;
    const [positionX, positionY, factor] = this.targets[0];
    const smoothingFactor = factor * deltaTime;

    const targetX = positionX - this.viewportWidth / 2;
    const targetY = positionY - this.viewportHeight / 2;

    const distanceX = targetX - this.viewportX;
    const distanceY = targetY - this.viewportY;

    if(Math.abs(distanceX) < threshold && Math.abs(distanceY) < threshold) {
        this.moveViewport(targetX, targetY);
        this.targets.shift();
        
        if(this.targets.length === 0) {
            //TODO: When all targets are reached: emit an "ALL_TARGETS_REACHED" event
            //THEN: Allow draggin again?
        }

        return;
    }

    if(smoothingFactor !== 0) {
        const viewportX = lerpValue(this.viewportX, targetX, smoothingFactor);
        const viewportY = lerpValue(this.viewportY, targetY, smoothingFactor);
        this.moveViewport(viewportX, viewportY);
    } else {
        this.moveViewport(targetX, targetY);
    }
}
