import { State } from "../../../source/state/state.js";
import { ArmyMapEditor } from "./armyMapEditor.js";

export const MapEditorState = function() {
    this.mapEditor = null;
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, tileManager, client } = gameContext;
    const { router } = client;
    const { meta } = tileManager;

    this.mapEditor = new ArmyMapEditor();
    this.mapEditor.init(gameContext.editorConfig);
    this.mapEditor.initCamera(gameContext);

    uiManager.parseUI(this.mapEditor.interfaceID, gameContext);
    router.load(gameContext, gameContext.editorConfig.binds);
    router.on("TOGGLE_AUTOTILER", () => this.mapEditor.toggleAutotiling());
    
    this.mapEditor.initSlots(gameContext);
    this.mapEditor.loadBrushSets(meta.getInversion());
    this.mapEditor.initRenderEvents(gameContext);
    this.mapEditor.initCursorEvents(gameContext);
    this.mapEditor.initUIEvents(gameContext);
    this.mapEditor.initButtons(gameContext);
    this.mapEditor.updateButtonText(gameContext);
}

MapEditorState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { renderer, uiManager } = gameContext;

    uiManager.unparseUI(this.mapEditor.interfaceID);
    renderer.destroyContext(this.mapEditor.id);
    this.mapEditor = null;
}