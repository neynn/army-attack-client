import { ActionQueue } from "../../../source/action/actionQueue.js";
import { State } from "../../../source/state/state.js";

import { CONTEXT_STATES } from "../../enums.js";

export const StoryModeState = function() {
    State.call(this);
}

StoryModeState.prototype = Object.create(State.prototype);
StoryModeState.prototype.constructor = StoryModeState;

StoryModeState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const contextID = gameContext.getID();
    const { actionQueue } = gameContext;

    actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_VALID, contextID, (request, messengerID, priority) => {
        if(priority === ActionQueue.PRIORITY_NORMAL) {
            actionQueue.queueAction(request);
        } else if(priority === ActionQueue.PRIORITY_SUPER) {
            actionQueue.queuePriorityAction(request);
        }
    });

    this.states.setNextState(CONTEXT_STATES.STORY_MODE_PLAY);
}