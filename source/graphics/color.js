import { loopValue } from "../math/math.js";

export const Color = function() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 255;
    this.rgba = "rgba(0, 0, 0, 255)";
}

Color.MAX_SIZE = 255;

Color.FORMAT = {
    NONE: 0,
    R: 1,
    RG: 2,
    RGB: 3,
    RGBA: 4
};

Color.TYPE = {
    R: 0,
    G: 1,
    B: 2,
    A: 3
};

Color.prototype.updateColor = function(type, value) {
    switch(type) {
        case Color.TYPE.R: {
            this.r = loopValue(this.r + value, Color.MAX_SIZE, 0);
            break;
        }
        case Color.TYPE.G: {
            this.g = loopValue(this.g + value, Color.MAX_SIZE, 0);
            break;
        }
        case Color.TYPE.B: {
            this.b = loopValue(this.b + value, Color.MAX_SIZE, 0);
            break;
        }
        case Color.TYPE.A: {
            this.a = loopValue(this.a + value, Color.MAX_SIZE, 0);
            break;
        }
    }

    this.updateRGBA();
}

Color.prototype.updateRGBA = function() {
    const alpha = this.a / Color.MAX_SIZE;
    const rgbaString = `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha})`;

    this.rgba = rgbaString;
}

Color.prototype.setColorRGB = function(r = 0, g = 0, b = 0) {
    this.r = loopValue(r, Color.MAX_SIZE, 0);
    this.g = loopValue(g, Color.MAX_SIZE, 0);
    this.b = loopValue(b, Color.MAX_SIZE, 0);
    this.updateRGBA();
}

Color.prototype.setColorRGBA = function(r = 0, g = 0, b = 0, a = 255) {
    this.r = loopValue(r, Color.MAX_SIZE, 0);
    this.g = loopValue(g, Color.MAX_SIZE, 0);
    this.b = loopValue(b, Color.MAX_SIZE, 0);
    this.a = loopValue(a, Color.MAX_SIZE, 0);
    this.updateRGBA();
}

Color.prototype.setColorArray = function(color) {
    if(!Array.isArray(color)) {
        this.setColorRGBA(0, 0, 0, 0);
        return;
    }

    switch(color.length) {
        case Color.FORMAT.R: {
            const [r] = color;
            this.setColorRGBA(r, 0, 0, 255);
            break;
        }
        case Color.FORMAT.RG: {
            const [r, g] = color;
            this.setColorRGBA(r, g, 0, 255);
            break;
        }
        case Color.FORMAT.RGB: {
            const [r, g, b] = color;
            this.setColorRGBA(r, g, b, 255);
            break;
        }
        case Color.FORMAT.RGBA: {
            const [r, g, b, a] = color;
            this.setColorRGBA(r, g, b, a);
            break;
        }
        default: {
            this.setColorRGBA(0, 0, 0, 255);
            break;
        }
    }
}