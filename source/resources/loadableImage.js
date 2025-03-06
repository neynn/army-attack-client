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

    return new Promise((resolve, reject) => {
        fetch(this.path)
            .then(response => {
                if(!response.ok) {
                    reject(LoadableImage.ERROR_CODE.ERROR_IMAGE_LOAD);
                }

                return response.blob();
            })
            .then(blob => {
                return createImageBitmap(blob);
            })
            .then(bitmap => {
                this.bitmap = bitmap;
                this.state = LoadableImage.STATE.LOADED;

                resolve(bitmap);
            })
            .catch(err => {
                this.state = LoadableImage.STATE.EMPTY;

                reject(LoadableImage.ERROR_CODE.ERROR_IMAGE_LOAD);
            });
    });
};

LoadableImage.prototype.addReference = function() {
    this.references++;
}

LoadableImage.prototype.removeReference = function() {
    this.references--;

    if(this.references <= 0) {
        console.log("REMOVED!", this.path);
        this.removeImage();
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