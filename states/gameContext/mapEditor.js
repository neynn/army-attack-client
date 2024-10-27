import { Camera } from "../../source/camera/camera.js";
import { Cursor } from "../../source/client/cursor.js";
import { loopValue } from "../../source/math/math.js";
import { saveTemplateAsFile } from "../../source/helpers.js";
import { State } from "../../source/state/state.js";
import { UIElement } from "../../source/ui/uiElement.js";

export const MapEditorState = function() {
    State.call(this);
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

//EBOLA-HÄCK-CONTAINMENT-CENTER
//TODO: Attack layers properly.
const initializeMapEditor = function(gameContext) {
    const { mapLoader, client, uiManager, spriteManager, renderer, mapEditor } = gameContext;
    const { cursor } = client;

    const editorInterface = mapEditor.config.interface;

    const BUTTON_TYPE_BOOLEAN = "0";
    const BUTTON_TYPE_GRAPHICS = "1";
    const BUTTON_TYPE_TYPE = "2";
    const BUTTON_STATE_HIDDEN = "0";
    const BUTTON_STATE_VISIBLE = "1";
    const BUTTON_STATE_EDIT = "2";

    const MAP_ID = `${Date.now()}`;
    const MAP_EDITOR_ID = "MAP_EDITOR";
    const AVAILABLE_BUTTON_SLOTS = editorInterface.slots;

    const GRAPHICS_BUTTON_SCALE = 50 / 96;

    let currentLayer = null;
    let currentLayerButtonID = null;
    let EDITOR_MAP_ID = null;

    const updateLayerOpacity = () => {
        const layerButtons = editorInterface.layerButtons;
        const layerButtonStates = editorInterface.layerButtonStates;
        const editorMap = mapLoader.getCachedMap(EDITOR_MAP_ID);

        if(!editorMap) {
            return;
        }

        for(const key in layerButtons) {
            const layerButton = layerButtons[key];
            const layerButtonStateConfig = layerButtonStates[layerButton.state];
            const layerID = layerButton.layer;
            const opacity = layerButtonStateConfig.opacity;

            editorMap.setLayerOpacity(layerID, opacity);

            if(currentLayerButtonID === null) {
                continue;
            }

            if(layerButton.state === BUTTON_STATE_VISIBLE) {
                editorMap.setLayerOpacity(layerID, 0.5);
            }
        }
    }

    const scrollLayerButton = (buttonID) => {
        const { layerButtons, layerButtonStates, id } = editorInterface;
        const layerButton = layerButtons[buttonID];
        const { nextState } = layerButtonStates[layerButton.state];

        if(layerButton.id === currentLayerButtonID) {
            currentLayerButtonID = null;
            currentLayer = null;
        }

        if(nextState === BUTTON_STATE_EDIT) {
            if(currentLayerButtonID !== null) {
                const currentLayerButton = layerButtons[currentLayerButtonID];
                const currentLayerButtonText = uiManager.getText(editorInterface.id, currentLayerButton.text);
                const currentLayerButtonTextColor = editorInterface.layerButtonStates[BUTTON_STATE_VISIBLE].textColor;

                currentLayerButton.state = BUTTON_STATE_VISIBLE;
                currentLayerButtonText.style.setColor(currentLayerButtonTextColor);

                currentLayer = null;
                currentLayerButtonID = null;
            }

            currentLayer = layerButton.layer;
            currentLayerButtonID = layerButton.id;
        }

        const layerButtonText = uiManager.getText(editorInterface.id, layerButton.text);
        const layerButtonTextColor = editorInterface.layerButtonStates[nextState].textColor;

        layerButtonText.style.setColor(layerButtonTextColor);
        layerButton.state = nextState;

        updateLayerOpacity();
    }

    const loadPageButtonsEvents = (pageElements) => {
        for(const buttonID of AVAILABLE_BUTTON_SLOTS) {
            const button = uiManager.getButton(editorInterface.id, buttonID);

            button.events.unsubscribe(UIElement.EVENT_CLICKED, MAP_EDITOR_ID);
            button.events.unsubscribe(UIElement.EVENT_DRAW, MAP_EDITOR_ID);
        }

        for(let i = 0; i < AVAILABLE_BUTTON_SLOTS.length; i++) {
            const brushData = pageElements[i];
            const buttonID = AVAILABLE_BUTTON_SLOTS[i];
            const button = uiManager.getButton(editorInterface.id, buttonID);

            button.events.subscribe(UIElement.EVENT_CLICKED, MAP_EDITOR_ID, () => mapEditor.setSelectedBrush(brushData));

            if(brushData === null) {
                button.events.subscribe(UIElement.EVENT_DRAW, MAP_EDITOR_ID, (context, localX, localY) => {
                    context.fillStyle = "#701867";
                    context.fillRect(localX, localY, 25, 25);
                    context.fillRect(localX + 25, localY + 25, 25, 25);
                    context.fillStyle = "#000000";
                    context.fillRect(localX + 25, localY, 25, 25);
                    context.fillRect(localX, localY + 25, 25, 25);
                });

                continue;
            }

            if(brushData === undefined) {
                continue;
            }

            const [tileSetID, frameID, brushModeID] = brushData;

            button.events.subscribe(UIElement.EVENT_DRAW, MAP_EDITOR_ID, (context, localX, localY) => {
                spriteManager.drawTileGraphics(brushData, context, localX, localY, GRAPHICS_BUTTON_SCALE, GRAPHICS_BUTTON_SCALE);
                context.fillStyle = "#eeeeee";
                context.textAlign = "center";
                context.fillText(frameID, localX + 25, localY + 25);
            });
        }
    }

    const incrementTypeIndex = () => {
        const gameMap = mapLoader.getCachedMap(EDITOR_MAP_ID);

        if(!gameMap) {
            return;
        }

        const {x, y} = gameContext.getViewportTilePosition();
        const tileTypes = gameContext.getConfig("tileTypes");

        const tileTypesKeys = Object.keys(tileTypes);
        const currentID = gameMap.getLayerTile("type", x, y);
        const currentIndex = tileTypesKeys.indexOf(currentID);
        const nextIndex = loopValue(currentIndex + 1, tileTypesKeys.length - 1, 0);
        const nextID = tileTypesKeys[nextIndex];

        gameMap.placeTile(nextID, "type", x, y);
    }

    const getPageText = () => {
        const maxElementsPerPage = AVAILABLE_BUTTON_SLOTS.length;
        const maxPagesNeeded = Math.ceil(mapEditor.allPageElements.length / maxElementsPerPage);
        const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;

        return `${mapEditor.currentPageIndex + 1} / ${showMaxPagesNeeded}`;
    }

    const getSizeText = () => {
        const brushSize = mapEditor.getBrushSize();
        const tileSize = brushSize * 2 + 1;

        return `SIZE: ${tileSize}x${tileSize} (${brushSize + 1} / ${mapEditor.brushSizes.length})`;
    }

    renderer.events.subscribe(Camera.EVENT_MAP_RENDER_COMPLETE, MAP_EDITOR_ID, (renderer) => {
        const cursorTile = gameContext.getViewportTilePosition();
        const brush = mapEditor.getSelectedBrush();
        const brushSize = mapEditor.getBrushSize();

        if(brush === undefined) {
            return;
        }

        if(currentLayerButtonID !== null) {
            const { layerButtons } = editorInterface;
            const { type } = layerButtons[currentLayerButtonID];

            if(type !== BUTTON_TYPE_GRAPHICS) {
                return;
            }
        }

        const { context } = renderer.display;
        const { viewportX, viewportY } = renderer.getViewportPosition();
        const tileWidth = Camera.TILE_WIDTH * Camera.SCALE;
        const tileHeight = Camera.TILE_HEIGHT * Camera.SCALE;
        const halfTileWidth = tileWidth / 2;
        const halfTileHeight = tileHeight / 2;
        const startX = cursorTile.x - brushSize;
        const startY = cursorTile.y - brushSize;
        const endX = cursorTile.x + brushSize;
        const endY = cursorTile.y + brushSize;

        context.globalAlpha = mapEditor.config.overlayOpacity;

        for(let i = startY; i <= endY; i++) {
            const renderY = i * tileHeight - viewportY * Camera.SCALE;
            for(let j = startX; j <= endX; j++) {   
                const renderX = j * tileWidth - viewportX * Camera.SCALE;

                if(brush === null) {
                    context.fillStyle = "#701867";
                    context.fillRect(renderX, renderY, halfTileWidth, halfTileHeight);
                    context.fillRect(renderX + halfTileWidth, renderY + halfTileHeight, halfTileWidth, halfTileHeight);
                    context.fillStyle = "#000000";
                    context.fillRect(renderX + halfTileWidth, renderY, halfTileWidth, halfTileHeight);
                    context.fillRect(renderX, renderY + halfTileHeight, halfTileWidth, halfTileHeight);
                    continue;
                }

                spriteManager.drawTileGraphics(brush, renderer.display.context, renderX, renderY);
            }
        }

        context.globalAlpha = 1;
    });

    cursor.events.subscribe(Cursor.UP_MOUSE_SCROLL, MAP_EDITOR_ID, () => {
        mapEditor.scrollBrushSize(1);
    
        uiManager.setText(editorInterface.id, "TEXT_SIZE", getSizeText());
    });

    cursor.events.subscribe(Cursor.DOWN_MOUSE_SCROLL, MAP_EDITOR_ID, () => {
        mapEditor.scrollBrushSize(-1);
    
        uiManager.setText(editorInterface.id, "TEXT_SIZE", getSizeText());
    });

    cursor.events.subscribe(Cursor.RIGHT_MOUSE_DRAG, MAP_EDITOR_ID, () => {
        if(currentLayerButtonID === null) {
            return;
        }

        const { layerButtons } = editorInterface;
        const { type } = layerButtons[currentLayerButtonID];

        if(type === BUTTON_TYPE_GRAPHICS) {
            mapEditor.paint(gameContext, EDITOR_MAP_ID, currentLayer);
        }
    });

    cursor.events.subscribe(Cursor.RIGHT_MOUSE_CLICK, MAP_EDITOR_ID, () => {
        if(currentLayerButtonID === null) {
            return;
        }

        const { layerButtons } = editorInterface;
        const { type } = layerButtons[currentLayerButtonID];

        if(type === BUTTON_TYPE_GRAPHICS) {
            mapEditor.paint(gameContext, EDITOR_MAP_ID, currentLayer);
        } else if(type === BUTTON_TYPE_TYPE) {
            incrementTypeIndex();
        } else if(type === BUTTON_TYPE_BOOLEAN) {
            mapEditor.swapFlag(gameContext, EDITOR_MAP_ID, currentLayer);
        }
    });

    loadPageButtonsEvents(mapEditor.getPageElements(AVAILABLE_BUTTON_SLOTS.length));

    uiManager.setText(editorInterface.id, "TEXT_TILESET_MODE", `MODE: ${mapEditor.getBrushModeID()}`);
    uiManager.setText(editorInterface.id, "TEXT_TILESET", `${mapEditor.getCurrentSetID()}`);
    uiManager.setText(editorInterface.id, "TEXT_PAGE", getPageText());
    uiManager.setText(editorInterface.id, "TEXT_SIZE",  getSizeText());

    uiManager.addClick(editorInterface.id, "BUTTON_TILESET_MODE", () => {
        mapEditor.scrollBrushMode(1);
        mapEditor.reloadPageElements(spriteManager.tileSprites);
        loadPageButtonsEvents(mapEditor.getPageElements(AVAILABLE_BUTTON_SLOTS.length));

        uiManager.setText(editorInterface.id, "TEXT_TILESET_MODE", `MODE: ${mapEditor.getBrushModeID()}`);
        uiManager.setText(editorInterface.id, "TEXT_PAGE", getPageText());
    });

    uiManager.addClick(editorInterface.id, "BUTTON_TILESET_LEFT", () => {
        mapEditor.scrollCurrentSet(-1);
        mapEditor.reloadPageElements(spriteManager.tileSprites);
        loadPageButtonsEvents(mapEditor.getPageElements(AVAILABLE_BUTTON_SLOTS.length));

        uiManager.setText(editorInterface.id, "TEXT_TILESET", `${mapEditor.getCurrentSetID()}`);
        uiManager.setText(editorInterface.id, "TEXT_PAGE", getPageText());
    });

    uiManager.addClick(editorInterface.id, "BUTTON_TILESET_RIGHT", () => {
        mapEditor.scrollCurrentSet(1);
        mapEditor.reloadPageElements(spriteManager.tileSprites);
        loadPageButtonsEvents(mapEditor.getPageElements(AVAILABLE_BUTTON_SLOTS.length));

        uiManager.setText(editorInterface.id, "TEXT_TILESET", `${mapEditor.getCurrentSetID()}`);
        uiManager.setText(editorInterface.id, "TEXT_PAGE", getPageText());
    });

    uiManager.addClick(editorInterface.id, "BUTTON_PAGE_LAST", () => {
        mapEditor.scrollPage(AVAILABLE_BUTTON_SLOTS.length, -1);
        loadPageButtonsEvents(mapEditor.getPageElements(AVAILABLE_BUTTON_SLOTS.length));

        uiManager.setText(editorInterface.id, "TEXT_PAGE", getPageText());
    });  

    uiManager.addClick(editorInterface.id, "BUTTON_PAGE_NEXT", () => {
        mapEditor.scrollPage(AVAILABLE_BUTTON_SLOTS.length, 1);
        loadPageButtonsEvents(mapEditor.getPageElements(AVAILABLE_BUTTON_SLOTS.length));

        uiManager.setText(editorInterface.id, "TEXT_PAGE", getPageText());
    });  

    uiManager.addClick(editorInterface.id, "BUTTON_SCROLL_SIZE", () => {
        mapEditor.scrollBrushSize(1);
    
        uiManager.setText(editorInterface.id, "TEXT_SIZE", getSizeText());
    });  

    uiManager.addClick(editorInterface.id, "BUTTON_L1", () => {
        scrollLayerButton("L1");
    });

    uiManager.addClick(editorInterface.id, "BUTTON_L2", () => {
        scrollLayerButton("L2");
    });

    uiManager.addClick(editorInterface.id, "BUTTON_L3", () => {
        scrollLayerButton("L3");
    });

    uiManager.addClick(editorInterface.id, "BUTTON_LC", () => {
        scrollLayerButton("LC");
    });

    uiManager.addClick(editorInterface.id, "BUTTON_SAVE", () => {
        const saveData = mapLoader.saveMap(EDITOR_MAP_ID);
        saveTemplateAsFile(EDITOR_MAP_ID + ".json", saveData);
    });

    uiManager.addClick(editorInterface.id, "BUTTON_CREATE", () => {
        mapLoader.createEmptyMap(MAP_ID);
    });

    uiManager.addClick(editorInterface.id, "BUTTON_LOAD", () => {
        const mapID = prompt("MAP-ID?");

        if(mapID.length === 0) {
            EDITOR_MAP_ID = MAP_ID;
        } else {
            EDITOR_MAP_ID = mapID;
        }

        gameContext.loadMap(EDITOR_MAP_ID);
    });

    uiManager.addClick(editorInterface.id, "BUTTON_RESIZE", () => {
        const gameMap = mapLoader.getCachedMap(EDITOR_MAP_ID);

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
    
        if(newWidth > mapLoader.config.maxMapWidth || newHeight > mapLoader.config.maxMapHeight) {
            const maxAllowedMapWidth = mapLoader.config.maxMapWidth;
            const maxAllowedMapHeight = mapLoader.config.maxMapHeight
            console.warn({maxAllowedMapWidth, maxAllowedMapHeight});
            return;
        }

        mapLoader.resizeMap(EDITOR_MAP_ID, newWidth, newHeight);
        renderer.loadViewport(newWidth, newHeight);
    }); 

    uiManager.addClick(editorInterface.id, "BUTTON_VIEW_ALL", () => {
        const layerButtons = editorInterface.layerButtons;

        for(const key in layerButtons) {
            const layerButton = layerButtons[key];
            const layerButtonText = uiManager.getText(editorInterface.id, layerButton.text);
            const layerButtonTextColor = editorInterface.layerButtonStates[BUTTON_STATE_VISIBLE].textColor;

            layerButton.state = BUTTON_STATE_VISIBLE;
            layerButtonText.style.setColor(layerButtonTextColor);
        }

        currentLayer = null;
        currentLayerButtonID = null;

        updateLayerOpacity();
    });
}

MapEditorState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, renderer } = gameContext;

    renderer.unbindFromScreen();
    uiManager.parseUI("MAP_EDITOR", gameContext);
    uiManager.unparseUI("FPS_COUNTER", gameContext);

    initializeMapEditor(gameContext);
}

MapEditorState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { mapLoader, client, renderer } = gameContext;
    const { cursor } = client;

    mapLoader.unparseUI("MAP_EDITOR", gameContext);
    
    renderer.events.unsubscribe(Camera.EVENT_MAP_RENDER_COMPLETE, "MAP_EDITOR");
    cursor.events.unsubscribe(Cursor.RIGHT_MOUSE_DRAG, "MAP_EDITOR");
    cursor.events.unsubscribe(Cursor.RIGHT_MOUSE_CLICK, "MAP_EDITOR");
}