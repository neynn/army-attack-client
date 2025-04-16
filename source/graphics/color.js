export const Color = function() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.alpha = 0;
}

Color.LENGTH = 256;

Color.FORMAT = {
    NONE: 0,
    R: 1,
    RG: 2,
    RGB: 3,
    RGBA: 4
};

Color.prototype.setColorRGB = function(r = 0, g = 0, b = 0) {
    this.r = r % Color.LENGTH;
    this.g = g % Color.LENGTH;
    this.b = b % Color.LENGTH;
}

Color.prototype.setColorRGBA = function(r = 0, g = 0, b = 0, a = 0) {
    this.r = r % Color.LENGTH;
    this.g = g % Color.LENGTH;
    this.b = b % Color.LENGTH;
    this.alpha = a;
}

Color.prototype.setColorArray = function(color) {
    if(!Array.isArray(color)) {
        this.setColorRGBA(0, 0, 0, 0);
        return;
    }

    switch(color.length) {
        case Color.FORMAT.R: {
            const [r] = color;
            this.setColorRGBA(r, 0, 0, 1);
            break;
        }
        case Color.FORMAT.RG: {
            const [r, g] = color;
            this.setColorRGBA(r, g, 0, 1);
            break;
        }
        case Color.FORMAT.RGB: {
            const [r, g, b] = color;
            this.setColorRGBA(r, g, b, 1);
            break;
        }
        case Color.FORMAT.RGBA: {
            const [r, g, b, a] = color;
            this.setColorRGBA(r, g, b, a);
            break;
        }
        default: {
            this.setColorRGBA(0, 0, 0, 0);
            break;
        }
    }
}

Color.prototype.getRGBAString = function() {
    const rgbaString = `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alpha})`;

    return rgbaString;
}