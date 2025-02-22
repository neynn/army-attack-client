import { TileManager } from "./tileManager.js";

export const TileMeta = function() {
    this.values = [];
    this.inversion = {};
}

TileMeta.BUFFER_THRESHOLD = {
    BIT_8: 256,
    BIT_16: 65536
};

TileMeta.prototype.getCorrectBuffer = function(bufferSize) {
    if(this.values.length < TileMeta.BUFFER_THRESHOLD.BIT_8) {
        return new Uint8Array(bufferSize);
    } else if(this.values.length < TileMeta.BUFFER_THRESHOLD.BIT_16) {
        return new Uint16Array(bufferSize);
    }

    return new Uint32Array(bufferSize);
}

TileMeta.prototype.init = function(values) {
    for(let i = 0; i < values.length; i++) {
        this.values[i] = values[i];
    }

    this.inversion = this.createInversion(values);
}

TileMeta.prototype.getInversion = function() {
    return this.inversion;
}

TileMeta.prototype.getTileID = function(setID, animationID) {
    const set = this.inversion[setID];

    if(!set) {
        return TileManager.TILE_ID.EMPTY;
    }

    const tileID = set[animationID];

    if(tileID === undefined) {
        return TileManager.TILE_ID.EMPTY;
    }

    return tileID;
}

TileMeta.prototype.hasMeta = function(tileID) {
    const index = tileID - 1;

    return index >= 0 && index < this.values.length;
}

TileMeta.prototype.getMeta = function(tileID) {
    const index = tileID - 1;

    if(index < 0 || index >= this.values.length) {
        return null;
    }

    return this.values[index];
}

TileMeta.prototype.createInversion = function(values) {
    const inversion = {};

    for(let i = 0; i < values.length; i++) {
        const { set, animation } = values[i];

        if(!inversion[set]) {
            inversion[set] = {};
        }

        inversion[set][animation] = i + 1;
    }
    
    return inversion;
}