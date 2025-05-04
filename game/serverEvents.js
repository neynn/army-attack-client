import { CLIENT_EVENT } from "./enums.js";
import { SpawnSystem } from "./systems/spawn.js";

export const ServerEvents = {};

ServerEvents.instanceGame = async function(gameContext, payload) {
    const { world, client } = gameContext;
    const { turnManager, mapManager } = world;
    const { socket } = client;
    const { actors, entities, mapID, mapData, playerID } = payload;

    /* Actor Instancing */
    for(let i = 0; i < actors.length; i++) {
        const { actorID, actorSetup } = actors[i];

        turnManager.createActor(gameContext, actorSetup, actorID);
    }

    /* Map-Instancing */
    if(!mapData) {
        const worldMap = await mapManager.createMapByID(gameContext, mapID);

        if(!worldMap) {
            socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, { "success": false, "error": "NO_MAP_FILE" });
        } else {
            socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, { "success": true, "error": null }); 
        }
    } else {
        mapManager.createMap(gameContext, mapID, mapData);

        socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, { "success": true, "error": null });
    }

    for(let i = 0; i < entities.length; i++) {
        const setup = entities[i];

        SpawnSystem.createEntity(gameContext, setup);
    }

    gameContext.playerID = playerID;
}

ServerEvents.instanceActor = function(gameContext, payload) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID, actorSetup } = payload;

    turnManager.createActor(gameContext, actorSetup, actorID);
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
    const { mapManager } = world;
    const { socket } = client;
    const { mapID, mapData } = payload;

    mapManager.createMap(gameContext, mapID, mapData);

    socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, {
        "success": true,
        "error": null
    });
}

ServerEvents.instanceMapFromID = async function(gameContext, payload) {
    const { client, world } = gameContext;
    const { mapManager } = world;
    const { socket } = client;
    const { mapID } = payload;
    const worldMap = await mapManager.createMapByID(gameContext, mapID);

    if(!worldMap) {
        socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, {
            "success": false,
            "error": "NO_MAP_FILE"
        });
    } else {
        socket.messageRoom(CLIENT_EVENT.INSTANCE_MAP, {
            "success": true,
            "error": null
        }); 
    }
}

ServerEvents.roomUpdate = function(gameContext, payload) {
    console.log(payload);
}

ServerEvents.gameEvent = function(gameContext, payload) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { type, data } = payload;

    /*
        TODO: FOR SERVER!
        When the server sends an action, it sends it as CLIENT_EVENT.EVENT { VERSUS_CHOICE_MADE { "choice": executionItem, "actorID": messengerID } }
        const { executionItem } = payload;
        const { messengerID } = executionItem;

        eventBus.emit(GameEvent.TYPE.VERSUS_CHOICE_MADE, { "choice": executionItem, "actorID": messengerID });

        So force the eventBus to call VERSUS_CHOICE_MADE with the parameters.
    */

    eventBus.emit(type, data);
}