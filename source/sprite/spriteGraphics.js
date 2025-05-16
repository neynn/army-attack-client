import { TextureHandler } from "../resources/textureHandler.js";
import { SpriteContainer } from "./spriteContainer.js";

export const SpriteGraphics = function() {
    TextureHandler.call(this);

    this.containerMap = new Map();
    this.textureMap = new Map();
}

SpriteGraphics.prototype = Object.create(TextureHandler.prototype);
SpriteGraphics.prototype.constructor = SpriteGraphics;

SpriteGraphics.prototype.loadBitmap = function(spriteID) {
    const textureID = this.textureMap.get(spriteID);

    if(!textureID) {
        return;
    }

    this.resources.requestBitmap(textureID);
}

SpriteGraphics.prototype.getContainerID = function(spriteID) {
    const index = this.containerMap.get(spriteID);

    if(index === undefined) {
        return -1;
    }

    return index;
}

SpriteGraphics.prototype.load = function(textures, sprites) {
    this.resources.createTextures(textures);
    
    const spriteKeys = Object.keys(sprites);

    for(const spriteID of spriteKeys) {
        const spriteConfig = sprites[spriteID];
        const { texture, bounds, frameTime, frames } = spriteConfig;
        const textureObject = this.resources.getTexture(texture);

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

        const containerID = this.addContainer(spriteContainer);

        this.containerMap.set(spriteID, containerID);
        this.textureMap.set(spriteID, texture);
    }
}