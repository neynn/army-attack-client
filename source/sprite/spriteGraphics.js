import { FrameContainer } from "../graphics/frameContainer.js";
import { TextureHandler } from "../resources/textureHandler.js";
import { SpriteAtlas } from "./spriteAtlas.js";

export const SpriteGraphics = function() {
    TextureHandler.call(this);

    this.usedTextures = new Map();
}

SpriteGraphics.prototype = Object.create(TextureHandler.prototype);
SpriteGraphics.prototype.constructor = SpriteGraphics;

SpriteGraphics.prototype.onTextureLoad = function(textureID, texture) {
    const identifiers = this.usedTextures.get(textureID);

    if(!identifiers) {
        return;
    }

    for(let i = 0; i < identifiers.length; i++) {
        const atlas = this.atlases.get(identifiers[i]);
        const container = this.getContainer(atlas.getContainerID());

        if(container) {
            container.setTexture(texture);
        }
    }
}

SpriteGraphics.prototype.load = function(textures, sprites) {
    this.resources.createTextures(textures);

    const spriteKeys = Object.keys(sprites);

    for(const spriteID of spriteKeys) {
        const spriteConfig = sprites[spriteID];
        const { texture, bounds, frameTime, frames } = spriteConfig;
        const textureObject = this.resources.getTexture(texture);

        if(!textureObject) {
            console.warn(`Texture ${texture} of sprite ${spriteID} does not exist!`);
            continue;
        }

        const usedTextures = this.usedTextures.get(texture);

        if(usedTextures) {
            usedTextures.push(spriteID);
        } else {
            this.usedTextures.set(texture, [spriteID]);
        }

        const spriteAtlas = new SpriteAtlas();

        spriteAtlas.loadBounds(bounds);
        
        this.atlases.set(spriteID, spriteAtlas);

        if(!frames) {
            continue;
        }

        const container = new FrameContainer();

        container.setFrameTime(frameTime ?? FrameContainer.DEFAULT.FRAME_TIME);

        for(let i = 0; i < frames.length; i++) {
            const region = textureObject.getRegion(frames[i]);

            if(region) {
                container.addFrame([region]);
            }
        }

        const frameCount = container.getFrameCount();

        if(frameCount !== 0) {
            const containerID = this.addContainer(container);

            spriteAtlas.setContainerID(containerID);
        } else {
            console.warn(`Sprite ${spriteID} has no frames!`);
        }
    }

    console.log(this.usedTextures);
}