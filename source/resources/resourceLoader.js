import { EventEmitter } from "../events/eventEmitter.js";
import { PathHandler } from "./pathHandler.js";
import { Texture } from "./texture.js";

export const ResourceLoader = function() {
    this.nextID = 0;
    this.textures = [];
    this.audio = [];

    this.events = new EventEmitter();
    this.events.listen(ResourceLoader.EVENT.TEXTURE_LOAD);
    this.events.listen(ResourceLoader.EVENT.AUDIO_LOAD);
    this.events.listen(ResourceLoader.EVENT.TEXTURE_LOAD);
}

ResourceLoader.EVENT = {
    TEXTURE_LOAD: "TEXTURE_LOAD",
    AUDIO_LOAD: "AUDIO_LOAD",
    LOAD_ERROR: "LOAD_ERROR"
};

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
        .then((result) => {
            this.events.emit(ResourceLoader.EVENT.TEXTURE_LOAD, id, texture);
        })
        .catch((error) => {
            this.events.emit(ResourceLoader.EVENT.LOAD_ERROR, id, error);
        });
    } 
}

ResourceLoader.prototype.steamAudio = function() {}
ResourceLoader.prototype.loadAudio = function() {}