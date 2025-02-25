export const LoadableImage = function(path) {
    this.path = path;
    this.image = null;
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

LoadableImage.prototype.removeImage = function() {
    if(this.state !== LoadableImage.STATE.LOADED) {
        return;
    }

    this.state = LoadableImage.STATE.EMPTY;

    if(this.image) {
        this.image.onload = null;
        this.image.onerror = null;
        this.image.src = "";
        this.image = null;
    }
}

LoadableImage.prototype.requestImage = function() {
    if(!this.path) {
        return Promise.reject(LoadableImage.ERROR_CODE.ERROR_NO_PATH);
    }

    if(this.image) {
        return Promise.reject(LoadableImage.ERROR_CODE.ERROR_IMAGE_ALREADY_LOADED);
    }

    if(this.state === LoadableImage.STATE.LOADING || this.state !== LoadableImage.STATE.EMPTY) {
        return Promise.reject(LoadableImage.ERROR_CODE.ERROR_IMAGE_IS_LOADING);
    }

    return new Promise((resolve, reject) => {
        this.state = LoadableImage.STATE.LOADING;

        const image = new Image();

        image.onload = () => {
            this.state = LoadableImage.STATE.LOADED;
            this.image = image;

            resolve(image);
        };

        image.onerror = () => {
            this.state = LoadableImage.STATE.EMPTY;

            reject(LoadableImage.ERROR_CODE.ERROR_IMAGE_LOAD);
        };

        image.src = this.path;
    });
}

LoadableImage.prototype.addReference = function() {
    this.references++;
}

LoadableImage.prototype.removeReference = function() {
    this.references--;
}

LoadableImage.prototype.getBuffer = function() {
    switch(this.state) {
        case LoadableImage.STATE.EMPTY: {
            this.requestImage();
            return null;
        }
        case LoadableImage.STATE.LOADING: {
            return null;
        }
        case LoadableImage.STATE.LOADED: {
            return this.image;
        }
        default: {
            return null;
        }
    }
}

LoadableImage.prototype.getReferences = function() {
    return this.references;
}