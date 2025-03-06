export const LoadableImage = function(path) {
    this.path = path;
    this.bitmap = null;
    this.references = 0;
    this.state = LoadableImage.STATE.EMPTY;
}

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

LoadableImage.prototype.requestImage = function () {
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
    .then((response) => {
        if(!response.ok) {
            return Promise.reject(LoadableImage.ERROR_CODE.ERROR_IMAGE_LOAD);
        }

        return response.blob();
    })
    .then((blob) => {
        return createImageBitmap(blob);
    })
    .then((bitmap) => {
        this.bitmap = bitmap;
        this.state = LoadableImage.STATE.LOADED;

        return bitmap;
    })
    .catch((error) => {
        this.state = LoadableImage.STATE.EMPTY;

        return Promise.reject(LoadableImage.ERROR_CODE.ERROR_IMAGE_LOAD);
    });
};

LoadableImage.prototype.addReference = function() {
    this.references++;
}

LoadableImage.prototype.removeReference = function() {
    this.references--;

    if(this.references <= 0) {
        this.clear();
    }
}

LoadableImage.prototype.getBuffer = function() {
    switch(this.state) {
        case LoadableImage.STATE.EMPTY: {
            this.requestImage();
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

LoadableImage.prototype.getReferences = function() {
    return this.references;
}