import { RequestQueue } from "../../source/action/requestQueue.js";

import { GAME_EVENTS } from "../enums.js";

export const startVersusInstance = function(gameContext, payload) {
    const { world, client } = gameContext;
    const { actionQueue } = world;
    const { socket } = client;
    const contextID = gameContext.getID();

    actionQueue.setMode(RequestQueue.MODE.DEFERRED);
    actionQueue.events.subscribe(RequestQueue.EVENT.EXECUTION_DEFER, contextID, (execution, request, type) => {
        if(type.message.send) {
            socket.messageRoom(GAME_EVENTS.ACTION, request);
        }
    });
}