import { State } from "../../../source/state/state.js";
import { Camera } from "../../../source/camera/camera.js";

import { CAMERA_TYPES, CONTROLLER_TYPES } from "../../enums.js";
import { ArmyCamera } from "../../armyCamera.js";

export const MapEditorState = function() {
    State.call(this);
}

MapEditorState.prototype = Object.create(State.prototype);
MapEditorState.prototype.constructor = MapEditorState;

MapEditorState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { world, uiManager, renderer } = gameContext;
    const camera = new ArmyCamera();
    const settings = world.getConfig("settings");

    camera.setMode(Camera.VIEWPORT_MODE_FORCED);
    camera.loadTileDimensions(settings.tileWidth, settings.tileHeight);
    camera.unbindViewport();
    renderer.addCamera(CAMERA_TYPES.ARMY_CAMERA, camera);
    uiManager.parseUI("MAP_EDITOR", gameContext);
    uiManager.unparseUI("FPS_COUNTER", gameContext);
    world.createController(gameContext, {
        "type": CONTROLLER_TYPES.EDITOR,
        "id": "MAP_EDITOR"
    });
}

MapEditorState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { world, renderer } = gameContext;
    const { mapManager } = world;

    mapManager.unparseUI("MAP_EDITOR", gameContext);
    renderer.removeCamera(CAMERA_TYPES.ARMY_CAMERA);
}