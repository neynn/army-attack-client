import { MapEditor } from "../../mapEditor.js";
import { Camera } from "../../source/camera/camera.js";
import { Cursor } from "../../source/client/cursor.js";
import { Controller } from "../../source/controller/controller.js";
import { saveMap, saveTemplateAsFile } from "../../source/helpers.js";
import { loopValue } from "../../source/math/math.js";
import { Renderer } from "../../source/renderer.js";
import { UIElement } from "../../source/ui/uiElement.js";

export const EditorController = function(id) {
    Controller.call(this, id);

    this.mapEditor = new MapEditor();
    this.temporaryMapID = `${Date.now()}`;;
    this.currentLayer = null;
    this.currentLayerButtonID = null;
    this.currentMapID = null;
}

EditorController.GRAPHICS_BUTTON_SCALE = 50 / 96;

EditorController.BUTTON_STATE_VISIBLE = "1";
EditorController.BUTTON_STATE_EDIT = "2";

EditorController.BUTTON_TYPE_BOOLEAN = "0";
EditorController.BUTTON_TYPE_GRAPHICS = "1";
EditorController.BUTTON_TYPE_TYPE = "2";

EditorController.prototype = Object.create(Controller.prototype);
EditorController.prototype.constructor = EditorController;

EditorController.prototype.initialize = function(gameContext, data) {
    const { tileManager, settings } = gameContext;

    this.mapEditor.loadConfig(settings.mapEditor);
    this.mapEditor.loadBrushSets(tileManager.tileMeta);

    this.initializeRenderEvents(gameContext);
    this.initializeCursorEvents(gameContext);
    this.initializeUIEvents(gameContext);

    this.loadButtonEvents(gameContext);
    this.updateButtonText(gameContext);
}

EditorController.prototype.incrementTypeIndex = function(gameContext) {
    const { mapLoader } = gameContext;
    const gameMap = mapLoader.getLoadedMap(this.currentMapID);

    if(!gameMap) {
        return;
    }

    const { x, y } = gameContext.getMouseTile();
    const tileTypes = gameContext.getConfig("tileTypes");

    const tileTypesKeys = Object.keys(tileTypes);
    const currentID = gameMap.getTile("type", x, y);
    const currentIndex = tileTypesKeys.indexOf(currentID);
    const nextIndex = loopValue(currentIndex + 1, tileTypesKeys.length - 1, 0);
    const nextID = tileTypesKeys[nextIndex];

    gameMap.placeTile(nextID, "type", x, y);
}

EditorController.prototype.updateLayerOpacity = function(gameContext) {
    const { mapLoader } = gameContext;
    const gameMap = mapLoader.getLoadedMap(this.currentMapID);

    if(!gameMap) {
        return;
    }

    const { layerButtons, layerButtonStates } = this.mapEditor.config.interface;

    for(const buttonID in layerButtons) {
        const button = layerButtons[buttonID];
        const state = layerButtonStates[button.state];
        const layerID = button.layer;
        const opacity = state.opacity;

        gameMap.setLayerOpacity(layerID, opacity);

        if(this.currentLayerButtonID === null) {
            continue;
        }

        if(button.state === EditorController.BUTTON_STATE_VISIBLE) {
            gameMap.setLayerOpacity(layerID, 0.5);
        }
    }
}

EditorController.prototype.scrollLayerButton = function(gameContext, buttonID) {
    const { uiManager } = gameContext;
    const { layerButtons, layerButtonStates, id } = this.mapEditor.config.interface;
    const button = layerButtons[buttonID];
    const { nextState } = layerButtonStates[button.state];

    if(button.id === this.currentLayerButtonID) {
        this.currentLayerButtonID = null;
        this.currentLayer = null;
    }

    if(nextState === EditorController.BUTTON_STATE_EDIT) {
        if(this.currentLayerButtonID !== null) {
            const currentButton = layerButtons[this.currentLayerButtonID];
            const currentButtonText = uiManager.getText(id, currentButton.text);
            const currentButtonColor = layerButtonStates[EditorController.BUTTON_STATE_VISIBLE].textColor;
        
            currentButton.state = EditorController.BUTTON_STATE_VISIBLE;
            currentButtonText.style.setColorArray(currentButtonColor);

            this.currentLayer = null;
            this.currentLayerButtonID = null;
        }

        this.currentLayer = button.layer;
        this.currentLayerButtonID = button.id;
    }

    const buttonText = uiManager.getText(id, button.text);
    const buttonColor = layerButtonStates[nextState].textColor;

    buttonText.style.setColorArray(buttonColor);
    button.state = nextState;

    this.updateLayerOpacity(gameContext);
}

EditorController.prototype.loadButtonEvents = function(gameContext) {
    const { uiManager, tileManager } = gameContext;
    const { slots, id } = this.mapEditor.config.interface;
    const pageElements = this.mapEditor.getPage();

    for(const buttonID of slots) {
        const button = uiManager.getButton(id, buttonID);

        button.events.unsubscribe(UIElement.EVENT_CLICKED, this.id);
        button.events.unsubscribe(UIElement.EVENT_DRAW, this.id);
    }

    for(let i = 0; i < slots.length; i++) {
        const buttonID = slots[i];
        const brushData = pageElements[i];
        const button = uiManager.getButton(id, buttonID);
        const { tileName, tileID } = brushData;

        button.events.subscribe(UIElement.EVENT_CLICKED, this.id, () => this.mapEditor.setBrush(brushData));

        button.events.subscribe(UIElement.EVENT_DRAW, this.id, (context, localX, localY) => {
            if(tileID === 0) {
                tileManager.drawEmptyTile(context, localX, localY, 25, 25);
            } else {
                tileManager.drawTileGraphics(tileID, context, localX, localY, EditorController.GRAPHICS_BUTTON_SCALE, EditorController.GRAPHICS_BUTTON_SCALE);
                context.fillStyle = "#eeeeee";
                context.textAlign = "center";
                context.fillText(tileName, localX + 25, localY + 25);
            }
        });
    }
} 

EditorController.prototype.getPageText = function() {
    const fMaxPagesNeeded = this.mapEditor.allPageElements.length / this.mapEditor.config.interface.slots.length;
    const maxPagesNeeded = Math.ceil(fMaxPagesNeeded);
    const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;
    const showCurrentPage = this.mapEditor.pageIndex + 1;

    return `${showCurrentPage} / ${showMaxPagesNeeded}`;
}

EditorController.prototype.getSizeText = function() {
    const brushSize = this.mapEditor.getBrushSize();
    const showBrushSize = brushSize + 1;
    const showTileSize = brushSize * 2 + 1;
    const showMaxBrushSize = this.mapEditor.config.brushSizes.length;

    return `SIZE: ${showTileSize}x${showTileSize} (${showBrushSize} / ${showMaxBrushSize})`;
}

EditorController.prototype.updateButtonText = function(gameContext) {
    const { uiManager } = gameContext;
    const { id } = this.mapEditor.config.interface;

    uiManager.setText(id, "TEXT_TILESET_MODE", `MODE: ${this.mapEditor.getBrushMode()}`);
    uiManager.setText(id, "TEXT_TILESET", `${this.mapEditor.getBrushSet().id}`);
    uiManager.setText(id, "TEXT_PAGE", this.getPageText());
    uiManager.setText(id, "TEXT_SIZE",  this.getSizeText());
}

EditorController.prototype.initializeRenderEvents = function(gameContext) {
    const { renderer, tileManager } = gameContext;
    const { layerButtons } = this.mapEditor.config.interface;
    
    renderer.events.subscribe(Renderer.EVENT_CAMERA_FINISH, this.id, (renderer, camera) => {
        const cursorTile = gameContext.getMouseTile();
        const brush = this.mapEditor.getBrush();
        const brushSize = this.mapEditor.getBrushSize();
    
        if(!brush) {
            return;
        }
    
        if(this.currentLayerButtonID !== null) {
            const { type } = layerButtons[this.currentLayerButtonID];
    
            if(type !== EditorController.BUTTON_TYPE_GRAPHICS) {
                return;
            }
        }
    
        const { tileName, tileID } = brush;
        const context = renderer.getContext();
        const { x, y } = camera.getViewportPosition();
        const tileWidth = Camera.TILE_WIDTH * camera.scale;
        const tileHeight = Camera.TILE_HEIGHT * camera.scale;
        const halfTileWidth = tileWidth / 2;
        const halfTileHeight = tileHeight / 2;
        const startX = cursorTile.x - brushSize;
        const startY = cursorTile.y - brushSize;
        const endX = cursorTile.x + brushSize;
        const endY = cursorTile.y + brushSize;

        context.globalAlpha = this.mapEditor.config.overlayOpacity;

        for(let i = startY; i <= endY; i++) {
            const renderY = i * tileHeight - y * camera.scale;

            for(let j = startX; j <= endX; j++) {   
                const renderX = j * tileWidth - x * camera.scale;

                if(tileID === 0) {
                    tileManager.drawEmptyTile(context, renderX, renderY, halfTileWidth, halfTileHeight);
                } else {
                    tileManager.drawTileGraphics(tileID, context, renderX, renderY);
                    context.fillStyle = "#eeeeee";
                    context.textAlign = "center";
                    context.fillText(tileName, renderX + halfTileWidth, renderY);  
                } 
            }
        }

        context.globalAlpha = 1;
    });
}

EditorController.prototype.initializeCursorEvents = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.UP_MOUSE_SCROLL, this.id, () => {
        this.mapEditor.scrollBrushSize(1);
        this.updateButtonText(gameContext);
    });

    cursor.events.subscribe(Cursor.DOWN_MOUSE_SCROLL, this.id, () => {
        this.mapEditor.scrollBrushSize(-1);
        this.updateButtonText(gameContext);
    });

    cursor.events.subscribe(Cursor.RIGHT_MOUSE_DRAG, this.id, () => {
        if(this.currentLayerButtonID === null) {
            return;
        }

        const { layerButtons } = this.mapEditor.config.interface;
        const { type } = layerButtons[this.currentLayerButtonID];

        if(type === EditorController.BUTTON_TYPE_GRAPHICS) {
            this.mapEditor.paint(gameContext, this.currentMapID, this.currentLayer);
        }
    });

    cursor.events.subscribe(Cursor.RIGHT_MOUSE_CLICK, this.id, () => {
        if(this.currentLayerButtonID === null) {
            return;
        }

        const { layerButtons } = this.mapEditor.config.interface;
        const { type } = layerButtons[this.currentLayerButtonID];

        if(type === EditorController.BUTTON_TYPE_GRAPHICS) {
            this.mapEditor.paint(gameContext, this.currentMapID, this.currentLayer);
        } else if(type === EditorController.BUTTON_TYPE_TYPE) {
            this.incrementTypeIndex(gameContext);
        } else if(type === EditorController.BUTTON_TYPE_BOOLEAN) {
            this.mapEditor.swapFlag(gameContext, this.currentMapID, this.currentLayer);
        }
    });

    cursor.events.subscribe(Cursor.LEFT_MOUSE_DRAG, this.id, (deltaX, deltaY) => {
        const camera = gameContext.getCameraAtMouse();

        if(camera) {
            camera.dragViewport(deltaX, deltaY);
        }
    });
}

EditorController.prototype.initializeUIEvents = function(gameContext) {
    const { uiManager, mapLoader, renderer } = gameContext;
    const { id, layerButtons, layerButtonStates } = this.mapEditor.config.interface;
    const camera = renderer.getCamera("ARMY_CAMERA");

    uiManager.addClick(id, "BUTTON_TILESET_MODE", () => {
        this.mapEditor.scrollBrushMode(1);
        this.loadButtonEvents(gameContext);
        this.updateButtonText(gameContext);
    });

    uiManager.addClick(id, "BUTTON_TILESET_LEFT", () => {
        this.mapEditor.scrollBrushSet(-1);
        this.loadButtonEvents(gameContext);
        this.updateButtonText(gameContext);
    });

    uiManager.addClick(id, "BUTTON_TILESET_RIGHT", () => {
        this.mapEditor.scrollBrushSet(1);
        this.loadButtonEvents(gameContext);
        this.updateButtonText(gameContext);
    });

    uiManager.addClick(id, "BUTTON_PAGE_LAST", () => {
        this.mapEditor.scrollPage(-1);
        this.loadButtonEvents(gameContext);
        this.updateButtonText(gameContext);
    }); 

    uiManager.addClick(id, "BUTTON_PAGE_NEXT", () => {
        this.mapEditor.scrollPage(1);
        this.loadButtonEvents(gameContext);
        this.updateButtonText(gameContext);
    });  

    uiManager.addClick(id, "BUTTON_SCROLL_SIZE", () => {
        this.mapEditor.scrollBrushSize(1);
        this.updateButtonText(gameContext);
    }); 

    uiManager.addClick(id, "BUTTON_L1", () => {
        this.scrollLayerButton(gameContext, "L1");
    });

    uiManager.addClick(id, "BUTTON_L2", () => {
        this.scrollLayerButton(gameContext, "L2");
    });

    uiManager.addClick(id, "BUTTON_L3", () => {
        this.scrollLayerButton(gameContext, "L3");
    });

    uiManager.addClick(id, "BUTTON_LC", () => {
        this.scrollLayerButton(gameContext, "LC");
    });

    uiManager.addClick(id, "BUTTON_SAVE", () => {
        const mapData = mapLoader.getLoadedMap(this.currentMapID);
        const saveData = saveMap(mapData);

        saveTemplateAsFile(this.currentMapID + ".json", saveData);
    });

    uiManager.addClick(id, "BUTTON_CREATE", () => {
        mapLoader.createEmptyMap(this.temporaryMapID);

        if(this.currentMapID === null) {
            this.currentMapID = this.temporaryMapID;

            gameContext.loadMap(this.currentMapID);
        }
    });

    uiManager.addClick(id, "BUTTON_LOAD", () => {
        const mapID = prompt("MAP-ID?");

        if(mapID.length === 0) {
            this.currentMapID = this.temporaryMapID;
        } else {
            this.currentMapID = mapID;
        }

        gameContext.loadMap(this.currentMapID).then(result => {
            if(!result) {
                //TODO
            }
        });
    });

    uiManager.addClick(id, "BUTTON_RESIZE", () => {
        const gameMap = mapLoader.getLoadedMap(this.currentMapID);

        if(!gameMap) {
            console.warn(`GameMap cannot be undefined! Returning...`);

            return;
        }

        const newWidth = parseInt(prompt("MAP_WIDTH"));
        const newHeight = parseInt(prompt("MAP_HEIGHT"));

        if(newWidth < 0 || newHeight < 0) {
            console.warn(`Width or Height cannot be below 0! Returning...`);

            return;
        }

        const { maxMapWidth, maxMapHeight } = mapLoader.config;
    
        if(newWidth > maxMapWidth || newHeight > maxMapHeight) {
            console.warn({maxMapWidth, maxMapHeight});

            return;
        }

        mapLoader.resizeMap(this.currentMapID, newWidth, newHeight);

        camera.loadViewport(newWidth, newHeight);
    }); 

    uiManager.addClick(id, "BUTTON_VIEW_ALL", () => {
        for(const buttonID in layerButtons) {
            const button = layerButtons[buttonID];
            const buttonText = uiManager.getText(id, button.text);
            const buttonColor = layerButtonStates[EditorController.BUTTON_STATE_VISIBLE].textColor;

            button.state = EditorController.BUTTON_STATE_VISIBLE;
            buttonText.style.setColorArray(buttonColor);
        }

        this.currentLayer = null;
        this.currentLayerButtonID = null;

        this.updateLayerOpacity(gameContext);
        this.mapEditor.setBrush(null);
    });
}

EditorController.prototype.removeEvents = function(gameContext) {
    const { client, renderer } = gameContext;
    const { cursor } = client;

    renderer.events.unsubscribe(Renderer.EVENT_CAMERA_FINISH, this.id);
    cursor.events.unsubscribeAll(this.id);
}