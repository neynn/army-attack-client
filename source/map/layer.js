export const Layer = function(buffer) {
    this.buffer = buffer;
    this.opacity = 1;
    this.autoGenerate = false;
}

Layer.RESPONSE_CODE = {
    SUCCESS: 0,
    OUT_OF_BOUNDS: 1
};

Layer.prototype.getBuffer = function() {
    return this.buffer;
}

Layer.prototype.getOpacity = function() {
    return this.opacity;
}

Layer.prototype.setOpacity = function(opacity) {
    if(opacity !== undefined) {
        this.opacity = opacity;
    }
}

Layer.prototype.init = function(config) {
    if(!config) {
        return;
    }

    const { opacity, autoGenerate } = config;

    this.setOpacity(opacity);
    this.autoGenerate = autoGenerate ?? this.autoGenerate;
}

Layer.prototype.resize = function(oldWidth, oldHeight, newWidth, newHeight, fill = 0) {
    const layerSize = newWidth * newHeight;
    const ArrayType = this.buffer.constructor;
    const newBuffer = new ArrayType(layerSize);
    
    if(fill !== 0) {
        for(let i = 0; i < layerSize; ++i) {
            newBuffer[i] = fill;
        }
    }

    const copyWidth = newWidth < oldWidth ? newWidth : oldWidth;
    const copyHeight = newHeight < oldHeight ? newHeight : oldHeight;

    for(let i = 0; i < copyHeight; ++i) {
        const newRow = i * newWidth;
        const oldRow = i * oldWidth;

        for(let j = 0; j < copyWidth; ++j) {
            const newIndex = newRow + j;
            const oldIndex = oldRow + j;

            newBuffer[newIndex] = this.buffer[oldIndex];
        }
    }

    this.buffer = newBuffer;
}

Layer.prototype.decode = function(encodedLayer) {
    if(!encodedLayer || this.buffer.length === 0) {
        return;
    }

    let index = 0;
    const MAX_INDEX = this.buffer.length;
    const layerLength = encodedLayer.length;

    for(let i = 0; i < layerLength; i += 2) {
        const typeID = encodedLayer[i];
        const typeCount = encodedLayer[i + 1];
        const copies = Math.min(typeCount, MAX_INDEX - index);

        for(let j = 0; j < copies; ++j) {
            this.buffer[index] = typeID;
            ++index;
        }

        if(index >= MAX_INDEX) {
            return;
        }
    }
}

Layer.prototype.encode = function() {
    if(this.buffer.length === 0) {
        return [];
    }

    let typeIndex = 0;
    let countIndex = 1;
    const encodedLayer = [this.buffer[0], 1];
    const bufferLength = this.buffer.length;

    for(let i = 1; i < bufferLength; ++i) {
        const currentID = this.buffer[i];

        if(currentID === encodedLayer[typeIndex]) {
            ++encodedLayer[countIndex];
        } else {
            encodedLayer.push(currentID);
            encodedLayer.push(1);
            typeIndex += 2;
            countIndex += 2;
        }
    }

    return encodedLayer;
}

Layer.prototype.getItem = function(index) {
    if(index < 0 || index >= this.buffer.length) {
        return null;
    }

    return this.buffer[index];
}

Layer.prototype.setItem = function(item, index) {
    if(index < 0 || index >= this.buffer.length) {
        return Layer.RESPONSE_CODE.OUT_OF_BOUNDS;
    }

    this.buffer[index] = item;

    return Layer.RESPONSE_CODE.SUCCESS;
}
