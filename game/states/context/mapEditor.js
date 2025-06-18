import { saveMap } from "../../../helpers.js";
import { State } from "../../../source/state/state.js";
import { ArmyContext } from "../../armyContext.js";
import { ArmyEditorCamera } from "../../armyEditorCamera.js";
import { MapEditorController } from "../../../source/map/editor/mapEditorController.js";
import { ArmyMap } from "../../init/armyMap.js";
import { MapSystem } from "../../systems/map.js";

export const MapEditorState = function() {
    this.controller = null;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const { uiManager, tileManager, client } = gameContext;
    const { router } = client;

    this.controller = new MapEditorController();
    this.controller.init(gameContext.editorConfig);
    this.controller.initCamera(gameContext, new ArmyEditorCamera(this.controller));
    this.controller.onPaint = function(gameContext, worldMap, tileID, tileX, tileY) {
        const { tileManager } = gameContext;
        const tileMeta = tileManager.getMeta(tileID);

        if(tileMeta) {
            const { defaultType } = tileMeta;

            if(defaultType !== undefined) {
                worldMap.placeTile(defaultType, ArmyMap.LAYER.TYPE, tileX, tileY);
            }
        }
    }

    uiManager.createUIByID(this.controller.interfaceID, gameContext);
    router.load(gameContext, gameContext.keybinds.editor);
    router.on("TOGGLE_AUTOTILER", () => this.controller.toggleAutotiler(gameContext));
    router.on("TOGGLE_ERASER", () => this.controller.toggleEraser(gameContext));
    
    this.controller.initUI(gameContext);
    this.controller.initSlots(gameContext);
    this.controller.loadBrushSets(tileManager.getInversion());
    this.controller.initCursorEvents(gameContext);
    this.controller.initButtons(gameContext);
    this.controller.updateMenuText(gameContext);
    this.initUIEvents(gameContext);

    gameContext.setGameMode(ArmyContext.GAME_MODE.EDIT);
}

MapEditorState.prototype.onExit = function(gameContext, stateMachine) {
    this.controller.destroy(gameContext);
    this.controller = null;
}

MapEditorState.prototype.initUIEvents = function(gameContext) {
    const { uiManager, world, states } = gameContext;
    const { mapManager } = world;
    const editorInterface = uiManager.getInterface(this.controller.interfaceID);

    editorInterface.addClick("BUTTON_BACK", () => {
        states.setNextState(gameContext, ArmyContext.STATE.MAIN_MENU);
    });

    editorInterface.addClick("BUTTON_AUTO", () => {
        this.controller.toggleAutotiler(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_MODE", () => {
        this.controller.scrollMode(1);
        this.controller.initButtons(gameContext);
        this.controller.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_LEFT", () => {
        this.controller.scrollBrushSet(-1);
        this.controller.initButtons(gameContext);
        this.controller.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_RIGHT", () => {
        this.controller.scrollBrushSet(1);
        this.controller.initButtons(gameContext);
        this.controller.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_PAGE_LAST", () => {
        this.controller.scrollPage(-1);
        this.controller.initButtons(gameContext);
        this.controller.updateMenuText(gameContext);
    }); 

    editorInterface.addClick("BUTTON_PAGE_NEXT", () => {
        this.controller.scrollPage(1);
        this.controller.initButtons(gameContext);
        this.controller.updateMenuText(gameContext);
    });  

    editorInterface.addClick("BUTTON_SCROLL_SIZE", () => {
        this.controller.scrollBrushSize(1);
        this.controller.updateMenuText(gameContext);
    }); 

    editorInterface.addClick("BUTTON_L1", () => {
        this.controller.scrollLayerButton(gameContext, "L1", this.controller.interfaceID);
    });

    editorInterface.addClick("BUTTON_L2", () => {
        this.controller.scrollLayerButton(gameContext, "L2", this.controller.interfaceID);
    });

    editorInterface.addClick("BUTTON_L3", () => {
        this.controller.scrollLayerButton(gameContext, "L3", this.controller.interfaceID);
    });

    editorInterface.addClick("BUTTON_LC", () => {
        this.controller.scrollLayerButton(gameContext, "LC", this.controller.interfaceID);
    });

    editorInterface.addClick("BUTTON_SAVE", () => {
        const mapData = mapManager.getLoadedMap(this.controller.mapID);
        
        saveMap(this.controller.mapID, mapData);
    });

    editorInterface.addClick("BUTTON_CREATE", () => {
        const createNew = confirm("This will create and load a brand new map! Proceed?");

        if(createNew) {
            const mapID = `${Date.now()}`;

            MapSystem.createEmptyMap(gameContext, mapID, this.controller.defaultMap);

            this.controller.setMapID(mapID);
        }
    });

    editorInterface.addClick("BUTTON_LOAD", async () => {
        const mapID = prompt("MAP-ID?");
        const worldMap = await MapSystem.createMapByID(gameContext, mapID);

        if(worldMap) {
            this.controller.mapID = mapID;
        }
    });

    editorInterface.addClick("BUTTON_RESIZE", () => {
        this.controller.resizeCurrentMap(gameContext);
    }); 

    editorInterface.addClick("BUTTON_UNDO", () => {
        this.controller.undo(gameContext);
    }); 

    editorInterface.addClick("BUTTON_ERASER", () => {
        this.controller.toggleEraser(gameContext);
    });

    editorInterface.addClick("BUTTON_VIEW_ALL", () => {
        this.controller.buttonHandler.resetButtons(editorInterface);
        this.controller.updateLayerOpacity(gameContext);
        this.controller.disableEraserButton(gameContext);
        this.controller.brush.reset();
    });
}
