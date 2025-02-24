import { Sheet } from "./sheet.js";

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

ImageManager.prototype.loadImages = function(imageMeta, onLoad) {
    for(const imageID in imageMeta) {
        const imageConfig = imageMeta[imageID];
        const { directory, source } = imageConfig;
        const fileName = source ? source : `${imageID}${ImageManager.DEFAULT_IMAGE_TYPE}`;
        const imagePath = this.getPath(directory, fileName);

        if(this.images.has(imageID)) {
            continue;
        }

        const sheet = new Sheet(imagePath);

        this.images.set(imageID, sheet);

        sheet.requestImage()
        .then((image, code) => onLoad(imageID, image, sheet))
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