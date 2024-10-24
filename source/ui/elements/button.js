import { UIElement } from "../uiElement.js";

export const Button = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);
    this.isHighlighted = false;
    this.highlightColor = [200, 200, 200, 0.2];
    this.events.subscribe(UIElement.EVENT_COLLIDES, DEBUG_NAME, () => this.highlight());
}

Button.prototype = Object.create(UIElement.prototype);
Button.prototype.constructor = Button;

Button.prototype.highlight = function() {
    if(this.isHighlighted) {
        return false;
    }

    this.isHighlighted = true;

    return true;
}

Button.prototype.setHighlightColor = function(r, g, b, a) {
    if(r === undefined || g === undefined || b === undefined || a === undefined) {
        return false;
    }

    this.highlightColor[0] = r;
    this.highlightColor[1] = g;
    this.highlightColor[2] = b;
    this.highlightColor[3] = a;

    return true;
}