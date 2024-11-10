import { Applyable } from "../applyable.js";

export const Outline = function() {
    Applyable.call(this);

    this.width = 0;
}

Outline.prototype = Object.create(Applyable.prototype);
Outline.prototype.constructor = Outline;

Outline.prototype.setWidth = function(width = 0) {
    this.width = width;
}

Outline.prototype.apply = function(context) {
    const strokeStyle = this.getRGBAString();

    context.strokeStyle = strokeStyle;
    context.lineWidth = this.width;
}