import { FrameContainer } from "../graphics/frameContainer.js";
import { TextureHandler } from "../resources/textureHandler.js";
import { SpriteAtlas } from "./spriteAtlas.js";

export const SpriteGraphics = function() {
    TextureHandler.call(this);
}

SpriteGraphics.prototype = Object.create(TextureHandler.prototype);
SpriteGraphics.prototype.constructor = SpriteGraphics;

SpriteGraphics.prototype.onTextureLoad = function(atlasID, texture) {
    const spriteAtlas = this.atlases.get(atlasID);

    if(!spriteAtlas) {
        return;
    }

    const { sprites } = spriteAtlas;

    sprites.forEach((index) => this.containers[index].setTexture(texture));
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

            spriteAtlas.setSpriteIndex(spriteID, containerID);
        } else {
            console.warn(`Sprite ${spriteID} has no frames!`);
        }
    }
}