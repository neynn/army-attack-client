import { TextureLoader } from "../resources/textureLoader.js";
import { SpriteContainer } from "./spriteContainer.js";

export const SpriteTextureHandler = function() {
    this.loader = new TextureLoader();
    this.indexMap = new Map();
    this.textureMap = new Map();
    this.containers = [];
}

SpriteTextureHandler.prototype.getContainer = function(index) {
    if(index < 0 || index >= this.containers.length) {
        return null;
    }

    return this.containers[index];
}

SpriteTextureHandler.prototype.getContainerIndex = function(spriteID) {
    const index = this.indexMap.get(spriteID);

    if(index === undefined) {
        return -1;
    }

    return index;
}

SpriteTextureHandler.prototype.loadBitmap = function(spriteID) {
    const textureID = this.textureMap.get(spriteID);

    if(!textureID) {
        return;
    }

    this.loader.requestBitmap(textureID);
}

SpriteTextureHandler.prototype.load = function(textures, sprites) {
    this.loader.createTextures(textures);
    
    for(const spriteID in sprites) {
        const spriteConfig = sprites[spriteID];
        const { texture, bounds, frameTime, frames } = spriteConfig;
        const textureObject = this.loader.getTexture(texture);

        if(!textureObject || !frames) {
            console.warn(`Texture ${texture} of sprite ${spriteID} does not exist!`);
            continue;
        }

        const spriteContainer = new SpriteContainer(textureObject, bounds, frameTime);
        const frameCount = spriteContainer.initFrames(frames);

        if(frameCount === 0) {
            console.warn(`Sprite ${spriteID} has no frames!`);
            continue;
        }

        this.containers.push(spriteContainer);
        this.indexMap.set(spriteID, this.containers.length - 1);
        this.textureMap.set(spriteID, texture);
    }
}