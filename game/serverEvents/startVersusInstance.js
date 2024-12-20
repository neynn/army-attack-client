import { RequestQueue } from "../../source/action/requestQueue.js";

import { GAME_EVENTS } from "../enums.js";

export const startVersusInstance = function(gameContext, payload) {
    const { world, client } = gameContext;
    const { actionQueue } = world;
    const { socket } = client;
    const contextID = gameContext.getID();

    actionQueue.setMode(RequestQueue.MODE_DEFERRED);
    actionQueue.events.subscribe(RequestQueue.EVENT_EXECUTION_DEFER, contextID, (execution, original) => {
        const { priority } = execution;

        if(priority === RequestQueue.PRIORITY_NORMAL) {
            socket.messageRoom(GAME_EVENTS.ACTION, original);
        }
    });
}