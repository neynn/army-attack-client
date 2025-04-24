import { CameraContext } from "../../../source/camera/cameraContext.js";
import { Cursor } from "../../../source/client/cursor.js";
import { MapEditor } from "../../../source/map/mapEditor.js";
import { ArmyCamera } from "../../armyCamera.js";
import { clampValue } from "../../../source/math/math.js";
import { saveMap } from "../../../helpers.js";
import { UIManager } from "../../../source/ui/uiManager.js";
import { UICollider } from "../../../source/ui/uiCollider.js";
import { ArmyMap } from "../../init/armyMap.js";
import { Brush } from "../../../source/map/editor/brush.js";
import { EditorButton } from "../../../source/map/editor/editorButton.js";

export const ArmyMapEditor = function() {
    MapEditor.call(this);

    this.id = "ARMY_MAP_EDITOR";
    this.interfaceID = "MAP_EDITOR";
    this.maxWidth = 100;
    this.maxHeight = 100;
    this.overlayAlpha = 0.75;
    this.overlayColor = "#eeeeee";
    this.currentLayer = null;
    this.currentLayerButtonID = null;
    this.currentMapID = null;

    this.buttonHandler.addButton("L1", "ground", "TEXT_L1");
    this.buttonHandler.addButton("L2", "decoration", "TEXT_L2");
    this.buttonHandler.addButton("L3", "cloud", "TEXT_L3");
    this.buttonHandler.addButton("LC", "type", "TEXT_LC");

    this.camera = new ArmyCamera();
}

ArmyMapEditor.FILL_MAPPING = {
    "ground": 1,
    "border": 0,
    "decoration": 0,
    "cloud": 0,
    "type": 0,
    "team": 0
};

ArmyMapEditor.DEFAULT_MAP = {
    "type": "EmptyVersus",
    "music": "music_remastered",
    "width": 20,
    "height": 20,
    "graphics": {
        "layers": {
            "ground": { "fill": 1, "opacity": 1, "autoGenerate": false },
            "border": { "fill": 0, "opacity": 1, "autoGenerate": true },
            "decoration": { "fill": 0, "opacity": 1, "autoGenerate": false },
            "cloud": { "fill": 0, "opacity": 1, "autoGenerate": true },
            "type": { "fill": 0, "opacity": 1, "autoGenerate": false },
            "team": { "fill": 0, "opacity": 1, "autoGenerate": false }
        },
        "background": ["ground", "border", "decoration"],
        "foreground": ["cloud"]
    }
};

ArmyMapEditor.SLOT_BUTTON_SIZE = 50;

ArmyMapEditor.prototype = Object.create(MapEditor.prototype);
ArmyMapEditor.prototype.constructor = ArmyMapEditor;

ArmyMapEditor.prototype.init = function(config) {
    const {
        maxWidth = this.maxWidth,
        maxHeight = this.maxHeight,
        brushSizes = [],
        hiddenSets = [],
        overlayAlpha = this.overlayAlpha,
        overlayColor = this.overlayColor
    } = config;

    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;
    this.overlayAlpha = overlayAlpha;
    this.overlayColor = overlayColor;
    this.brushSizes.setValues(brushSizes);

    for(let i = 0; i < hiddenSets.length; i++) {
        const setID = hiddenSets[i];

        this.hiddenSets.add(setID);
    }
}

ArmyMapEditor.prototype.initSlots = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);
    const buttonRows = 7;
    const buttonColumns = 7;
    const buttonSize = 50;
    const buttons = [];

    for(let i = 0; i < buttonRows; i++) {
        for(let j = 0; j < buttonColumns; j++) {
            const buttonID = `BUTTON_${i * buttonColumns + j}`;
            const posX = buttonSize * j;
            const posY = buttonSize * i + 100;
            const button = uiManager.createElement(UIManager.ELEMENT_TYPE.BUTTON, {
                "shape": 0,
                "position": { "x": posX, "y": posY },
                "width": buttonSize,
                "height": buttonSize,
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
    
    context.setPositionMode(CameraContext.POSITION_MODE.ORIGIN);
}

ArmyMapEditor.prototype.initRenderEvents = function(gameContext) {
    const { tileManager } = gameContext;
    const { graphics } = tileManager;

    this.camera.addPostDraw((context) => {    
        const button = this.buttonHandler.getButton(this.currentLayerButtonID);

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

ArmyMapEditor.prototype.initUIEvents = function(gameContext) {
    const { uiManager, world } = gameContext;
    const { mapManager } = world;
    const editorInterface = uiManager.getInterface(this.interfaceID);

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
        this.scrollLayerButton(gameContext, "L1");
    });

    editorInterface.addClick("BUTTON_L2", () => {
        this.scrollLayerButton(gameContext, "L2");
    });

    editorInterface.addClick("BUTTON_L3", () => {
        this.scrollLayerButton(gameContext, "L3");
    });

    editorInterface.addClick("BUTTON_LC", () => {
        this.scrollLayerButton(gameContext, "LC");
    });

    editorInterface.addClick("BUTTON_SAVE", () => {
        const mapData = mapManager.getLoadedMap(this.currentMapID);
        
        saveMap(this.currentMapID, mapData);
    });

    editorInterface.addClick("BUTTON_CREATE", () => {
        this.createNewMap(gameContext);
    });

    editorInterface.addClick("BUTTON_LOAD", async () => {
        const mapID = prompt("MAP-ID?");
        const worldMap = await mapManager.createMapByID(gameContext, mapID);

        if(worldMap) {
            this.currentMapID = mapID;
        }
    });

    editorInterface.addClick("BUTTON_RESIZE", () => {
        this.resizeCurrentMap(gameContext);
    }); 

    editorInterface.addClick("BUTTON_UNDO", () => {
        this.undo(gameContext);
    }); 

    editorInterface.addClick("BUTTON_ERASER", () => {
        this.brush.toggleEraser();
    });

    editorInterface.addClick("BUTTON_VIEW_ALL", () => {
        this.buttonHandler.resetButtons(editorInterface);

        this.currentLayer = null;
        this.currentLayerButtonID = null;

        this.brush.reset();
        this.updateLayerOpacity(gameContext);
    });
}

ArmyMapEditor.prototype.initButtons = function(gameContext) {
    const { uiManager, tileManager } = gameContext;
    const { graphics } = tileManager;
    const pageIndices = this.brush.getPageIndices(this.pageIndex, this.slots.length)
    const editorInterface = uiManager.getInterface(this.interfaceID);

    for(let i = 0; i < this.slots.length; i++) {
        const buttonID = this.slots[i];
        const palletID = pageIndices[i];
        const button = editorInterface.getElement(buttonID);
        const tileID = this.brush.getTileID(palletID);

        button.collider.events.unsubscribe(UICollider.EVENT.CLICKED, this.id);
        button.clearDefers();

        if(tileID === Brush.ID.INVALID) {
            continue;
        }

        button.collider.events.on(UICollider.EVENT.CLICKED, () => {
            this.brush.selectFromPallet(palletID);
        }, { id: this.id });

        button.addDefer((context, localX, localY) => {
            this.camera.drawTile(graphics, context, tileID, localX, localY, ArmyMapEditor.SLOT_BUTTON_SIZE, ArmyMapEditor.SLOT_BUTTON_SIZE);
        });
    }
} 

ArmyMapEditor.prototype.createNewMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const createNew = confirm("This will create and load a brand new map! Proceed?");

    if(createNew) {
        const mapID = `${Date.now()}`;

        mapManager.createMap(gameContext, mapID, ArmyMapEditor.DEFAULT_MAP);

        this.currentMapID = mapID;
    }
}

ArmyMapEditor.prototype.resizeCurrentMap = function(gameContext) {
    const { world, renderer } = gameContext;
    const { mapManager } = world;
    const gameMap = mapManager.getLoadedMap(this.currentMapID);

    if(!gameMap) {
        console.warn(`GameMap cannot be undefined! Returning...`);
        return;
    }

    const parsedWidth = parseInt(prompt("MAP_WIDTH"));
    const parsedHeight = parseInt(prompt("MAP_HEIGHT"));
    const newWidth = clampValue(parsedWidth, this.maxWidth, 1);
    const newHeight = clampValue(parsedHeight, this.maxHeight, 1);
  
    gameMap.resize(newWidth, newHeight, ArmyMapEditor.FILL_MAPPING);
    
    this.camera.setMapSize(newWidth, newHeight);

    renderer.getContext(this.id).refreshCamera();
}

ArmyMapEditor.prototype.paintTile = function(gameContext) {
    const { tileManager } = gameContext;
    const button = this.buttonHandler.getButton(this.currentLayerButtonID);

    if(!button) {
        return;
    }

    const { type } = button;

    switch(type) {
        case EditorButton.TYPE.GRAPHICS: {
            this.paint(gameContext, this.currentMapID, this.currentLayer, (worldMap, tileID, tileX, tileY) => {
                const tileMeta = tileManager.getMeta(tileID);

                if(tileMeta) {
                    const { defaultType } = tileMeta;
    
                    if(defaultType) {
                        worldMap.placeTile(defaultType, ArmyMap.LAYER.TYPE, tileX, tileY);
                    }
                }
            });
            break;
        }
        case EditorButton.TYPE.TYPE: {
            const layerID = "type";

            this.incrementTypeIndex(gameContext, this.currentMapID, layerID);
            break;
        }
        default: {
            console.warn(`Button type ${type} does not exist!`);
            break;
        }
    }
}

ArmyMapEditor.prototype.updateLayerOpacity = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getLoadedMap(this.currentMapID);

    if(!worldMap) {
        return;
    }

    if(this.currentLayerButtonID === null) {
        this.buttonHandler.forAllButtons((buttonID, button) => {
            const { layerID, opacity } = button;

            worldMap.setLayerOpacity(layerID, opacity);
        });
    } else {
        this.buttonHandler.forAllButtons((buttonID, button) => {
            const { state, layerID, opacity } = button;

            if(state === EditorButton.STATE.VISIBLE) {
                worldMap.setLayerOpacity(layerID, 0.5);
            } else {
                worldMap.setLayerOpacity(layerID, opacity);
            }
        });
    }
}

ArmyMapEditor.prototype.scrollLayerButton = function(gameContext, buttonID) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);
    const button = this.buttonHandler.getButton(buttonID);

    if(buttonID === this.currentLayerButtonID) {
        this.currentLayerButtonID = null;
        this.currentLayer = null;
    }

    const nextState = button.scrollState(editorInterface);

    if(nextState === EditorButton.STATE.EDIT) {
        const currentButton = this.buttonHandler.getButton(this.currentLayerButtonID);

        if(currentButton) {
            currentButton.setState(EditorButton.STATE.VISIBLE);
            currentButton.updateTextColor(editorInterface);

            this.currentLayerButtonID = null;
            this.currentLayer = null;
        }

        this.currentLayer = button.layerID;
        this.currentLayerButtonID = buttonID;
    }

    this.updateLayerOpacity(gameContext);
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