import { isRectangleRectangleIntersect } from "../../../math/math.js";
import { UIElement } from "../../uiElement.js";
import { Button } from "../button.js";

export const ButtonSquare = function(config) {
    Button.call(this, "BUTTON_SQUARE");
    this.loadFromConfig(config);
}

ButtonSquare.prototype = Object.create(Button.prototype);
ButtonSquare.prototype.constructor = ButtonSquare;

ButtonSquare.prototype.loadFromConfig = function(config) {
    const { id, opacity, width, height, position } = config;
    const { x, y } = position;

    this.id = id;
    this.DEBUG_NAME = id;
    this.bounds.set(0, 0, width, height);
    this.setPosition(x, y);
    this.setOpacity(opacity);
}

ButtonSquare.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    const { w, h } = this.bounds;
    return isRectangleRectangleIntersect(this.position.x, this.position.y, w, h, mouseX, mouseY, mouseRange, mouseRange);
}

ButtonSquare.prototype.onDebug = function(context, viewportX, viewportY, localX, localY) {
    const { w, h } = this.bounds;
    context.globalAlpha = 0.2;
    context.fillStyle = "#ff00ff";
    context.fillRect(localX, localY, w, h);
}

ButtonSquare.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {
    this.events.emit(UIElement.EVENT_DRAW, context, localX, localY);

    if(!this.isHighlighted) {
        return;
    }

    const [r, g, b, a] = this.highlightColor;
    const { w, h } = this.bounds;

    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    context.fillRect(localX, localY, w, h);

    this.isHighlighted = false;
}