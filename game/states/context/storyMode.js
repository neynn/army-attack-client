import { RequestQueue } from "../../../source/action/requestQueue.js";
import { StateMachine } from "../../../source/state/stateMachine.js";

import { CONTEXT_STATES } from "../../enums.js";
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
    const { world } = gameContext;
    const { actionQueue } = world;

    gameContext.createArmyCamera();
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

    gameContext.destroyArmyCamera();
}