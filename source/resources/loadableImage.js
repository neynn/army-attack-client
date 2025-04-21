export const LoadableImage = function(path) {
    this.path = path;
    this.bitmap = null;
    this.references = 0;
    this.width = 0;
    this.height = 0;
    this.state = LoadableImage.STATE.EMPTY;
}

LoadableImage.USE_AUTO_LOADING = 1;

LoadableImage.TYPE = {
    BITMAP: 0,
    RAW: 1
};

LoadableImage.STATE = {
    EMPTY: 0,
    LOADING: 1,
    LOADED: 2
};

LoadableImage.ERROR_CODE = {
    NONE: 0,
    ERROR_IMAGE_LOAD: 1,
    ERROR_NO_PATH: 2,
    ERROR_IMAGE_ALREADY_LOADED: 3,
    ERROR_IMAGE_IS_LOADING: 4
};

LoadableImage.prototype.clear = function() {
    if(this.state !== LoadableImage.STATE.LOADED) {
        return;
    }

    this.state = LoadableImage.STATE.EMPTY;
    this.bitmap = null;
}

LoadableImage.prototype.createImageData = function(bitmap) {
    const canvas = document.createElement("canvas");

    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext("2d");

    context.imageSmoothingEnabled = false;
    context.drawImage(bitmap, 0, 0);

    const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
    const pixelArray = imageData.data;

    return pixelArray;
}

LoadableImage.prototype.requestImage = function(imageType) {
    if(!this.path) {
        return Promise.reject(LoadableImage.ERROR_CODE.ERROR_NO_PATH);
    }

    if(this.state === LoadableImage.STATE.LOADING) {
        return Promise.reject(LoadableImage.ERROR_CODE.ERROR_IMAGE_IS_LOADING);
    }

    if(this.bitmap) {
        return Promise.reject(LoadableImage.ERROR_CODE.ERROR_IMAGE_ALREADY_LOADED);
    }

    this.state = LoadableImage.STATE.LOADING;

    return fetch(this.path)
    .then((response) => response.ok ? response.blob() : Promise.reject(LoadableImage.ERROR_CODE.ERROR_IMAGE_LOAD))
    .then((blob) => createImageBitmap(blob))
    .then((bitmap) => this.onBitmapLoad(bitmap, imageType))
    .catch((error) => Promise.reject(this.onLoadError(error)));
};

LoadableImage.prototype.onLoadError = function(error) {
    this.state = LoadableImage.STATE.EMPTY;

    return LoadableImage.ERROR_CODE.ERROR_IMAGE_LOAD;
}

LoadableImage.prototype.onBitmapLoad = function(bitmap, imageType) {
    switch(imageType) {
        case LoadableImage.TYPE.BITMAP: {
            this.bitmap = bitmap;
            break;
        }
        case LoadableImage.TYPE.RAW: {
            this.bitmap = this.createImageData(bitmap);
            break;
        }
        default: {
            this.bitmap = bitmap;
            break;
        }
    }

    this.width = bitmap.width;
    this.height = bitmap.height;
    this.state = LoadableImage.STATE.LOADED;

    return this.bitmap;
}

LoadableImage.prototype.addReference = function() {
    this.references++;

    return this.references;
}

LoadableImage.prototype.removeReference = function() {
    this.references--;

    if(this.references <= 0) {
        this.clear();
    }

    return this.references;
}

LoadableImage.prototype.getBitmap = function() {
    switch(this.state) {
        case LoadableImage.STATE.EMPTY: {
            if(LoadableImage.USE_AUTO_LOADING) {
                this.requestImage(LoadableImage.TYPE.BITMAP);
            }

            return null;
        }
        case LoadableImage.STATE.LOADED: {
            return this.bitmap;
        }
        default: {
            return null;
        }
    }
}