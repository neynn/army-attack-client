import { ResourceLoader } from "../resources/resourceLoader.js";
import { TileContainer } from "./tileContainer.js";

export const TileTextureHandler = function(loader) {
    this.loader = loader;
    this.containers = [];
    this.activeContainers = [];
    this.atlases = new Map();

    this.loader.events.on(ResourceLoader.EVENT.TEXTURE_LOAD, (id, texture) => {
        this.onTextureLoad(id, texture);
    }, { permanent: true });
}

TileTextureHandler.DEFAULT = {
    FRAME_TIME: 1
};

TileTextureHandler.prototype.getContainerCount = function() {
    return this.containers.length;
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
    const textureMap = this.loader.createTextures(atlases);

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
                this.activeContainers.push(container);
            }

            const textureID = textureMap[atlasID];

            if(textureID !== undefined) {
                const atlas = this.atlases.get(textureID);

                if(atlas) {
                    atlas.push(i);
                } else {
                    this.atlases.set(textureID, [i]);
                    this.loader.loadTexture(textureID);
                }
            }
        }
    }
}

TileTextureHandler.prototype.update = function(timestamp) {
    for(let i = 0; i < this.activeContainers.length; i++) {
        this.activeContainers[i].updateFrameIndex(timestamp);
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