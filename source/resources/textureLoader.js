import { EventEmitter } from "../events/eventEmitter.js";
import { Texture } from "./texture.js";
import { PathHandler } from "./pathHandler.js";

export const TextureLoader = function() {
    this.textures = new Map();
    this.events = new EventEmitter();

    this.events.listen(TextureLoader.EVENT.TEXTURE_LOAD);
    this.events.listen(TextureLoader.EVENT.TEXTURE_UNLOAD);
    this.events.listen(TextureLoader.EVENT.TEXTURE_ERROR);
}

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
    if(!this.textures.has(textureID)) {
        const { directory, source, regions = {} } = config;
        const fileName = source ? source : `${textureID}${TextureLoader.DEFAULT.FILE_TYPE}`;
        const imagePath = PathHandler.getPath(directory, fileName);
        const texture = new Texture(imagePath, regions);

        this.textures.set(textureID, texture);
    }
}

TextureLoader.prototype.requestBitmap = async function(textureID) {
    const texture = this.textures.get(textureID);

    if(texture && texture.state === Texture.STATE.EMPTY) {
        texture.requestBitmap(Texture.TYPE.BITMAP)
        .then((result) => {
            this.events.emit(TextureLoader.EVENT.TEXTURE_LOAD, textureID, texture);
        })
        .catch((error) => {
            this.events.emit(TextureLoader.EVENT.TEXTURE_ERROR, textureID, error);
        });
    }
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