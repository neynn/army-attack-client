export const Applyable = function() {
    this.color = new Uint8Array(3);
    this.alpha = 0;
    this.isActive = false;
}

Applyable.prototype.enable = function() {
    this.isActive = true;
}

Applyable.prototype.disable = function() {
    this.isActive = false;
}

Applyable.prototype.getActive = function() {
    return this.isActive;
}

Applyable.prototype.setColor = function(r = 0, g = 0, b = 0, a = 0) {
    this.color[0] = r;
    this.color[1] = g;
    this.color[2] = b;
    this.alpha = a;
}

Applyable.prototype.setColorArray = function(color) {
    if(!Array.isArray(color) || color.length < 3) {
        this.setColor(0, 0, 0, 0);

        return false;
    }

    if(color.length === 3) {
        const [r, g, b] = color;
        this.setColor(r, g, b, 1);
    } else {
        const [r, g, b, a] = color;
        this.setColor(r, g, b, a);
    }

    return true;
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