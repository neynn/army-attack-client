export const BufferableImage = function(path) {
    this.path = path;
    this.image = null;
    this.buffer = null;
    this.isBuffered = false;
    this.isLoaded = false;
    this.references = 0;
}

BufferableImage.ERROR_CODE = {
    NONE: 0,
    ERROR_IMAGE_LOAD: 1
};

BufferableImage.prototype.removeImage = function() {
    if(!this.image) {
        return;
    }

    this.image.src = null;
    this.image = null;
}

BufferableImage.prototype.requestImage = function() {
    if(!this.path || this.image) {
        return;
    }

    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
            this.image = image;
            this.isLoaded = true;

            resolve(image, BufferableImage.ERROR_CODE.NONE);
        };

        image.onerror = () => {
            this.isLoaded = false;

            reject(BufferableImage.ERROR_CODE.ERROR_IMAGE_LOAD);
        };

        image.src = this.path;
    });
}

BufferableImage.prototype.addReference = function() {
    this.references++;
}

BufferableImage.prototype.removeReference = function() {
    this.references--;
}

BufferableImage.prototype.toBuffer = function() {
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

BufferableImage.prototype.getBuffer = function() {
    if(this.isBuffered) {
        return this.buffer;
    }

    return this.image;
}

BufferableImage.prototype.getReferences = function() {
    return this.references;
}