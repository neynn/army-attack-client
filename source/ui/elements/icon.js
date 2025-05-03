import { UIElement } from "../uiElement.js";

export const Icon = function(resources, DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);
    
    this.resources = resources;
    this.imageID = null;
    this.scaleX = 1;
    this.scaleY = 1;
}

Icon.prototype = Object.create(UIElement.prototype);
Icon.prototype.constructor = Icon;

Icon.prototype.onDraw = function(display, localX, localY) {
    const bitmap = this.resources.getBitmap(this.imageID);
            
    if(bitmap) {
        const { context } = display;

        context.drawImage(bitmap, localX, localY, bitmap.width * this.scaleX, bitmap.height * this.scaleY);
    }
}

Icon.prototype.setScale = function(scaleX, scaleY) {
    this.scaleX = scaleX;
    this.scaleY = scaleY;
}

Icon.prototype.onDebug = function(display, localX, localY) {
    const { context } = display;
    
    context.globalAlpha = 0.5;
    context.fillStyle = "#0000ff";
    context.fillRect(localX, localY, this.width, this.height);
}

Icon.prototype.setImage = function(imageID) {
    this.imageID = imageID;
}