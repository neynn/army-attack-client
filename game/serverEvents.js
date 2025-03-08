import { CLIENT_EVENTS, GAME_EVENT } from "./enums.js";
import { SpawnSystem } from "./systems/spawn.js";

export const ServerEvents = {};

ServerEvents.instanceController = function(gameContext, payload) {
    const { world } = gameContext;
    const { controllerID, controllerSetup } = payload;

    world.createController(gameContext, controllerSetup, controllerID);
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
    const { actionQueue, eventBus } = world;
    const { executionItem } = payload;
    const { messengerID } = executionItem;

    actionQueue.enqueue(executionItem);
    eventBus.force(GAME_EVENT.CHOICE_MADE, messengerID);
}

ServerEvents.roomUpdate = function(gameContext, payload) {
    console.log(payload);
}

ServerEvents.startVersusInstance = async function(gameContext, payload) {
    const { entitySetup, mapSetup, controllerSetup, playerID } = payload;

    /**
     * entitySetup = { entityBatch },
     * mapSetup = { mapID },
     * controllerSetup = [ ...{ controllerID, controllerSetup }],
     * playerID <- The controllerID of the PLAYER.
     */
    for(let i = 0; i < controllerSetup.length; i++) {
        const controllerPayload = controllerSetup[i];

        ServerEvents.instanceController(gameContext, controllerPayload);
    }

    await ServerEvents.instanceMapFromID(gameContext, mapSetup);

    ServerEvents.instanceEntityBatch(gameContext, entitySetup);

    gameContext.playerID = playerID;
}

ServerEvents.gameEvent = function(gameContext, payload) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { type, data } = payload;

    eventBus.force(type, data);
}