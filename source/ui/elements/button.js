import { Graph } from "../../graphics/graph.js";
import { SHAPE, TWO_PI } from "../../math/constants.js";
import { UICollider } from "../uiCollider.js";
import { UIColorHandler } from "../uiColorHandler.js";
import { UIElement } from "../uiElement.js";

export const Button = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.defers = [];
    this.shape = SHAPE.RECTANGLE;
    this.collider = new UICollider();

    this.background = new UIColorHandler();
    this.highlight = new UIColorHandler();
    this.outline = new UIColorHandler();
    this.outlineSize = 1;

    this.highlight.color.setColorRGBA(200, 200, 200, 0.25);
    this.outline.color.setColorRGBA(255, 255, 255, 1);
    this.outline.enable();

    this.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (mouseX, mouseY, mouseRange) => this.highlight.enable(), { permanent: true });
    this.collider.events.on(UICollider.EVENT.LAST_COLLISION, (mouseX, mouseY, mouseRange) => this.highlight.disable(), { permanent: true });

    this.addDrawHook();
    this.addDebugHook();
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

Button.prototype.addDebugHook = function() {
    this.addHook(Graph.HOOK.DEBUG, (context, localX, localY) => {
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
    });
}

Button.prototype.addDrawHook = function() {
    this.addHook(Graph.HOOK.DRAW, (context, localX, localY) => {
        this.background.drawColor(context, this.shape, localX, localY, this.width, this.height);
        this.defers.forEach(defer => defer(context, localX, localY));
        this.highlight.drawColor(context, this.shape, localX, localY, this.width, this.height);
        this.outline.drawStroke(context, this.outlineSize, this.shape, localX, localY, this.width, this.height);
    });
}

Button.prototype.clearDefers = function() {
    this.defers.length = 0;
}

Button.prototype.addDefer = function(onDraw) {
    this.defers.push(onDraw);
}
