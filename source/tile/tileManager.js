import { ImageManager } from "../resources/imageManager.js";
import { TileGraphics } from "./tileGraphics.js";
import { Autotiler } from "./autotiler.js";

export const TileManager = function() {
    this.resources = new ImageManager();
    this.graphics = new TileGraphics();
    this.autotilers = new Map();
    this.metaInversion = {};
    this.meta = [];
}

TileManager.TILE_ID = {
    EMPTY: 0
};

TileManager.prototype.load = function(tileSheets, tileMeta) {
    if(!tileSheets) {
        console.warn("TileSheets do not exist!");
        return;
    }

    const { graphics, autotilers } = tileMeta;

    this.init(graphics, autotilers);
    this.graphics.load(tileSheets, graphics);
    this.resources.createImages(tileSheets);
    this.graphics.loadSheets(this.resources);
}

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();

    this.graphics.update(realTime);
}

TileManager.prototype.init = function(meta = [], autotilers = {}) {
    this.meta = meta;
    this.metaInversion = createInversion(meta);

    for(const autotilerID in autotilers) {
        const config = autotilers[autotilerID];
        const { type, values, members } = config;
        const autotiler = new Autotiler(autotilerID);

        autotiler.loadType(type);
        autotiler.loadValues(this, values);
        autotiler.loadMembers(this, members);

        this.autotilers.set(autotilerID, autotiler);
    }
}

TileManager.prototype.getInversion = function() {
    return this.metaInversion;
}

TileManager.prototype.getTileID = function(setID, animationID) {
    const set = this.metaInversion[setID];

    if(!set) {
        return TileManager.TILE_ID.EMPTY;
    }

    const tileID = set[animationID];

    if(tileID === undefined) {
        return TileManager.TILE_ID.EMPTY;
    }

    return tileID;
}

TileManager.prototype.hasMeta = function(tileID) {
    const index = tileID - 1;

    return index >= 0 && index < this.meta.length;
}

TileManager.prototype.getMeta = function(tileID) {
    const index = tileID - 1;

    if(index < 0 || index >= this.meta.length) {
        return null;
    }

    return this.meta[index];
}

TileManager.prototype.getAutotilerByID = function(id) {
    const autotiler = this.autotilers.get(id);

    if(!autotiler) {
        return null;
    }

    return autotiler;
}

TileManager.prototype.getAutotilerByTile = function(tileID) {
    const tileMeta = this.getMeta(tileID);

    if(!tileMeta) {
        return null;
    }

    const autotilerID = tileMeta.autotiler;
    const autotiler = this.getAutotilerByID(autotilerID);

    return autotiler;
}

const createInversion = function(values = []) {
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
