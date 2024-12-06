import { Applyable } from "../applyable.js";

export const TextStyle = function() {
    Applyable.call(this);
    
    this.fontSize = 10;
    this.fontType = "sans-serif";
    this.font = "10px sans-serif";
    this.baseline = "middle";
    this.alignment = "left"
}

TextStyle.prototype = Object.create(Applyable.prototype);
TextStyle.prototype.constructor = TextStyle;

TextStyle.TEXT_BASELINE_MIDDLE = "middle";
TextStyle.TEXT_ALIGN_RIGHT = "right";
TextStyle.TEXT_ALIGN_LEFT = "left";
TextStyle.TEXT_ALIGN_CENTER = "center";

TextStyle.prototype.setAlignment = function(alignment) {
    if(alignment === undefined) {
        return;
    }

    this.alignment = alignment;
}

TextStyle.prototype.setBaseline = function(baseline) {
    if(baseline === undefined) {
        return;
    }

    this.baseline = baseline;
}

TextStyle.prototype.updateFont = function() {
    this.font = `${this.fontSize}px ${this.fontType}`;
}

TextStyle.prototype.setFontType = function(fontType) {
    if(fontType === undefined) {
        return;
    }

    this.fontType = fontType;
    this.updateFont();
}

TextStyle.prototype.setFontSize = function(fontSize) {
    if(fontSize === undefined) {
        return;
    }

    this.fontSize = fontSize;
    this.updateFont();
}

TextStyle.prototype.setFont = function(font) {
    if(font === undefined) {
        return;
    }

    this.font = font;
}

TextStyle.prototype.apply = function(context) {
    const fillStyle = this.getRGBAString();

    context.font = this.font;
    context.fillStyle = fillStyle;
    context.textAlign = this.alignment;
    context.textBaseline = this.baseline;
}