import { CLIENT_EVENTS } from "./enums.js";
import { SpawnSystem } from "./systems/spawn.js";

export const ServerEvents = {};

ServerEvents.instanceController = function(gameContext, payload) {
    const { world } = gameContext;
    const { controllerID, controllerSetup } = payload;

    world.createController(gameContext, controllerID, controllerSetup);
}

ServerEvents.instanceEntityBatch = function(gameContext, payload) {
    const { entityBatch } = payload;
    
    for(let i = 0; i < entityBatch.length; i++) {
        const setup = entityBatch[i];

        SpawnSystem.createEntity(gameContext, setup);
    }
}

ServerEvents.instanceMapFromData = function(gameContext, payload) {
    const { client, world } = gameContext;
    const { socket } = client;
    const { mapID, mapData } = payload;

    world.createMap(gameContext, mapID, mapData);

    socket.messageRoom(CLIENT_EVENTS.INSTANCE_MAP, {
        "success": true,
        "error": null
    });
}

ServerEvents.instanceMapFromID = async function(gameContext, payload) {
    const { client, world } = gameContext;
    const { socket } = client;
    const { mapID } = payload;
    const worldMap = await world.createMapByID(gameContext, mapID);

    if(!worldMap) {
        socket.messageRoom(CLIENT_EVENTS.INSTANCE_MAP, {
            "success": false,
            "error": "NO_MAP_FILE"
        });
    } else {
        socket.messageRoom(CLIENT_EVENTS.INSTANCE_MAP, {
            "success": true,
            "error": null
        }); 
    }
}

ServerEvents.queueAction = function(gameContext, payload) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const { executionItem } = payload;

    actionQueue.enqueue(executionItem);
}

ServerEvents.roomUpdate = function(gameContext, payload) {
    console.log(payload);
}

ServerEvents.startVersusInstance = async function(gameContext, payload) {
    ServerEvents.instanceController(gameContext, payload);

    await ServerEvents.instanceMapFromID(gameContext, payload);

    ServerEvents.instanceEntityBatch(gameContext, payload);
}

ServerEvents.gameEvent = function(gameContext, payload) {
    console.log(payload);
}