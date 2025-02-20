import { Drawable } from "../drawable.js";

export const SimpleImage = function() {
    Drawable.call(this, "SIMPLE_IMAGE");

    this.image = null;
}

SimpleImage.prototype = Object.create(Drawable.prototype);
SimpleImage.prototype.constructor = SimpleImage;

SimpleImage.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {
    if(!this.image) {
        return;
    }

    const drawX = viewportX - localX;
    const drawY = viewportY - localY;

    context.drawImage(
        this.image,
        0, 0, this.image.width, this.image.height,
        drawX, drawY, this.image.width, this.image.height
    );
}

SimpleImage.prototype.setImage = function(image) {
    if(image !== undefined) {
        this.image = image;
    }
}