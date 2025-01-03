import { GAME_EVENTS } from "../enums.js";
import { MapSystem } from "../systems/map.js";

export const instanceMapFromData = function(gameContext, payload) {
    const { client } = gameContext;
    const { socket } = client;
    const { id } = payload;

    MapSystem.loadMapByData(gameContext, id, payload);
    
    socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, {
        "success": true,
        "error": null
    });
}