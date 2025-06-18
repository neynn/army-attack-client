import { Cursor } from "../../client/cursor.js";
import { MapEditor } from "../mapEditor.js";
import { clampValue } from "../../math/math.js";
import { UIManager } from "../../ui/uiManager.js";
import { UICollider } from "../../ui/uiCollider.js";
import { SHAPE } from "../../math/constants.js";
import { Brush } from "./brush.js";
import { EditorButton } from "./editorButton.js";

export const MapEditorController = function() {
    MapEditor.call(this);

    this.id = "MAP_EDITOR_CONTROLLER";
    this.camera = null;
    this.interfaceID = null;
    this.maxWidth = 100;
    this.maxHeight = 100;
    this.overlayAlpha = 0.75;
    this.slotButtonSize = 50;
    this.overlayColor = "#eeeeee";
    this.defaultMap = {};

    this.buttonHandler.addButton("L1", "ground", "TEXT_L1");
    this.buttonHandler.addButton("L2", "decoration", "TEXT_L2");
    this.buttonHandler.addButton("L3", "cloud", "TEXT_L3");
    this.buttonHandler.addButton("LC", "type", "TEXT_LC");
    this.buttonHandler.getButton("LC").setType(EditorButton.TYPE.TYPE);
}

MapEditorController.prototype = Object.create(MapEditor.prototype);
MapEditorController.prototype.constructor = MapEditorController;

MapEditorController.prototype.setMapID = function(mapID) {
    this.mapID = mapID;
}

MapEditorController.prototype.destroy = function(gameContext) {
    const { renderer, uiManager } = gameContext;

    uiManager.destroyUI(this.interfaceID);
    renderer.destroyContext(this.id);
}

MapEditorController.prototype.init = function(config) {
    const {
        brushSizes = [0],
        hiddenSets = [],
        maxWidth = this.maxWidth,
        maxHeight = this.maxHeight,
        overlayAlpha = this.overlayAlpha,
        overlayColor = this.overlayColor,
        slotSize = this.slotButtonSize,
        defaultMap = this.defaultMap,
        interfaceID = null
    } = config;

    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;
    this.overlayAlpha = overlayAlpha;
    this.overlayColor = overlayColor;
    this.interfaceID = interfaceID;
    this.slotButtonSize = slotSize;
    this.defaultMap = defaultMap;
    this.brushSizes.setValues(brushSizes);

    for(let i = 0; i < hiddenSets.length; i++) {
        const setID = hiddenSets[i];

        this.hiddenSets.add(setID);
    }
}

MapEditorController.prototype.initUI = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);

    ["CONTAINER_FILE", "CONTAINER_LAYERS", "CONTAINER_TILES", "CONTAINER_TOOLS"].forEach(id => {
        const container = editorInterface.getElement(id);

        container.background.color.setColorRGBA(20, 20, 20, 128);
        container.background.toggle();
    });
}

MapEditorController.prototype.initSlots = function(gameContext) {
    const { uiManager } = gameContext;
    const SLOT_START_Y = 100;
    const editorInterface = uiManager.getInterface(this.interfaceID);
    const buttonRows = 7;
    const buttonColumns = 7;
    const buttons = [];

    for(let i = 0; i < buttonRows; i++) {
        for(let j = 0; j < buttonColumns; j++) {
            const buttonID = `BUTTON_${i * buttonColumns + j}`;
            const posX = this.slotButtonSize * j;
            const posY = this.slotButtonSize * i + SLOT_START_Y;
            const button = uiManager.createElement(UIManager.ELEMENT_TYPE.BUTTON, {
                "shape": SHAPE.RECTANGLE,
                "position": { "x": posX, "y": posY },
                "width": this.slotButtonSize,
                "height": this.slotButtonSize,
                "opacity": 1
            }, buttonID);

            editorInterface.addElement(button, buttonID);
            buttons.push(buttonID);
        }
    }

    editorInterface.linkElements("CONTAINER_TILES", buttons);

    this.slots = buttons;
}

MapEditorController.prototype.initCamera = function(gameContext, camera) {
    const { renderer } = gameContext;
    const context = renderer.createContext(this.id, camera);
    
    context.setPosition(0, 0);

    this.camera = camera;
    this.camera.freeViewport();
    this.camera.setTileSize(gameContext.settings.tileWidth, gameContext.settings.tileHeight)
}

MapEditorController.prototype.initCursorEvents = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.on(Cursor.EVENT.SCROLL, (direction) => {
        switch(direction) {
            case Cursor.SCROLL.UP: {
                this.scrollBrushSize(1);
                break;
            }
            case Cursor.SCROLL.DOWN: {
                this.scrollBrushSize(-1);
                break;
            }
        }

        this.updateMenuText(gameContext);
    });

    cursor.events.on(Cursor.EVENT.BUTTON_DRAG, (buttonID) => {
        if(buttonID !== Cursor.BUTTON.RIGHT) {
            return;
        }

        this.paint(gameContext);
    });

    cursor.events.on(Cursor.EVENT.BUTTON_CLICK, (buttonID) => {
        if(buttonID !== Cursor.BUTTON.RIGHT) {
            return;
        }

        this.paint(gameContext);
    });

    cursor.events.on(Cursor.EVENT.BUTTON_DRAG, (buttonID, deltaX, deltaY) => {
        if(buttonID !== Cursor.BUTTON.LEFT) {
            return;
        }

        const context = gameContext.getContextAtMouse();

        if(context) {
            context.dragCamera(deltaX, deltaY);
        }
    });
}

MapEditorController.prototype.disableEraserButton = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);
    const text = editorInterface.getElement("TEXT_ERASER");
    const { style } = text;
    const { color } = style;

    color.setColorRGBA(238, 238, 238, 255);
}

MapEditorController.prototype.toggleEraser = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);
    const nextState = this.brush.toggleEraser();
    const text = editorInterface.getElement("TEXT_ERASER");
    const { style } = text;
    const { color } = style;

    switch(nextState) {
        case Brush.MODE.ERASE: {
            color.setColorRGBA(252, 252, 63, 255);
            break;
        }
        default: {
            color.setColorRGBA(238, 238, 238, 255);
            break;
        }
    }
}

MapEditorController.prototype.toggleAutotiler = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);
    const nextState = this.toggleAutotiling();
    const text = editorInterface.getElement("TEXT_AUTO");
    const { style } = text;
    const { color } = style;

    switch(nextState) {
        case MapEditor.AUTOTILER_STATE.INACTIVE: {
            color.setColorRGBA(238, 238, 238, 255);
            break;
        }
        case MapEditor.AUTOTILER_STATE.ACTIVE: {
            color.setColorRGBA(252, 252, 63, 255);
            break;
        }
    }
}

MapEditorController.prototype.initButtons = function(gameContext) {
    const { uiManager, tileManager } = gameContext;
    const { graphics } = tileManager;
    const editorInterface = uiManager.getInterface(this.interfaceID);

    for(let i = 0; i < this.slots.length; i++) {
        const buttonID = this.slots[i];
        const button = editorInterface.getElement(buttonID);
        const palletID = this.brush.getPalletIndex(this.pageIndex, this.slots.length, i);
        const tileID = this.brush.getTileID(palletID);

        button.collider.events.unsubscribe(UICollider.EVENT.CLICKED, this.id);
        button.clearCustomRenders();

        if(tileID === Brush.ID.INVALID) {
            continue;
        }

        button.collider.events.on(UICollider.EVENT.CLICKED, () => {
            this.brush.selectFromPallet(palletID);
        }, { id: this.id });

        button.addCustomRender((context, localX, localY) => {
            this.camera.setRelativeScale(this.slotButtonSize, this.slotButtonSize);
            this.camera.drawTileEasy(graphics, tileID, context, localX, localY);
            this.camera.resetScale();
        });
    }
} 

MapEditorController.prototype.resizeCurrentMap = function(gameContext) {
    const { world, renderer } = gameContext;
    const { mapManager } = world;
    const gameMap = mapManager.getLoadedMap(this.mapID);

    if(!gameMap) {
        console.warn(`GameMap cannot be undefined! Returning...`);
        return;
    }

    const parsedWidth = parseInt(prompt("MAP_WIDTH"));
    const parsedHeight = parseInt(prompt("MAP_HEIGHT"));
    const newWidth = clampValue(parsedWidth, this.maxWidth, 1);
    const newHeight = clampValue(parsedHeight, this.maxHeight, 1);

    gameMap.resize(newWidth, newHeight);
    renderer.onMapSizeUpdate(newWidth, newHeight);
}

MapEditorController.prototype.updateMenuText = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);

    editorInterface.setText("TEXT_TILESET_MODE", `MODE: ${MapEditor.MODE_NAME[this.mode]}`);

    switch(this.mode) {
        case MapEditor.MODE.DRAW: {
            editorInterface.setText("TEXT_TILESET", `${this.brushSets.getValue()?.id}`);
            break;
        }
        case MapEditor.MODE.AUTOTILE: {
            editorInterface.setText("TEXT_TILESET", `NOT IMPLEMENTED!`);
            break;
        }
    }

    editorInterface.setText("TEXT_PAGE", this.getPageText());
    editorInterface.setText("TEXT_SIZE",  this.getSizeText());
}

MapEditorController.prototype.getPageText = function() {
    const maxPagesNeeded = Math.ceil(this.brush.pallet.length / this.slots.length);
    const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;
    const showCurrentPage = this.pageIndex + 1;

    return `${showCurrentPage} / ${showMaxPagesNeeded}`;
}

MapEditorController.prototype.getSizeText = function() {
    const info = this.brushSizes.getInfo();
    const drawArea = this.brush.getDrawArea();

    return `SIZE: ${drawArea}x${drawArea} (${info})`;
}