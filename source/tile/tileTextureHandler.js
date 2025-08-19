import { TextureLoader } from "../resources/textureLoader.js";
import { TileContainer } from "./tileContainer.js";

export const TileTextureHandler = function() {
    this.loader = new TextureLoader();
    this.containers = [];
    this.activeContainers = [];
    this.atlases = new Map();

    this.loader.events.on(TextureLoader.EVENT.TEXTURE_LOAD, (textureID, texture) => {
        this.onTextureLoad(textureID, texture);
    }, { permanent: true });
}

TileTextureHandler.DEFAULT = {
    FRAME_TIME: 1
};

TileTextureHandler.prototype.getContainerCount = function() {
    return this.containers.length;
}

TileTextureHandler.prototype.getValidContainer = function(tileID) {
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

TileTextureHandler.prototype.onTextureLoad = function(textureID, texture) {
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

TileTextureHandler.prototype.load = function(atlases, tileMeta) {
    this.loader.createTextures(atlases);

    for(let i = 0; i < tileMeta.length; i++) {
        const { graphics } = tileMeta[i];
        const [atlasID, graphicID] = graphics;
        const container = new TileContainer();
        const atlasConfig = atlases[atlasID];

        this.containers.push(container);

        if(!atlasConfig) {
            continue;
        }

        TileTextureHandler.initContainer(container, atlasConfig, graphicID);

        const frameCount = container.getFrameCount();

        if(frameCount > 0) {
            if(frameCount > 1) {
                this.activeContainers.push(i);
            }

            const usedSheet = this.atlases.get(atlasID);

            if(usedSheet) {
                usedSheet.push(i);
            } else {
                this.atlases.set(atlasID, [i]);
                this.loader.requestBitmap(atlasID);
            }
        }
    }
}

TileTextureHandler.prototype.update = function(timestamp) {
    for(let i = 0; i < this.activeContainers.length; i++) {
        const index = this.activeContainers[i];
        const container = this.containers[index];

        container.updateFrameIndex(timestamp);
    }
}

TileTextureHandler.initContainer = function(container, atlas, graphicID) {
    const { regions = {}, patterns = {}, animations = {} } = atlas;
    const frameData = regions[graphicID];

    if(frameData) {
        const frame = TileContainer.createFrame(frameData);

        container.setFrameTime(TileTextureHandler.DEFAULT.FRAME_TIME);
        container.addFrame(frame);
        return;
    } 

    const patternData = patterns[graphicID];

    if(patternData) {
        const frame = TileContainer.createPatternFrame(patternData, regions);

        container.setFrameTime(TileTextureHandler.DEFAULT.FRAME_TIME);
        container.addFrame(frame);
        return;
    }

    const animationData = animations[graphicID];

    if(animationData) {
        const frameTime = animationData.frameTime ?? TileTextureHandler.DEFAULT.FRAME_TIME;
        const animationFrames = animationData.frames ?? [];

        container.setFrameTime(frameTime);

        for(let i = 0; i < animationFrames.length; i++) {
            const frameID = animationFrames[i];
            const frameData = regions[frameID];

            if(frameData) {
                const frame = TileContainer.createFrame(frameData);

                container.addFrame(frame);
                continue;
            }

            const patternData = patterns[frameID];

            if(patternData) {
                const frame = TileContainer.createPatternFrame(patternData, regions);

                container.addFrame(frame);
                continue;
            }
        }
    }
}