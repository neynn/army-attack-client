import { State } from "../../source/state/state.js";
import { CONTROLLER_TYPES } from "../../enums.js";

export const MapEditorState = function() {
    State.call(this);
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, renderer } = gameContext;
    const camera = renderer.getCamera("ARMY_CAMERA");

    uiManager.parseUI("MAP_EDITOR", gameContext);
    uiManager.unparseUI("FPS_COUNTER", gameContext);
    camera.unbindViewport();
    gameContext.createController({
        "type": CONTROLLER_TYPES.EDITOR
    }, "MAP_EDITOR");
}

MapEditorState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { mapLoader, controllerManager } = gameContext;
    const controller = controllerManager.getController("MAP_EDITOR");

    controller.removeEvents(gameContext);
    mapLoader.unparseUI("MAP_EDITOR", gameContext);
}