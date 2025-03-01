import { UIElement } from "../uiElement.js";

export const Scrollbar = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.events.listen(UIElement.EVENT.CLICKED);
}

Scrollbar.TYPE = {
    HORIZONTAL: 0,
    VERTICAL: 1
};

Scrollbar.prototype = Object.create(UIElement.prototype);
Scrollbar.prototype.constructor = Scrollbar;

Scrollbar.prototype.onClick = function() {
    this.events.emit(UIElement.EVENT.CLICKED);
}

//onClick - enable drag mode.
//in drag mode, react to the mouse delta