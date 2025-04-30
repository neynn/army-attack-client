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

SpriteGraphics.prototype.load = function(atlases) {
    this.resources.createTextures(atlases);

    const atlasKeys = Object.keys(atlases);

    for(let i = 0; i < atlasKeys.length; i++) {
        const atlasID = atlasKeys[i];
        const spriteAtlas = new SpriteAtlas();
        const atlasConfig = atlases[atlasID];
        const { animations, frames, frameTime, bounds } = atlasConfig;

        spriteAtlas.loadBounds(bounds);
        
        this.atlases.set(atlasID, spriteAtlas);

        if(!animations || !frames) {
            continue;
        }

        this.createContainers(spriteAtlas, animations, frames, frameTime ?? FrameContainer.DEFAULT.FRAME_TIME);
    }
}

SpriteGraphics.prototype.createContainers = function(atlas, animations, uniqueFrames, defaultFrameTime) {
    for(const animationID in animations) {
        const { 
            frameTime = defaultFrameTime,
            frames = [] 
        } = animations[animationID];

        const container = new FrameContainer();

        container.setFrameTime(frameTime);

        for(let i = 0; i < frames.length; i++) {
            const frameID = frames[i];
            const frameData = uniqueFrames[frameID];
            const frame = FrameContainer.createFrame(frameData);

            container.addFrame(frame);
        }

        const frameCount = container.getFrameCount();

        if(frameCount !== 0) {
            const containerID = this.addContainer(container);

            atlas.setSpriteIndex(animationID, containerID);
        } else {
            console.warn(`Animation ${animationID} has no frames!`);
        }
    }
}