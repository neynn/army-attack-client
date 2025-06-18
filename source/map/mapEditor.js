import { loopValue } from "../math/math.js";
import { Scroller } from "../scroller.js";
import { Brush } from "./editor/brush.js";
import { ButtonHandler } from "./editor/buttonHandler.js";
import { EditorButton } from "./editor/editorButton.js";

export const MapEditor = function() {
    this.brush = new Brush();
    this.buttonHandler = new ButtonHandler();
    this.brushSets = new Scroller();
    this.brushSizes = new Scroller();
    this.modes = new Scroller([MapEditor.MODE.DRAW, MapEditor.MODE.AUTOTILE]);
    this.mode = MapEditor.MODE.DRAW;
    this.mapID = null;
    this.pageIndex = 0;
    this.activityStack = [];
    this.autoState = MapEditor.AUTOTILER_STATE.INACTIVE;
    this.hiddenSets = new Set();
    this.slots = [];
}

MapEditor.AUTOTILER_STATE = {
    INACTIVE: 0,
    ACTIVE: 1
};

MapEditor.MODE = {
    DRAW: 0,
    AUTOTILE: 1
};

MapEditor.MODE_NAME = {
    [MapEditor.MODE.DRAW]: "DRAW",
    [MapEditor.MODE.AUTOTILE]: "AUTOTILE"
};

MapEditor.prototype.toggleAutotiling = function() {
    switch(this.autoState) {
        case MapEditor.AUTOTILER_STATE.INACTIVE: {
            this.autoState = MapEditor.AUTOTILER_STATE.ACTIVE;
            break;
        }
        case MapEditor.AUTOTILER_STATE.ACTIVE: {
            this.autoState = MapEditor.AUTOTILER_STATE.INACTIVE;
            break;
        }
    }

    return this.autoState;
}

MapEditor.prototype.scrollLayerButton = function(gameContext, buttonID, interfaceID) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(interfaceID);

    this.buttonHandler.onClick(editorInterface, buttonID);
    this.updateLayerOpacity(gameContext);
}

MapEditor.prototype.scrollBrushSize = function(delta = 0) {
    const brushSize = this.brushSizes.scroll(delta);

    if(brushSize !== null) {
        this.brush.setSize(brushSize);
    }
}

MapEditor.prototype.scrollMode = function(delta = 0) {
    const mode = this.modes.loop(delta);

    if(mode !== null) {
        this.mode = mode;
    }

    this.reloadAll();
}

MapEditor.prototype.scrollBrushSet = function(delta) {
    const brushSet = this.brushSets.loop(delta);

    if(brushSet !== null) {
        this.reloadAll();
    }
}

MapEditor.prototype.scrollPage = function(delta = 0) {
    const maxPagesNeeded = Math.ceil(this.brush.pallet.length / this.slots.length);

    if(maxPagesNeeded <= 0) {
        this.pageIndex = 0;
    } else {
        this.pageIndex = loopValue(this.pageIndex + delta, maxPagesNeeded - 1, 0);
    }
}

MapEditor.prototype.reloadAll = function() {
    switch(this.mode) {
        case MapEditor.MODE.DRAW: {
            const pallet = this.brushSets.getValue();

            if(pallet) {
                const { values } = pallet;
        
                this.brush.loadPallet(values);
            } else {
                this.brush.clearPallet();
            }
            break;
        }
        case MapEditor.MODE.AUTOTILE: {
            this.brush.clearPallet();
            break;
        }
    }

    this.pageIndex = 0;
    this.brush.reset();
}

MapEditor.prototype.loadBrushSets = function(invertedTileMeta) {
    const sets = [];

    for(const setID in invertedTileMeta) {
        if(this.hiddenSets.has(setID)) {
            continue;
        }

        const brushSet = {};
        const set = invertedTileMeta[setID];

        for(const tileID in set) {
            brushSet[tileID] = set[tileID];
        }

        sets.push({
            "id": setID,
            "values": brushSet
        });
    }

    this.brushSets.setValues(sets);
    this.scrollBrushSet(0);
    this.reloadAll();
}

MapEditor.prototype.undo = function(gameContext) {
    if(this.activityStack.length === 0) {
        return;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const { mapID, mode, actions } = this.activityStack.pop();
    const gameMap = mapManager.getLoadedMap(mapID);

    if(!gameMap) {
        return;
    }

    for(let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const { layerID, tileX, tileY, oldID } = action;

        gameMap.placeTile(oldID, layerID, tileX, tileY);
    }
}

MapEditor.prototype.updateLayerOpacity = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getLoadedMap(this.mapID);

    if(!worldMap) {
        return;
    }

    this.buttonHandler.updateLayers(worldMap);
}

MapEditor.prototype.paint = function(gameContext, onPaint) {
    const button = this.buttonHandler.getActiveButton();

    if(!button) {
        return;
    }

    const { type, layerID } = button;

    if(type === EditorButton.TYPE.TYPE) {
        this.incrementTypeIndex(gameContext, layerID);
        return;
    }

    if(typeof onPaint !== "function") {
        return;
    }

    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getLoadedMap(this.mapID);

    if(!worldMap) {
        return;
    }

    const actionsTaken = [];
    const { x, y } = gameContext.getMouseTile();
    const { id } = this.brush;
    //TODO: add autotiler mode, not based on tiles autotiler.
    const autotiler = tileManager.getAutotilerByTile(id);

    this.brush.paint(x, y, (j, i, brushID, brushName) => {
        const tileID = worldMap.getTile(layerID, j, i);

        if(tileID !== null && tileID !== brushID) {
            worldMap.placeTile(brushID, layerID, j, i);

            onPaint(worldMap, brushID, j, i);

            if(this.autoState === MapEditor.AUTOTILER_STATE.INACTIVE) {
                actionsTaken.push({
                    "layerID": layerID,
                    "tileX": j,
                    "tileY": i,
                    "oldID": tileID
                });
            }
        }

        if(this.autoState === MapEditor.AUTOTILER_STATE.ACTIVE) {
            worldMap.updateAutotiler(autotiler, j, i, layerID);
        }
    });

    if(actionsTaken.length !== 0) {
        this.activityStack.push({
            "mapID": this.mapID,
            "mode": this.mode,
            "actions": actionsTaken
        });
    }
}

MapEditor.prototype.incrementTypeIndex = function(gameContext, layerID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const types = gameContext.tileTypes;
    const worldMap = mapManager.getLoadedMap(this.mapID);

    if(!worldMap) {
        return;
    }

    const { x, y } = gameContext.getMouseTile();
    const tileTypeIDs = [];

    for(const typeID of Object.keys(types)) {
        const type = types[typeID];

        tileTypeIDs.push(type.id);
    }

    const currentID = worldMap.getTile(layerID, x, y);
    const currentIndex = tileTypeIDs.indexOf(currentID);
    const nextIndex = loopValue(currentIndex + 1, tileTypeIDs.length - 1, 0);
    const nextID = tileTypeIDs[nextIndex];

    worldMap.placeTile(nextID, layerID, x, y);
}