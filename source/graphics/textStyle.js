export const TextStyle = function() {
    this.fontSize = 10;
    this.fontType = "sans-serif";
    this.font = "10px sans-serif";
    this.baseline = "middle";
    this.alignment = "left"
    this.color = "#ffffff";
}

TextStyle.TEXT_BASELINE_MIDDLE = "middle";
TextStyle.TEXT_ALIGN_RIGHT = "right";
TextStyle.TEXT_ALIGN_LEFT = "left";
TextStyle.TEXT_ALIGN_CENTER = "center";

TextStyle.prototype.setAlignment = function(alignment) {
    if(alignment === undefined) {
        return false;
    }

    this.alignment = alignment;

    return true;
}

TextStyle.prototype.setBaseline = function(baseline) {
    if(baseline === undefined) {
        return false;
    }

    this.baseline = baseline;

    return true;
}

TextStyle.prototype.updateFont = function() {
    this.font = `${this.fontSize}px ${this.fontType}`;
}

TextStyle.prototype.setFontType = function(fontType) {
    if(fontType === undefined) {
        return false;
    }

    this.fontType = fontType;
    this.updateFont();

    return true;
}

TextStyle.prototype.setFontSize = function(fontSize) {
    if(fontSize === undefined) {
        return false;
    }

    this.fontSize = fontSize;
    this.updateFont();

    return true;
}

TextStyle.prototype.setColor = function(colorHex) {
    if(colorHex === undefined) {
        return false;
    }

    this.color = colorHex;

    return true;
}

TextStyle.prototype.setFont = function(font) {
    if(font === undefined) {
        return false;
    }

    this.font = font;
    
    return true;
}

TextStyle.prototype.apply = function(context) {
    context.font = this.font;
    context.fillStyle = this.color;
    context.textAlign = this.alignment;
    context.textBaseline = this.baseline;
}