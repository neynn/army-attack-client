export const Rectangle = function(x = 0, y = 0, w = 0, h = 0) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
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