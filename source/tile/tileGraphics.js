import { FrameContainer } from "../graphics/frameContainer.js";
import { TextureHandler } from "../resources/textureHandler.js";

export const TileGraphics = function() {
    TextureHandler.call(this);

    this.atlases = new Map();
}

TileGraphics.prototype = Object.create(TextureHandler.prototype);
TileGraphics.prototype.constructor = TileGraphics;

TileGraphics.DEFAULT = {
    FRAME_TIME: 1
};

TileGraphics.prototype.getValidContainer = function(tileID) {
    const index = tileID - 1;

    if(index < 0 || index >= this.containers.length) {
        return null;
    }

    const container = this.containers[index];
    const { texture, frameCount } = container;

    if(texture === null || frameCount === 0) {
        return null;
    }

    return container;
}

TileGraphics.prototype.onTextureLoad = function(textureID, texture) {
    const indices = this.atlases.get(textureID);

    if(!indices) {
        return;
    }

    for(let i = 0; i < indices.length; i++) {
        const index = indices[i];
        const graphic = this.containers[index];

        graphic.setTexture(texture);
        texture.addReference();
    }
}

TileGraphics.prototype.load = function(atlases, tileMeta) {
    this.resources.createTextures(atlases);

    for(let i = 0; i < tileMeta.length; i++) {
        const { graphics } = tileMeta[i];
        const [atlas, texture] = graphics;
        const container = new FrameContainer();
        const atlasConfig = atlases[atlas];

        this.addContainer(container);

        if(!atlasConfig) {
            continue;
        }

        createGraphic(container, atlasConfig, texture);

        const frameCount = container.getFrameCount();

        if(frameCount === 0) {
            continue;
        }

        if(frameCount > 1) {
            this.activeContainers.push(i);
        }
        
        const usedSheet = this.atlases.get(atlas);

        if(usedSheet) {
            usedSheet.push(i);
        } else {
            this.atlases.set(atlas, [i]);
            this.resources.requestBitmap(atlas);
        }
    }
}

const createGraphic = function(animation, sheet, graphicID) {
    const { regions = {}, patterns = {}, animations = {} } = sheet;
    const frameData = regions[graphicID];

    if(frameData) {
        const frame = FrameContainer.createFrame(frameData);

        animation.setFrameTime(TileGraphics.DEFAULT.FRAME_TIME);
        animation.addFrame(frame);

        return animation;
    } 

    const patternData = patterns[graphicID];

    if(patternData) {
        const frame = FrameContainer.createPatternFrame(patternData, regions);

        animation.setFrameTime(TileGraphics.DEFAULT.FRAME_TIME);
        animation.addFrame(frame);

        return animation;
    }

    const animationData = animations[graphicID];

    if(animationData) {
        const frameTime = animationData.frameTime ?? TileGraphics.DEFAULT.FRAME_TIME;
        const animationFrames = animationData.frames ?? [];

        animation.setFrameTime(frameTime);

        for(let i = 0; i < animationFrames.length; i++) {
            const frameID = animationFrames[i];
            const frameData = regions[frameID];

            if(frameData) {
                const frame = FrameContainer.createFrame(frameData);

                animation.addFrame(frame);
                continue;
            }

            const patternData = patterns[frameID];

            if(patternData) {
                const frame = FrameContainer.createPatternFrame(patternData, regions);

                animation.addFrame(frame);
                continue;
            }
        }

        return animation;
    }

    return animation;
}