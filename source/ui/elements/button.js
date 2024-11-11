import { Highlight } from "../../graphics/applyable/highlight.js";
import { Outline } from "../../graphics/applyable/outline.js";
import { UIElement } from "../uiElement.js";

export const Button = function(id, DEBUG_NAME) {
    UIElement.call(this, id, DEBUG_NAME);
    this.highlight = new Highlight();
    this.outline = new Outline();

    this.highlight.setColor(200, 200, 200, 50);
    this.outline.setColor(255, 255, 255, 255);

    this.events.subscribe(UIElement.EVENT_COLLIDES, DEBUG_NAME, () => {
        this.highlight.setActive();
    });
}

Button.prototype = Object.create(UIElement.prototype);
Button.prototype.constructor = Button;