import { Cursor } from "../source/client/cursor.js";
import { MapEditor } from "../source/map/mapEditor.js";
import { clampValue } from "../source/math/math.js";
import { UIManager } from "../source/ui/uiManager.js";
import { UICollider } from "../source/ui/uiCollider.js";
import { Brush } from "../source/map/editor/brush.js";
import { EditorButton } from "../source/map/editor/editorButton.js";
import { saveMap } from "../helpers.js";
import { ArmyMap } from "./init/armyMap.js";
import { ArmyCamera } from "./armyCamera.js";
import { SHAPE } from "../source/math/constants.js";
import { ArmyContext } from "./armyContext.js";

export const ArmyMapEditor = function() {
    MapEditor.call(this);

    this.id = "ARMY_MAP_EDITOR";
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

    this.camera = new ArmyCamera();
}

ArmyMapEditor.prototype = Object.create(MapEditor.prototype);
ArmyMapEditor.prototype.constructor = ArmyMapEditor;

ArmyMapEditor.prototype.init = function(config) {
    const {
        brushSizes = [0],
        hiddenSets = [],
        maxWidth = this.maxWidth,
        maxHeight = this.maxHeight,
        overlayAlpha = this.overlayAlpha,
        overlayColor = this.overlayColor,
        slotSize = this.slotButtonSize,
        defaultMap = this.defaultMap,
        layerFill = this.layerFill,
        interfaceID = null
    } = config;

    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;
    this.overlayAlpha = overlayAlpha;
    this.overlayColor = overlayColor;
    this.interfaceID = interfaceID;
    this.slotButtonSize = slotSize;
    this.layerFill = layerFill;
    this.defaultMap = defaultMap;
    this.brushSizes.setValues(brushSizes);

    for(let i = 0; i < hiddenSets.length; i++) {
        const setID = hiddenSets[i];

        this.hiddenSets.add(setID);
    }
}

ArmyMapEditor.prototype.initUI = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);

    ["CONTAINER_FILE", "CONTAINER_LAYERS", "CONTAINER_TILES", "CONTAINER_TOOLS"].forEach(id => {
        const container = editorInterface.getElement(id);

        container.background.color.setColorRGBA(20, 20, 20, 128);
        container.background.toggle();
    });
}

ArmyMapEditor.prototype.initSlots = function(gameContext) {
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

ArmyMapEditor.prototype.initCamera = function(gameContext) {
    const { renderer } = gameContext;

    this.camera.freeViewport();
    this.camera.setTileSize(gameContext.settings.tileWidth, gameContext.settings.tileHeight)

    const context = renderer.createContext(this.id, this.camera);
    
    context.setPosition(0, 0);
}

ArmyMapEditor.prototype.initRenderEvents = function(gameContext) {
    const { tileManager } = gameContext;
    const { graphics } = tileManager;

    this.camera.addPostDraw((context) => {    
        const button = this.buttonHandler.getActiveButton();

        if(button && button.type !== EditorButton.TYPE.GRAPHICS) {
            return;
        }
    
        const cursorTile = gameContext.getMouseTile();
        const { x, y } = this.camera.getViewport();
        const { width, height, halfWidth } = this.camera.getTileDimensions();

        context.globalAlpha = this.overlayAlpha;
        context.textAlign = "center";

        this.brush.paint(cursorTile.x, cursorTile.y, (j, i, id, name) => {
            const renderY = i * height - y;
            const renderX = j * width - x;

            this.camera.drawTile(graphics, context, id, renderX, renderY);

            context.fillStyle = this.overlayColor;
            context.fillText(name, renderX + halfWidth, renderY);  
        });

        context.globalAlpha = 1;
    });
}

ArmyMapEditor.prototype.initCursorEvents = function(gameContext) {
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

        this.paintTile(gameContext);
    });

    cursor.events.on(Cursor.EVENT.BUTTON_CLICK, (buttonID) => {
        if(buttonID !== Cursor.BUTTON.RIGHT) {
            return;
        }

        this.paintTile(gameContext);
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

ArmyMapEditor.prototype.disableEraserButton = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);
    const text = editorInterface.getElement("TEXT_ERASER");
    const { style } = text;
    const { color } = style;

    color.setColorRGBA(238, 238, 238, 255);
}

ArmyMapEditor.prototype.toggleEraser = function(gameContext) {
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

ArmyMapEditor.prototype.toggleAutotiler = function(gameContext) {
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

ArmyMapEditor.prototype.initUIEvents = function(gameContext) {
    const { uiManager, world, states } = gameContext;
    const { mapManager } = world;
    const editorInterface = uiManager.getInterface(this.interfaceID);

    editorInterface.addClick("BUTTON_BACK", () => {
        states.setNextState(gameContext, ArmyContext.STATE.MAIN_MENU);
    });

    editorInterface.addClick("BUTTON_AUTO", () => {
        this.toggleAutotiler(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_MODE", () => {
        this.scrollMode(1);
        this.initButtons(gameContext);
        this.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_LEFT", () => {
        this.scrollBrushSet(-1);
        this.initButtons(gameContext);
        this.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_RIGHT", () => {
        this.scrollBrushSet(1);
        this.initButtons(gameContext);
        this.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_PAGE_LAST", () => {
        this.scrollPage(-1);
        this.initButtons(gameContext);
        this.updateMenuText(gameContext);
    }); 

    editorInterface.addClick("BUTTON_PAGE_NEXT", () => {
        this.scrollPage(1);
        this.initButtons(gameContext);
        this.updateMenuText(gameContext);
    });  

    editorInterface.addClick("BUTTON_SCROLL_SIZE", () => {
        this.scrollBrushSize(1);
        this.updateMenuText(gameContext);
    }); 

    editorInterface.addClick("BUTTON_L1", () => {
        this.scrollLayerButton(gameContext, "L1", this.interfaceID);
    });

    editorInterface.addClick("BUTTON_L2", () => {
        this.scrollLayerButton(gameContext, "L2", this.interfaceID);
    });

    editorInterface.addClick("BUTTON_L3", () => {
        this.scrollLayerButton(gameContext, "L3", this.interfaceID);
    });

    editorInterface.addClick("BUTTON_LC", () => {
        this.scrollLayerButton(gameContext, "LC", this.interfaceID);
    });

    editorInterface.addClick("BUTTON_SAVE", () => {
        const mapData = mapManager.getLoadedMap(this.mapID);
        
        saveMap(this.mapID, mapData);
    });

    editorInterface.addClick("BUTTON_CREATE", () => {
        this.createNewMap(gameContext);
    });

    editorInterface.addClick("BUTTON_LOAD", async () => {
        const mapID = prompt("MAP-ID?");
        const worldMap = await mapManager.createMapByID(gameContext, mapID);

        if(worldMap) {
            this.mapID = mapID;
        }
    });

    editorInterface.addClick("BUTTON_RESIZE", () => {
        this.resizeCurrentMap(gameContext);
    }); 

    editorInterface.addClick("BUTTON_UNDO", () => {
        this.undo(gameContext);
    }); 

    editorInterface.addClick("BUTTON_ERASER", () => {
        this.toggleEraser(gameContext);
    });

    editorInterface.addClick("BUTTON_VIEW_ALL", () => {
        this.buttonHandler.resetButtons(editorInterface);
        this.updateLayerOpacity(gameContext);
        this.disableEraserButton(gameContext);
        this.brush.reset();
    });
}

ArmyMapEditor.prototype.initButtons = function(gameContext) {
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
            this.camera.drawTile(graphics, context, tileID, localX, localY, this.slotButtonSize, this.slotButtonSize);
        });
    }
} 

ArmyMapEditor.prototype.createNewMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const createNew = confirm("This will create and load a brand new map! Proceed?");

    if(createNew) {
        const mapID = `${Date.now()}`;

        mapManager.createMap(gameContext, mapID, this.defaultMap);

        this.mapID = mapID;
    }
}

ArmyMapEditor.prototype.resizeCurrentMap = function(gameContext) {
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

    gameMap.resize(newWidth, newHeight, this.layerFill);

    this.camera.setMapSize(newWidth, newHeight);
    this.camera.resizeBorder(newWidth, newHeight);

    renderer.getContext(this.id).reload();
}

ArmyMapEditor.prototype.paintTile = function(gameContext) {
    const { tileManager } = gameContext;

    this.paint(gameContext, (worldMap, tileID, tileX, tileY) => {
        const tileMeta = tileManager.getMeta(tileID);

        if(tileMeta) {
            const { defaultType } = tileMeta;

            if(defaultType !== undefined) {
                worldMap.placeTile(defaultType, ArmyMap.LAYER.TYPE, tileX, tileY);
            }
        }
    });
}

ArmyMapEditor.prototype.updateMenuText = function(gameContext) {
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

ArmyMapEditor.prototype.getPageText = function() {
    const maxPagesNeeded = Math.ceil(this.brush.pallet.length / this.slots.length);
    const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;
    const showCurrentPage = this.pageIndex + 1;

    return `${showCurrentPage} / ${showMaxPagesNeeded}`;
}

ArmyMapEditor.prototype.getSizeText = function() {
    const info = this.brushSizes.getInfo();
    const drawArea = this.brush.getDrawArea();

    return `SIZE: ${drawArea}x${drawArea} (${info})`;
}