import { TileSheet } from "../graphics/tileSheet.js";
import { Logger } from "../logger.js";
import { ImageManager } from "../resources/imageManager.js";
import { TileMeta } from "./tileMeta.js";

export const TileManager = function() {
    this.meta = new TileMeta();
    this.resources = new ImageManager();
    this.dynamicAnimations = [];
    this.tileTypes = {};
}

TileManager.TILE_ID = {
    EMPTY: 0
};

TileManager.prototype.load = function(tileTypes, tileMeta) {
    this.meta.init(tileMeta);

    if(!tileTypes) {
        Logger.log(false, "TileTypes cannot be undefined!", "TileManager.prototype.load", null);
        return;
    }

    this.loadTileTypes(tileTypes);

    this.resources.createImages(tileTypes);
    this.resources.requestAllImages((key, image, sheet) => sheet.addReference());
}

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();

    this.updateDynamicAnimations(realTime);
}

TileManager.prototype.updateDynamicAnimations = function(timestamp) {
    for(let i = 0; i < this.dynamicAnimations.length; i++) {
        const { set, animation } = this.dynamicAnimations[i];
        const tileType = this.tileTypes[set];
        const animationType = tileType.getAnimation(animation);

        animationType.updateFrameIndex(timestamp);
    }
}

TileManager.prototype.loadTileTypes = function(tileTypes) {
    for(const typeID in tileTypes) {
        const tileType = tileTypes[typeID];
        const tileSheet = new TileSheet();

        tileSheet.init(tileType);

        const dynamicAnimations = tileSheet.getDynamicAnimations();

        for(let i = 0; i < dynamicAnimations.length; i++) {
            const animationID = dynamicAnimations[i];

            this.dynamicAnimations.push({
                "set": typeID,
                "animation": animationID
            });
        }

        this.tileTypes[typeID] = tileSheet;
    }
}