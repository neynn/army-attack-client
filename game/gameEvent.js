import { CLIENT_EVENT } from "./enums.js";
import { GameObjective } from "./gameObjective.js";
import { AnimationSystem } from "./systems/animation.js";
import { ConquerSystem } from "./systems/conquer.js";
import { DebrisSystem } from "./systems/debris.js";
import { DropSystem } from "./systems/drop.js";
import { SpawnSystem } from "./systems/spawn.js";

export const GameEvent = function() {
    this.mode = GameEvent.MODE.NONE;
    this.objective = new GameObjective();
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
    ENTITY_HEAL: 205,
    ENTITY_SELL: 206,

    TILE_CAPTURE: 300,
    DEBRIS_REMOVED: 301,
    DEBRIS_SPAWN: 302,

    DROP: 400,
    MISSION_COMPLETE: 401,

    VERSUS_REQUEST_SKIP_TURN: 1000,
    VERSUS_SKIP_TURN: 1001
};

GameEvent.OBJECTIVE_TYPE = {
    DESTROY: "Destroy"
};

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
    eventBus.on(GameEvent.TYPE.ENTITY_HEAL, (event) => this.onEntityHeal(gameContext, event));
    eventBus.on(GameEvent.TYPE.ENTITY_SELL, (event) => this.onEntitySell(gameContext, event));
    eventBus.on(GameEvent.TYPE.TILE_CAPTURE, (event) => this.onTileCapture(gameContext, event));
    eventBus.on(GameEvent.TYPE.DEBRIS_REMOVED, (event) => this.onDebrisRemoved(gameContext, event));
    eventBus.on(GameEvent.TYPE.DEBRIS_SPAWN, (event) => this.onDebrisSpawn(gameContext, event));
    eventBus.on(GameEvent.TYPE.DROP, (event) => this.onDrop(gameContext, event));
    eventBus.on(GameEvent.TYPE.MISSION_COMPLETE, (event) => this.onMissionComplete(gameContext, event));
}

GameEvent.prototype.onAttackCounter = function(gameContext, event) {

}

GameEvent.prototype.onMoveCounter = function(gameContext, event) {

}

GameEvent.prototype.onMissionComplete = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { id, mission, actorID } = event;
    const rewards = mission.getRewards();

    console.log("MISSION_COMPLETE", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {

            if(rewards.length !== 0) {
                eventBus.emit(GameEvent.TYPE.DROP, { "drops": rewards, "receiverID": actorID });
            }

            break;
        }
    }
}

GameEvent.prototype.onDrop = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager, mapManager } = world;
    const { drops, receiverID } = event;
    const receiver = turnManager.getActor(receiverID);

    if(!receiver || !receiver.inventory) {
        return;
    }
    
    const worldMap = mapManager.getActiveMap();
    
    if(worldMap) {
        console.log("DROP", event);

        worldMap.drops.createDrops(gameContext, drops, receiver.inventory);
    }
}

GameEvent.prototype.onDebrisRemoved = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { actor } = event;

    console.log("DEBRIS_REMOVE", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            const drops = DropSystem.getDebrisReward(gameContext, "Debris");

            if(drops) {
                eventBus.emit(GameEvent.TYPE.DROP, { "drops": drops, "receiverID": actor });
            }
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
    const { entity, actor } = event;

    console.log("ENTITY_HIT", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            const hitRewards = DropSystem.getHitReward(entity);

            if(hitRewards) {
                eventBus.emit(GameEvent.TYPE.DROP, { "drops": hitRewards, "receiverID": actor });
            }
            break;
        }
    }
}

GameEvent.prototype.onEntityKill = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { entity, reason, actor } = event;

    console.log("ENTITY_KILL", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            const killRewards = DropSystem.getKillReward(entity);

            if(killRewards) {
                eventBus.emit(GameEvent.TYPE.DROP, { "drops": killRewards, "receiverID": actor });
            }

            this.objective.onEntityKill(gameContext, entity, actor);
            
            eventBus.emit(GameEvent.TYPE.ENTITY_DEATH, { "entity": entity, "reason": reason });
            break;
        }
    }
}

GameEvent.prototype.onEntitySell = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { actorID, entity } = event;

    console.log("ENTITY_SELL", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            const sellRewards = DropSystem.getSellReward(entity);

            if(sellRewards) {
                eventBus.emit(GameEvent.TYPE.DROP, { "drops": sellRewards, "receiverID": actorID });
            }

            SpawnSystem.destroyEntity(gameContext, entity);

            break;
        }
    }
}

GameEvent.prototype.onEntityHeal = function(gameContext, event) {
    const { entity, health } = event;

    console.log("ENTITY_HEAL", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            break;
        }
    }
}

GameEvent.prototype.onEntityDown = function(gameContext, event) {
    console.log("ENTITY_DOWN", event);
}

GameEvent.prototype.onTileCapture = function(gameContext, event) {
    const { actorID, teamID, tiles, count } = event;

    console.log("TILE_CAPTURED", event);

    switch(this.mode) {
        case GameEvent.MODE.STORY: {
            ConquerSystem.conquer(gameContext, teamID, tiles);

            this.objective.onTileCapture(gameContext, count, actorID);
            break;
        }
    }
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