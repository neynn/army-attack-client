import { Drawable } from "./drawable.js";

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

    const { w, h } = this.bounds;
    const drawX = viewportX - localX;
    const drawY = viewportY - localY;

    context.drawImage(
        this.image,
        0, 0, w, h,
        drawX, drawY, w, h
    );
}

SimpleImage.prototype.setImage = function(image) {
    if(image === undefined) {
        return false;
    }

    this.image = image;

    return true;
}