import { TileManager } from "./tileManager.js";

export const TileMeta = function() {
    this.values = [];
    this.inversion = {};
}

TileMeta.prototype.init = function(values) {
    for(let i = 0; i < values.length; i++) {
        this.values[i] = values[i];
    }

    this.invert();
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

TileMeta.prototype.invert = function() {
    this.inversion = {};

    for(let i = 0; i < this.values.length; i++) {
        const { set, animation } = this.values[i];

        if(!this.inversion[set]) {
            this.inversion[set] = {};
        }

        this.inversion[set][animation] = i + 1;
    }
}