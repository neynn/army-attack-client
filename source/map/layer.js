export const Layer = function(width, height) {
    this.buffer = [];
    this.opacity = 1;
    this.autoGenerate = false;
    this.width = width;
    this.height = height;
    this.type = Layer.BUFFER_TYPE.BIT_0;
}

Layer.BUFFER_TYPE = {
    BIT_0: 0,
    BIT_8: 1,
    BIT_16: 2,
    BIT_32: 3
};

Layer.BUFFER_THRESHOLD = {
    BIT_0: -1,
    BIT_8: 255,
    BIT_16: 65535,
    BIT_32: 4294967295
};

Layer.prototype.getBufferType = function(count) {
    if(count <= Layer.BUFFER_THRESHOLD.BIT_8) {
        return Layer.BUFFER_TYPE.BIT_8;
    } else if(count <= Layer.BUFFER_THRESHOLD.BIT_16) {
        return Layer.BUFFER_TYPE.BIT_16;
    }

    return Layer.BUFFER_TYPE.BIT_32;
}

Layer.prototype.fill = function(id) {
    if(!id) {
        return;
    }

    const length = this.buffer.length;
    
    for(let i = 0; i < length; ++i) {
        this.buffer[i] = id;
    }
}

Layer.prototype.initBuffer = function(count) {
    const bufferType = this.getBufferType(count);
    const bufferSize = this.width * this.height;

    switch(bufferType) {
        case Layer.BUFFER_TYPE.BIT_8: {
            this.type = Layer.BUFFER_TYPE.BIT_8;
            this.buffer = new Uint8Array(bufferSize);
            break;
        }
        case Layer.BUFFER_TYPE.BIT_16: {
            this.type = Layer.BUFFER_TYPE.BIT_16;
            this.buffer = new Uint16Array(bufferSize);
            break;
        }
        case Layer.BUFFER_TYPE.BIT_32: {
            this.type = Layer.BUFFER_TYPE.BIT_32;
            this.buffer = new Uint32Array(bufferSize);
            break;
        }
    }
}

Layer.prototype.getBuffer = function() {
    return this.buffer;
}

Layer.prototype.getOpacity = function() {
    return this.opacity;
}

Layer.prototype.setOpacity = function(opacity = 0) {
    if(opacity < 0) {
        this.opacity = 0;
    } else if(opacity > 1) {
        this.opacity = 1;
    } else {
        this.opacity = opacity;
    }
}

Layer.prototype.setAutoGenerate = function(autoGenerate) {
    this.autoGenerate = autoGenerate ?? this.autoGenerate;
}

Layer.prototype.resize = function(newWidth, newHeight, fill = 0) {
    const layerSize = newWidth * newHeight;
    const ArrayType = this.buffer.constructor;
    const newBuffer = new ArrayType(layerSize);
    
    if(fill !== 0) {
        for(let i = 0; i < layerSize; ++i) {
            newBuffer[i] = fill;
        }
    }

    const copyWidth = newWidth < this.width ? newWidth : this.width;
    const copyHeight = newHeight < this.height ? newHeight : this.height;

    for(let i = 0; i < copyHeight; ++i) {
        const newRow = i * newWidth;
        const oldRow = i * this.width;

        for(let j = 0; j < copyWidth; ++j) {
            const newIndex = newRow + j;
            const oldIndex = oldRow + j;

            newBuffer[newIndex] = this.buffer[oldIndex];
        }
    }

    this.buffer = newBuffer;
    this.width = newWidth;
    this.height = newHeight;
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
        return;
    }

    this.buffer[index] = item;
}
