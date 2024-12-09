import { RequestQueue } from "../../../source/action/requestQueue.js";
import { State } from "../../../source/state/state.js";

import { CAMERA_TYPES, CONTEXT_STATES } from "../../enums.js";
import { ArmyCamera } from "../../armyCamera.js";

export const StoryModeState = function() {
    State.call(this);
}

StoryModeState.prototype = Object.create(State.prototype);
StoryModeState.prototype.constructor = StoryModeState;

StoryModeState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const contextID = gameContext.getID();
    const { world, renderer } = gameContext;
    const { actionQueue } = world;
    const camera = new ArmyCamera();
    const settings = world.getConfig("settings");

    camera.loadTileDimensions(settings.tileWidth, settings.tileHeight); 
    renderer.addCamera(CAMERA_TYPES.ARMY_CAMERA, camera);
    actionQueue.events.subscribe(RequestQueue.EVENT_REQUEST_VALID, contextID, (request, messengerID, priority) => {
        if(priority === RequestQueue.PRIORITY_NORMAL) {
            actionQueue.enqueue(request);
        } else if(priority === RequestQueue.PRIORITY_SUPER) {
            actionQueue.enqueuePriority(request);
        }
    });

    this.states.setNextState(CONTEXT_STATES.STORY_MODE_PLAY);
}

StoryModeState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { renderer } = gameContext;

    renderer.removeCamera(CAMERA_TYPES.ARMY_CAMERA);
}