import { isRectangleRectangleIntersect } from "../../math/math.js";
import { UIElement } from "../uiElement.js";

export const Container = function(config) {
    UIElement.call(this, "CONTAINER");
    this.loadFromConfig(config);
} 

Container.prototype = Object.create(UIElement.prototype);
Container.prototype.constructor = Container;

Container.prototype.loadFromConfig = function(config) {
    const { id, width, height, opacity, position } = config;
    const { x, y } = position;

    this.id = id;
    this.DEBUG_NAME = id;
    this.bounds.set(0, 0, width, height);
    this.setPosition(x, y);
    this.setOpacity(opacity);
}

Container.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    const { w, h } = this.bounds;
    return isRectangleRectangleIntersect(this.position.x, this.position.y, w, h, mouseX, mouseY, mouseRange, mouseRange);
}

Container.prototype.onDebug = function(context, viewportX, viewportY,localX, localY) {
    const { w, h } = this.bounds;
    context.globalAlpha = 0.2;
    context.fillStyle = "#0000ff";
    context.fillRect(localX, localY, w, h);
}