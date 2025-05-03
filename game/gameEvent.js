import { Inventory } from "./actors/player/inventory.js";
import { CLIENT_EVENT } from "./enums.js";
import { AnimationSystem } from "./systems/animation.js";
import { DropSystem } from "./systems/drop.js";
import { SpawnSystem } from "./systems/spawn.js";

export const GameEvent = function() {
    this.id = 0;
}

GameEvent.TYPE = {
    STORY_AI_CHOICE_MADE: 111,
    PLAYER_CHOICE_MADE: 113,

    ENTITY_DEATH: 200,
    ENTITY_DECAY: 201,
    ENTITY_HIT: 202,
    ENTITY_DOWN: 203,
    ENTITY_KILL: 204,

    TILE_CAPTURED: 300,

    DROP: 400,
    HIT_DROP: 401,
    KILL_DROP: 402,

    VERSUS_REQUEST_SKIP_TURN: 1000,
    VERSUS_SKIP_TURN: 1001,
    VERSUS_CHOICE_MADE: 112,
};

GameEvent.KILL_REASON = {
    DECAY: "DECAY",
    ATTACK: "ATTACK"
};

const getMaxDrop = function(gameContext, type, id) {
    switch(type) {
        case Inventory.TYPE.ITEM: {
            const item = gameContext.itemTypes[id];

            if(!item || !item.maxDrop) {
                return 0;
            }

            return item.maxDrop;
        }
        case Inventory.TYPE.RESOURCE: {
            const resource = gameContext.resourceTypes[id];

            if(!resource || !resource.maxDrop) {
                return 0;
            }

            return resource.maxDrop;
        }
        default: {
            return 0;
        }
    }
}

GameEvent.onDrop = function(gameContext, event) {
    console.log("DROP", event);
}

GameEvent.onDropRequest = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager, eventBus } = world;
    const { drops, receiverID } = event;
    const receiver = turnManager.getActor(receiverID);

    if(!receiver || !receiver.inventory) {
        return;
    }

    const inventory = receiver.inventory;

    for(let i = 0; i < drops.length; i++) {
        const item = drops[i];
        const { type, id, value } = item;
        const maxDrop = getMaxDrop(gameContext, type, id);

        if(maxDrop === 0) {
            inventory.add(type, id, value);
            continue;
        }

        let toDrop = value;

        while(toDrop >= maxDrop) {
            toDrop -= maxDrop;

            inventory.add(type, id, maxDrop);
        }

        if(toDrop !== 0) {
            inventory.add(type, id, toDrop);
        }
    }

    let energyDrops = 0;
    let energyCounter = inventory.resources.get("EnergyCounter");

    while(energyCounter >= 100) {
        energyCounter -= 100;
        energyDrops++;
    }

    if(energyDrops > 0) {
        inventory.resources.set("EnergyCounter", energyCounter);
        inventory.add(Inventory.TYPE.RESOURCE, "Energy", energyDrops);
    }

    eventBus.emit(GameEvent.TYPE.DROP, { receiverID, drops });
}

GameEvent.onStoryChoice = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager, actionQueue } = world;
    const { actorID, request, choice } = event;
    const isActor = turnManager.isActor(actorID);

    console.log("STORY_CHOICE", event);

    if(choice && request) {
        actionQueue.enqueueExecutionItem(choice, request);
    }

    if(isActor) {
        turnManager.reduceActorActions(1);
    }
}

GameEvent.onEntityDeath = function(gameContext, event) {
    const { entity, reason } = event;

    console.log("ENTITY_DEATH", event);

    AnimationSystem.playDeath(gameContext, entity);
    SpawnSystem.destroyEntity(gameContext, entity);
}

GameEvent.onEntityDecay = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { entity } = event;

    console.log("DECAY", event);

    eventBus.emit(GameEvent.TYPE.ENTITY_DEATH, { entity, "reason": GameEvent.KILL_REASON.DECAY });
}

GameEvent.onEntityHit = function(gameContext, event) {
    const { target } = event;

    console.log("HIT", event);

    DropSystem.dropHitReward(gameContext, target, "Player");
}

GameEvent.onEntityKill = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { target } = event;

    console.log("KILLED", event);

    eventBus.emit(GameEvent.TYPE.ENTITY_DEATH, { "entity": target, "reason": GameEvent.KILL_REASON.ATTACK });
    DropSystem.dropKillReward(gameContext, target, "Player");
}

GameEvent.onEntityDown = function(gameContext, event) {
    console.log("DOWN", event);
}

GameEvent.onTileCaptured = function(gameContext, event) {
    console.log("CAPTURED", event);
}

GameEvent.onVersusChoice = function(gameContext, event) {
    const { world } = gameContext;
    const { actionQueue, turnManager } = world;
    const { choice, actorID } = event;
    const isActor = turnManager.isActor(actorID);

    console.log("SERVER_CHOICE", event);

    if(isActor) {
        turnManager.reduceActorActions(1);
    }

    actionQueue.enqueue(choice);
}

GameEvent.onRequestVersusChoice = function(gameContext, event) {
    const { client } = gameContext;
    const { socket } = client;
    const { actorID, request, choice } = event;

    console.log("REQUEST_SERVER_CHOICE", event);

    socket.messageRoom(CLIENT_EVENT.EVENT, request);
}

GameEvent.onVersusRequestSkipTurn = function(gameContext, event) {
    //Send request to skip turn to server.
    //Only works if user is the active actor.

    console.log("VERUS_REQUEST_SKIP_TURN", event);
}

GameEvent.onVersusSkipTurn = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID } = event;
    const isActor = turnManager.isActor(actorID);

    console.log("VERUS_SKIP_TURN", event);

    if(isActor) {
        turnManager.cancelActorActions();
    }
}