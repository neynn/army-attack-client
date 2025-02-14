import { Outline } from "../../graphics/applyable/outline.js";
import { isCircleCicleIntersect, isRectangleRectangleIntersect } from "../../math/math.js";
import { UIElement } from "../uiElement.js";

export const Button = function(id) {
    UIElement.call(this, id, "BUTTON");

    this.shape = Button.SHAPE_RECTANGLE;
    this.highlight = new Outline();
    this.outline = new Outline();

    this.highlight.color.setColor(200, 200, 200, 0.25);
    this.outline.color.setColor(255, 255, 255, 1);
    this.outline.enable();

    this.events.listen(Button.EVENT_DEFER_DRAW);
    this.events.listen(Button.EVENT_CLICKED);
    this.events.subscribe(UIElement.EVENT.FIRST_COLLISION, this.DEBUG_NAME, () => this.highlight.enable());
    this.events.subscribe(UIElement.EVENT.FINAL_COLLISION, this.DEBUG_NAME, () => this.highlight.disable());
}

Button.EVENT_DEFER_DRAW = "EVENT_DEFER_DRAW";
Button.EVENT_CLICKED = "EVENT_CLICKED";

Button.SHAPE_RECTANGLE = 0;
Button.SHAPE_CIRCLE = 1;

Button.prototype = Object.create(UIElement.prototype);
Button.prototype.constructor = Button;

Button.prototype.setShape = function(shape) {
    if(shape !== undefined) {
        this.shape = shape;
    }
}

Button.prototype.loadFromConfig = function(config) {
    const { id, opacity, position, shape } = config;
    const { x, y } = position;

    this.DEBUG_NAME = id;
    this.setPosition(x, y);
    this.setOpacity(opacity);

    switch(shape) {
        case Button.SHAPE_RECTANGLE: {
            const { width, height } = config;

            this.width = width;
            this.height = height;
            this.setShape(Button.SHAPE_RECTANGLE);
            break;
        }
        case Button.SHAPE_CIRCLE: {
            const { radius } = config;

            this.width = radius;
            this.height = radius;
            this.setShape(Button.SHAPE_CIRCLE);
            break;
        }
        default: {
            console.warn(`Shape ${shape} does not exist!`);
        }
    }
}

Button.prototype.onDebug = function(context, viewportX, viewportY, localX, localY) {
    context.globalAlpha = 0.2;
    context.fillStyle = "#ff00ff";

    switch(this.shape) {
        case Button.SHAPE_RECTANGLE: {
            context.fillRect(localX, localY, this.width, this.height);
            break;
        }
        case Button.SHAPE_CIRCLE: {
            context.beginPath();
            context.arc(localX, localY, this.width, 0, 2 * Math.PI);
            context.fill();
            break;
        }
    }
}

Button.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    const { x, y } = this.position;

    switch(this.shape) {
        case Button.SHAPE_RECTANGLE: return isRectangleRectangleIntersect(x, y, this.width, this.height, mouseX, mouseY, mouseRange, mouseRange);
        case Button.SHAPE_CIRCLE: return isCircleCicleIntersect(x, y, this.width, mouseX, mouseY, mouseRange);
        default: return false;
    }
}

Button.prototype.drawStyle = function(context, localX, localY) {
    const isHighlightActive = this.highlight.isActive();
    const isOutlineActive = this.outline.isActive();

    switch(this.shape) {
        case Button.SHAPE_RECTANGLE: {
            if(isHighlightActive) {
                const fillStyle = this.highlight.color.getRGBAString();

                context.fillStyle = fillStyle;
                context.fillRect(localX, localY, this.width, this.height);
            }
        
            if(isOutlineActive) {
                this.outline.apply(context);
                context.strokeRect(localX, localY, this.width, this.height);
            }
            break;
        }
        case Button.SHAPE_CIRCLE: {
            if(isHighlightActive) {
                const fillStyle = this.highlight.color.getRGBAString();

                context.fillStyle = fillStyle;
                context.beginPath();
                context.arc(localX, localY, this.width, 0, 2 * Math.PI);
                context.fill();
            }
        
            if(isOutlineActive) {
                this.outline.apply(context);
                context.beginPath();
                context.arc(localX, localY, this.width, 0, 2 * Math.PI);
                context.stroke();
            }
            break;
        }
    }
}

Button.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {
    this.events.emit(Button.EVENT_DEFER_DRAW, this, context, localX, localY);
    this.drawStyle(context, localX, localY);
}