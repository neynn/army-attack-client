import { Camera } from "../camera.js";
import { lerpValue } from "../../math/math.js";

export const MoveableCamera = function() {
    Camera.call(this);
    
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportX_limit = 0;
    this.viewportY_limit = 0;
    
    this.worldWidth = 0;
    this.worldHeight = 0;

    this.viewportMode = MoveableCamera.VIEWPORT_MODE.DRAG;
    this.viewportType = MoveableCamera.VIEWPORT_TYPE.BOUND;
}

MoveableCamera.VIEWPORT_TYPE = {
    FREE: 0,
    BOUND: 1
};

MoveableCamera.VIEWPORT_MODE = {
    FIXED: 0,
    FOLLOW: 1,
    DRAG: 2
};

MoveableCamera.prototype = Object.create(Camera.prototype);
MoveableCamera.prototype.constructor = MoveableCamera;

MoveableCamera.prototype.loadWorld = function(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
}

MoveableCamera.prototype.centerWorld = function() {
    const positionX = this.worldWidth / 2;
    const positionY = this.worldHeight / 2;

    this.centerViewport(positionX, positionY);
}

MoveableCamera.prototype.reloadViewport = function() {
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();

    if(this.worldWidth <= viewportWidth) {
        this.viewportX_limit = 0;
    } else {
        this.viewportX_limit = this.worldWidth - viewportWidth;
    }

    if(this.worldHeight <= viewportHeight) {
        this.viewportY_limit = 0;
    } else {
        this.viewportY_limit = this.worldHeight - viewportHeight;
    }

    this.limitViewport();
}

MoveableCamera.prototype.cutViewport = function(windowWidth, windowHeight) {
    if(this.worldWidth < windowWidth) {
        this.viewportWidth = this.worldWidth;
    }

    if(this.worldHeight < windowHeight) {
        this.viewportHeight = this.worldHeight;
    }
}

MoveableCamera.prototype.limitViewport = function() {
    if(this.viewportType !== MoveableCamera.VIEWPORT_TYPE.BOUND) {
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

MoveableCamera.prototype.moveViewport = function(viewportX, viewportY) {
    if(this.viewportMode === MoveableCamera.VIEWPORT_MODE.FIXED) {
        return;
    }

    this.viewportX = Math.trunc(viewportX);
    this.viewportY = Math.trunc(viewportY);

    this.limitViewport();
}

MoveableCamera.prototype.dragViewport = function(param_dragX, param_dragY) {
    if(this.viewportMode !== MoveableCamera.VIEWPORT_MODE.DRAG) {
        return;
    }

    const viewportX = this.viewportX + param_dragX / this.scale;
    const viewportY = this.viewportY + param_dragY / this.scale;
    
    this.moveViewport(viewportX, viewportY);
}

MoveableCamera.prototype.centerViewport = function(positionX, positionY) {
    const viewportX = positionX - this.getViewportWidth() / 2;
    const viewportY = positionY - this.getViewportHeight() / 2;

    this.moveViewport(viewportX, viewportY);
}

MoveableCamera.prototype.bindViewport = function() {
    this.viewportType = MoveableCamera.VIEWPORT_TYPE.BOUND;
    this.limitViewport();
}

MoveableCamera.prototype.unbindViewport = function() {
    this.viewportType = MoveableCamera.VIEWPORT_TYPE.FREE;
    this.limitViewport();
}

MoveableCamera.prototype.screenToWorld = function(screenX, screenY) {
    const { x, y } = this.getViewportPosition();
    const worldX = Math.floor(screenX / this.scale + x);
    const worldY = Math.floor(screenY / this.scale + y);

    return {
        "x": worldX,
        "y": worldY
    }
}

MoveableCamera.prototype.getViewportPosition = function() {
    return {
        "x": this.viewportX - this.position.x,
        "y": this.viewportY - this.position.y
    }
}

MoveableCamera.prototype.addTarget = function(targetX = 0, targetY = 0, factor = 0) {
    if(this.viewportMode !== MoveableCamera.VIEWPORT_MODE.FOLLOW) {
        return;
    }

    this.targets.push([targetX, targetY, factor]);
}

MoveableCamera.prototype.followTargets = function(deltaTime) {
    if(this.viewportMode !== MoveableCamera.VIEWPORT_MODE.FOLLOW || this.targets.length === 0) {
        return;
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
