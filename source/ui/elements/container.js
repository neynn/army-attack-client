import { Graph } from "../../graphics/graph.js";
import { SHAPE } from "../../math/constants.js";
import { UICollider } from "../uiCollider.js";
import { UIColorHandler } from "../uiColorHandler.js";
import { UIElement } from "../uiElement.js";

export const Container = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.collider = new UICollider();
    this.background = new UIColorHandler();
    this.outline = new UIColorHandler();
    this.outlineSize = 1;

    this.outline.color.setColorRGBA(255, 255, 255, 1);
    this.outline.enable();

    this.addDrawHook();
    this.addDebugHook();
} 

Container.prototype = Object.create(UIElement.prototype);
Container.prototype.constructor = Container;

Container.prototype.addDrawHook = function() {
    this.addHook(Graph.HOOK.DRAW, (context, localX, localY) => {
        this.background.drawColor(context, SHAPE.RECTANGLE, localX, localY, this.width, this.height);
        this.outline.drawStroke(context, this.outlineSize, SHAPE.RECTANGLE, localX, localY, this.width, this.height);
    });
}

Container.prototype.addDebugHook = function() {
    this.addHook(Graph.HOOK.DEBUG, (context, localX, localY) => {
        context.globalAlpha = 0.2;
        context.fillStyle = "#0000ff";
        context.fillRect(localX, localY, this.width, this.height);
    });
}
