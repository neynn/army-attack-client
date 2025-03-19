import { Autotiler } from "./autotiler.js";
import { TileManager } from "./tileManager.js";

export const TileMeta = function() {
    this.graphics = [];
    this.graphicsInversion = {};
    this.autotilers = new Map();
}

TileMeta.prototype.init = function(tileMeta) {
    if(!tileMeta) {
        return;
    }

    const { graphics, autotilers } = tileMeta;

    this.graphics = graphics;
    this.graphicsInversion = this.createInversion(graphics);

    for(const autotilerID in autotilers) {
        const config = autotilers[autotilerID];
        const { type, values, members } = config;
        const autotiler = new Autotiler(autotilerID);

        autotiler.loadType(type);
        autotiler.loadValues(this, values);
        autotiler.loadMembers(this, members);

        this.autotilers.set(autotilerID, autotiler);
    }

    //Members also have to be loaded HERE!!! (This means to LINK the members to an element in graphics!!!);
}

TileMeta.prototype.getInversion = function() {
    return this.graphicsInversion;
}

TileMeta.prototype.getTileID = function(setID, animationID) {
    const set = this.graphicsInversion[setID];

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