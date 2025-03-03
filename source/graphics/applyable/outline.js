import { Color } from "../color.js";

export const Outline = function() {
    this.color = new Color();
    this.state = Outline.STATE.INACTIVE;
    this.width = 1;
}

Outline.STATE = {
    INACTIVE: 0,
    ACTIVE: 1
};

Outline.prototype.enable = function() {
    this.state = Outline.STATE.ACTIVE;
}

Outline.prototype.disable = function() {
    this.state = Outline.STATE.INACTIVE;
}

Outline.prototype.isActive = function() {
    return this.state === Outline.STATE.ACTIVE;
}

Outline.prototype.setWidth = function(width = 0) {
    this.width = width;
}

Outline.prototype.apply = function(context) {
    const strokeStyle = this.color.getRGBAString();

    context.strokeStyle = strokeStyle;
    context.lineWidth = this.width;
}