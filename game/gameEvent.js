import { CLIENT_EVENT } from "./enums.js";
import { AnimationSystem } from "./systems/animation.js";
import { ConquerSystem } from "./systems/conquer.js";
import { DebrisSystem } from "./systems/debris.js";
import { DropSystem } from "./systems/drop.js";
import { SpawnSystem } from "./systems/spawn.js";

export const GameEvent = function() {
    this.mode = GameEvent.MODE.NONE;
}

GameEvent.MODE = {
    NONE: 0,
    STORY: 1,
    VERSUS: 2,
    COOP: 3
};

GameEvent.TYPE = {
    ACTION_REQUEST: 100,
    ACTION_AUTHORIZE: 101,
    ACTION_DENY: 102,

    ENTITY_DEATH: 200,
    ENTITY_DECAY: 201,
    ENTITY_HIT: 202,
    ENTITY_DOWN: 203,
    ENTITY_KILL: 204,

    TILE_CAPTURE: 300,
    DEBRIS_REMOVED: 301,
    DEBRIS_SPAWN: 302,

    DROP: 400,
    HIT_DROP: 401,
    KILL_DROP: 402,
    DEBRIS_DROP: 403,


    VERSUS_REQUEST_SKIP_TURN: 1000,
    VERSUS_SKIP_TURN: 1001
};

GameEvent.NAME = {
    [GameEvent.TYPE.ACTION_REQUEST]: "ACTION_REQUEST",
    [GameEvent.TYPE.ACTION_AUTHORIZE]: "ACTION_AUTHORIZE",
    [GameEvent.TYPE.ACTION_DENY]: "ACTION_DENY",

    [GameEvent.TYPE.ENTITY_DEATH]: "ENTITY_DEATH",
    [GameEvent.TYPE.ENTITY_DECAY]: "ENTITY_DECAY",
    [GameEvent.TYPE.ENTITY_HIT]: "ENTITY_HIT",
    [GameEvent.TYPE.ENTITY_DOWN]: "ENTITY_DOWN",
    [GameEvent.TYPE.ENTITY_KILL]: "ENTITY_KILL",

    [GameEvent.TYPE.TILE_CAPTURE]: "TILE_CAPTURE",
    [GameEvent.TYPE.DEBRIS_REMOVED]: "DEBRIS_REMOVED",

    [GameEvent.TYPE.DROP]: "DROP",
    [GameEvent.TYPE.HIT_DROP]: "HIT_DROP",
    [GameEvent.TYPE.KILL_DROP]: "KILL_DROP",
    [GameEvent.TYPE.DEBRIS_DROP]: "DEBRIS_DROP",

    [GameEvent.TYPE.VERSUS_REQUEST_SKIP_TURN]: "VERSUS_REQUEST_SKIP_TURN",
    [GameEvent.TYPE.VERSUS_SKIP_TURN]: "VERSUS_SKIP_TURN"
}

GameEvent.KILL_REASON = {
    DECAY: "DECAY",
    ATTACK: "ATTACK",
    FIRE_MISSION: "FIRE_MISSION"
};

GameEvent.prototype.init = function(gameContext) {
    const { world } = gameContext;
    const { eventBus } = world;

    eventBus.on(GameEvent.TYPE.ACTION_REQUEST, (event) => this.onActionRequested(gameContext, event));
    eventBus.on(GameEvent.TYPE.ACTION_AUTHORIZE, (event) => this.onActionAuthorized(gameContext, event));
    eventBus.on(GameEvent.TYPE.ACTION_DENY, (event) => this.onActionDenied(gameContext, event));
    eventBus.on(GameEvent.TYPE.ENTITY_DEATH, (event) => this.onEntityDeath(gameContext, event));
    eventBus.on(GameEvent.TYPE.ENTITY_DECAY, (event) => this.onEntityDecay(gameContext, event));
    eventBus.on(GameEvent.TYPE.ENTITY_HIT, (event) => this.onEntityHit(gameContext, event));
    eventBus.on(GameEvent.TYPE.ENTITY_DOWN, (event) => this.onEntityDown(gameContext, event));
    eventBus.on(GameEvent.TYPE.ENTITY_KILL, (event) => this.onEntityKill(gameContext, event));
    eventBus.on(GameEvent.TYPE.TILE_CAPTURE, (event) => this.onTileCapture(gameContext, event));
    eventBus.on(GameEvent.TYPE.DEBRIS_REMOVED, (event) => this.onDebrisRemoved(gameContext, event));
    eventBus.on(GameEvent.TYPE.HIT_DROP, (event) => this.onHitDrop(gameContext, event));
    eventBus.on(GameEvent.TYPE.KILL_DROP, (event) => this.onKillDrop(gameContext, event));
    eventBus.on(GameEvent.TYPE.DEBRIS_DROP, (event) => this.onDebrisDrop(gameContext, event));
    eventBus.on(GameEvent.TYPE.DEBRIS_SPAWN, (event) => this.onDebrisSpawn(gameContext, event));
    eventBus.on(GameEvent.TYPE.DROP, (event) => this.onDrop(gameContext, event));
}

GameEvent.prototype.onAttackCounter = function(gameContext, event) {

}

GameEvent.prototype.onMoveCounter = function(gameContext, event) {

}

GameEvent.prototype.onDrop = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { drops, receiverID } = event;
    const receiver = turnManager.getActor(receiverID);

    if(!receiver || !receiver.inventory) {
        return;
    }
    
    console.log("DROP", event);

    DropSystem.dropItems(gameContext, drops, receiver.inventory);
}

GameEvent.prototype.onDebrisDrop = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { debrisID, receiverID } = event;
    const drops = DropSystem.getDebrisReward(gameContext, debrisID);

    console.log("DEBRIS_DROP", event);

    if(!drops) {
        return;
    }

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            eventBus.emit(GameEvent.TYPE.DROP, { "drops": drops, "receiverID": receiverID });
            break;
        }
    }
}

GameEvent.prototype.onDebrisRemoved = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { cleanerID } = event;

    console.log("DEBRIS_REMOVE", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            eventBus.emit(GameEvent.TYPE.DEBRIS_DROP, { "receiverID": cleanerID, "debrisID": "Debris" });
            break;
        }
    }
}

GameEvent.prototype.onDebrisSpawn = function(gameContext, event) {
    const { debris } = event;

    console.log("DEBRIS_SPAWN", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            DebrisSystem.spawnDebris(gameContext, debris);
            break;
        }
    }
}

GameEvent.prototype.onKillDrop = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { entity, receiverID } = event;
    const killRewards = DropSystem.getKillReward(entity);

    console.log("KILL_DROP", event);

    if(!killRewards) {
        return;
    }

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            eventBus.emit(GameEvent.TYPE.DROP, { "drops": killRewards, "receiverID": receiverID });
            break;
        }
    }
}

GameEvent.prototype.onHitDrop = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { entity, receiverID } = event;
    const hitRewards = DropSystem.getHitReward(entity);

    console.log("HIT_DROP", event);

    if(!hitRewards) {
        return;
    }

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            eventBus.emit(GameEvent.TYPE.DROP, { "drops": hitRewards, "receiverID": receiverID });
            break;
        }
    }
}

GameEvent.prototype.onEntityDeath = function(gameContext, event) {
    const { entity, reason } = event;

    console.log("ENTITY_DEATH", event);

    AnimationSystem.playDeath(gameContext, entity);
    SpawnSystem.destroyEntity(gameContext, entity);
}

GameEvent.prototype.onEntityDecay = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { entity } = event;

    console.log("ENTITY_DECAY", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            eventBus.emit(GameEvent.TYPE.ENTITY_DEATH, { entity, "reason": GameEvent.KILL_REASON.DECAY });
            break;
        }
    }
}

GameEvent.prototype.onEntityHit = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { target } = event;

    console.log("ENTITY_HIT", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            eventBus.emit(GameEvent.TYPE.HIT_DROP, { "entity": target, "receiverID": "Player"});
            break;
        }
    }
}

GameEvent.prototype.onEntityKill = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { target, reason } = event;

    console.log("ENTITY_KILL", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            eventBus.emit(GameEvent.TYPE.KILL_DROP, { "entity": target, "receiverID": "Player"});
            eventBus.emit(GameEvent.TYPE.ENTITY_DEATH, { "entity": target, "reason": reason });
            break;
        }
    }
}

GameEvent.prototype.onEntityDown = function(gameContext, event) {
    console.log("ENTITY_DOWN", event);
}

GameEvent.prototype.onTileCapture = function(gameContext, event) {
    const { teamID, tiles } = event;

    console.log("TILE_CAPTURED", event);

    ConquerSystem.conquer(gameContext, teamID, tiles);
}

GameEvent.prototype.onActionAuthorized = function(gameContext, event) {
    const { world } = gameContext;
    const { actionQueue, turnManager } = world;
    const { choice, actorID } = event;
    const isActor = turnManager.isActor(actorID);

    console.log("ACTION_AUTHORIZED", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {        
            if(isActor) {
                turnManager.reduceActorActions(1);
            }

            actionQueue.enqueue(choice);
            break;
        }
        case GameEvent.MODE.VERSUS: {
            if(isActor) {
                turnManager.reduceActorActions(1);
            }
        
            actionQueue.enqueue(choice);
            break;
        }
    }
}

GameEvent.prototype.onActionRequested = function(gameContext, event) {
    const { client, world } = gameContext;
    const { eventBus, actionQueue } = world;
    const { socket } = client;
    const { request, choice } = event;

    console.log("ACTION_REQUESTED", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            if(choice && request) {
                eventBus.emit(GameEvent.TYPE.ACTION_AUTHORIZE, event);
            } else {
                eventBus.emit(GameEvent.TYPE.ACTION_DENY, event);
            }
            break;
        }
        case GameEvent.MODE.VERSUS: {
            const { type } = request;
            const isSendable = actionQueue.isSendable(type);

            if(isSendable) {
                socket.messageRoom(CLIENT_EVENT.EVENT, request);
            }
            break;
        }
    }
}

GameEvent.prototype.onActionDenied = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID } = event;

    console.log("ACTION_DENIED", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            const isActor = turnManager.isActor(actorID);
        
            if(isActor) {
                turnManager.reduceActorActions(1);
            }
            break;
        }
    }
}

GameEvent.prototype.onVersusRequestSkipTurn = function(gameContext, event) {
    //Send request to skip turn to server.
    //Only works if user is the active actor.
    console.log("VERUS_REQUEST_SKIP_TURN", event);
}

GameEvent.prototype.onVersusSkipTurn = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID } = event;
    const isActor = turnManager.isActor(actorID);

    console.log("VERUS_SKIP_TURN", event);

    if(isActor) {
        turnManager.cancelActorActions();
    }
}