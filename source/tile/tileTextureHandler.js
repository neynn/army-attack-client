import { ResourceLoader } from "../resources/resourceLoader.js";
import { TileContainer } from "./tileContainer.js";

export const TileTextureHandler = function() {
    this.containers = [];
    this.activeContainers = [];
    this.atlases = new Map();
}

TileTextureHandler.EMPTY_CONTAINER = new TileContainer();
TileTextureHandler.EMPTY_CONTAINER.setTexture(ResourceLoader.EMPTY_TEXTURE);

TileTextureHandler.prototype.update = function(timestamp) {
    for(let i = 0; i < this.activeContainers.length; i++) {
        this.activeContainers[i].updateFrameIndex(timestamp);
    }
}

TileTextureHandler.prototype.getContainer = function(tileID) {
    const index = tileID - 1;

    if(index < 0 || index >= this.containers.length) {
        return TileTextureHandler.EMPTY_CONTAINER;
    }

    return this.containers[index];
}

TileTextureHandler.prototype.getContainerCount = function() {
    return this.containers.length;
}

TileTextureHandler.prototype.load = function(resourceLoader, atlases, tileMeta) {
    const textureMap = resourceLoader.createTextures(atlases);

    for(let i = 0; i < tileMeta.length; i++) {
        const { graphics } = tileMeta[i];
        const [atlasID, frameID] = graphics;
        const container = new TileContainer();
        const atlasConfig = atlases[atlasID];

        if(atlasConfig) {
            container.init(atlasConfig, frameID);
        }

        const textureID = textureMap[atlasID];
        const frameCount = container.getFrameCount();

        if(frameCount > 0) {
            if(textureID !== undefined) {
                const textureObject = resourceLoader.getTextureByID(textureID);

                container.setTexture(textureObject);
                textureObject.addReference();
                resourceLoader.loadTexture(textureID);
            } else {
                container.setTexture(ResourceLoader.EMPTY_TEXTURE);
            }

            if(frameCount > 1) {
                this.activeContainers.push(container);
            }
        } else {
            container.setTexture(ResourceLoader.EMPTY_TEXTURE);
        }

        this.containers.push(container);
    }
}