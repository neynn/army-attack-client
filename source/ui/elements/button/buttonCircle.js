import { isCircleCicleIntersect } from "../../../math/math.js";
import { UIElement } from "../../uiElement.js";
import { Button } from "../button.js";

export const ButtonCircle = function() {
    Button.call(this, "BUTTON_CIRCLE");
    this.radius = 0;
}

ButtonCircle.prototype = Object.create(Button.prototype);
ButtonCircle.prototype.constructor = ButtonCircle;

ButtonCircle.prototype.loadFromConfig = function(config) {
    const { id, opacity, radius, position } = config;
    const { x, y } = position;

    this.DEBUG_NAME = id;
    this.setPosition(x, y);
    this.setOpacity(opacity);
    this.setRadius(radius);
}

ButtonCircle.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    return isCircleCicleIntersect(this.position.x, this.position.y, this.radius, mouseX, mouseY, mouseRange);
}

ButtonCircle.prototype.setRadius = function(radius) {
    this.radius = radius;
}

ButtonCircle.prototype.onDebug = function(context, viewportX, viewportY, localX, localY) {
    context.beginPath();
    context.globalAlpha = 0.2;
    context.fillStyle = "#ff00ff";
    context.arc(localX, localY, this.radius, 0, 2 * Math.PI);
    context.fill();
}

ButtonCircle.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {
    this.events.emit(UIElement.EVENT_DRAW, context, localX, localY);

    if(!this.isHighlighted) {
        return;
    }

    const [r, g, b, a] = this.highlightColor;

    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    context.arc(localX, localY, this.radius, 0, 2 * Math.PI);
    context.fill();

    this.isHighlighted = false;
}