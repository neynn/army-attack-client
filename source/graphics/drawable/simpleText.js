import { Drawable } from "../drawable.js";
import { TextStyle } from "../applyable/textStyle.js";

export const SimpleText = function() {
    Drawable.call(this, "SIMPLE_TEXT");

    this.style = new TextStyle();
    this.text = "SAMPLE TEXT";
    this.style.color.setColor(238, 238, 238, 1);
}

SimpleText.prototype = Object.create(Drawable.prototype);
SimpleText.prototype.constructor = SimpleText;

SimpleText.prototype.onDraw = function(context, localX, localY) {
    this.style.apply(context);

    context.fillText(this.text, localX, localY);
}

SimpleText.prototype.setText = function(text) {
    if(text !== undefined) {
        this.text = text;
    }
}