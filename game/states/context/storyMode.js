import { RequestQueue } from "../../../source/action/requestQueue.js";
import { StateMachine } from "../../../source/state/stateMachine.js";

import { CAMERA_TYPES, CONTEXT_STATES } from "../../enums.js";
import { ArmyCamera } from "../../armyCamera.js";
import { StoryModeIntroState } from "./story/storyModeIntro.js";
import { StoryModePlayState } from "./story/storyModePlay.js";

export const StoryModeState = function() {
    StateMachine.call(this, null);
    
    this.addState(CONTEXT_STATES.STORY_MODE_INTRO, new StoryModeIntroState());
    this.addState(CONTEXT_STATES.STORY_MODE_PLAY, new StoryModePlayState());
}

StoryModeState.prototype = Object.create(StateMachine.prototype);
StoryModeState.prototype.constructor = StoryModeState;

StoryModeState.prototype.onEnter = function(stateMachine) {
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

    this.setNextState(CONTEXT_STATES.STORY_MODE_PLAY);
}

StoryModeState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { renderer } = gameContext;

    renderer.removeCamera(CAMERA_TYPES.ARMY_CAMERA);
}