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
    this.setPosition(x, y);
    this.setOpacity(opacity);
    this.setBounds(width, height);
}

ButtonSquare.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    return isRectangleRectangleIntersect(this.position.x, this.position.y, this.width, this.height, mouseX, mouseY, mouseRange, mouseRange);
}

ButtonSquare.prototype.onDebug = function(context, viewportX, viewportY, localX, localY) {
    context.globalAlpha = 0.2;
    context.fillStyle = "#ff00ff";
    context.fillRect(localX, localY, this.width, this.height);
}

ButtonSquare.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {
    this.events.emit(UIElement.EVENT_DRAW, context, localX, localY);

    if(!this.isHighlighted) {
        return;
    }

    const [r, g, b, a] = this.highlightColor;

    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    context.fillRect(localX, localY, this.width, this.height);

    this.isHighlighted = false;
}