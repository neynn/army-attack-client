import { RequestQueue } from "../../source/action/requestQueue.js";

import { GAME_EVENTS } from "../enums.js";

export const startVersusInstance = function(gameContext, payload) {
    const { world, client } = gameContext;
    const { actionQueue } = world;
    const { socket } = client;
    const contextID = gameContext.getID();

    actionQueue.events.subscribe(RequestQueue.EVENT_REQUEST_VALID, contextID, (request, messengerID, priority) => {
        if(priority === RequestQueue.PRIORITY_NORMAL) {
            socket.messageRoom(GAME_EVENTS.ENTITY_ACTION, request);
        }
    });
}