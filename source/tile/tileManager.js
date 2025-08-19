import { TileTextureHandler } from "./tileTextureHandler.js";
import { Autotiler } from "./autotiler.js";

export const TileManager = function() {
    this.graphics = new TileTextureHandler();
    this.autotilers = new Map();
    this.metaInversion = {};
    this.meta = [];
}

TileManager.TILE_ID = {
    EMPTY: 0,
    INVALID: -1
};

TileManager.prototype.load = function(tileAtlases, tileMeta, autotilers) {
    if(!tileAtlases) {
        console.warn("TileAtlases do not exist!");
        return;
    }

    if(!tileMeta) {
        console.warn("TileMeta does not exist!");
        return;
    }

    this.graphics.load(tileAtlases, tileMeta);
    this.meta = tileMeta;

    for(let i = 0; i < tileMeta.length; i++) {
        const { graphics } = tileMeta[i];
        const [atlas, texture] = graphics;

        if(!this.metaInversion[atlas]) {
            this.metaInversion[atlas] = {};
        }

        this.metaInversion[atlas][texture] = i + 1;
    }

    if(!autotilers) {
        console.warn("Autotilers do not exist!");
        return;
    }
    
    for(const autotilerID in autotilers) {
        const config = autotilers[autotilerID];
        const autotiler = this.createAutotiler(config);

        this.autotilers.set(autotilerID, autotiler);
    }
}

TileManager.prototype.createAutotiler = function(config) {
    const { type = Autotiler.TYPE.NONE, values = {}, members = [] } = config;
    const autotiler = new Autotiler(TileManager.TILE_ID.EMPTY);

    autotiler.setType(type);

    for(let i = 0; i < members.length; i++) {
        const [atlas, texture] = members[i];
        const tileID = this.getTileID(atlas, texture);

        if(tileID !== TileManager.TILE_ID.EMPTY) {
            autotiler.addMember(tileID);
        }
    }

    for(const indexID in values) {
        const graphics = values[indexID];

        if(graphics) {
            const [atlas, texture] = graphics;
            const tileID = this.getTileID(atlas, texture);
            const index = Number(indexID);

            autotiler.setValue(index, tileID);
        }
    }

    return autotiler;
}

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();

    this.graphics.update(realTime);
}

TileManager.prototype.getInversion = function() {
    return this.metaInversion;
}

TileManager.prototype.getTileIDByArray = function(overlay) {
    if(!overlay) {
        return TileManager.TILE_ID.EMPTY;
    }

    const [atlas, texture] = overlay;
    const tileID = this.getTileID(atlas, texture);

    return tileID;
}

TileManager.prototype.getTileID = function(atlasID, textureID) {
    const atlas = this.metaInversion[atlasID];

    if(!atlas) {
        return TileManager.TILE_ID.EMPTY;
    }

    const tileID = atlas[textureID];

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

TileManager.prototype.getAutotilerByID = function(autotilerID) {
    const autotiler = this.autotilers.get(autotilerID);

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