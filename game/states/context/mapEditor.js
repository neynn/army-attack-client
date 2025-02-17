import { State } from "../../../source/state/state.js";
import { Cursor } from "../../../source/client/cursor.js";
import { CameraContext } from "../../../source/camera/cameraContext.js";
import { MapEditor } from "../../../source/map/mapEditor.js";
import { clampValue } from "../../../source/math/math.js";
import { Button } from "../../../source/ui/elements/button.js";

import { CAMERA_TYPES } from "../../enums.js";
import { saveMap } from "../../../helpers.js";
import { ArmyContext } from "../../armyContext.js";

export const MapEditorState = function() {
    this.id = "MAP_EDITOR_STATE";
    this.mapEditor = new MapEditor();
    this.currentLayer = null;
    this.currentLayerButtonID = null;
    this.currentMapID = null;
}

MapEditorState.GRAPHICS_BUTTON_SCALE = 50 / 96;

MapEditorState.BUTTON_STATE_VISIBLE = "VISIBLE";
MapEditorState.BUTTON_STATE_EDIT = "EDIT";

MapEditorState.BUTTON_TYPE_GRAPHICS = "1";
MapEditorState.BUTTON_TYPE_TYPE = "2";

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, tileManager, settings } = gameContext;
    const context = gameContext.createCamera(CAMERA_TYPES.ARMY_CAMERA);
    const camera = context.getCamera();

    gameContext.setGameMode(ArmyContext.GAME_MODE.EDIT);
    context.setPositionMode(CameraContext.POSITION_MODE.FIXED_ORIGIN);
    camera.unbindViewport();

    uiManager.parseUI("MAP_EDITOR", gameContext);
    uiManager.unparseUI("FPS_COUNTER", gameContext);

    this.mapEditor.loadConfig(settings.mapEditor);
    this.mapEditor.loadBrushSets(tileManager.getInvertedTileMeta());
    this.initializeRenderEvents(gameContext);
    this.initializeCursorEvents(gameContext);
    this.initializeUIEvents(gameContext);
    this.loadButtonEvents(gameContext);
    this.updateButtonText(gameContext);
}

MapEditorState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { renderer, uiManager } = gameContext;

    gameContext.setGameMode(ArmyContext.GAME_MODE.NONE);
    uiManager.unparseUI("MAP_EDITOR", gameContext);
    renderer.removeCamera(CAMERA_TYPES.ARMY_CAMERA);
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
    const { uiManager, renderer, tileManager } = gameContext;
    const { slots, id } = this.mapEditor.config.interface;
    const pageElements = this.mapEditor.getPage();
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const editorInterface = uiManager.getInterface(id);

    for(const buttonID of slots) {
        const button = editorInterface.getElement(buttonID);

        button.events.unsubscribe(Button.EVENT_CLICKED, this.id);
        button.events.unsubscribe(Button.EVENT_DEFER_DRAW, this.id);
    }

    for(let i = 0; i < slots.length; i++) {
        const buttonID = slots[i];
        const brushData = pageElements[i];
        const button = editorInterface.getElement(buttonID);
        const { tileName, tileID } = brushData;

        button.events.subscribe(Button.EVENT_CLICKED, this.id, () => this.mapEditor.setBrush(brushData));

        button.events.subscribe(Button.EVENT_DEFER_DRAW, this.id, (element, context, localX, localY) => {
            if(tileID === 0) {
                camera.drawEmptyTile(context, localX, localY, MapEditorState.GRAPHICS_BUTTON_SCALE, MapEditorState.GRAPHICS_BUTTON_SCALE);
            } else {
                camera.drawTileGraphics(tileManager, context, tileID, localX, localY, MapEditorState.GRAPHICS_BUTTON_SCALE, MapEditorState.GRAPHICS_BUTTON_SCALE);
                context.fillStyle = "#eeeeee";
                context.textAlign = "center";
                context.fillText(tileName, localX + 25, localY + 25);
            }
        });
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
    const { renderer, tileManager } = gameContext;
    const { layerButtons } = this.mapEditor.config.interface;
    const cameraContext = renderer.getContext(CAMERA_TYPES.ARMY_CAMERA);

    cameraContext.events.subscribe(CameraContext.EVENT.RENDER_COMPLETE, this.id, (camera, context) => {
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
        const { width, height, halfWidth } = camera.getTileDimensions();
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
                    camera.drawEmptyTile(context, renderX, renderY);
                } else {
                    camera.drawTileGraphics(tileManager, context, tileID, renderX, renderY);
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
    const { world } = gameContext;

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
            const types = world.getConfig("TileType");
            const layerID = "type";

            this.mapEditor.incrementTypeIndex(gameContext, types, this.currentMapID, layerID);
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
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

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

    camera.loadWorld(newWidth, newHeight);
    renderer.refreshCamera(CAMERA_TYPES.ARMY_CAMERA);
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