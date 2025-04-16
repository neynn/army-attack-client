import { TextStyle } from "../applyable/textStyle.js";
import { Graph } from "../graph.js";

export const SimpleText = function() {
    Graph.call(this, Graph.TYPE.OTHER, "SIMPLE_TEXT");

    this.style = new TextStyle();
    this.text = "SAMPLE TEXT";
    this.style.color.setColorRGBA(238, 238, 238, 1);
}

SimpleText.prototype = Object.create(Graph.prototype);
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