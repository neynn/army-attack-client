import { TextStyle } from "../../graphics/applyable/textStyle.js";
import { UIElement } from "../uiElement.js";

export const DynamicTextElement = function(behavior, DEBUG_NAME) {
    UIElement.call(this, behavior, DEBUG_NAME);

    this.fullText = "";
    this.style = new TextStyle();

    this.events.listen(UIElement.EVENT.REQUEST_TEXT);
}

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
    this.events.emit(UIElement.EVENT.REQUEST_TEXT, this);
    this.style.apply(context);

    context.fillText(this.fullText, localX, localY);
}