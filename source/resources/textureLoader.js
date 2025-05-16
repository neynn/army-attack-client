import { EventEmitter } from "../events/eventEmitter.js";
import { Texture } from "./texture.js";
import { PathHandler } from "./pathHandler.js";

export const TextureLoader = function() {
    this.textures = new Map();
    this.textureType = TextureLoader.TEXTURE_TYPE.BITMAP;
    this.autoLoad = true;

    this.events = new EventEmitter();
    this.events.listen(TextureLoader.EVENT.TEXTURE_LOAD);
    this.events.listen(TextureLoader.EVENT.TEXTURE_UNLOAD);
    this.events.listen(TextureLoader.EVENT.TEXTURE_ERROR);
}

TextureLoader.TEXTURE_TYPE = {
    BITMAP: 0,
    RAW: 1
};

TextureLoader.EVENT = {
    TEXTURE_LOAD: "TEXTURE_LOAD",
    TEXTURE_UNLOAD: "TEXTURE_UNLOAD",
    TEXTURE_ERROR: "TEXTURE_ERROR"
};

TextureLoader.SIZE = {
    MB: 1048576,
    LARGE: 2048 * 2048 * 4
};

TextureLoader.DEFAULT = {
    FILE_TYPE: ".png"
};

TextureLoader.prototype.getTexture = function(textureID) {
    const texture = this.textures.get(textureID);

    if(!texture) {
        return null;
    }

    return texture;
}

TextureLoader.prototype.createTextures = function(textureMeta) {
    for(const textureID in textureMeta) {
        const textureConfig = textureMeta[textureID];

        this.createTexture(textureID, textureConfig);
    }
}

TextureLoader.prototype.createTexture = function(textureID, config) {
    const { directory, source, regions } = config;
    const fileName = source ? source : `${textureID}${TextureLoader.DEFAULT.FILE_TYPE}`;
    const imagePath = PathHandler.getPath(directory, fileName);

    if(this.textures.has(textureID)) {
        return;
    }

    const texture = new Texture(imagePath, regions);

    this.textures.set(textureID, texture);
}

TextureLoader.prototype.requestBitmap = function(textureID) {
    const texture = this.textures.get(textureID);

    if(!texture || texture.state !== Texture.STATE.EMPTY) {
        return;
    }

    texture.requestBitmap()
    .then((bitmap) => this.onBitmapLoad(textureID, texture, bitmap))
    .catch((error) => this.events.emit(TextureLoader.EVENT.TEXTURE_ERROR, textureID, error));
}

TextureLoader.prototype.createImageData = function(bitmap) {
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

TextureLoader.prototype.onBitmapLoad = function(textureID, texture, bitmap) {
    let imageData = bitmap;

    if(this.textureType === TextureLoader.TEXTURE_TYPE.RAW) {
        imageData = this.createImageData(bitmap);
    }

    texture.setImageData(bitmap, bitmap.width, bitmap.height);

    this.events.emit(TextureLoader.EVENT.TEXTURE_LOAD, textureID, texture);
}

TextureLoader.prototype.getBitmap = function(textureID) {
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

TextureLoader.prototype.addReference = function(textureID) {
    const texture = this.textures.get(textureID);

    if(!texture) {
        return -1;
    }
    
    const references = texture.addReference();

    return references;
}

TextureLoader.prototype.removeReference = function(textureID) {
    const texture = this.textures.get(textureID);

    if(!texture) {
        return -1;
    }
    
    const references = texture.removeReference();

    return references;
}