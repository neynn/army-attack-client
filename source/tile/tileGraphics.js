import { TextureLoader } from "../resources/textureLoader.js";
import { TileContainer } from "./tileContainer.js";

export const TileGraphics = function() {
    this.loader = new TextureLoader();
    this.containers = [];
    this.activeContainers = [];
    this.atlases = new Map();

    this.loader.events.on(TextureLoader.EVENT.TEXTURE_LOAD, (textureID, texture) => {
        this.onTextureLoad(textureID, texture);
    }, { permanent: true });
}

TileGraphics.DEFAULT = {
    FRAME_TIME: 1
};

TileGraphics.prototype.getContainerCount = function() {
    return this.containers.length;
}

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
    this.loader.createTextures(atlases);

    for(let i = 0; i < tileMeta.length; i++) {
        const { graphics } = tileMeta[i];
        const [atlas, texture] = graphics;
        const container = new TileContainer();
        const atlasConfig = atlases[atlas];

        this.containers.push(container);

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
            this.loader.requestBitmap(atlas);
        }
    }
}

TileGraphics.prototype.update = function(timestamp) {
    for(let i = 0; i < this.activeContainers.length; i++) {
        const index = this.activeContainers[i];
        const container = this.containers[index];

        container.updateFrameIndex(timestamp);
    }
}

const createGraphic = function(animation, sheet, graphicID) {
    const { regions = {}, patterns = {}, animations = {} } = sheet;
    const frameData = regions[graphicID];

    if(frameData) {
        const frame = TileContainer.createFrame(frameData);

        animation.setFrameTime(TileGraphics.DEFAULT.FRAME_TIME);
        animation.addFrame(frame);

        return animation;
    } 

    const patternData = patterns[graphicID];

    if(patternData) {
        const frame = TileContainer.createPatternFrame(patternData, regions);

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
                const frame = TileContainer.createFrame(frameData);

                animation.addFrame(frame);
                continue;
            }

            const patternData = patterns[frameID];

            if(patternData) {
                const frame = TileContainer.createPatternFrame(patternData, regions);

                animation.addFrame(frame);
                continue;
            }
        }

        return animation;
    }

    return animation;
}