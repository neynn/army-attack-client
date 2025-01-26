import { EventEmitter } from "../events/eventEmitter.js";
import { RenderContext } from "./renderContext.js";
import { Vec2 } from "../math/vec2.js";
import { clampValue } from "../math/math.js";

export const CameraContext = function(id, camera) {
    this.id = id;
    this.position = new Vec2(0, 0);
    this.camera = camera;
    this.context = null;
    this.scale = CameraContext.BASE_SCALE;
    this.scaleMode = CameraContext.SCALE_MODE.WHOLE;
    this.positionMode = CameraContext.POSITION_MODE.AUTO_CENTER;
    this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;

    this.events = new EventEmitter();
    this.events.listen(CameraContext.EVENT.RENDER_COMPLETE);
    this.events.listen(CameraContext.EVENT.REQUEST_WINDOW);
}

CameraContext.BASE_SCALE = 1;

CameraContext.EVENT = {
    RENDER_COMPLETE: 0,
    REQUEST_WINDOW: 1
};

CameraContext.POSITION_MODE = {
    AUTO_CENTER: 0,
    FIXED: 1,
    FIXED_ORIGIN: 2
};

CameraContext.DISPLAY_MODE = {
    RESOLUTION_DEPENDENT: 0,
    RESOLUTION_FIXED: 1
};

CameraContext.SCALE_MODE = {
    WHOLE: 0,
    FRACTURED: 1
};

CameraContext.prototype.getPosition = function() {
    return this.position;
}

CameraContext.prototype.setScaleMode = function(modeID) {
    if(!Object.values(CameraContext.SCALE_MODE).includes(modeID)) {
        console.warn(`Scale mode is not supported! ${modeID}`);
        return;
    }

    this.scaleMode = modeID;
    this.events.emit(CameraContext.EVENT.REQUEST_WINDOW, (width, height) => this.refresh(width, height));
}

CameraContext.prototype.setPositionMode = function(modeID) {
    if(!Object.values(CameraContext.POSITION_MODE).includes(modeID)) {
        console.warn(`Position mode is not supported! ${modeID}`);
        return;
    }

    if(modeID === CameraContext.POSITION_MODE.FIXED_ORIGIN) {
        this.setPosition(0, 0);
    }

    this.positionMode = modeID;
    this.events.emit(CameraContext.EVENT.REQUEST_WINDOW, (width, height) => this.refresh(width, height));
}

CameraContext.prototype.setDisplayMode = function(modeID) {
    if(!Object.values(CameraContext.DISPLAY_MODE).includes(modeID)) {
        console.warn(`Display mode is not supported! ${modeID}`);
        return;
    }

    switch(modeID) {
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            this.displayMode = modeID;
            this.scale = CameraContext.BASE_SCALE;
            this.events.emit(CameraContext.EVENT.REQUEST_WINDOW, (width, height) => {
                this.camera.setViewport(width, height);
                this.refresh(width, height);
            });
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            if(this.context) {
                this.displayMode = modeID;
                this.camera.setViewport(this.context.width, this.context.height);
                this.events.emit(CameraContext.EVENT.REQUEST_WINDOW, (width, height) => this.refresh(width, height));
            }
            break;
        }
    }
}

CameraContext.prototype.setPosition = function(x, y) {
    this.position.x = Math.floor(x);
    this.position.y = Math.floor(y);
}

CameraContext.prototype.dragCamera = function(deltaX, deltaY) {
    const dragX = deltaX / this.scale;
    const dragY = deltaY / this.scale;

    this.camera.dragViewport(dragX, dragY);
}

CameraContext.prototype.getWorldPosition = function(screenX, screenY) {
    const { x, y } = this.camera.getViewport();

    return {
        "x": (screenX - this.position.x) / this.scale + x,
        "y": (screenY - this.position.y) / this.scale + y
    }
}

CameraContext.prototype.getBounds = function() {
    const { w, h } = this.camera.getViewport();

    return {
        "x": this.position.x,
        "y": this.position.y,
        "w": w * this.scale,
        "h": h * this.scale
    }
}

CameraContext.prototype.getCamera = function() {
    return this.camera;
}

CameraContext.prototype.refresh = function(windowWidth, windowHeight) {
    this.reloadFixedScale(windowWidth, windowHeight);

    if(this.positionMode === CameraContext.POSITION_MODE.AUTO_CENTER) {
        if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
            this.camera.alignViewport();
        }

        this.centerCamera(windowWidth, windowHeight);
    }

    this.camera.reloadViewport();
}

CameraContext.prototype.onWindowResize = function(windowWidth, windowHeight) {
    if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.camera.setViewport(windowWidth, windowHeight);
    }

    this.refresh(windowWidth, windowHeight);
}

CameraContext.prototype.centerCamera = function(windowWidth, windowHeight) {
    const { w, h } = this.camera.getViewport();
    const positionX = (windowWidth - this.scale * w) * 0.5;
    const positionY = (windowHeight - this.scale * h) * 0.5;

    this.setPosition(positionX, positionY);
}

CameraContext.prototype.getScale = function(windowWidth, windowHeight) {
    if(!this.context) {
        return {
            "x": CameraContext.BASE_SCALE,
            "y": CameraContext.BASE_SCALE
        }
    }

    switch(this.scaleMode) {
        case CameraContext.SCALE_MODE.FRACTURED: {
            return {
                "x": windowWidth / this.context.width,
                "y": windowHeight / this.context.height
            }
        }
        case CameraContext.SCALE_MODE.WHOLE: {
            return {
                "x": Math.floor(windowWidth / this.context.width),
                "y": Math.floor(windowHeight / this.context.height)
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

CameraContext.prototype.reloadFixedScale = function(windowWidth, windowHeight) {
    if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        return;
    }

    if(this.positionMode === CameraContext.POSITION_MODE.FIXED) {
        windowWidth -= this.position.x;
        windowHeight -= this.position.y;
    }

    const { x, y } = this.getScale(windowWidth, windowHeight);
    const scale = Math.min(x, y);

    this.scale = clampValue(scale, Infinity, CameraContext.BASE_SCALE);
}

CameraContext.prototype.initRenderer = function(width, height) {
    if(!this.context) {
        this.context = new RenderContext();
        this.context.init(width, height, false);
    }
}

CameraContext.prototype.setResolution = function(width, height) {
    if(this.context) {
        this.context.resize(width, height);

        if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
            this.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
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
            mainContext.translate(this.position.x, this.position.y);
            this.camera.update(gameContext, mainContext);
            this.events.emit(CameraContext.EVENT.RENDER_COMPLETE, mainContext);
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            const { canvas, context, width, height } = this.context;
            const { x, y, w, h } = this.getBounds();

            this.context.clear();
            this.camera.update(gameContext, context);
            this.events.emit(CameraContext.EVENT.RENDER_COMPLETE, context);
            mainContext.drawImage(canvas, 0, 0, width, height, x, y, w, h);
            break;
        }
    }
}
