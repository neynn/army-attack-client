import { Graph } from "../graph.js";

export const SimpleImage = function() {
    Graph.call(this, Graph.TYPE.OTHER, "SIMPLE_IMAGE");

    this.image = null;
}

SimpleImage.prototype = Object.create(Graph.prototype);
SimpleImage.prototype.constructor = SimpleImage;

SimpleImage.prototype.onDraw = function(context, localX, localY) {
    if(!this.image) {
        return;
    }

    context.drawImage(
        this.image,
        0, 0, this.image.width, this.image.height,
        localX, localY, this.image.width, this.image.height
    );
}

SimpleImage.prototype.setImage = function(image) {
    if(image !== undefined) {
        this.image = image;
    }
}