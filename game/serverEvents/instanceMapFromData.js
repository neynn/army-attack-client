import { GAME_EVENTS } from "../enums.js";

export const instanceMapFromData = function(gameContext, payload) {
    const { client, world } = gameContext;
    const { socket } = client;
    const { id } = payload;

    world.loadMapByData(id, payload);

    socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, {
        "success": true,
        "error": null
    });
}