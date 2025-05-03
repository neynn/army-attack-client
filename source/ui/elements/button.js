import { SHAPE, TWO_PI } from "../../math/constants.js";
import { UICollider } from "../uiCollider.js";
import { UIColorHandler } from "../uiColorHandler.js";
import { UIElement } from "../uiElement.js";

export const Button = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.customRenders = [];
    this.shape = SHAPE.RECTANGLE;
    this.collider = new UICollider();

    this.background = new UIColorHandler();
    this.highlight = new UIColorHandler();
    this.outline = new UIColorHandler();
    this.outlineSize = 1;

    this.highlight.color.setColorRGBA(200, 200, 200, 64);
    this.outline.color.setColorRGBA(255, 255, 255, 255);
    this.outline.enable();

    this.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (mouseX, mouseY, mouseRange) => this.highlight.enable(), { permanent: true });
    this.collider.events.on(UICollider.EVENT.LAST_COLLISION, (mouseX, mouseY, mouseRange) => this.highlight.disable(), { permanent: true });
}

Button.prototype = Object.create(UIElement.prototype);
Button.prototype.constructor = Button;

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

    switch(this.shape) {
        case SHAPE.RECTANGLE: {
            context.fillRect(localX, localY, this.width, this.height);
            break;
        }
        case SHAPE.CIRCLE: {
            context.beginPath();
            context.arc(localX, localY, this.width, 0, TWO_PI);
            context.fill();
            break;
        }
    }
}

Button.prototype.onDraw = function(display, localX, localY) {
    const { context } = display;

    this.background.drawColor(context, this.shape, localX, localY, this.width, this.height);
    this.customRenders.forEach(onDraw => onDraw(context, localX, localY));
    this.highlight.drawColor(context, this.shape, localX, localY, this.width, this.height);
    this.outline.drawStroke(context, this.outlineSize, this.shape, localX, localY, this.width, this.height);
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
