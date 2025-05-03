import { Camera } from "./camera/camera.js";
import { Display } from "./camera/display.js";
import { EffectManager } from "./effects/effectManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { isRectangleRectangleIntersect } from "./math/math.js";
import { CameraContext } from "./camera/cameraContext.js";

export const Renderer = function() {
    this.contexts = [];
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    this.effects = new EffectManager();
    this.display = new Display();
    this.display.init(this.windowWidth, this.windowHeight, Display.TYPE.DISPLAY);

    this.events = new EventEmitter();
    this.events.listen(Renderer.EVENT.SCREEN_RESIZE);
    this.events.listen(Renderer.EVENT.CONTEXT_CREATE);
    this.events.listen(Renderer.EVENT.CONTEXT_DESTROY);

    window.addEventListener("resize", () => this.onWindowResize(window.innerWidth, window.innerHeight));
}

Renderer.EVENT = {
    SCREEN_RESIZE: "SCREEN_RESIZE",
    CONTEXT_CREATE: "CONTEXT_CREATE",
    CONTEXT_DESTROY: "CONTEXT_DESTROY"
};

Renderer.DEBUG = {
    CONTEXT: false,
    INTERFACE: false,
    SPRITES: false,
    MAP: false
};

Renderer.FPS_COLOR = {
    BAD: "#ff0000",
    GOOD: "#00ff00"
};

Renderer.prototype.exit = function() {
    this.contexts.length = 0;
}

Renderer.prototype.getContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            return context;
        }
    }

    return null;
}

Renderer.prototype.hasContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            return true;
        }
    }

    return false;
}

Renderer.prototype.createContext = function(contextID, camera) {
    if(this.hasContext(contextID) || !(camera instanceof Camera)) {
        return null;
    }

    const context = new CameraContext(contextID, camera);

    camera.setViewportSize(this.windowWidth, this.windowHeight);
    context.setWindow(this.windowWidth, this.windowHeight);

    this.contexts.push(context);
    this.events.emit(Renderer.EVENT.CONTEXT_CREATE, contextID, context);

    return context;
}

Renderer.prototype.destroyContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            this.contexts.splice(i, 1);
            this.events.emit(Renderer.EVENT.CONTEXT_DESTROY, contextID);
            return;
        }
    }
}

Renderer.prototype.drawContextDebug = function() {
    const { context } = this.display;

    context.globalAlpha = 1;
    context.strokeStyle = "#eeeeee";
    context.lineWidth = 3;

    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const { x, y, w, h } = context.getBounds();

        context.strokeRect(x, y, w, h);
    }
}

Renderer.prototype.update = function(gameContext) {
    const { timer, uiManager } = gameContext; 
    const deltaTime = timer.getDeltaTime();

    this.display.clear();

    for(let i = 0; i < this.contexts.length; i++) {
        this.display.save();
        this.contexts[i].update(gameContext, this.display);
        this.display.reset();
    }

    this.effects.update(this.display, deltaTime);

    if(Renderer.DEBUG.CONTEXT) {
        this.drawContextDebug();
    }

    this.display.save();

    uiManager.draw(gameContext, this.display);

    this.display.reset();

    if(Renderer.DEBUG.INTERFACE) {
        uiManager.debug(this.display);
    }

    this.drawFPS(timer);
}

Renderer.prototype.drawFPS = function(timer) {
    const { context } = this.display;
    const fps = timer.getFPS();
    const text = `FPS: ${Math.round(fps)}`;

    if(fps >= 60) {
        context.fillStyle = Renderer.FPS_COLOR.GOOD;
    } else {
        context.fillStyle = Renderer.FPS_COLOR.BAD;
    }
    
    context.fontSize = 20;
    context.fillText(text, 0, 10);
}

Renderer.prototype.onWindowResize = function(width, height) {
    this.windowWidth = width;
    this.windowHeight = height;
    this.display.onWindowResize(width, height);

    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];

        context.onWindowResize(this.display.width, this.display.height);
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