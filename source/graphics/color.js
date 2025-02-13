export const Color = function() {
    this.rgb = new Uint8Array(3);
    this.alpha = 0;
}

Color.FORMAT = {
    RGB: 3,
    RGBA: 4
};

Color.prototype.setColorRGB = function(r = 0, g = 0, b = 0) {
    this.rgb[0] = r;
    this.rgb[1] = g;
    this.rgb[2] = b;
}

Color.prototype.setColor = function(r = 0, g = 0, b = 0, a = 0) {
    this.rgb[0] = r;
    this.rgb[1] = g;
    this.rgb[2] = b;
    this.alpha = a;
}

Color.prototype.setColorArray = function(color) {
    if(!Array.isArray(color)) {
        this.setColor(0, 0, 0, 0);
        return;
    }

    switch(color.length) {
        case Color.FORMAT.RGB: {
            const [r, g, b] = color;
            this.setColor(r, g, b, 1);
            break;
        }
        case Color.FORMAT.RGBA: {
            const [r, g, b, a] = color;
            this.setColor(r, g, b, a);
            break;
        }
        default: {
            this.setColor(0, 0, 0, 0);
            break;
        }
    }
}

Color.prototype.getRGBAString = function() {
    const [r, g, b] = this.rgb;
    const rgbaString = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;

    return rgbaString;
}