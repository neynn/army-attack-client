import { SpriteContainer } from "./spriteContainer.js";

export const SpriteTextureHandler = function(loader) {
    this.loader = loader;
    this.spriteMap = new Map();
    this.containers = [];
}

SpriteTextureHandler.prototype.getContainer = function(index) {
    if(index < 0 || index >= this.containers.length) {
        return null;
    }

    return this.containers[index];
}

SpriteTextureHandler.prototype.getContainerIndex = function(spriteID) {
    const data = this.spriteMap.get(spriteID);

    if(!data) {
        return -1;
    }

    const { index, textureID } = data;

    return index;
}

SpriteTextureHandler.prototype.loadBitmap = function(spriteID) {
    const data = this.spriteMap.get(spriteID);

    if(data) {
        const { index, textureID } = data;

        this.loader.loadTexture(textureID);
    }
}

SpriteTextureHandler.prototype.load = function(textures, sprites) {
    const textureMap = this.loader.createTextures(textures);
    
    for(const spriteID in sprites) {
        const spriteConfig = sprites[spriteID];
        const { texture, bounds, frameTime, frames } = spriteConfig;
        const textureID = textureMap[texture];

        if(textureID === undefined || !frames) {
            console.warn(`Texture ${texture} of sprite ${spriteID} does not exist!`);
            continue;
        }

        const textureObject = this.loader.getTextureByID(textureID);
        const spriteContainer = new SpriteContainer(textureObject, bounds, frameTime);
        const frameCount = spriteContainer.initFrames(frames);

        if(frameCount === 0) {
            console.warn(`Sprite ${spriteID} has no frames!`);
            continue;
        }

        this.containers.push(spriteContainer);
        this.spriteMap.set(spriteID, {
            "index": this.containers.length - 1,
            "textureID": textureID
        });
    }
}

SpriteTextureHandler.prototype.removeReference = function(spriteID) {
    const data = this.spriteMap.get(spriteID);

    if(data) {
        //TODO: Unload textures.
    }
}   