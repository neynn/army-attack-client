import { PathHandler } from "./pathHandler.js";
import { Texture } from "./texture.js";

export const ResourceLoader = function() {
    this.nextID = 0;
    this.textures = [];
    this.audio = [];
}

ResourceLoader.EMPTY_TEXTURE = new Texture(-1, "", {})
ResourceLoader.DEFAULT = {
    TEXTURE_TYPE: ".png",
    AUDIO_TYPE: ".mp3"
};

ResourceLoader.prototype.createTextures = function(textures) {
    const textureMap = {};

    for(const textureName in textures) {
        const { directory, source, regions = {} } = textures[textureName];
        const fileName = source ? source : `${textureName}${ResourceLoader.DEFAULT.TEXTURE_TYPE}`;
        const filePath = PathHandler.getPath(directory, fileName);
        const textureID = this.nextID++;
        const texture = new Texture(textureID, filePath, regions);

        this.textures.push(texture);
        textureMap[textureName] = textureID;
    }

    return textureMap;
}

ResourceLoader.prototype.getTextureByID = function(id) {
    for(let i = 0; i < this.textures.length; i++) {
        if(this.textures[i].id === id) {
            return this.textures[i];
        }
    }

    return null;
}

ResourceLoader.prototype.getAudioByID = function(id) {
    for(let i = 0; i < this.audio.length; i++) {
        if(this.audio[i].id === id) {
            return this.audio[i];
        }
    }

    return null;
}

ResourceLoader.prototype.createAudio = function() {

}

ResourceLoader.prototype.loadTexture = function(id) {
    const texture = this.getTextureByID(id);

    if(texture && texture.state === Texture.STATE.EMPTY) {
        texture.requestBitmap(Texture.TYPE.BITMAP)
        .then((result) => console.log("LOADED TEXTURE", id))
        .catch((error) => console.error("FAILED TO LOAD TEXTURE", id));
    } 
}

ResourceLoader.prototype.streamAudio = function() {}
ResourceLoader.prototype.loadAudio = function() {}