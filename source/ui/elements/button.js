import { ToggleColor } from "../../graphics/applyable/toggleColor.js";
import { Graph } from "../../graphics/graph.js";
import { UICollider } from "../uiCollider.js";
import { UIElement } from "../uiElement.js";

export const Button = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.defers = [];
    this.shape = Button.SHAPE.RECTANGLE;
    this.collider = new UICollider();
    this.highlight = new ToggleColor();
    this.outline = new ToggleColor();
    this.background = new ToggleColor();

    this.highlight.setColorRGBA(200, 200, 200, 0.25);
    this.outline.setColorRGBA(255, 255, 255, 1);
    this.outline.enable();

    this.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (mouseX, mouseY, mouseRange) => this.highlight.enable(), { permanent: true });
    this.collider.events.on(UICollider.EVENT.LAST_COLLISION, (mouseX, mouseY, mouseRange) => this.highlight.disable(), { permanent: true });

    this.addDrawHook();
    this.addDebugHook();
}

Button.SHAPE = {
    RECTANGLE: 0,
    CIRCLE: 1
};

Button.prototype = Object.create(UIElement.prototype);
Button.prototype.constructor = Button;

Button.prototype.setShape = function(shape) {
    switch(shape) {
        case Button.SHAPE.RECTANGLE: {
            this.shape = Button.SHAPE.RECTANGLE;
            this.collider.setShape(UICollider.SHAPE.RECTANGLE);
            break;
        }
        case Button.SHAPE.CIRCLE: {
            this.shape = Button.SHAPE.CIRCLE;
            this.collider.setShape(UICollider.SHAPE.CIRCLE);
            break;
        }
    }
} 

Button.prototype.addDebugHook = function() {
    this.addHook(Graph.HOOK.DEBUG, (context, localX, localY) => {
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
    });
}

Button.prototype.addDrawHook = function() {
    this.addHook(Graph.HOOK.DRAW, (context, localX, localY) => {
        const isHighlightActive = this.highlight.isActive();
        const isOutlineActive = this.outline.isActive();
        const isBackgroundActive = this.background.isActive();

        switch(this.shape) {
            case Button.SHAPE.RECTANGLE: {
                if(isBackgroundActive) {
                    const fillStyle = this.background.getRGBAString();

                    context.fillStyle = fillStyle;
                    context.fillRect(localX, localY, this.width, this.height);
                }

                for(let i = 0; i < this.defers.length; i++) {
                    this.defers[i](context, localX, localY);
                }

                if(isHighlightActive) {
                    const fillStyle = this.highlight.getRGBAString();
    
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
                if(isBackgroundActive) {
                    const fillStyle = this.background.getRGBAString();

                    context.fillStyle = fillStyle;
                    context.beginPath();
                    context.arc(localX, localY, this.width, 0, 2 * Math.PI);
                    context.fill();
                }

                for(let i = 0; i < this.defers.length; i++) {
                    this.defers[i](context, localX, localY);
                }

                if(isHighlightActive) {
                    const fillStyle = this.highlight.getRGBAString();
    
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
    });
}

Button.prototype.clearDefers = function() {
    this.defers.length = 0;
}

Button.prototype.addDefer = function(onDraw) {
    this.defers.push(onDraw);
}
