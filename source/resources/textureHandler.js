import { TextureLoader } from "./textureLoader.js";

export const TextureHandler = function() {
    this.resources = new TextureLoader();
    this.containers = [];
    this.activeContainers = [];
    this.autoRequest = true;

    this.resources.events.on(TextureLoader.EVENT.TEXTURE_LOAD, (textureID, texture) => {
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