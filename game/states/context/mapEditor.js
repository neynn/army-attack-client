import { State } from "../../../source/state/state.js";
import { Camera } from "../../../source/camera/camera.js";

import { CAMERA_TYPES } from "../../enums.js";

export const MapEditorState = function() {}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.onEnter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { world, uiManager } = gameContext;
    const camera = gameContext.createArmyCamera();

    camera.setMode(Camera.VIEWPORT_MODE_FORCED);
    camera.unbindViewport();

    uiManager.parseUI("MAP_EDITOR", gameContext);
    uiManager.unparseUI("FPS_COUNTER", gameContext);

    world.createController(gameContext, {
        "type": "Editor",
        "id": "MAP_EDITOR"
    });
}

MapEditorState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { world, renderer } = gameContext;
    const { mapManager } = world;

    mapManager.unparseUI("MAP_EDITOR", gameContext);
    renderer.removeCamera(CAMERA_TYPES.ARMY_CAMERA);
}