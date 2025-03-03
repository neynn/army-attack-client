import { UIElement } from "../uiElement.js";

export const Icon = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);
    
    this.image = null;
}

Icon.prototype = Object.create(UIElement.prototype);
Icon.prototype.constructor = Icon;

Icon.prototype.init = function(config) {
    if(!config) {
        return;
    }

    const { anchor, opacity, position } = config;
    const { x, y } = position;

    this.setPosition(x, y);
    this.setOpacity(opacity);
    this.setOrigin(x, y);
    this.setAnchor(anchor);
}

Icon.prototype.onDraw = function(context, localX, localY) {
    if(!this.image) {
        return;
    }

    context.drawImage(this.image, localX, localY, this.width, this.height);
}

Icon.prototype.onDebug = function(context, localX, localY) {
    context.globalAlpha = 0.5;
    context.fillStyle = "#0000ff";
    context.fillRect(localX, localY, this.width, this.height);
}

Icon.prototype.setImage = function(image) {
    this.image = image;
    this.width = image.width;
    this.height = image.height;
}

Icon.prototype.getImage = function() {
    return this.image;
}