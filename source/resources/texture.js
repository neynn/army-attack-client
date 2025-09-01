export const Texture = function(path, regions) {
    this.path = path;
    this.regions = regions;
    this.bitmap = null;
    this.references = 0;
    this.width = 0;
    this.height = 0;
    this.state = Texture.STATE.EMPTY;
}

Texture.TYPE = {
    BITMAP: 0,
    RAW: 1
};

Texture.STATE = {
    EMPTY: 0,
    LOADING: 1,
    LOADED: 2
};

Texture.ERROR_CODE = {
    NONE: "NONE",
    ERROR_IMAGE_LOAD: "LOAD_ERROR",
    ERROR_NO_PATH: "NO_PATH",
    ERROR_IMAGE_ALREADY_LOADED: "ALREADY_LOADED",
    ERROR_IMAGE_IS_LOADING: "IS_LOADING"
};

Texture.createImageData = function(bitmap) {
    const { width, height } = bitmap;
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.imageSmoothingEnabled = false;
    context.drawImage(bitmap, 0, 0);

    const imageData = context.getImageData(0, 0, width, height);
    const pixelArray = imageData.data;

    return pixelArray;
}

Texture.prototype.isState = function(state) {
    return this.state === state;
}

Texture.prototype.clear = function() {
    this.bitmap = null;
    this.state = Texture.STATE.EMPTY;
}

Texture.prototype.getLoadingError = function() {
    if(!this.path) {
        return Texture.ERROR_CODE.ERROR_NO_PATH;
    }

    if(this.state === Texture.STATE.LOADING) {
        return Texture.ERROR_CODE.ERROR_IMAGE_IS_LOADING;
    }

    if(this.bitmap) {
        return Texture.ERROR_CODE.ERROR_IMAGE_ALREADY_LOADED;
    }

    return Texture.ERROR_CODE.NONE;
}

Texture.prototype.requestBitmap = function(type) {
    const errorCode = this.getLoadingError();

    if(errorCode !== Texture.ERROR_CODE.NONE) {
        return Promise.reject(errorCode);
    }

    this.state = Texture.STATE.LOADING;

    return fetch(this.path)
    .then((response) => {
        if(response.ok) {
            return response.blob();
        }

        return Promise.reject(Texture.ERROR_CODE.ERROR_IMAGE_LOAD);
    })
    .then((blob) => createImageBitmap(blob))
    .then((bitmap) => {
        this.setImageData(bitmap, bitmap.width, bitmap.height);

        if(type === Texture.TYPE.RAW) {
            return Promise.resolve(Texture.createImageData(bitmap));
        }

        return Promise.resolve(bitmap);
    })
    .catch((error) => {
        this.state = Texture.STATE.EMPTY;

        return Promise.reject(error);
    });
};

Texture.prototype.setImageData = function(bitmap, width, height) {
    this.bitmap = bitmap;
    this.width = width;
    this.height = height;
    this.state = Texture.STATE.LOADED;
}

Texture.prototype.addReference = function() {
    this.references++;

    return this.references;
}

Texture.prototype.removeReference = function() {
    this.references--;

    if(this.references <= 0) {
        this.clear();
    }

    return this.references;
}

Texture.prototype.getRegion = function(regionID) {
    const region = this.regions[regionID];

    if(!region) {
        return null;
    }

    return region;
}