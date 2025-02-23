import { Camera } from "./camera/camera.js";
import { RenderContext } from "./camera/renderContext.js";
import { FPSCounter } from "./camera/fpsCounter.js";
import { EffectManager } from "./effects/effectManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { isRectangleRectangleIntersect } from "./math/math.js";
import { CameraContext } from "./camera/cameraContext.js";

export const Renderer = function() {
    this.contexts = [];
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    this.effects = new EffectManager();
    this.fpsCounter = new FPSCounter();
    this.display = new RenderContext();
    this.display.init(this.windowWidth, this.windowHeight, RenderContext.TYPE.DISPLAY);

    this.events = new EventEmitter();
    this.events.listen(Renderer.EVENT.SCREEN_RESIZE);

    window.addEventListener("resize", () => this.resizeDisplay(window.innerWidth, window.innerHeight));
}

Renderer.EVENT = {
    SCREEN_RESIZE: 0
};

Renderer.DEBUG = {
    CAMERA: true,
    INTERFACE: false,
    SPRITES: false,
    MAP: true
};

Renderer.prototype.getContext = function(id) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const contextID = context.getID();

        if(contextID === id) {
            return context;
        }
    }

    return null;
}

Renderer.prototype.getCamera = function(id) {
    const context = this.getContext(id);

    if(!context) {
        return null;
    }

    return context.getCamera();
}

Renderer.prototype.hasContext = function(id) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const contextID = context.getID();

        if(contextID === id) {
            return true;
        }
    }

    return false;
}

Renderer.prototype.refreshCamera = function(cameraID) {
    const context = this.getContext(cameraID);

    if(!context) {
        return;
    }

    context.refresh(this.windowWidth, this.windowHeight);
}

Renderer.prototype.addCamera = function(cameraID, camera) {
    if(!(camera instanceof Camera) || this.hasContext(cameraID)) {
        return null;
    }

    const context = new CameraContext(cameraID, camera);

    camera.setViewport(this.windowWidth, this.windowHeight);

    context.events.subscribe(CameraContext.EVENT.REQUEST_WINDOW, EventEmitter.SUPER_ID, (onRequest) => onRequest(this.windowWidth, this.windowHeight));

    this.contexts.push(context);

    return context;
}

Renderer.prototype.removeCamera = function(id) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const contextID = context.getID();

        if(contextID === id) {
            this.contexts.splice(i, 1);
            return;
        }
    }
}

Renderer.prototype.drawUI = function(gameContext) {
    const { uiManager, timer } = gameContext;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();
    const interfaceStack = uiManager.getInterfaceStack();

    for(let i = interfaceStack.length - 1; i >= 0; i--) {
        const userInterface = interfaceStack[i];

        userInterface.draw(this.display.context, realTime, deltaTime);
    }
}

Renderer.prototype.drawUIDebug = function(gameContext) {
    const { uiManager } = gameContext;
    const interfaceStack = uiManager.getInterfaceStack();

    for(let i = interfaceStack.length - 1; i >= 0; i--) {
        const userInterface = interfaceStack[i];

        userInterface.debug(this.display.context);
    }
}

Renderer.prototype.drawCameraDebug = function() {
    this.display.context.strokeStyle = "#eeeeee";
    this.display.context.lineWidth = 3;

    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const { x, y, w, h } = context.getBounds();

        this.display.context.strokeRect(x, y, w, h);
    }
}

Renderer.prototype.update = function(gameContext) {
    const { timer } = gameContext; 
    const drawContext = this.display.context;
    const deltaTime = timer.getDeltaTime();

    this.display.clear();
    this.fpsCounter.update(deltaTime);

    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];

        drawContext.save();
        context.update(gameContext, drawContext);
        drawContext.restore();
    }

    this.effects.update(drawContext, deltaTime);

    if(Renderer.DEBUG.CAMERA) {
        this.drawCameraDebug();
    }

    this.drawUI(gameContext);

    if(Renderer.DEBUG.INTERFACE) {
        this.drawUIDebug(gameContext);
    }
}

Renderer.prototype.resizeDisplay = function(width, height) {
    this.windowWidth = width;
    this.windowHeight = height;
    this.display.resize(width, height);

    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];

        context.onWindowResize(width, height)
    }

    this.events.emit(Renderer.EVENT.SCREEN_RESIZE, width, height);
}

Renderer.prototype.getWindow = function() {
    return {
        "w": this.windowWidth,
        "h": this.windowHeight
    }
}

Renderer.prototype.getCollidedContext = function(mouseX, mouseY, mouseRange) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        const context = this.contexts[i];
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