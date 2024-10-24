import { Drawable } from "./drawable.js";
import { TextStyle } from "./textStyle.js";

export const SimpleText = function() {
    Drawable.call(this, "SIMPLE_TEXT");

    this.style = new TextStyle();
    this.text = "SAMPLE TEXT";
}

SimpleText.prototype = Object.create(Drawable.prototype);
SimpleText.prototype.constructor = SimpleText;

SimpleText.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {
    const renderX = localX - viewportX;
    const renderY = localY - viewportY;
    
    this.style.apply(context);

    context.globalAlpha = this.opacity;
    context.fillText(this.text, renderX, renderY);
}

SimpleText.prototype.setText = function(text) {
    if(text === undefined) {
        return false;
    }

    this.text = text;

    return true;
}