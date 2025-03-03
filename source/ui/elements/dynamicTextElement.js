import { TextStyle } from "../../graphics/applyable/textStyle.js";
import { UIElement } from "../uiElement.js";

export const DynamicTextElement = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.fullText = "";
    this.style = new TextStyle();

    this.events.listen(UIElement.EVENT.REQUEST_TEXT);
}

DynamicTextElement.prototype = Object.create(UIElement.prototype);
DynamicTextElement.prototype.constructor = DynamicTextElement;

DynamicTextElement.prototype.setText = function(text) {
    if(text !== undefined) {
        this.fullText = text;
    }
}

DynamicTextElement.prototype.onDraw = function(context, localX, localY) {
    this.events.emit(UIElement.EVENT.REQUEST_TEXT, this);
    this.style.apply(context);

    context.fillText(this.fullText, localX, localY);
}