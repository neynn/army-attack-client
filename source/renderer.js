import { Camera } from "./camera/camera.js";
import { RenderContext } from "./camera/renderContext.js";
import { FPSCounter } from "./camera/fpsCounter.js";
import { EffectManager } from "./effects/effectManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { isRectangleRectangleIntersect } from "./math/math.js";
import { CameraContext } from "./camera/cameraContext.js";

export const Renderer = function() {
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    this.effects = new EffectManager();
    this.fpsCounter = new FPSCounter();
    this.display = new RenderContext();
    this.display.init(this.windowWidth, this.windowHeight, true);

    this.events = new EventEmitter();
    this.events.listen(Renderer.EVENT.SCREEN_RESIZE);

    this.contexts = new Map();
    this.contextStack = [];

    window.addEventListener("resize", () => this.resizeDisplay(window.innerWidth, window.innerHeight));
}

Renderer.ANCHOR_TYPE = {
    "TOP_CENTER": "TOP_CENTER",
    "TOP_LEFT": "TOP_LEFT",
    "TOP_RIGHT": "TOP_RIGHT",
    "BOTTOM_CENTER": "BOTTOM_CENTER",
    "BOTTOM_LEFT": "BOTTOM_LEFT",
    "BOTTOM_RIGHT": "BOTTOM_RIGHT",
    "CENTER": "CENTER",
    "LEFT": "LEFT",
    "RIGHT": "RIGHT"
};

Renderer.EVENT = {
    SCREEN_RESIZE: 0
};

Renderer.DEBUG = 0b00000001;
Renderer.DEBUG_CAMERA = 1 << 0;
Renderer.DEBUG_INTERFACE = 1 << 1;
Renderer.DEBUG_SPRITES = 1 << 2;
Renderer.DEBUG_MAP = 1 << 3;

Renderer.prototype.getDrawingContext = function() {
    return this.display.context;
}

Renderer.prototype.getContext = function(contextID) {
    const context = this.contexts.get(contextID);

    if(!context) {
        return null;
    }

    return context;
}

Renderer.prototype.getWidth = function() {
    return this.windowWidth;
}

Renderer.prototype.getHeight = function() {
    return this.windowHeight;
}

Renderer.prototype.getCamera = function(cameraID) {
    const context = this.contexts.get(cameraID);

    if(!context) {
        return null;
    }

    return context.getCamera();
}

Renderer.prototype.reloadCamera = function(cameraID) {
    const context = this.contexts.get(cameraID);

    if(!context) {
        return;
    }

    context.reloadCamera(this.windowWidth, this.windowHeight);
}

Renderer.prototype.addCamera = function(cameraID, camera) {
    if(!(camera instanceof Camera) || this.contexts.has(cameraID)) {
        return;
    }

    const context = new CameraContext(cameraID, camera);

    context.forceResize(this.windowWidth, this.windowHeight);

    this.contexts.set(cameraID, context);
    this.contextStack.push(cameraID);

    return context;
}

Renderer.prototype.removeCamera = function(cameraID) {
    if(!this.contexts.has(cameraID)) {
        return;
    }

    this.contexts.delete(cameraID);

    for(let i = 0; i < this.contextStack.length; i++) {
        const stackedCameraID = this.contextStack[i];

        if(stackedCameraID === cameraID) {
            this.contextStack.splice(i, 1);
            break;
        }
    }
}

Renderer.prototype.drawUI = function(gameContext) {
    const { uiManager, timer } = gameContext;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();
    const interfaceStack = uiManager.getInterfaceStack();

    for(let i = interfaceStack.length - 1; i >= 0; i--) {
        const interfaceElement = interfaceStack[i];
        const { roots } = interfaceElement;

        for(const elementUID of roots) {
            const element = uiManager.getElementByID(elementUID);
           
            element.update(realTime, deltaTime);
            element.draw(this.display.context, 0, 0);
        }
    }
}

Renderer.prototype.drawUIDebug = function(gameContext) {
    const { uiManager } = gameContext;
    const interfaceStack = uiManager.getInterfaceStack();

    for(let i = interfaceStack.length - 1; i >= 0; i--) {
        const interfaceElement = interfaceStack[i];
        const { roots } = interfaceElement;

        for(const elementUID of roots) {
            const element = uiManager.getElementByID(elementUID);
           
            element.debug(this.display.context, 0, 0);
        }
    }
}

Renderer.prototype.drawCameraDebug = function() {
    this.display.context.strokeStyle = "#eeeeee";
    this.display.context.lineWidth = 3;
    this.contexts.forEach(context => this.display.context.strokeRect(context.position.x, context.position.y, context.camera.viewportWidth, context.camera.viewportHeight));
}

Renderer.prototype.update = function(gameContext) {
    const { timer } = gameContext; 
    const renderContext = this.getDrawingContext();
    const deltaTime = timer.getDeltaTime();

    this.display.clear();
    this.fpsCounter.update(deltaTime);

    this.contexts.forEach(context => {
        renderContext.save();
        context.update(gameContext, renderContext);
        renderContext.restore();
    });

    this.effects.update(gameContext);

    if((Renderer.DEBUG & Renderer.DEBUG_CAMERA) !== 0) {
        this.drawCameraDebug();
    }

    this.drawUI(gameContext);

    if((Renderer.DEBUG & Renderer.DEBUG_INTERFACE) !== 0) {
        this.drawUIDebug(gameContext);
    }
}

Renderer.prototype.resizeDisplay = function(width, height) {
    this.windowWidth = width;
    this.windowHeight = height;
    this.display.resize(width, height);
    this.contexts.forEach(context => context.onWindowResize(width, height));
    this.events.emit(Renderer.EVENT.SCREEN_RESIZE, width, height);
}

Renderer.prototype.getAnchor = function(type, originX, originY, width, height) {
    switch(type) {
        case Renderer.ANCHOR_TYPE.TOP_LEFT: return { "x": originX, "y": originY };
        case Renderer.ANCHOR_TYPE.TOP_CENTER: return { "x": this.windowWidth / 2 - originX - width / 2, "y": originY };
        case Renderer.ANCHOR_TYPE.TOP_RIGHT: return { "x": this.windowWidth - originX - width, "y": originY };
        case Renderer.ANCHOR_TYPE.BOTTOM_LEFT: return { "x": originX, "y": this.windowHeight - originY - height };
        case Renderer.ANCHOR_TYPE.BOTTOM_CENTER: return { "x": this.windowWidth / 2 - originX - width / 2, "y": this.windowHeight - originY - height };
        case Renderer.ANCHOR_TYPE.BOTTOM_RIGHT: return { "x": this.windowWidth - originX - width, "y": this.windowHeight - originY - height };
        case Renderer.ANCHOR_TYPE.LEFT: return { "x": originX, "y": this.windowHeight / 2 - originY - height / 2 };
        case Renderer.ANCHOR_TYPE.CENTER: return { "x": this.windowWidth / 2 - originX - width / 2, "y": this.windowHeight / 2 - originY - height / 2 };
        case Renderer.ANCHOR_TYPE.RIGHT: return { "x": this.windowWidth - originX - width, "y": this.windowHeight / 2 - originY - height / 2 };
        default: {
            console.warn(`Anchor Type ${type} does not exist!`);
            return { "x": originX, "y": originY };
        }
    }
}

Renderer.prototype.getCollidedCamera = function(mouseX, mouseY, mouseRange) {
    for(let i = this.contextStack.length - 1; i >= 0; i--) {
        const contextID = this.contextStack[i];
        const context = this.contexts.get(contextID);
        const { x, y, w, h } = context.getBounds();
        const isColliding = isRectangleRectangleIntersect(
            x, y, w, h,
            mouseX, mouseY, mouseRange, mouseRange
        );

        if(isColliding) {
            return context;
        }
    }

    return null;
}