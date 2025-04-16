import { EventEmitter } from "../../events/eventEmitter.js";
import { Outline } from "../../graphics/applyable/outline.js";
import { Logger } from "../../logger.js";
import { isCircleCicleIntersect, isRectangleRectangleIntersect } from "../../math/math.js";
import { UIElement } from "../uiElement.js";

export const Button = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.defers = [];
    this.shape = Button.SHAPE.RECTANGLE;
    this.highlight = new Outline();
    this.outline = new Outline();

    this.highlight.color.setColorRGBA(200, 200, 200, 0.25);
    this.outline.color.setColorRGBA(255, 255, 255, 1);
    this.outline.enable();

    this.events = new EventEmitter();
    this.events.listen(UIElement.EVENT.FIRST_COLLISION);
    this.events.listen(UIElement.EVENT.LAST_COLLISION);
    this.events.listen(UIElement.EVENT.REPEATED_COLLISION);
    this.events.listen(UIElement.EVENT.CLICKED);
}

Button.SHAPE = {
    RECTANGLE: 0,
    CIRCLE: 1
};

Button.prototype = Object.create(UIElement.prototype);
Button.prototype.constructor = Button;

Button.prototype.setShape = function(shape) {
    if(shape !== undefined) {
        this.shape = shape;
    }
}

Button.prototype.onCollision = function(type, mouseX, mouseY, mouseRange) {
    switch(type) {
        case UIElement.COLLISION_TYPE.FIRST: {
            this.highlight.enable();
            this.events.emit(UIElement.EVENT.FIRST_COLLISION);
            break;
        }
        case UIElement.COLLISION_TYPE.LAST: {
            this.highlight.disable();
            this.events.emit(UIElement.EVENT.LAST_COLLISION);
            break;
        }
        case UIElement.COLLISION_TYPE.REPEATED: {
            this.events.emit(UIElement.EVENT.REPEATED_COLLISION);
            break;
        }
        default: {
            Logger.log(Logger.CODE.ENGINE_WARN, "CollisionType does not exist!", "Button.prototype.onCollision", { "type": type });
            break;
        }
    }
}   

Button.prototype.onClick = function() {
    this.events.emit(UIElement.EVENT.CLICKED);
}

Button.prototype.onDebug = function(context, localX, localY) {
    context.globalAlpha = 0.2;
    context.fillStyle = "#ff00ff";

    switch(this.shape) {
        case Button.SHAPE.RECTANGLE: {
            context.fillRect(localX, localY, this.width, this.height);
            break;
        }
        case Button.SHAPE.CIRCLE: {
            context.beginPath();
            context.arc(localX, localY, this.width, 0, 2 * Math.PI);
            context.fill();
            break;
        }
    }
}

Button.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    switch(this.shape) {
        case Button.SHAPE.RECTANGLE: {
            const isColliding = isRectangleRectangleIntersect(this.positionX, this.positionY, this.width, this.height, mouseX, mouseY, mouseRange, mouseRange);

            return isColliding;
        }
        case Button.SHAPE.CIRCLE: {
            const isColliding = isCircleCicleIntersect(this.positionX, this.positionY, this.width, mouseX, mouseY, mouseRange);

            return isColliding;
        }
        default: {
            return false;
        }
    }
}

Button.prototype.clearDefers = function() {
    this.defers.length = 0;
}

Button.prototype.addDefer = function(onDraw) {
    this.defers.push(onDraw);
}

Button.prototype.drawDefers = function(context, localX, localY) {
    for(let i = 0; i < this.defers.length; i++) {
        const onDraw = this.defers[i];

        onDraw(context, localX, localY);
    }
}

Button.prototype.drawStyle = function(context, localX, localY) {
    const isHighlightActive = this.highlight.isActive();
    const isOutlineActive = this.outline.isActive();

    switch(this.shape) {
        case Button.SHAPE.RECTANGLE: {
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
        case Button.SHAPE.CIRCLE: {
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

Button.prototype.onDraw = function(context, localX, localY) {
    this.drawDefers(context, localX, localY);
    this.drawStyle(context, localX, localY);
}