import { Logger } from "../logger.js";
import { LoadableImage } from "./loadableImage.js";
import { PathHandler } from "./pathHandler.js";

export const ImageManager = function(imageType = LoadableImage.TYPE.BITMAP) {
    this.autoLoad = true;
    this.imageType = imageType;
    this.images = new Map();
}

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

ImageManager.prototype.onLoadingError = function(imageID, code) {
    Logger.log(Logger.CODE.ENGINE_WARN, "Image could not be loaded!", "", { imageID, "error": code })
}

ImageManager.prototype.requestImage = function(imageID, onLoad) {
    const loadableImage = this.images.get(imageID);

    if(!loadableImage) {
        return;
    }

    loadableImage.requestImage(this.imageType)
    .then((bitmap) => onLoad(imageID, bitmap, loadableImage))
    .catch((code) => this.onLoadingError(imageID, code));
}

ImageManager.prototype.requestAllImages = function(onLoad) {
    for(const [imageID, loadableImage] of this.images) {
        loadableImage.requestImage(this.imageType)
        .then((bitmap) => onLoad(imageID, bitmap, loadableImage))
        .catch((code) => this.onLoadingError(imageID, code));
    }
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
                image.requestImage(this.imageType);
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