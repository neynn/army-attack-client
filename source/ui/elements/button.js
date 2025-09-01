import { getRGBAString } from "../../graphics/helpers.js";
import { SHAPE } from "../../math/constants.js";
import { UICollider } from "../uiCollider.js";
import { UIElement } from "../uiElement.js";

export const Button = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.shape = SHAPE.RECTANGLE;
    this.collider = new UICollider();
    this.drawBackground = false;
    this.drawHighlight = false;
    this.drawOutline = true;
    this.drawCustom = true;
    this.backgroundColor = getRGBAString(0, 0, 0, 0);
    this.highlightColor = getRGBAString(200, 200, 200, 64);
    this.outlineColor = getRGBAString(255, 255, 255, 255);
    this.outlineSize = 1;
    this.customRenders = [];

    this.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (mouseX, mouseY, mouseRange) => this.enableOverlay(Button.OVERLAY.HIGHLIGHT), { permanent: true });
    this.collider.events.on(UICollider.EVENT.LAST_COLLISION, (mouseX, mouseY, mouseRange) => this.disableOverlay(Button.OVERLAY.HIGHLIGHT), { permanent: true });
}

Button.OVERLAY = {
    BACKGROUND: 0,
    HIGHLIGHT: 1,
    OUTLINE: 2,
    CUSTOM: 3
};

Button.prototype = Object.create(UIElement.prototype);
Button.prototype.constructor = Button;

Button.prototype.disableOverlay = function(type) {
    switch(type) {
        case Button.OVERLAY.BACKGROUND: {
            this.drawBackground = false;
            break;
        }
        case Button.OVERLAY.HIGHLIGHT: {
            this.drawHighlight = false;
            break;
        }
        case Button.OVERLAY.OUTLINE: {
            this.drawOutline = false;
            break;
        }
        case Button.OVERLAY.CUSTOM: {
            this.drawCustom = false;
            break;
        }
    }
}

Button.prototype.enableOverlay = function(type) {
    switch(type) {
        case Button.OVERLAY.BACKGROUND: {
            this.drawBackground = true;
            break;
        }
        case Button.OVERLAY.HIGHLIGHT: {
            this.drawHighlight = true;
            break;
        }
        case Button.OVERLAY.OUTLINE: {
            this.drawOutline = true;
            break;
        }
        case Button.OVERLAY.CUSTOM: {
            this.drawCustom = true;
            break;
        }
    }
}

Button.prototype.setShape = function(shape) {
    switch(shape) {
        case SHAPE.RECTANGLE: {
            this.shape = SHAPE.RECTANGLE;
            this.collider.setShape(SHAPE.RECTANGLE);
            break;
        }
        case SHAPE.CIRCLE: {
            this.shape = SHAPE.CIRCLE;
            this.collider.setShape(SHAPE.CIRCLE);
            break;
        }
    }
} 

Button.prototype.onDebug = function(display, localX, localY) {
    const { context } = display;
    
    context.globalAlpha = 0.2;
    context.fillStyle = "#ff00ff";
    display.drawShape(this.shape, localX, localY, this.width, this.height);
}

Button.prototype.onDraw = function(display, localX, localY) {
    const { context } = display;

    if(this.drawBackground) {
        context.fillStyle = this.backgroundColor;
        display.drawShape(this.shape, localX, localY, this.width, this.height);
    }

    if(this.drawCustom) {
        for(let i = 0; i < this.customRenders.length; i++) {
            this.customRenders[i](context, localX, localY);
        }
    }

    if(this.drawHighlight) {
        context.fillStyle = this.highlightColor;
        display.drawShape(this.shape, localX, localY, this.width, this.height);
    }

    if(this.drawOutline) {
        context.strokeStyle = this.outlineColor;
        context.lineWidth = this.outlineSize;
        display.strokeShape(this.shape, localX, localY, this.width, this.height);
    }
}

Button.prototype.clearCustomRenders = function() {
    this.customRenders.length = 0;
}

Button.prototype.addCustomRender = function(onDraw) {
    if(typeof onDraw !== "function") {
        return;
    }

    this.customRenders.push(onDraw);
}
