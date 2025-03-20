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
    this.mapEditor.init({
        "maxWidth": 1000,
        "maxHeight": 1000,
        "overlayColor": "#eeeeee",
        "overlayAlpha": 0.75,
        "brushSizes": [0, 1, 2, 3, 4],
        "hiddenSets": ["overlay", "border", "range"]
    });

    this.mapEditor.initCamera(gameContext);

    uiManager.parseUI(this.mapEditor.interfaceID, gameContext);

    router.load(gameContext, {
        "TOGGLE_AUTOTILER": "+a"
    });

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