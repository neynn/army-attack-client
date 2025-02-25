export const BufferableImage = function(path) {
    this.path = path;
    this.image = null;
    this.buffer = null;
    this.references = 0;
    this.state = BufferableImage.STATE.EMPTY;
}

BufferableImage.STATE = {
    EMPTY: 0,
    LOADING: 1,
    LOADED: 2,
    BUFFERED: 3
};

BufferableImage.ERROR_CODE = {
    NONE: 0,
    ERROR_IMAGE_LOAD: 1,
    ERROR_NO_PATH: 2,
    ERROR_IMAGE_ALREADY_LOADED: 3,
    ERROR_IMAGE_IS_LOADING: 4
};

BufferableImage.prototype.removeBuffer = function() {
    if(!this.image) {
        this.state = BufferableImage.STATE.EMPTY;
    } else {
        this.state = BufferableImage.STATE.LOADED;
    }

    this.buffer = null;
}

BufferableImage.prototype.removeImage = function() {
    if(this.state !== BufferableImage.STATE.BUFFERED) {
        this.state = BufferableImage.STATE.EMPTY;
    }

    if(this.image) {
        this.image.onload = null;
        this.image.onerror = null;
        this.image.src = "";
        this.image = null;
    }
}

BufferableImage.prototype.requestImage = function() {
    if(!this.path) {
        return Promise.reject(BufferableImage.ERROR_CODE.ERROR_NO_PATH);
    }

    if(this.image) {
        return Promise.reject(BufferableImage.ERROR_CODE.ERROR_IMAGE_ALREADY_LOADED);
    }

    if(this.state === BufferableImage.STATE.LOADING || this.state !== BufferableImage.STATE.EMPTY) {
        return Promise.reject(BufferableImage.ERROR_CODE.ERROR_IMAGE_IS_LOADING);
    }

    return new Promise((resolve, reject) => {
        this.state = BufferableImage.STATE.LOADING;

        const image = new Image();

        image.onload = () => {
            this.state = BufferableImage.STATE.LOADED;
            this.image = image;

            resolve(image);
        };

        image.onerror = () => {
            this.state = BufferableImage.STATE.EMPTY;

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
    if(this.state === BufferableImage.STATE.BUFFERED || !this.image) {
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
    this.state = BufferableImage.STATE.BUFFERED;
}

BufferableImage.prototype.getBuffer = function() {
    switch(this.state) {
        case BufferableImage.STATE.EMPTY: {
            this.requestImage();
            return null;
        }
        case BufferableImage.STATE.LOADING: {
            return null;
        }
        case BufferableImage.STATE.LOADED: {
            return this.image;
        }
        case BufferableImage.STATE.BUFFERED: {
            return this.buffer;
        }
        default: {
            return null;
        }
    }
}

BufferableImage.prototype.getReferences = function() {
    return this.references;
}