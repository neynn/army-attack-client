import { State } from "../../../source/state/state.js";
import { Cursor } from "../../../source/client/cursor.js";
import { CameraContext } from "../../../source/camera/cameraContext.js";
import { MapEditor } from "../../../source/map/mapEditor.js";
import { clampValue } from "../../../source/math/math.js";
import { saveMap } from "../../../helpers.js";
import { ArmyContext } from "../../armyContext.js";
import { ArmyCamera } from "../../armyCamera.js";
import { World } from "../../../source/world.js";
import { UIElement } from "../../../source/ui/uiElement.js";

export const MapEditorState = function() {
    this.id = "MAP_EDITOR_STATE";
    this.contextID = "MAP_EDITOR_CAMERA";
    this.mapEditor = new MapEditor();
    this.currentLayer = null;
    this.currentLayerButtonID = null;
    this.currentMapID = null;
    this.camera = null;
}

MapEditorState.CONFIG = {
    "id": "MAP_EDITOR",
    "maxMapWidth": 10000,
    "maxMapHeight": 10000,
    "overlayOpacity": 0.75,
    "overlayTextColor": "#eeeeee",
    "brushSizes": [0, 1, 2, 3, 4],
    "interface": {
        "id": "MAP_EDITOR",
        "buttonStates": {
            "HIDDEN": { "id": "HIDDEN", "description": "HIDDEN", "textColor": [207, 55, 35, 1], "opacity": 0, "nextState": "VISIBLE" },
            "VISIBLE": { "id": "VISIBLE", "description": "VISIBLE", "textColor": [238, 238, 238, 1], "opacity": 1, "nextState": "EDIT" },
            "EDIT": { "id": "EDIT", "description": "EDIT", "textColor": [252, 252, 63, 1], "opacity": 1, "nextState": "HIDDEN" }
        },
        "layerButtons": {
            "L1": { "id": "L1", "layer": "ground", "text": "TEXT_L1", "state": "VISIBLE", "type": "1" },
            "L2": { "id": "L2", "layer": "decoration", "text": "TEXT_L2", "state": "VISIBLE", "type": "1" },
            "L3": { "id": "L3", "layer": "cloud", "text": "TEXT_L3", "state": "VISIBLE", "type": "1" },
            "LC": { "id": "LC", "layer": "type", "text": "TEXT_LC", "state": "VISIBLE", "type": "2" }
        },
        "slots": ["BUTTON_0", "BUTTON_1", "BUTTON_2", "BUTTON_3", "BUTTON_4", "BUTTON_5", "BUTTON_6", "BUTTON_7", "BUTTON_8"]
    },
    "hiddenSets": {
        "overlay": 1,
        "border": 1,
        "range": 1
    },
    "default": {
        "meta": {
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
        }
    }
};

MapEditorState.GRAPHICS_BUTTON_SCALE = 50 / 96;

MapEditorState.BUTTON_STATE_VISIBLE = "VISIBLE";
MapEditorState.BUTTON_STATE_EDIT = "EDIT";

MapEditorState.BUTTON_TYPE_GRAPHICS = "1";
MapEditorState.BUTTON_TYPE_TYPE = "2";

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.initEditorCamera = function(gameContext) {
    const { world, renderer, client } = gameContext;

    this.camera = new ArmyCamera();
    this.camera.unbindViewport();
    this.camera.loadTileDimensions(gameContext.settings.tileWidth, gameContext.settings.tileHeight)

    const context = renderer.createContext(this.contextID, this.camera);
    
    context.setPositionMode(CameraContext.POSITION_MODE.ORIGIN);

    world.events.subscribe(World.EVENT.MAP_CREATE, this.contextID, (worldMap) => {
        const { width, height, music } = worldMap;
    
        this.camera.loadWorld(width, height);
    
        if(music) {
            //client.musicPlayer.swapTrack(music);
        }

        context.refreshCamera();
    });

    context.events.subscribe(CameraContext.EVENT.REMOVE, this.contextID, () => {
        world.events.unsubscribe(World.EVENT.MAP_CREATE, this.contextID);
    });
}

MapEditorState.prototype.onEnter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, tileManager, settings, client } = gameContext;
    const { router } = client;
    const { meta } = tileManager;

    this.initEditorCamera(gameContext);

    uiManager.parseUI("MAP_EDITOR", gameContext);
    uiManager.unparseUI("FPS_COUNTER");

    router.load(gameContext, {
        "TOGGLE_AUTOTILER": "+a"
    });

    router.on("TOGGLE_AUTOTILER", () => this.mapEditor.toggleAutotiling());
    
    this.mapEditor.loadConfig(MapEditorState.CONFIG);
    this.mapEditor.loadBrushSets(meta.getInversion());
    this.initializeRenderEvents(gameContext);
    this.initializeCursorEvents(gameContext);
    this.initializeUIEvents(gameContext);
    this.loadButtonEvents(gameContext);
    this.updateButtonText(gameContext);
}

MapEditorState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { renderer, uiManager } = gameContext;

    uiManager.unparseUI("MAP_EDITOR");
    renderer.destroyContext(this.contextID);

    this.camera = null;
}

MapEditorState.prototype.updateLayerOpacity = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const gameMap = mapManager.getLoadedMap(this.currentMapID);

    if(!gameMap) {
        return;
    }

    const { layerButtons, buttonStates } = this.mapEditor.config.interface;

    for(const buttonID in layerButtons) {
        const button = layerButtons[buttonID];
        const state = buttonStates[button.state];
        const layerID = button.layer;
        const opacity = state.opacity;

        gameMap.setLayerOpacity(layerID, opacity);

        if(this.currentLayerButtonID === null) {
            continue;
        }

        if(button.state === MapEditorState.BUTTON_STATE_VISIBLE) {
            gameMap.setLayerOpacity(layerID, 0.5);
        }
    }
}

MapEditorState.prototype.scrollLayerButton = function(gameContext, buttonID) {
    const { uiManager } = gameContext;
    const { layerButtons, buttonStates, id } = this.mapEditor.config.interface;
    const button = layerButtons[buttonID];
    const { nextState } = buttonStates[button.state];
    const editorInterface = uiManager.getInterface(id);

    if(button.id === this.currentLayerButtonID) {
        this.currentLayerButtonID = null;
        this.currentLayer = null;
    }

    if(nextState === MapEditorState.BUTTON_STATE_EDIT) {
        if(this.currentLayerButtonID !== null) {
            const currentButton = layerButtons[this.currentLayerButtonID];
            const currentButtonText = editorInterface.getElement(currentButton.text);
            const currentButtonColor = buttonStates[MapEditorState.BUTTON_STATE_VISIBLE].textColor;
        
            currentButton.state = MapEditorState.BUTTON_STATE_VISIBLE;
            currentButtonText.style.color.setColorArray(currentButtonColor);

            this.currentLayer = null;
            this.currentLayerButtonID = null;
        }

        this.currentLayer = button.layer;
        this.currentLayerButtonID = button.id;
    }

    const buttonText = editorInterface.getElement(button.text);
    const buttonColor = buttonStates[nextState].textColor;

    buttonText.style.color.setColorArray(buttonColor);
    button.state = nextState;

    this.updateLayerOpacity(gameContext);
}

MapEditorState.prototype.loadButtonEvents = function(gameContext) {
    const { uiManager, tileManager } = gameContext;
    const { slots, id } = this.mapEditor.config.interface;
    const pageElements = this.mapEditor.getPage();
    const editorInterface = uiManager.getInterface(id);

    for(const buttonID of slots) {
        const button = editorInterface.getElement(buttonID);

        button.events.unsubscribe(UIElement.EVENT.CLICKED, this.id);
        button.clearDefers();
    }

    for(let i = 0; i < slots.length; i++) {
        const buttonID = slots[i];
        const brushData = pageElements[i];
        const button = editorInterface.getElement(buttonID);
        const { tileName, tileID } = brushData;

        button.events.subscribe(UIElement.EVENT.CLICKED, this.id, () => this.mapEditor.setBrush(brushData));

        if(tileID === 0) {
            button.addDefer((context, localX, localY) => {
                this.camera.drawEmptyTile(context, localX, localY, MapEditorState.GRAPHICS_BUTTON_SCALE, MapEditorState.GRAPHICS_BUTTON_SCALE);
            });
        } else {
            button.addDefer((context, localX, localY) => {
                this.camera.drawTileGraphics(tileManager, context, tileID, localX, localY, MapEditorState.GRAPHICS_BUTTON_SCALE, MapEditorState.GRAPHICS_BUTTON_SCALE);
                /*
                context.fillStyle = "#eeeeee";
                context.textAlign = "center";
                context.fillText(tileName, localX + 25, localY + 25);
                */
            });
        }
    }
} 

MapEditorState.prototype.getPageText = function() {
    const fMaxPagesNeeded = this.mapEditor.allSetElements.length / this.mapEditor.config.interface.slots.length;
    const maxPagesNeeded = Math.ceil(fMaxPagesNeeded);
    const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;
    const showCurrentPage = this.mapEditor.pageIndex + 1;

    return `${showCurrentPage} / ${showMaxPagesNeeded}`;
}

MapEditorState.prototype.getSizeText = function() {
    const brushSize = this.mapEditor.getBrushSize();
    const showBrushSize = brushSize + 1;
    const showTileSize = brushSize * 2 + 1;
    const showMaxBrushSize = this.mapEditor.config.brushSizes.length;

    return `SIZE: ${showTileSize}x${showTileSize} (${showBrushSize} / ${showMaxBrushSize})`;
}

MapEditorState.prototype.updateButtonText = function(gameContext) {
    const { uiManager } = gameContext;
    const { id } = this.mapEditor.config.interface;
    const editorInterface = uiManager.getInterface(id);

    editorInterface.setText("TEXT_TILESET_MODE", `MODE: ${this.mapEditor.getBrushMode()}`);
    editorInterface.setText("TEXT_TILESET", `${this.mapEditor.getBrushSet().id}`);
    editorInterface.setText("TEXT_PAGE", this.getPageText());
    editorInterface.setText("TEXT_SIZE",  this.getSizeText());
}

MapEditorState.prototype.initializeRenderEvents = function(gameContext) {
    const { tileManager, renderer } = gameContext;
    const { layerButtons } = this.mapEditor.config.interface;
    const cameraContext = renderer.getContext(this.contextID);

    cameraContext.addPostDraw((camera, context) => {
        const cursorTile = gameContext.getMouseTile();
        const brushSize = this.mapEditor.getBrushSize();
        const brush = this.mapEditor.getBrush();
    
        if(!brush) {
            return;
        }
    
        if(this.currentLayerButtonID !== null) {
            const { type } = layerButtons[this.currentLayerButtonID];
    
            if(type !== MapEditorState.BUTTON_TYPE_GRAPHICS) {
                return;
            }
        }
    
        const { tileName, tileID } = brush;
        const { x, y } = camera.getViewport();
        const { width, height, halfWidth, halfHeight } = camera.getTileDimensions();
        const startX = cursorTile.x - brushSize;
        const startY = cursorTile.y - brushSize;
        const endX = cursorTile.x + brushSize;
        const endY = cursorTile.y + brushSize;

        context.globalAlpha = this.mapEditor.config.overlayOpacity;

        for(let i = startY; i <= endY; i++) {
            const renderY = i * height - y;

            for(let j = startX; j <= endX; j++) {   
                const renderX = j * width - x;

                if(tileID === 0) {
                    this.camera.drawEmptyTile(context, renderX, renderY);
                } else {
                    this.camera.drawTileGraphics(tileManager, context, tileID, renderX, renderY);

                    context.fillStyle = this.mapEditor.config.overlayTextColor;
                    context.textAlign = "center";
                    context.fillText(tileName, renderX + halfWidth, renderY);  
                } 
            }
        }

        context.globalAlpha = 1;
    });
}

MapEditorState.prototype.paint = function(gameContext) {
    if(this.currentLayerButtonID === null) {
        return;
    }

    const { layerButtons } = this.mapEditor.config.interface;
    const { type } = layerButtons[this.currentLayerButtonID];

    switch(type) {
        case MapEditorState.BUTTON_TYPE_GRAPHICS: {
            this.mapEditor.paint(gameContext, this.currentMapID, this.currentLayer);
            break;
        }
        case MapEditorState.BUTTON_TYPE_TYPE: {
            const layerID = "type";

            this.mapEditor.incrementTypeIndex(gameContext, this.currentMapID, layerID);
            break;
        }
        default: {
            console.warn(`Button type ${type} does not exist!`);
            break;
        }
    }
}

MapEditorState.prototype.initializeCursorEvents = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.EVENT.UP_MOUSE_SCROLL, this.id, () => {
        this.mapEditor.scrollBrushSize(1);
        this.updateButtonText(gameContext);
    });

    cursor.events.subscribe(Cursor.EVENT.DOWN_MOUSE_SCROLL, this.id, () => {
        this.mapEditor.scrollBrushSize(-1);
        this.updateButtonText(gameContext);
    });

    cursor.events.subscribe(Cursor.EVENT.RIGHT_MOUSE_DRAG, this.id, () => {
        this.paint(gameContext);
    });

    cursor.events.subscribe(Cursor.EVENT.RIGHT_MOUSE_CLICK, this.id, () => {
        this.paint(gameContext);
    });

    cursor.events.subscribe(Cursor.EVENT.LEFT_MOUSE_DRAG, this.id, (deltaX, deltaY) => {
        const context = gameContext.getContextAtMouse();

        if(context) {
            context.dragCamera(deltaX, deltaY);
        }
    });
}

MapEditorState.prototype.createNewMap = function(gameContext) {
    const { world } = gameContext;
    const createNew = confirm("This will create and load a brand new map! Proceed?");

    if(!createNew) {
        return;
    }

    const mapID = `${Date.now()}`;
    const mapData = this.mapEditor.getDefaultMapData();
    
    world.createMap(gameContext, mapID, mapData);

    this.currentMapID = mapID;
}

MapEditorState.prototype.resizeMap = function(gameContext) {
    const { world, renderer } = gameContext;
    const { mapManager } = world;
    const gameMap = mapManager.getLoadedMap(this.currentMapID);
    const { maxMapWidth, maxMapHeight } = this.mapEditor.config;

    if(!gameMap) {
        console.warn(`GameMap cannot be undefined! Returning...`);
        return;
    }

    const parsedWidth = parseInt(prompt("MAP_WIDTH"));
    const parsedHeight = parseInt(prompt("MAP_HEIGHT"));
    const newWidth = clampValue(parsedWidth, maxMapWidth, 1);
    const newHeight = clampValue(parsedHeight, maxMapHeight, 1);
  
    this.mapEditor.resizeMap(gameMap, newWidth, newHeight);
    this.camera.loadWorld(newWidth, newHeight);

    renderer.getContext(this.contextID).refreshCamera();
}

MapEditorState.prototype.initializeUIEvents = function(gameContext) {
    const { uiManager, world } = gameContext;
    const { mapManager } = world;
    const { id, layerButtons, buttonStates } = this.mapEditor.config.interface;
    const editorInterface = uiManager.getInterface(id);

    editorInterface.addClick("BUTTON_TILESET_MODE", () => {
        this.mapEditor.scrollBrushMode(1);
        this.loadButtonEvents(gameContext);
        this.updateButtonText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_LEFT", () => {
        this.mapEditor.scrollBrushSet(-1);
        this.loadButtonEvents(gameContext);
        this.updateButtonText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_RIGHT", () => {
        this.mapEditor.scrollBrushSet(1);
        this.loadButtonEvents(gameContext);
        this.updateButtonText(gameContext);
    });

    editorInterface.addClick("BUTTON_PAGE_LAST", () => {
        this.mapEditor.scrollPage(-1);
        this.loadButtonEvents(gameContext);
        this.updateButtonText(gameContext);
    }); 

    editorInterface.addClick("BUTTON_PAGE_NEXT", () => {
        this.mapEditor.scrollPage(1);
        this.loadButtonEvents(gameContext);
        this.updateButtonText(gameContext);
    });  

    editorInterface.addClick("BUTTON_SCROLL_SIZE", () => {
        this.mapEditor.scrollBrushSize(1);
        this.updateButtonText(gameContext);
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
        const worldMap = await world.createMapByID(gameContext, mapID);

        if(worldMap) {
            this.currentMapID = mapID;
        }
    });

    editorInterface.addClick("BUTTON_RESIZE", () => {
        this.resizeMap(gameContext);
    }); 

    editorInterface.addClick("BUTTON_UNDO", () => {
        this.mapEditor.undo(gameContext);
    }); 

    editorInterface.addClick("BUTTON_VIEW_ALL", () => {
        for(const buttonID in layerButtons) {
            const button = layerButtons[buttonID];
            const buttonText = editorInterface.getElement(button.text);
            const buttonColor = buttonStates[MapEditorState.BUTTON_STATE_VISIBLE].textColor;

            button.state = MapEditorState.BUTTON_STATE_VISIBLE;
            buttonText.style.color.setColorArray(buttonColor);
        }

        this.currentLayer = null;
        this.currentLayerButtonID = null;

        this.updateLayerOpacity(gameContext);
        this.mapEditor.setBrush(null);
    });
}