import { TextStyle } from "../textStyle.js";
import { Graph } from "../graph.js";

export const SimpleText = function() {
    Graph.call(this, "SIMPLE_TEXT");

    this.text = "SAMPLE TEXT";
    this.style = new TextStyle();
    this.style.color.setColorRGBA(238, 238, 238, 255);
}

SimpleText.prototype = Object.create(Graph.prototype);
SimpleText.prototype.constructor = SimpleText;

SimpleText.prototype.onDraw = function(context, localX, localY) {
    this.style.drawText(context, this.text, localX, localY);
}

SimpleText.prototype.setText = function(text) {
    if(text !== undefined) {
        this.text = text;
    }
}