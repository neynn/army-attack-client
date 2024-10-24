import { Drawable } from "./drawable.js";

export const SimpleImage = function() {
    Drawable.call(this, "SIMPLE_IMAGE");
    this.image = null;
    this.width = 0;
    this.height = 0;
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
        0, 0, this.width, this.height,
        drawX, drawY, this.width, this.height
    );
}

SimpleImage.prototype.setImage = function(image) {
    if(image === undefined) {
        return false;
    }

    this.image = image;

    return true;
}

SimpleImage.prototype.setBounds = function(width, height) {
    if(width === undefined || height === undefined) {
        return false;
    }

    this.width = width;
    this.height = height;

    return true;
}