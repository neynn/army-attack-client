export const Layer = function(buffer) {
    this.buffer = buffer;
    this.opacity = 1;
}

Layer.RESPONSE_CODE = {
    SUCCESS: 0,
    OUT_OF_BOUNDS: 1
};

Layer.prototype.setBuffer = function(buffer) {
    this.buffer = buffer;
}

Layer.prototype.getBuffer = function() {
    return this.buffer;
}

Layer.prototype.resize = function(oldWidth, oldHeight, width, height, fill = 0) {
    const ArrayType = this.buffer.constructor;
    const layerSize = width * height;
    const newBuffer = new ArrayType(layerSize);
    
    if(fill !== 0) {
        for(let i = 0; i < layerSize; ++i) {
            newBuffer[i] = fill;
        }
    }

    for(let i = 0; i < oldHeight && i < height; ++i) {
        const newRow = i * width;
        const oldRow = i * oldWidth;

        for(let j = 0; j < oldWidth && j < width; ++j) {
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

    for(let i = 0; i < encodedLayer.length; i += 2) {
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

    let index = 0;
    const encodedLayer = [this.buffer[0], 1];

    for(let i = 1; i < this.buffer.length; ++i) {
        const currentID = this.buffer[i];

        if(currentID === encodedLayer[index]) {
            ++encodedLayer[index + 1];
        } else {
            encodedLayer.push(currentID);
            encodedLayer.push(1);
            index += 2;
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
