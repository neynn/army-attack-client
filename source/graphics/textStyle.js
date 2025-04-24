import { Color } from "./color.js";

export const TextStyle = function() {
    this.color = new Color();
    this.fontSize = TextStyle.DEFAULT.FONT_SIZE;
    this.fontType = TextStyle.DEFAULT.FONT_TYPE;
    this.baseline = TextStyle.TEXT_BASELINE.MIDDLE;
    this.alignment = TextStyle.TEXT_ALIGNMENT.LEFT;
    this.font = null;

    this.updateFont();
}

TextStyle.DEFAULT = {
    FONT_SIZE: 10,
    FONT_TYPE: "sans-serif"
};

TextStyle.TEXT_BASELINE = {
    MIDDLE: "middle"
};

TextStyle.TEXT_ALIGNMENT = {
    RIGHT: "right",
    LEFT: "left",
    MIDDLE: "center"
};

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

TextStyle.prototype.drawText = function(context, text, positionX, positionY) {
    context.font = this.font;
    context.fillStyle = this.color.rgba;
    context.textAlign = this.alignment;
    context.textBaseline = this.baseline;
    context.fillText(text, positionX, positionY);
}