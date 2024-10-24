export const Rectangle = function() {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
}

Rectangle.prototype.set = function(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

Rectangle.prototype.isZero = function() {
    return this.x === 0 && this.y === 0 && this.w === 0 && this.h === 0;
}

Rectangle.prototype.clear = function() {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
}