export const Applyable = function() {
    this.color = new Uint8Array(3);
    this.alpha = 0;
    this.state = Applyable.STATE_INACTIVE;
}

Applyable.STATE_INACTIVE = 0;
Applyable.STATE_ACTIVE = 1;

Applyable.COLOR_FORMAT_RGB = 3;
Applyable.COLOR_FORMAT_RGBA = 4;

Applyable.prototype.enable = function() {
    this.state = Applyable.STATE_ACTIVE;
}

Applyable.prototype.disable = function() {
    this.state = Applyable.STATE_INACTIVE;
}

Applyable.prototype.isActive = function() {
    return this.state === Applyable.STATE_ACTIVE;
}

Applyable.prototype.setColor = function(r = 0, g = 0, b = 0, a = 0) {
    this.color[0] = r;
    this.color[1] = g;
    this.color[2] = b;
    this.alpha = a;
}

Applyable.prototype.setColorArray = function(color) {
    if(!Array.isArray(color)) {
        this.setColor(0, 0, 0, 0);
        return;
    }

    switch(color.length) {
        case Applyable.COLOR_FORMAT_RGB: {
            const [r, g, b] = color;

            this.setColor(r, g, b, 1);
            break;
        }
        case Applyable.COLOR_FORMAT_RGBA: {
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

Applyable.prototype.getRGBAString = function() {
    const [r, g, b] = this.color;
    const rgbaString = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;

    return rgbaString;
}

Applyable.prototype.apply = function(context) {
    const fillStyle = this.getRGBAString();

    context.fillStyle = fillStyle;
}