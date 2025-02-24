import { TextStyle } from "../../graphics/applyable/textStyle.js";
import { UIElement } from "../uiElement.js";

export const DynamicTextElement = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.fullText = "";
    this.style = new TextStyle();
    this.events.listen(DynamicTextElement.EVENT_REQUEST_TEXT);
}

DynamicTextElement.EVENT_REQUEST_TEXT = "EVENT_REQUEST_TEXT";

DynamicTextElement.prototype = Object.create(UIElement.prototype);
DynamicTextElement.prototype.constructor = DynamicTextElement;

DynamicTextElement.prototype.init = function(config) {
    const { id, opacity, position, font, align, color = [0, 0, 0, 0], text } = config;
    const { x, y } = position;

    this.DEBUG_NAME = id;
    this.setText(text);
    this.setOpacity(opacity);
    this.setPosition(x, y);
    this.style.setFont(font);
    this.style.setAlignment(align);
    this.style.color.setColorArray(color);
}

DynamicTextElement.prototype.setText = function(text) {
    if(text !== undefined) {
        this.fullText = text;
    }
}

DynamicTextElement.prototype.onDraw = function(context, localX, localY) {
    this.events.emit(DynamicTextElement.EVENT_REQUEST_TEXT, this);
    this.style.apply(context);

    context.fillText(this.fullText, localX, localY);
}