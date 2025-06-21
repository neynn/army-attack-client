import { Cursor } from "../../client/cursor.js";
import { MapEditor } from "../mapEditor.js";
import { clampValue, loopValue } from "../../math/math.js";
import { UIManager } from "../../ui/uiManager.js";
import { UICollider } from "../../ui/uiCollider.js";
import { SHAPE } from "../../math/constants.js";
import { Brush } from "./brush.js";
import { EditorButton } from "./editorButton.js";
import { ButtonHandler } from "./buttonHandler.js";
import { EditorAutotiler } from "./autotiler.js";

export const MapEditorController = function() {
    this.camera = null;
    this.interfaceID = null;
    this.maxWidth = 100;
    this.maxHeight = 100;
    this.overlayAlpha = 0.75;
    this.overlayColor = "#eeeeee";
    this.slotButtonSize = 50;
    this.textColorView = [238, 238, 238, 255];
    this.textColorEdit = [252, 252, 63, 255];
    this.textColorHide = [207, 55, 35, 255];
    this.defaultMap = {};
    this.buttonHandler = new ButtonHandler();
    this.editor = new MapEditor();

    this.palletButtons = [];
    this.pageIndex = 0;
}

MapEditorController.EVENT_ID = "MAP_EDITOR_CONTROLLER";

MapEditorController.prototype.paint = function(gameContext) {
    const button = this.buttonHandler.getActiveButton();

    if(!button) {
        return;
    }

    const { type, layerID } = button;
    
    if(type === EditorButton.TYPE.TYPE) {
        this.editor.incrementTypeIndex(gameContext, layerID);
    } else {
        this.editor.paint(gameContext, layerID);
    }
}

MapEditorController.prototype.setMapID = function(mapID) {
    this.editor.mapID = mapID;
}

MapEditorController.prototype.destroy = function(gameContext) {
    const { renderer, uiManager } = gameContext;

    uiManager.destroyUI(this.interfaceID);
    renderer.destroyContext(MapEditorController.EVENT_ID);
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
        textColorView = this.textColorView,
        textColorEdit = this.textColorEdit,
        textColorHide = this.textColorHide,
        interfaceID = null
    } = config;

    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;
    this.overlayAlpha = overlayAlpha;
    this.overlayColor = overlayColor;
    this.interfaceID = interfaceID;
    this.slotButtonSize = slotSize;
    this.defaultMap = defaultMap;
    this.textColorView = textColorView;
    this.textColorEdit = textColorEdit;
    this.textColorHide = textColorHide;

    this.editor.brushSizes.setValues(brushSizes);

    for(let i = 0; i < hiddenSets.length; i++) {
        this.editor.hiddenSets.add(hiddenSets[i]);
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

MapEditorController.prototype.initPalletButtons = function(gameContext) {
    const SLOT_START_Y = 100;
    const BUTTON_ROWS = 5;
    const BUTTON_COLUMNS = 5;

    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);

    this.palletButtons.length = 0;

    for(let i = 0; i < BUTTON_ROWS; i++) {
        for(let j = 0; j < BUTTON_COLUMNS; j++) {
            const buttonID = `BUTTON_${i * BUTTON_COLUMNS + j}`;
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
        
            this.palletButtons.push(buttonID);
        }
    }

    editorInterface.linkElements("CONTAINER_TILES", this.palletButtons);
}

MapEditorController.prototype.initCamera = function(gameContext, camera) {
    const { renderer } = gameContext;
    const context = renderer.createContext(MapEditorController.EVENT_ID, camera);
    
    context.setPosition(0, 0);

    this.camera = camera;
    this.camera.freeViewport();
    this.camera.setTileSize(gameContext.settings.tileWidth, gameContext.settings.tileHeight)
}

MapEditorController.prototype.resetPage = function() {
    this.pageIndex = 0;
}

MapEditorController.prototype.scrollPage = function(delta) {
    const maxPagesNeeded = Math.ceil(this.editor.brush.getPalletSize() / this.palletButtons.length);

    if(maxPagesNeeded <= 0) {
        this.pageIndex = 0;
    } else {
        this.pageIndex = loopValue(this.pageIndex + delta, maxPagesNeeded - 1, 0);
    }
}

MapEditorController.prototype.initCursorEvents = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.on(Cursor.EVENT.SCROLL, (direction) => {
        switch(direction) {
            case Cursor.SCROLL.UP: {
                this.editor.scrollBrushSize(1);
                break;
            }
            case Cursor.SCROLL.DOWN: {
                this.editor.scrollBrushSize(-1);
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

MapEditorController.prototype.clickLayerButton = function(gameContext, buttonID) {
    const { world, uiManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getLoadedMap(this.editor.mapID);

    if(!worldMap) {
        return;
    }

    const editorInterface = uiManager.getInterface(this.interfaceID);

    this.buttonHandler.onClick(editorInterface, this, buttonID);
    this.buttonHandler.updateLayers(worldMap);
}

MapEditorController.prototype.viewAllLayers = function(gameContext) {
    const { uiManager, world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getLoadedMap(this.editor.mapID);

    if(!worldMap) {
        return;
    }

    const editorInterface = uiManager.getInterface(this.interfaceID);
    
    this.resetBrush(editorInterface);
    this.buttonHandler.resetButtons(editorInterface, this);
    this.buttonHandler.updateLayers(worldMap);
}

MapEditorController.prototype.resetBrush = function(editorInterface) {
    const text = editorInterface.getElement("TEXT_ERASER");
    const { style } = text;
    const { color } = style;

    color.setColorArray(this.textColorView);

    this.editor.brush.reset();
}

MapEditorController.prototype.updateInversionText = function(gameContext, stateID) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);
    const text = editorInterface.getElement("TEXT_INVERT");
    const { style } = text;
    const { color } = style;

    switch(stateID) {
        case EditorAutotiler.STATE.ACTIVE_INVERTED: {
            color.setColorArray(this.textColorEdit);
            break;
        }
        default: {
            color.setColorArray(this.textColorView);
            break;
        }
    }
}

MapEditorController.prototype.updateEraserText = function(gameContext, stateID) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);
    const text = editorInterface.getElement("TEXT_ERASER");
    const { style } = text;
    const { color } = style;

    switch(stateID) {
        case Brush.MODE.ERASE: {
            color.setColorArray(this.textColorEdit);
            break;
        }
        default: {
            color.setColorArray(this.textColorView);
            break;
        }
    }
}

MapEditorController.prototype.updateAutoText = function(gameContext, stateID) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);
    const text = editorInterface.getElement("TEXT_AUTO");
    const { style } = text;
    const { color } = style;

    switch(stateID) {
        case EditorAutotiler.STATE.INACTIVE: {
            color.setColorArray(this.textColorView);
            this.updateInversionText(gameContext, nextState);
            break;
        }
        case EditorAutotiler.STATE.ACTIVE: {
            color.setColorArray(this.textColorEdit);
            break;
        }
    }
}

MapEditorController.prototype.toggleEraser = function(gameContext) {
    const nextState = this.editor.brush.toggleEraser();

    this.updateEraserText(gameContext, nextState);
}

MapEditorController.prototype.toggleAutotiler = function(gameContext) {
    const nextState = this.editor.autotiler.toggleAutotiling();

    this.updateAutoText(gameContext, nextState);
}

MapEditorController.prototype.toggleInversion = function(gameContext) {
    const inversionState = this.editor.autotiler.toggleInversion();

    this.updateInversionText(gameContext, inversionState);
}

MapEditorController.prototype.mapPageIndex = function(index) {
    return this.pageIndex * this.palletButtons.length + index;
}

MapEditorController.prototype.updatePalletButtonEvents = function(gameContext) {
    const { uiManager, tileManager } = gameContext;
    const { graphics } = tileManager;
    const editorInterface = uiManager.getInterface(this.interfaceID);

    for(let i = 0; i < this.palletButtons.length; i++) {
        const palletIndex = this.mapPageIndex(i);
        const tileID = this.editor.brush.getTileID(palletIndex);

        const buttonID = this.palletButtons[i];
        const button = editorInterface.getElement(buttonID);

        button.collider.events.unsubscribe(UICollider.EVENT.CLICKED, MapEditorController.EVENT_ID);
        button.clearCustomRenders();

        if(tileID !== Brush.ID.INVALID) {
            button.collider.events.on(UICollider.EVENT.CLICKED, () => {
                this.resetBrush(editorInterface);
                this.editor.brush.selectFromPallet(palletIndex);
            }, { id: MapEditorController.EVENT_ID });

            button.addCustomRender((context, localX, localY) => {
                this.camera.setRelativeScale(this.slotButtonSize, this.slotButtonSize);
                this.camera.drawTileEasy(graphics, tileID, context, localX, localY);
                this.camera.resetScale();
            });
        }
    }
} 

MapEditorController.prototype.resizeCurrentMap = function(gameContext) {
    const { world, renderer } = gameContext;
    const { mapManager } = world;
    const gameMap = mapManager.getLoadedMap(this.editor.mapID);

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

    editorInterface.setText("TEXT_TILESET_MODE", `MODE: ${MapEditor.MODE_NAME[this.editor.modes.getValue()]}`);

    switch(this.editor.modes.getValue()) {
        case MapEditor.MODE.DRAW: {
            editorInterface.setText("TEXT_TILESET", `${this.editor.brushSets.getValue()?.id}`);
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
    const maxPagesNeeded = Math.ceil(this.editor.brush.getPalletSize() / this.palletButtons.length);
    const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;
    const showCurrentPage = this.pageIndex + 1;

    return `${showCurrentPage} / ${showMaxPagesNeeded}`;
}

MapEditorController.prototype.getSizeText = function() {
    const info = this.editor.brushSizes.getInfo();
    const drawArea = this.editor.brush.getDrawArea();

    return `SIZE: ${drawArea}x${drawArea} (${info})`;
}