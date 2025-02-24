export const Sheet = function(path) {
    this.path = path;
    this.image = null;
    this.buffer = null;
    this.isBuffered = false;
    this.isLoaded = false;
    this.references = 0;
}

Sheet.ERROR_CODE = {
    NONE: 0,
    ERROR_IMAGE_LOAD: 1
};

Sheet.prototype.removeImage = function() {
    if(!this.image) {
        return;
    }

    this.image.src = null;
    this.image = null;
}

Sheet.prototype.requestImage = async function() {
    if(!this.path || this.image) {
        return;
    }

    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
            this.image = image;
            this.isLoaded = true;

            resolve(image, Sheet.ERROR_CODE.NONE);
        };

        image.onerror = () => {
            this.isLoaded = false;

            reject(Sheet.ERROR_CODE.ERROR_IMAGE_LOAD);
        };

        image.src = this.path;
    });
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