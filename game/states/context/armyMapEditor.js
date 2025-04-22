import { CameraContext } from "../../../source/camera/cameraContext.js";
import { Cursor } from "../../../source/client/cursor.js";
import { MapEditor } from "../../../source/map/mapEditor.js";
import { ArmyCamera } from "../../armyCamera.js";
import { clampValue } from "../../../source/math/math.js";
import { saveMap } from "../../../helpers.js";
import { UIManager } from "../../../source/ui/uiManager.js";
import { UICollider } from "../../../source/ui/uiCollider.js";

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
    this.buttonStates = {
        [ArmyMapEditor.BUTTON_STATE.HIDDEN]: {
            description: "HIDDEN",
            textColor: ArmyMapEditor.COLOR.HIDDEN,
            opacity: 0,
            nextState: ArmyMapEditor.BUTTON_STATE.VISIBLE
        },
        [ArmyMapEditor.BUTTON_STATE.VISIBLE]: {
            description: "VISIBLE",
            textColor: ArmyMapEditor.COLOR.VISIBLE,
            opacity: 1,
            nextState: ArmyMapEditor.BUTTON_STATE.EDIT
        },
        [ArmyMapEditor.BUTTON_STATE.EDIT]: {
            description: "EDIT",
            textColor: ArmyMapEditor.COLOR.EDIT,
            opacity: 1,
            nextState: ArmyMapEditor.BUTTON_STATE.HIDDEN
        }
    };

    this.layerButtons = {
        L1: { layer: "ground", text: "TEXT_L1", state: ArmyMapEditor.BUTTON_STATE.VISIBLE, type: ArmyMapEditor.BUTTON_TYPE.GRAPHICS },
        L2: { layer: "decoration", text: "TEXT_L2", state: ArmyMapEditor.BUTTON_STATE.VISIBLE, type: ArmyMapEditor.BUTTON_TYPE.GRAPHICS },
        L3: { layer: "cloud", text: "TEXT_L3", state: ArmyMapEditor.BUTTON_STATE.VISIBLE, type: ArmyMapEditor.BUTTON_TYPE.GRAPHICS },
        LC: { layer: "type", text: "TEXT_LC", state: ArmyMapEditor.BUTTON_STATE.VISIBLE, type: ArmyMapEditor.BUTTON_TYPE.TYPE }
    };

    this.camera = new ArmyCamera();
}

ArmyMapEditor.COLOR = {
    HIDDEN: [207, 55, 35, 1],
    VISIBLE: [238, 238, 238, 1],
    EDIT: [252, 252, 63, 1]
};

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

ArmyMapEditor.BUTTON_TYPE = {
    NONE: 0,
    GRAPHICS: 1,
    TYPE: 2
};

ArmyMapEditor.SLOT_BUTTON_SIZE = 50;

ArmyMapEditor.BUTTON_STATE = {
    HIDDEN: 0,
    VISIBLE: 1,
    EDIT: 2
};

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
    const buttonCount = 7;
    const buttonSize = 50;
    const buttons = [];

    for(let i = 0; i < buttonCount; i++) {
        for(let j = 0; j < buttonCount; j++) {
            const buttonID = `BUTTON_${i * buttonCount + j}`;
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
        const cursorTile = gameContext.getMouseTile();
    
        if(!this.brush) {
            return;
        }
    
        if(this.currentLayerButtonID !== null) {
            const { type } = this.layerButtons[this.currentLayerButtonID];
    
            if(type !== ArmyMapEditor.BUTTON_TYPE.GRAPHICS) {
                return;
            }
        }
    
        const { x, y } = this.camera.getViewport();
        const { width, height, halfWidth } = this.camera.getTileDimensions();
        const { name, id } = this.brush;
        const startX = cursorTile.x - this.brushSize;
        const startY = cursorTile.y - this.brushSize;
        const endX = cursorTile.x + this.brushSize;
        const endY = cursorTile.y + this.brushSize;

        context.globalAlpha = this.overlayAlpha;
        context.textAlign = "center";

        for(let i = startY; i <= endY; i++) {
            const renderY = i * height - y;

            for(let j = startX; j <= endX; j++) {   
                const renderX = j * width - x;

                if(id === 0) {
                    this.camera.drawEmptyTile(graphics, context, renderX, renderY);
                } else {
                    this.camera.drawTile(graphics, context, id, renderX, renderY);
                } 

                context.fillStyle = this.overlayColor;
                context.fillText(name, renderX + halfWidth, renderY);  
            }
        }

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
                this.updateButtonText(gameContext);
                break;
            }
            case Cursor.SCROLL.DOWN: {
                this.scrollBrushSize(-1);
                this.updateButtonText(gameContext);
                break;
            }
        }
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
        this.scrollBrushMode(1);
        this.initButtons(gameContext);
        this.updateButtonText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_LEFT", () => {
        this.scrollBrushSet(-1);
        this.initButtons(gameContext);
        this.updateButtonText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_RIGHT", () => {
        this.scrollBrushSet(1);
        this.initButtons(gameContext);
        this.updateButtonText(gameContext);
    });

    editorInterface.addClick("BUTTON_PAGE_LAST", () => {
        this.scrollPage(-1);
        this.initButtons(gameContext);
        this.updateButtonText(gameContext);
    }); 

    editorInterface.addClick("BUTTON_PAGE_NEXT", () => {
        this.scrollPage(1);
        this.initButtons(gameContext);
        this.updateButtonText(gameContext);
    });  

    editorInterface.addClick("BUTTON_SCROLL_SIZE", () => {
        this.scrollBrushSize(1);
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
        if(!this.brush || this.brush.id !== 0) {
            this.brush = this.createBrush(0, "ERASER");
        } else {
            this.brush = null;
        }
    });

    editorInterface.addClick("BUTTON_VIEW_ALL", () => {
        const buttonColor = this.buttonStates[ArmyMapEditor.BUTTON_STATE.VISIBLE].textColor;
        
        for(const buttonID in this.layerButtons) {
            const button = this.layerButtons[buttonID];
            const buttonText = editorInterface.getElement(button.text);

            button.state = ArmyMapEditor.BUTTON_STATE.VISIBLE;
            buttonText.style.color.setColorArray(buttonColor);
        }

        this.currentLayer = null;
        this.currentLayerButtonID = null;
        this.brush = null;
        this.updateLayerOpacity(gameContext);

    });
}

ArmyMapEditor.prototype.initButtons = function(gameContext) {
    const { uiManager, tileManager } = gameContext;
    const { graphics } = tileManager;
    const pageElements = this.routePage();
    const editorInterface = uiManager.getInterface(this.interfaceID);

    for(let i = 0; i < this.slots.length; i++) {
        const buttonID = this.slots[i];
        const button = editorInterface.getElement(buttonID);

        button.collider.events.unsubscribe(UICollider.EVENT.CLICKED, this.id);
        button.clearDefers();
    }

    for(let i = 0; i < this.slots.length; i++) {
        const buttonID = this.slots[i];
        const brushData = pageElements[i];
        const button = editorInterface.getElement(buttonID);
        const { name, id } = brushData;

        if(id !== 0) {
            button.collider.events.on(UICollider.EVENT.CLICKED, () => {
                this.brush = brushData;
            }, { id: this.id });

            button.addDefer((context, localX, localY) => {
                this.camera.drawTile(graphics, context, id, localX, localY, ArmyMapEditor.SLOT_BUTTON_SIZE, ArmyMapEditor.SLOT_BUTTON_SIZE);
                /*
                context.fillStyle = "#eeeeee";
                context.textAlign = "center";
                context.fillText(tileName, localX + 25, localY + 25);
                */
            });
        }
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
    if(this.currentLayerButtonID === null) {
        return;
    }

    const { type } = this.layerButtons[this.currentLayerButtonID];

    switch(type) {
        case ArmyMapEditor.BUTTON_TYPE.GRAPHICS: {
            this.paint(gameContext, this.currentMapID, this.currentLayer);
            break;
        }
        case ArmyMapEditor.BUTTON_TYPE.TYPE: {
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

    for(const buttonID in this.layerButtons) {
        const button = this.layerButtons[buttonID];
        const { state, layer } = button;
        const buttonState = this.buttonStates[state];
        const { opacity } = buttonState;

        worldMap.setLayerOpacity(layer, opacity);

        if(this.currentLayerButtonID === null) {
            continue;
        }

        if(state === ArmyMapEditor.BUTTON_STATE.VISIBLE) {
            worldMap.setLayerOpacity(layer, 0.5);
        }
    }
}

ArmyMapEditor.prototype.scrollLayerButton = function(gameContext, buttonID) {
    const { uiManager } = gameContext;
    const button = this.layerButtons[buttonID];
    const { nextState } = this.buttonStates[button.state];
    const editorInterface = uiManager.getInterface(this.interfaceID);

    if(buttonID === this.currentLayerButtonID) {
        this.currentLayerButtonID = null;
        this.currentLayer = null;
    }

    switch(nextState) {
        case ArmyMapEditor.BUTTON_STATE.EDIT: {
            if(this.currentLayerButtonID !== null) {
                const currentButton = this.layerButtons[this.currentLayerButtonID];
                const currentButtonText = editorInterface.getElement(currentButton.text);
                const currentButtonColor = this.buttonStates[ArmyMapEditor.BUTTON_STATE.VISIBLE].textColor;
            
                currentButton.state = ArmyMapEditor.BUTTON_STATE.VISIBLE;
                currentButtonText.style.color.setColorArray(currentButtonColor);
    
                this.currentLayer = null;
                this.currentLayerButtonID = null;
            }
    
            this.currentLayer = button.layer;
            this.currentLayerButtonID = buttonID;
            break;
        }
    }

    const buttonText = editorInterface.getElement(button.text);
    const buttonColor = this.buttonStates[nextState].textColor;

    buttonText.style.color.setColorArray(buttonColor);
    button.state = nextState;

    this.updateLayerOpacity(gameContext);
}

ArmyMapEditor.prototype.updateButtonText = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getInterface(this.interfaceID);

    editorInterface.setText("TEXT_TILESET_MODE", `MODE: ${MapEditor.MODE_NAME[this.brushMode]}`);
    editorInterface.setText("TEXT_TILESET", `${this.brushSet?.id}`);
    editorInterface.setText("TEXT_PAGE", this.getPageText());
    editorInterface.setText("TEXT_SIZE",  this.getSizeText());
}

ArmyMapEditor.prototype.getPageText = function() {
    const modeElements = this.getModeElements();
    const maxPagesNeeded = Math.ceil(modeElements.length / this.slots.length);
    const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;
    const showCurrentPage = this.pageIndex + 1;

    return `${showCurrentPage} / ${showMaxPagesNeeded}`;
}

ArmyMapEditor.prototype.getSizeText = function() {
    const info = this.brushSizes.getInfo();
    const showTileSize = this.brushSize * 2 + 1;

    return `SIZE: ${showTileSize}x${showTileSize} (${info})`;
}