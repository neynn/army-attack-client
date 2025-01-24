import { EventEmitter } from "../events/eventEmitter.js";
import { RenderContext } from "./renderContext.js";
import { Vec2 } from "../math/vec2.js";

export const CameraContext = function(id, camera) {
    this.id = id;
    this.position = new Vec2(0, 0);
    this.positionMode = CameraContext.POSITION_MODE.AUTO_CENTER;
    this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
    this.camera = camera;
    this.context = null;

    this.events = new EventEmitter();
    this.events.listen(CameraContext.EVENT.RENDER_COMPLETE);
}

CameraContext.EVENT = {
    RENDER_COMPLETE: 0
};

CameraContext.POSITION_MODE = {
    AUTO_CENTER: 0,
    FIXED: 1
};

CameraContext.DISPLAY_MODE = {
    RESOLUTION_DEPENDENT: 0,
    RESOLUTION_FIXED: 1
};

CameraContext.prototype.getPosition = function() {
    return this.position;
}

CameraContext.prototype.setPositionMode = function(modeID) {
    if(CameraContext.POSITION_MODE[modeID] === undefined) {
        console.warn(`Position mode is not supported! ${modeID}`);
        return;
    }

    this.positionMode = modeID;
}

CameraContext.prototype.setDisplayMode = function(modeID) {
    if(CameraContext.DISPLAY_MODE[modeID] === undefined) {
        console.warn(`Display mode is not supported! ${modeID}`);
        return;
    }

    if(modeID === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED && this.context) {
        this.camera.setViewport(this.context.width, this.context.height);
        this.camera.reloadViewport();
    }

    this.displayMode = modeID;
}

CameraContext.prototype.setPosition = function(x = 0, y = 0) {
    switch(this.positionMode) {
        case CameraContext.POSITION_MODE.AUTO_CENTER: {
            this.position.x = Math.floor(x);
            this.position.y = Math.floor(y);
            break;
        }
        case CameraContext.POSITION_MODE.FIXED: {
            break;
        }
        default: {
            console.warn(`Position mode is not supported! ${this.positionMode}`);
            break;
        }
    }
}

CameraContext.prototype.getBounds = function() {
    return {
        "x": this.position.x,
        "y": this.position.y,
        "w": this.camera.viewportWidth,
        "h": this.camera.viewportHeight
    }
}

CameraContext.prototype.getCamera = function() {
    return this.camera;
}

CameraContext.prototype.reloadCamera = function(windowWidth, windowHeight) {
    if(this.positionMode === CameraContext.POSITION_MODE.AUTO_CENTER) {
        if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
            this.camera.cutViewport(windowWidth, windowHeight);
        }

        const { x, y } = this.camera.getCenterOffset(windowWidth, windowHeight);
        this.setPosition(x, y);
    }

    this.camera.reloadViewport();
}

CameraContext.prototype.onWindowResize = function(windowWidth, windowHeight) {
    if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.forceResize(windowWidth, windowHeight);
    }

    this.reloadCamera(windowWidth, windowHeight);
}

CameraContext.prototype.forceResize = function(width, height) {
    this.camera.setViewport(width, height);

    if(this.context) {
        this.context.resize(width, height);
    }
}

CameraContext.prototype.initRenderer = function(width, height) {
    if(!this.context) {
        this.context = new RenderContext();
        this.context.init(width, height, false);
    }
}

CameraContext.prototype.destroyRenderer = function() {
    this.context = null;
    this.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT);
}

CameraContext.prototype.update = function(gameContext, context) {
    switch(this.displayMode) { 
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            context.translate(this.position.x, this.position.y);
            this.camera.update(gameContext, context);
            this.events.emit(CameraContext.EVENT.RENDER_COMPLETE, context);
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            this.context.clear();
            this.camera.update(gameContext, this.context.context);
            this.events.emit(CameraContext.EVENT.RENDER_COMPLETE, this.context.context);
            context.drawImage(
                this.context.canvas, 0, 0, this.context.width, this.context.height,
                this.position.x, this.position.y, this.context.width, this.context.height
            );
            break;
        }
    }
}
