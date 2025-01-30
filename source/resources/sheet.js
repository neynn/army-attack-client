export const Sheet = function(id, image) {
    this.id = id;
    this.image = image;
    this.buffer = null;
    this.isBuffered = false;
    this.references = 0;
}

Sheet.prototype.addReference = function() {
    this.references++;
}

Sheet.prototype.removeReference = function() {
    this.references--;
}

Sheet.prototype.toBuffer = function() {
    if(this.isBuffered || !this.image) {
        return;
    }

    const canvas = document.createElement("canvas");
    const width = this.image.width;
    const height = this.image.height;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    
    context.imageSmoothingEnabled = false;

    context.drawImage(
        this.image,
        0, 0, width, height,
        0, 0, width, height
    );

    this.buffer = canvas;
    this.isBuffered = true;
}

Sheet.prototype.getBuffer = function() {
    if(this.isBuffered) {
        return this.buffer;
    }

    return this.image;
}

Sheet.prototype.getReferences = function() {
    return this.references;
}