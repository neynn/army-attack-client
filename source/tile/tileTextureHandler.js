import { ResourceLoader } from "../resources/resourceLoader.js";
import { TileContainer } from "./tileContainer.js";

export const TileTextureHandler = function() {
    this.containers = [];
    this.activeContainers = [];
    this.atlases = new Map();
}

TileTextureHandler.prototype.update = function(timestamp) {
    for(let i = 0; i < this.activeContainers.length; i++) {
        this.activeContainers[i].updateFrameIndex(timestamp);
    }
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