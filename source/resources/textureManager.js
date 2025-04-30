import { EventEmitter } from "../events/eventEmitter.js";
import { Texture } from "./texture.js";
import { PathHandler } from "./pathHandler.js";

export const TextureManager = function() {
    this.autoLoad = true;
    this.textureType = TextureManager.TEXTURE_TYPE.BITMAP;
    this.textures = new Map();

    this.events = new EventEmitter();
    this.events.listen(TextureManager.EVENT.TEXTURE_LOAD);
    this.events.listen(TextureManager.EVENT.TEXTURE_UNLOAD);
    this.events.listen(TextureManager.EVENT.TEXTURE_ERROR);
}

TextureManager.TEXTURE_TYPE = {
    BITMAP: 0,
    RAW: 1
};

TextureManager.EVENT = {
    TEXTURE_LOAD: "TEXTURE_LOAD",
    TEXTURE_UNLOAD: "TEXTURE_UNLOAD",
    TEXTURE_ERROR: "TEXTURE_ERROR"
};

TextureManager.SIZE = {
    MB: 1048576,
    LARGE: 2048 * 2048 * 4
};

TextureManager.DEFAULT = {
    FILE_TYPE: ".png"
};

TextureManager.prototype.createTextures = function(textureMeta) {
    for(const textureID in textureMeta) {
        const textureConfig = textureMeta[textureID];
        const { directory, source } = textureConfig;

        this.createTexture(textureID, directory, source);
    }
}

TextureManager.prototype.createTexture = function(textureID, directory, source) {
    const fileName = source ? source : `${textureID}${TextureManager.DEFAULT.FILE_TYPE}`;
    const imagePath = PathHandler.getPath(directory, fileName);

    if(!this.textures.has(textureID)) {
        const texture = new Texture(imagePath);

        this.textures.set(textureID, texture);
    }
}

TextureManager.prototype.requestBitmap = function(textureID) {
    const texture = this.textures.get(textureID);

    if(!texture || texture.state !== Texture.STATE.EMPTY) {
        return;
    }

    texture.requestBitmap()
    .then((bitmap) => this.onBitmapLoad(textureID, texture, bitmap))
    .catch((error) => this.events.emit(TextureManager.EVENT.TEXTURE_ERROR, textureID, error));
}

TextureManager.prototype.createImageData = function(bitmap) {
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

TextureManager.prototype.onBitmapLoad = function(textureID, texture, bitmap) {
    let imageData = bitmap;

    if(this.textureType === TextureManager.TEXTURE_TYPE.RAW) {
        imageData = this.createImageData(bitmap);
    }

    texture.setImageData(bitmap, bitmap.width, bitmap.height);

    this.events.emit(TextureManager.EVENT.TEXTURE_LOAD, textureID, texture);
}

TextureManager.prototype.getBitmap = function(textureID) {
    const texture = this.textures.get(textureID);

    if(!texture) {
        return null;
    }

    const { state, bitmap } = texture;

    if(state === Texture.STATE.LOADED) {
        return bitmap;
    }

    if(this.autoLoad && state === Texture.STATE.EMPTY) {
        this.requestBitmap(textureID);
    }

    return null;
}

TextureManager.prototype.addReference = function(textureID) {
    const texture = this.textures.get(textureID);

    if(!texture) {
        return -1;
    }
    
    const references = texture.addReference();

    return references;
}

TextureManager.prototype.removeReference = function(textureID) {
    const texture = this.textures.get(textureID);

    if(!texture) {
        return -1;
    }
    
    const references = texture.removeReference();

    return references;
}