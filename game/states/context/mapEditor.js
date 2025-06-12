import { State } from "../../../source/state/state.js";
import { ArmyContext } from "../../armyContext.js";
import { ArmyMapEditor } from "../../armyMapEditor.js";

export const MapEditorState = function() {
    this.mapEditor = null;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(gameContext, stateMachine) {
    const { uiManager, tileManager, client } = gameContext;
    const { router } = client;

    this.mapEditor = new ArmyMapEditor();
    this.mapEditor.init(gameContext.editorConfig);
    this.mapEditor.initCamera(gameContext);

    gameContext.setGameMode(ArmyContext.GAME_MODE.EDIT);

    uiManager.createUIByID(this.mapEditor.interfaceID, gameContext);
    router.load(gameContext, gameContext.keybinds.editor);
    router.on("TOGGLE_AUTOTILER", () => this.mapEditor.toggleAutotiler(gameContext));
    router.on("TOGGLE_ERASER", () => this.mapEditor.toggleEraser(gameContext));
    
    this.mapEditor.initUI(gameContext);
    this.mapEditor.initSlots(gameContext);
    this.mapEditor.loadBrushSets(tileManager.getInversion());
    this.mapEditor.initCursorEvents(gameContext);
    this.mapEditor.initUIEvents(gameContext);
    this.mapEditor.initButtons(gameContext);
    this.mapEditor.updateMenuText(gameContext);
}

MapEditorState.prototype.onExit = function(gameContext, stateMachine) {
    const { renderer, uiManager } = gameContext;

    uiManager.destroyUI(this.mapEditor.interfaceID);
    renderer.destroyContext(this.mapEditor.id);
    this.mapEditor = null;
}