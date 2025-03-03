import { EventEmitter } from "../events/eventEmitter.js";
import { Logger } from "../logger.js";
import { RenderContext } from "./renderContext.js";

export const CameraContext = function(id, camera) {
    this.id = id;
    this.positionX = 0;
    this.positionY = 0;
    this.camera = camera;
    this.context = null;
    this.scale = CameraContext.BASE_SCALE;
    this.scaleMode = CameraContext.SCALE_MODE.WHOLE;
    this.positionMode = CameraContext.POSITION_MODE.AUTO_CENTER;
    this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
    this.windowWidth = 0;
    this.windowHeight = 0;

    this.events = new EventEmitter();
    this.events.listen(CameraContext.EVENT.RENDER_COMPLETE);
    this.events.listen(CameraContext.EVENT.REMOVE);
}

CameraContext.BASE_SCALE = 1;

CameraContext.EVENT = {
    RENDER_COMPLETE: 0,
    REMOVE: 1
};

CameraContext.POSITION_MODE = {
    AUTO_CENTER: 0,
    FIXED: 1,
    ORIGIN: 2
};

CameraContext.DISPLAY_MODE = {
    RESOLUTION_DEPENDENT: 0,
    RESOLUTION_FIXED: 1
};

CameraContext.SCALE_MODE = {
    NONE: 0,
    WHOLE: 1,
    FRACTURED: 2
};

CameraContext.prototype.getID = function() {
    return this.id;
}

CameraContext.prototype.getPosition = function() {
    return this.position;
}

CameraContext.prototype.setWindow = function(windowWidth, windowHeight) {
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;
}

CameraContext.prototype.setScaleMode = function(modeID) {
    if(!Object.values(CameraContext.SCALE_MODE).includes(modeID)) {
        console.warn(`Scale mode is not supported! ${modeID}`);
        return;
    }

    this.scaleMode = modeID;
    this.refresh();
}

CameraContext.prototype.setPositionMode = function(modeID) {
    if(!Object.values(CameraContext.POSITION_MODE).includes(modeID)) {
        console.warn(`Position mode is not supported! ${modeID}`);
        return;
    }

    if(modeID === CameraContext.POSITION_MODE.ORIGIN) {
        this.setPosition(0, 0);
    }

    this.positionMode = modeID;
    this.refresh();
}

CameraContext.prototype.setDisplayMode = function(modeID) {
    switch(modeID) {
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            this.displayMode = modeID;
            this.scale = CameraContext.BASE_SCALE;
            this.camera.setViewport(this.windowWidth, this.windowHeight);
            this.refresh();

            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            if(this.context) {
                this.displayMode = modeID;
                this.camera.setViewport(this.context.width, this.context.height);
                this.refresh();
            }

            break;
        }
        default: {
            Logger.log(Logger.CODE.ENGINE_WARN, "Display mode is not supported!", "CameraContext.prototype.setDisplayMode", { modeID });

            break;
        }
    }
}

CameraContext.prototype.setPosition = function(x, y) {
    this.positionX = Math.floor(x);
    this.positionY = Math.floor(y);
}

CameraContext.prototype.dragCamera = function(deltaX, deltaY) {
    const dragX = deltaX / this.scale;
    const dragY = deltaY / this.scale;

    this.camera.dragViewport(dragX, dragY);
}

CameraContext.prototype.getWorldPosition = function(screenX, screenY) {
    const { x, y } = this.camera.getViewport();

    return {
        "x": (screenX - this.positionX) / this.scale + x,
        "y": (screenY - this.positionY) / this.scale + y
    }
}

CameraContext.prototype.getBounds = function() {
    const { w, h } = this.camera.getViewport();

    return {
        "x": this.positionX,
        "y": this.positionY,
        "w": w * this.scale,
        "h": h * this.scale
    }
}

CameraContext.prototype.getCamera = function() {
    return this.camera;
}

CameraContext.prototype.refreshCamera = function() {
    if(this.positionMode === CameraContext.POSITION_MODE.AUTO_CENTER) {
        if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
            this.camera.alignViewport();
        }

        this.centerCamera();
    }

    this.camera.reloadViewport();
}

CameraContext.prototype.refresh = function() {
    this.reloadFixedScale();
    this.refreshCamera();
}

CameraContext.prototype.onWindowResize = function(windowWidth, windowHeight) {
    this.setWindow(windowWidth, windowHeight);

    if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.camera.setViewport(windowWidth, windowHeight);
    }

    this.refresh();
}

CameraContext.prototype.centerCamera = function() {
    const { w, h } = this.camera.getViewport();
    const positionX = (this.windowWidth - this.scale * w) * 0.5;
    const positionY = (this.windowHeight - this.scale * h) * 0.5;

    this.setPosition(positionX, positionY);
}

CameraContext.prototype.getScale = function(width, height) {
    if(!this.context) {
        return {
            "x": CameraContext.BASE_SCALE,
            "y": CameraContext.BASE_SCALE
        }
    }

    switch(this.scaleMode) {
        case CameraContext.SCALE_MODE.NONE: {
            return {
                "x": CameraContext.BASE_SCALE,
                "y": CameraContext.BASE_SCALE
            }
        }
        case CameraContext.SCALE_MODE.FRACTURED: {
            return {
                "x": width / this.context.width,
                "y": height / this.context.height
            }
        }
        case CameraContext.SCALE_MODE.WHOLE: {
            return {
                "x": Math.floor(width / this.context.width),
                "y": Math.floor(height / this.context.height)
            }
        }
        default: {
            return {
                "x": CameraContext.BASE_SCALE,
                "y": CameraContext.BASE_SCALE
            }
        }
    }
}


CameraContext.prototype.reloadFixedScale = function() {
    if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        return;
    }

    let width = this.windowWidth;
    let height = this.windowHeight;

    if(this.positionMode === CameraContext.POSITION_MODE.FIXED) {
        width -= this.positionY;
        height -= this.positionY;
    }

    const { x, y } = this.getScale(width, height);
    const scale = Math.min(x, y);

    if(scale < CameraContext.BASE_SCALE) {
        this.scale = CameraContext.BASE_SCALE;
    } else {
        this.scale = scale;
    }
}

CameraContext.prototype.initRenderer = function(width, height) {
    if(!this.context) {
        this.context = new RenderContext();
        this.context.init(width, height, RenderContext.TYPE.BUFFER);
    }
}

CameraContext.prototype.setResolution = function(width, height) {
    if(this.context) {
        this.context.resize(width, height);

        if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
            this.camera.setViewport(width, height);
            this.refresh();
        }
    }
}

CameraContext.prototype.destroyRenderer = function() {
    this.context = null;
    this.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT);
}

CameraContext.prototype.update = function(gameContext, mainContext) {
    switch(this.displayMode) { 
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            mainContext.translate(this.positionX, this.positionY);

            this.camera.update(gameContext, mainContext);
            this.events.emit(CameraContext.EVENT.RENDER_COMPLETE, this.camera, mainContext);
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            const { canvas, context, width, height } = this.context;
            const { x, y, w, h } = this.getBounds();

            this.context.clear();
            this.camera.update(gameContext, context);
            this.events.emit(CameraContext.EVENT.RENDER_COMPLETE, this.camera, context);

            mainContext.drawImage(canvas, 0, 0, width, height, x, y, w, h);
            break;
        }
    }
}
