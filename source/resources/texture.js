export const Texture = function(path) {
    this.path = path;
    this.bitmap = null;
    this.references = 0;
    this.width = 0;
    this.height = 0;
    this.state = Texture.STATE.EMPTY;
}

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

Texture.prototype.clear = function() {
    this.bitmap = null;
    this.state = Texture.STATE.EMPTY;
}

Texture.prototype.requestBitmap = function() {
    if(!this.path) {
        return Promise.reject(Texture.ERROR_CODE.ERROR_NO_PATH);
    }

    if(this.state === Texture.STATE.LOADING) {
        return Promise.reject(Texture.ERROR_CODE.ERROR_IMAGE_IS_LOADING);
    }

    if(this.bitmap) {
        return Promise.reject(Texture.ERROR_CODE.ERROR_IMAGE_ALREADY_LOADED);
    }

    this.state = Texture.STATE.LOADING;

    return fetch(this.path)
    .then((response) => this.onResponse(response))
    .then((blob) => createImageBitmap(blob))
    .catch((error) => this.onLoadError(error));
};

Texture.prototype.onResponse = function(response) {
    if(response.ok) {
        return response.blob();
    }

    return Promise.reject(Texture.ERROR_CODE.ERROR_IMAGE_LOAD);
}

Texture.prototype.onLoadError = function(error) {
    this.state = Texture.STATE.EMPTY;

    return Promise.reject(error);
}

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