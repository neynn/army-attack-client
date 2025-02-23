import { Autotiler } from "./autotiler.js";
import { TileManager } from "./tileManager.js";

export const TileMeta = function() {
    this.graphics = [];
    this.inversion = {};
    this.autotilers = new Map();
}

TileMeta.BUFFER_THRESHOLD = {
    BIT_8: 256,
    BIT_16: 65536
};

TileMeta.prototype.getCorrectBuffer = function(bufferSize) {
    if(this.graphics.length < TileMeta.BUFFER_THRESHOLD.BIT_8) {
        return new Uint8Array(bufferSize);
    } else if(this.graphics.length < TileMeta.BUFFER_THRESHOLD.BIT_16) {
        return new Uint16Array(bufferSize);
    }

    return new Uint32Array(bufferSize);
}

TileMeta.prototype.init = function(tileMeta) {
    const { graphics, autotilers } = tileMeta;
    
    this.graphics = graphics;
    this.inversion = this.createInversion(graphics);

    for(const autotilerID in autotilers) {
        const autotiler = new Autotiler(autotilerID);
        const config = autotilers[autotilerID];

        autotiler.init(this, config);

        this.autotilers.set(autotilerID, autotiler);
    }
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

    return index >= 0 && index < this.graphics.length;
}

TileMeta.prototype.getMeta = function(tileID) {
    const index = tileID - 1;

    if(index < 0 || index >= this.graphics.length) {
        return null;
    }

    return this.graphics[index];
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

TileMeta.prototype.getAutotilerByID = function(id) {
    const autotiler = this.autotilers.get(id);

    if(!autotiler) {
        return null;
    }

    return autotiler;
}

TileMeta.prototype.getAutotilerByTile = function(tileID) {
    const tileMeta = this.getMeta(tileID);

    if(!tileMeta) {
        return null;
    }

    const autotilerID = tileMeta.autotiler;
    const autotiler = this.getAutotilerByID(autotilerID);

    return autotiler;
}