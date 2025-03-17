import { Logger } from "../logger.js";
import { ImageManager } from "../resources/imageManager.js";
import { TileGraphics } from "./tileGraphics.js";
import { TileMeta } from "./tileMeta.js";

export const TileManager = function() {
    this.meta = new TileMeta();
    this.resources = new ImageManager();
    this.graphics = new TileGraphics();
}

TileManager.TILE_ID = {
    EMPTY: 0
};

TileManager.prototype.load = function(tileSheets, tileMeta) {
    this.meta.init(tileMeta);

    if(!tileSheets) {
        Logger.log(false, "TileSheets cannot be undefined!", "TileManager.prototype.load", null);
        return;
    }

    const usedSheets = this.graphics.load(tileSheets, tileMeta);

    this.resources.createImages(tileSheets);

    for(const sheetID of usedSheets) {
        this.resources.requestImage(sheetID, (key, image, sheet) => sheet.addReference());
    }
}

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();

    this.graphics.update(realTime);
}