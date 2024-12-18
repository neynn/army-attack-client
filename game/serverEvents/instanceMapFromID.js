import { MapParser } from "../../source/map/mapParser.js";
import { World } from "../../source/world.js";

import { GAME_EVENTS } from "../enums.js";

export const instanceMapFromID = function(gameContext, payload) {
    const { client, world } = gameContext;
    const { socket } = client;
    const { id } = payload;

    world.parseMap(id, MapParser.parseMap2D).then(code => {
        if(code === World.CODE_PARSE_MAP_SUCCESS) {
            socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, {
                "success": true,
                "error": null
            });
        } else {
            socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, {
                "success": false,
                "error": "NO_MAP_FILE"
            });
        }
    });
}