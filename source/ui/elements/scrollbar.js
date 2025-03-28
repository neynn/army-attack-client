import { EventEmitter } from "../../events/eventEmitter.js";
import { UIElement } from "../uiElement.js";

export const Scrollbar = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.events = new EventEmitter();
    this.events.listen(UIElement.EVENT.BUTTON_CLICKED);
}

Scrollbar.TYPE = {
    HORIZONTAL: 0,
    VERTICAL: 1
};

Scrollbar.prototype = Object.create(UIElement.prototype);
Scrollbar.prototype.constructor = Scrollbar;

Scrollbar.prototype.onCollision = function(type, mouseX, mouseY, mouseRange) {}

Scrollbar.prototype.onClick = function() {
    this.events.emit(UIElement.EVENT.BUTTON_CLICKED);
}

//onClick - enable drag mode.
//in drag mode, react to the mouse delta