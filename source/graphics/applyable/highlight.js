import { Applyable } from "../applyable.js";

export const Highlight = function() {
    Applyable.call(this);
    
    this.isActive = false;
}

Highlight.prototype = Object.create(Applyable.prototype);
Highlight.prototype.constructor = Highlight;

Highlight.prototype.getActive = function() {
    return this.isActive;
}

Highlight.prototype.setActive = function() {
    this.isActive = true;
}

Highlight.prototype.apply = function(context) {
    const fillStyle = this.getRGBAString();

    context.fillStyle = fillStyle;

    this.isActive = false;
}