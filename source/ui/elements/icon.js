import { UIElement } from "../uiElement.js";

export const Icon = function(config) {
    UIElement.call(this, "ICON");
    this.image = null;
    this.loadFromConfig(config);
}

//The fuck? Icon should request an image!

Icon.prototype = Object.create(UIElement.prototype);
Icon.prototype.constructor = Icon;

Icon.prototype.loadFromConfig = function(config) {
    const { id, opacity, position } = config;
    const { x, y } = position;

    this.id = id;
    this.DEBUG_NAME = id;
    this.setPosition(x, y);
    this.setOpacity(opacity);
}

Icon.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {
    if(!this.image) {
        return;
    }

    const { w, h } = this.bounds;
    context.drawImage(this.image, localX, localY, w, h);
}

Icon.prototype.onDebug = function(context, viewportX, viewportY, localX, localY) {
    const { w, h } = this.bounds;
    context.globalAlpha = 0.5;
    context.fillStyle = "#0000ff";
    context.fillRect(localX, localY, w, h);
}

Icon.prototype.setImage = function(image) {
    this.image = image;
    this.bounds.set(0, 0, image.width, image.height);
}

Icon.prototype.getImage = function() {
    return this.image;
}