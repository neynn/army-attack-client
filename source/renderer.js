import { Camera2D } from "./camera/2D/camera2D.js";
import { Canvas } from "./camera/canvas.js";
import { FPSCounter } from "./camera/fpsCounter.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { isRectangleRectangleIntersect } from "./math/math.js";

export const Renderer = function() {
    this.id = "RENDERER";
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    this.fpsCounter = new FPSCounter();

    this.display = new Canvas();
    this.display.create(this.windowWidth, this.windowHeight, true);

    this.events = new EventEmitter();
    this.events.listen(Renderer.EVENT_SCREEN_RESIZE);
    this.events.listen(Renderer.EVENT_CAMERA_FINISH);

    this.cameras = new Map();
    this.cameraStack = [];
    this.cameraTypes = {
        [Renderer.CAMERA_TYPE_2D]: Camera2D
    }

    window.addEventListener("resize", () => {
        this.resizeDisplay(window.innerWidth, window.innerHeight);
    });
}

Renderer.DEBUG = 0b00000001;
Renderer.DEBUG_CAMERA = 1 << 0;
Renderer.DEBUG_INTERFACE = 1 << 1;
Renderer.DEBUG_SPRITES = 1 << 2;
Renderer.DEBUG_MAP = 1 << 3;
Renderer.CAMERA_TYPE_2D = "2D";
Renderer.EVENT_SCREEN_RESIZE = "EVENT_SCREEN_RESIZE";
Renderer.EVENT_CAMERA_FINISH = "EVENT_CAMERA_FINISH";
Renderer.ANCHOR_TYPE_TOP_CENTER = "TOP_CENTER";
Renderer.ANCHOR_TYPE_TOP_LEFT = "TOP_LEFT";
Renderer.ANCHOR_TYPE_TOP_RIGHT = "TOP_RIGHT";
Renderer.ANCHOR_TYPE_BOTTOM_CENTER = "BOTTOM_CENTER";
Renderer.ANCHOR_TYPE_BOTTOM_LEFT = "BOTTOM_LEFT";
Renderer.ANCHOR_TYPE_BOTTOM_RIGHT = "BOTTOM_RIGHT";
Renderer.ANCHOR_TYPE_RIGHT_CENTER = "RIGHT_CENTER";
Renderer.ANCHOR_TYPE_LEFT_CENTER = "LEFT_CENTER";
Renderer.ANCHOR_TYPE_CENTER = "CENTER";

Renderer.prototype.getContext = function() {
    return this.display.context;
}

Renderer.prototype.getWidth = function() {
    return this.windowWidth;
}

Renderer.prototype.getHeight = function() {
    return this.windowHeight;
}

Renderer.prototype.getCamera = function(cameraID) {
    const camera = this.cameras.get(cameraID);

    if(!camera) {
        return null;
    }

    return camera;
}

Renderer.prototype.createCamera = function(cameraID, type, x, y, w, h) {
    const CameraType = this.cameraTypes[type];

    if(!CameraType) {
        return null;
    }

    if(typeof cameraID !== "string" || this.cameras.has(cameraID)) {
        return null;
    }

    const camera = new CameraType(x, y, w, h);

    this.cameras.set(cameraID, camera);
    this.cameraStack.push(cameraID);

    return camera;
}

Renderer.prototype.destroyCamera = function(cameraID) {
    if(!this.cameras.has(cameraID)) {
        return false;
    }

    this.cameras.delete(cameraID);

    for(let i = 0; i < this.cameraStack.length; i++) {
        const stackedCameraID = this.cameraStack[i];

        if(stackedCameraID === cameraID) {
            this.cameraStack.splice(i, 1);
            break;
        }
    }

    return true;
}

Renderer.prototype.drawUI = function(gameContext) {
    const { uiManager, timer } = gameContext;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    for(const elementID of uiManager.drawableElements) {
        const element = uiManager.getElementByID(elementID);
        
        element.update(realTime, deltaTime);
        element.draw(this.display.context, 0, 0, 0, 0);

        if((Renderer.DEBUG & Renderer.DEBUG_INTERFACE) !== 0) {
            element.debug(this.display.context, 0, 0, 0, 0);
        }
    }
}

Renderer.prototype.drawCameraOutlines = function() {
    this.display.context.strokeStyle = "#eeeeee";
    this.display.context.lineWidth = 3;

    for(const [cameraID, camera] of this.cameras) {
        this.display.context.strokeRect(camera.position.x, camera.position.y, camera.viewportWidth, camera.viewportHeight);
    }
}

Renderer.prototype.update = function(gameContext) {
    const { timer } = gameContext; 
    const context = this.getContext();
    const deltaTime = timer.getDeltaTime();

    this.display.clear();
    this.fpsCounter.update(deltaTime);

    for(const [cameraID, camera] of this.cameras) {
        context.save();
        context.beginPath();
        context.rect(camera.position.x, camera.position.y, camera.viewportWidth, camera.viewportHeight);
        context.clip();
        camera.update(gameContext);
        this.events.emit(Renderer.EVENT_CAMERA_FINISH, this, camera);
        context.restore();
    }

    if((Renderer.DEBUG & Renderer.DEBUG_CAMERA) !== 0) {
        this.drawCameraOutlines();
    }

    this.drawUI(gameContext);
}

Renderer.prototype.resizeDisplay = function(width, height) {
    this.windowWidth = width;
    this.windowHeight = height;
    this.display.resize(width, height);
    this.cameras.forEach(camera => camera.onWindowResize(width, height));
    this.events.emit(Renderer.EVENT_SCREEN_RESIZE, width, height);
}

Renderer.prototype.getAnchor = function(type, originX, originY, width, height) {
    let x = originX;
    let y = originY;

    switch(type) {
        case Renderer.ANCHOR_TYPE_TOP_LEFT: {
            x = originX;
            y = originY;
            break;
        }
        case Renderer.ANCHOR_TYPE_TOP_CENTER: {
            x = this.windowWidth / 2 - originX - width / 2;
            y = originY;
            break;
        }
        case Renderer.ANCHOR_TYPE_TOP_RIGHT: {
            x = this.windowWidth - originX - width;
            y = originY;
            break;
        }
        case Renderer.ANCHOR_TYPE_BOTTOM_LEFT: {
            x = originX;
            y = this.windowHeight - originY - height;
            break;
        }
        case Renderer.ANCHOR_TYPE_BOTTOM_CENTER: {
            x = this.windowWidth / 2 - originX - width / 2;
            y = this.windowHeight - originY - height;
            break;
        }
        case Renderer.ANCHOR_TYPE_BOTTOM_RIGHT: {
            x = this.windowWidth - originX - width;
            y = this.windowHeight - originY - height;
            break;
        }
        case Renderer.ANCHOR_TYPE_LEFT_CENTER: {
            x = originX;
            y = this.windowHeight / 2 - originY - height / 2;
            break;
        }
        case Renderer.ANCHOR_TYPE_CENTER: {
            x = this.windowWidth / 2 - originX - width / 2;
            y = this.windowHeight / 2 - originY - height / 2;
            break;
        }
        case Renderer.ANCHOR_TYPE_RIGHT_CENTER: {
            x = this.windowWidth - originX - width;
            y = this.windowHeight / 2 - originY - height / 2;
            break;
        }
        default: {
            console.warn(`Anchor Type ${type} does not exist!`);
            break;
        }
    }

    return {
        "x": x,
        "y": y
    }
}

Renderer.prototype.getCollidedCamera = function(mouseX, mouseY, mouseRange) {
    for(let i = this.cameraStack.length - 1; i > - 1; i--) {
        const cameraID = this.cameraStack[i];
        const camera = this.getCamera(cameraID);
        const { x, y, w, h } = camera.getBounds();
        const isColliding = isRectangleRectangleIntersect(
            x, y, w, h,
            mouseX, mouseY, mouseRange, mouseRange
        );

        if(isColliding) {
            return camera;
        }
    }

    return null;
}

Renderer.prototype.centerCamera = function(cameraID) {
    //(viewportWidth - width) / 2 <- offset!
    //width refers to mapWidth * Camera.TILE_WIDTH
    //The camera is centered on the screen!
}