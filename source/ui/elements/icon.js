import { UIElement } from "../uiElement.js";

export const Icon = function(resources, DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);
    
    this.resources = resources;
    this.imageID = null;
}

Icon.prototype = Object.create(UIElement.prototype);
Icon.prototype.constructor = Icon;

Icon.prototype.onDraw = function(context, localX, localY) {
    const bitmap = this.resources.getBitmap(this.imageID);
            
    if(bitmap) {
        context.drawImage(bitmap, localX, localY);
    }
}

Icon.prototype.onDebug = function(context, localX, localY) {
    context.globalAlpha = 0.5;
    context.fillStyle = "#0000ff";
    context.fillRect(localX, localY, this.width, this.height);
}

Icon.prototype.setImage = function(imageID) {
    this.imageID = imageID;
}