import { EventEmitter } from "../events/eventEmitter.js";
import { LoadableImage } from "./loadableImage.js";
import { PathHandler } from "./pathHandler.js";

export const ImageManager = function(imageType = LoadableImage.TYPE.BITMAP) {
    this.autoLoad = true;
    this.imageType = imageType;
    this.images = new Map();

    this.events = new EventEmitter();
    this.events.listen(ImageManager.EVENT.IMAGE_LOAD);
    this.events.listen(ImageManager.EVENT.IMAGE_UNLOAD);
    this.events.listen(ImageManager.EVENT.LOAD_ERROR);
}

ImageManager.EVENT = {
    IMAGE_LOAD: "IMAGE_LOAD",
    IMAGE_UNLOAD: "IMAGE_UNLOAD",
    LOAD_ERROR: "LOAD_ERROR"
};

ImageManager.SIZE = {
    MB: 1048576,
    LARGE: 2048 * 2048 * 4
};

ImageManager.DEFAULT = {
    FILE_TYPE: ".png"
};

ImageManager.prototype.createImages = function(imageMeta) {
    for(const imageID in imageMeta) {
        const imageConfig = imageMeta[imageID];
        const { directory, source } = imageConfig;

        this.createImage(imageID, directory, source);
    }
}

ImageManager.prototype.createImage = function(imageID, directory, source) {
    const fileName = source ? source : `${imageID}${ImageManager.DEFAULT.FILE_TYPE}`;
    const imagePath = PathHandler.getPath(directory, fileName);

    if(!this.images.has(imageID)) {
        const loadableImage = new LoadableImage(imagePath);

        this.images.set(imageID, loadableImage);
    }
}

ImageManager.prototype.isImageLoadable = function(imageID) {
    const loadableImage = this.images.get(imageID);

    if(!loadableImage) {
        return false;
    }

    const isLoadable = loadableImage.state === LoadableImage.STATE.EMPTY;

    return isLoadable;
}

ImageManager.prototype.requestImage = function(imageID) {
    const loadableImage = this.images.get(imageID);

    if(!loadableImage || loadableImage.state !== LoadableImage.STATE.EMPTY) {
        return;
    }

    loadableImage.requestImage(this.imageType)
    .then(() => this.events.emit(ImageManager.EVENT.IMAGE_LOAD, imageID, loadableImage))
    .catch((code) => this.events.emit(ImageManager.EVENT.LOAD_ERROR, imageID, code));
}

ImageManager.prototype.getImageBitmap = function(imageID) {
    const image = this.images.get(imageID);

    if(!image) {
        return null;
    }

    const { state, bitmap } = image;

    switch(state) {
        case LoadableImage.STATE.EMPTY: {
            if(this.autoLoad) {
                this.requestImage(imageID);
            }

            return null;
        }
        case LoadableImage.STATE.LOADED: {
            return bitmap;
        }
        default: {
            return null;
        }
    }
}

ImageManager.prototype.addReference = function(imageID) {
    const image = this.images.get(imageID);

    if(!image) {
        return -1;
    }
    
    const references = image.addReference();

    return references;
}

ImageManager.prototype.removeReference = function(imageID) {
    const image = this.images.get(imageID);

    if(!image) {
        return -1;
    }
    
    const references = image.removeReference();

    return references;
}