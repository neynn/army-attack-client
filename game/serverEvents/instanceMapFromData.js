import { MapParser } from "../../source/map/mapParser.js";
import { GAME_EVENTS } from "../enums.js";

export const instanceMapFromData = function(gameContext, payload) {
    const { client, world } = gameContext;
    const { socket } = client;
    const { id, layers, meta } = payload;
    const worldMap = MapParser.parseMap2D(id, layers, meta);

    world.loadMap(id, worldMap);
    socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, {
        "success": true,
        "error": null
    });
}