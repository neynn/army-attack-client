import { GAME_EVENTS } from "../enums.js";

export const instanceMapFromID = async function(gameContext, payload) {
    const { client, world } = gameContext;
    const { socket } = client;
    const { id } = payload;
    const worldMap = await world.loadMapByID(id);

    if(!worldMap) {
        socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, {
            "success": false,
            "error": "NO_MAP_FILE"
        });
    } else {
        socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, {
            "success": true,
            "error": null
        }); 
    }
}