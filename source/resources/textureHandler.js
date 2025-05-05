import { TextureManager } from "./textureManager.js";

export const TextureHandler = function() {
    this.resources = new TextureManager();
    this.atlases = new Map();
    this.containers = [];
    this.activeContainers = [];
    this.autoRequest = true;

    this.resources.events.on(TextureManager.EVENT.TEXTURE_LOAD, (textureID, texture) => {
        this.onTextureLoad(textureID, texture);
    },  { permanent: true });
}

TextureHandler.prototype.onTextureLoad = function(textureID, texture) {}

TextureHandler.prototype.disableAutoRequest = function() {
    this.autoRequest = false;
}

TextureHandler.prototype.enableAutoRequest = function() {
    this.autoRequest = true;
}

TextureHandler.prototype.addContainer = function(container) {
    this.containers.push(container);

    return this.containers.length - 1;
}

TextureHandler.prototype.getAtlas = function(atlasID) {
    const textureAtlas = this.atlases.get(atlasID);

    if(!textureAtlas) {
        return null;
    }

    if(this.autoRequest) {
        this.resources.requestBitmap(atlasID);
    }

    return textureAtlas;
}

TextureHandler.prototype.getContainer = function(index) {
    if(index < 0 || index >= this.containers.length) {
        return null;
    }

    return this.containers[index];
}

TextureHandler.prototype.getContainerCount = function() {
    return this.containers.length;
}

TextureHandler.prototype.update = function(timestamp) {
    for(let i = 0; i < this.activeContainers.length; i++) {
        const index = this.activeContainers[i];
        const container = this.containers[index];

        container.updateFrameIndex(timestamp);
    }
}