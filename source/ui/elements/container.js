import { Outline } from "../../graphics/applyable/outline.js";
import { Graph } from "../../graphics/graph.js";
import { UICollider } from "../uiCollider.js";
import { UIElement } from "../uiElement.js";

export const Container = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.outline = new Outline();
    this.outline.color.setColorRGBA(255, 255, 255, 1);
    this.outline.enable();
    this.collider = new UICollider();

    this.addDrawHook();
    this.addDebugHook();
} 

Container.prototype = Object.create(UIElement.prototype);
Container.prototype.constructor = Container;

Container.prototype.addDrawHook = function() {
    this.addHook(Graph.HOOK.DRAW, (context, localX, localY) => {
        if(this.outline.isActive()) {
            this.outline.apply(context);
        
            context.strokeRect(localX, localY, this.width, this.height);
        }
    });
}

Container.prototype.addDebugHook = function() {
    this.addHook(Graph.HOOK.DEBUG, (context, localX, localY) => {
        context.globalAlpha = 0.2;
        context.fillStyle = "#0000ff";
        context.fillRect(localX, localY, this.width, this.height);
    });
}
