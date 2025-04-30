import { FrameContainer } from "../graphics/frameContainer.js";
import { TextureManager } from "../resources/textureManager.js";
import { SpriteAtlas } from "./spriteAtlas.js";

export const SpriteGraphics = function() {
    this.resources = new TextureManager();
    this.atlases = new Map();
    this.containers = [];

    this.resources.events.on(TextureManager.EVENT.TEXTURE_LOAD, (textureID, texture) => {
        this.onTextureLoad(textureID, texture);
    }, { permanent: true });
}

SpriteGraphics.prototype.load = function(atlases) {
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

        this.createContainers(spriteAtlas, animations, frames, frameTime ?? SpriteAtlas.DEFAULT.FRAME_TIME);
    }

    this.resources.createTextures(atlases);
}

SpriteGraphics.prototype.onTextureLoad = function(atlasID, texture) {
    const spriteAtlas = this.atlases.get(atlasID);

    if(!spriteAtlas) {
        return;
    }

    const { sprites } = spriteAtlas;

    sprites.forEach((index) => this.containers[index].setTexture(texture));
}

SpriteGraphics.prototype.getSpriteIndex = function(atlasID, spriteID) {
    const spriteAtlas = this.atlases.get(atlasID);

    if(!spriteAtlas) {
        return SpriteAtlas.ID.INVALID;
    }

    const spriteIndex = spriteAtlas.getSpriteIndex(spriteID)

    return spriteIndex;
}

SpriteGraphics.prototype.getAtlas = function(atlasID) {
    const spriteAtlas = this.atlases.get(atlasID);

    if(!spriteAtlas) {
        return null;
    }

    this.resources.requestBitmap(atlasID);

    return spriteAtlas;
}

SpriteGraphics.prototype.getContainer = function(spriteIndex) {
    if(spriteIndex < 0 || spriteIndex >= this.containers.length) {
        return null;
    }

    return this.containers[spriteIndex];
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
            atlas.setSpriteIndex(animationID, this.containers.length);
            this.containers.push(container);
        } else {
            console.warn(`Animation ${animationID} has no frames!`);
        }
    }
}