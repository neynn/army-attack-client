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
    this.setPosition(x, y);
    this.setBounds(width, height);
    this.setOpacity(opacity);
}

Container.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    return isRectangleRectangleIntersect(this.position.x, this.position.y, this.width, this.height, mouseX, mouseY, mouseRange, mouseRange);
}

Container.prototype.onDebug = function(context, viewportX, viewportY,localX, localY) {
    context.globalAlpha = 0.2;
    context.fillStyle = "#0000ff";
    context.fillRect(localX, localY, this.width, this.height);
}