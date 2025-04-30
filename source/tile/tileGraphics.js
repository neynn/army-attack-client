import { FrameContainer } from "../graphics/frameContainer.js";
import { TextureManager } from "../resources/textureManager.js";

export const TileGraphics = function() {
    this.resources = new TextureManager();
    this.containers = [];
    this.activeContainers = [];
    this.textures = new Map();

    this.resources.events.on(TextureManager.EVENT.TEXTURE_LOAD, (textureID, texture) => {
        this.onTextureLoad(textureID, texture);
    },  { permanent: true });
}

TileGraphics.DEFAULT = {
    FRAME_TIME: 1
};

TileGraphics.BUFFER_THRESHOLD = {
    BIT_8: 256,
    BIT_16: 65536
};

TileGraphics.COLOR = {
    EMPTY_TILE_FIRST: "#000000",
    EMPTY_TILE_SECOND: "#701867"
};

TileGraphics.prototype.drawEmptyTile = function(context, renderX, renderY, scaleX , scaleY, tileWidth, tileHeight) {
    const scaledX = tileWidth * 0.5 * scaleX;
    const scaledY = tileHeight * 0.5 * scaleY;

    context.fillStyle = TileGraphics.COLOR.EMPTY_TILE_FIRST;
    context.fillRect(renderX, renderY, scaledX, scaledY);
    context.fillRect(renderX + scaledX, renderY + scaledY, scaledX, scaledY);

    context.fillStyle = TileGraphics.COLOR.EMPTY_TILE_SECOND;
    context.fillRect(renderX + scaledX, renderY, scaledX, scaledY);
    context.fillRect(renderX, renderY + scaledY, scaledX, scaledY);
}

TileGraphics.prototype.drawTile = function(context, tileID, renderX, renderY, scaleX, scaleY, tileWidth, tileHeight) {
    const index = tileID - 1;

    if(index < 0 || index >= this.containers.length) {
        this.drawEmptyTile(context, renderX, renderY, scaleX, scaleY, tileWidth, tileHeight);
        return;
    }

    const graphic = this.containers[index];
    const { texture, frames, frameIndex, frameCount } = graphic;

    if(texture === null || frameCount === 0) {
        this.drawEmptyTile(context, renderX, renderY, scaleX, scaleY, tileWidth, tileHeight);
        return;
    }

    const { bitmap } = texture;
    const currentFrame = frames[frameIndex];
    const frameLength = currentFrame.length;

    for(let i = 0; i < frameLength; ++i) {
        const component = currentFrame[i];
        const { frameX, frameY, frameW, frameH, shiftX, shiftY } = component;
        const drawX = renderX + shiftX * scaleX;
        const drawY = renderY + shiftY * scaleY;
        const drawWidth = frameW * scaleX;
        const drawHeight = frameH * scaleY;

        context.drawImage(
            bitmap,
            frameX, frameY, frameW, frameH,
            drawX, drawY, drawWidth, drawHeight
        );
    }
}

TileGraphics.prototype.getBufferType = function() {
    if(this.containers.length < TileGraphics.BUFFER_THRESHOLD.BIT_8) {
        return Uint8Array;
    } else if(this.containers.length < TileGraphics.BUFFER_THRESHOLD.BIT_16) {
        return Uint16Array;
    }

    return Uint32Array;
}

TileGraphics.prototype.update = function(timestamp) {
    for(let i = 0; i < this.activeContainers.length; i++) {
        const index = this.activeContainers[i];
        const graphic = this.containers[index];

        graphic.updateFrameIndex(timestamp);
    }
}

TileGraphics.prototype.load = function(tileSheets, tileGraphics) {
    this.resources.createTextures(tileSheets);

    for(let i = 0; i < tileGraphics.length; i++) {
        const { set, animation } = tileGraphics[i];
        const sheet = tileSheets[set];
        const container = new FrameContainer();

        this.containers.push(container);

        if(!sheet) {
            continue;
        }

        createGraphic(container, sheet, animation);

        const frameCount = container.getFrameCount();

        if(frameCount === 0) {
            continue;
        }

        if(frameCount > 1) {
            this.activeContainers.push(i);
        }
        
        const usedSheet = this.textures.get(set);

        if(usedSheet) {
            usedSheet.push(i);
        } else {
            this.textures.set(set, [i]);
            this.resources.requestBitmap(set);
        }
    }
}

TileGraphics.prototype.onTextureLoad = function(textureID, texture) {
    const indices = this.textures.get(textureID);

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

const createGraphic = function(animation, sheet, graphicID) {
    const { frames = {}, patterns = {}, animations = {} } = sheet;
    const frameData = frames[graphicID];

    if(frameData) {
        const frame = FrameContainer.createFrame(frameData);

        animation.setFrameTime(TileGraphics.DEFAULT.FRAME_TIME);
        animation.addFrame(frame);

        return animation;
    } 

    const patternData = patterns[graphicID];

    if(patternData) {
        const frame = FrameContainer.createPatternFrame(patternData, frames);

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
            const frameData = frames[frameID];

            if(frameData) {
                const frame = FrameContainer.createFrame(frameData);

                animation.addFrame(frame);
                continue;
            }

            const patternData = patterns[frameID];

            if(patternData) {
                const frame = FrameContainer.createPatternFrame(patternData, frames);

                animation.addFrame(frame);
                continue;
            }
        }

        return animation;
    }

    return animation;
}