export const Bitmap = function(width, height) {
    this.width = width;
    this.height = height;
    this.imageData = new Uint8Array(width * height * 4);
}

Bitmap.prototype.setPixel = function(x, y, r, g, b, a) {
    const index = y * this.width + x;

    this.imageData[index] = r;
    this.imageData[index + 1] = g;
    this.imageData[index + 2] = b;
    this.imageData[index + 3] = a;
}