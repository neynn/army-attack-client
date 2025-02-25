import { LoadableImage } from "./loadableImage.js";

export const ImageManager = function() {
    this.images = new Map();
}

ImageManager.SIZE_MB = 1048576;
ImageManager.SIZE_BIG_IMAGE = 2048 * 2048 * 4;
ImageManager.DEFAULT_IMAGE_TYPE = ".png";

ImageManager.prototype.getPath = function(directory, source) {
    const path = `${directory}/${source}`;

    return path;
}

ImageManager.prototype.createImages = function(imageMeta) {
    for(const imageID in imageMeta) {
        const imageConfig = imageMeta[imageID];
        const { directory, source } = imageConfig;
        const fileName = source ? source : `${imageID}${ImageManager.DEFAULT_IMAGE_TYPE}`;
        const imagePath = this.getPath(directory, fileName);

        if(!this.images.has(imageID)) {
            const loadableImage = new LoadableImage(imagePath);

            this.images.set(imageID, loadableImage);
        }
    }
}

ImageManager.prototype.requestImage = function(imageID, onLoad) {
    const loadableImage = this.images.get(imageID);

    if(!loadableImage) {
        return;
    }

    loadableImage.requestImage()
    .then((image) => onLoad(imageID, image, loadableImage))
    .catch((code) => console.error(`Image ${imageID} could not be loaded! Code: ${code}`));
}

ImageManager.prototype.requestAllImages = function(onLoad) {
    for(const [imageID, loadableImage] of this.images) {
        loadableImage.requestImage()
        .then((image) => onLoad(imageID, image, loadableImage))
        .catch((code) => console.error(`Image ${imageID} could not be loaded! Code: ${code}`));
    }
}

ImageManager.prototype.getImage = function(imageID) {
    const sheet = this.images.get(imageID);

    if(!sheet) {
        return null;
    }

    return sheet.getBuffer();
}

ImageManager.prototype.addReference = function(imageID) {
    const sheet = this.images.get(imageID);

    if(!sheet) {
        return -1;
    }
    
    sheet.addReference();

    return sheet.getReferences();
}

ImageManager.prototype.removeReference = function(imageID) {
    const sheet = this.images.get(imageID);

    if(!sheet) {
        return -1;
    }
    
    sheet.removeReference();

    return sheet.getReferences();
}