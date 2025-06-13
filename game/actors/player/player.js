import { PlayerCursor } from "./playerCursor.js";
import { RangeVisualizer } from "./rangeVisualizer.js";
import { Inventory } from "./inventory/inventory.js";
import { PlayerIdleState } from "./states/idle.js";
import { PlayerSelectedState } from "./states/selected.js";
import { PlayerFireMissionState } from "./states/fireMission.js";
import { PlayerSpectateState } from "./states/spectate.js";
import { Actor } from "../../../source/turn/actor.js";
import { StateMachine } from "../../../source/state/stateMachine.js";
import { Queue } from "../../../source/queue.js";
import { ArmyEventHandler } from "../../armyEventHandler.js";
import { AttackVisualizer } from "./attackVisualizer.js";
import { PlayerHealState } from "./states/heal.js";
import { AttackAction } from "../../actions/attackAction.js";
import { MissionHandler } from "./mission/missionHandler.js";
import { PlayerSellState } from "./states/sell.js";
import { PlayerDebugState } from "./states/debug.js";
import { PlayerPlaceState } from "./states/place.js";
import { MapManager } from "../../../source/map/mapManager.js";
import { MissionGroup } from "./mission/missionGroup.js";
import { ArmyContext } from "../../armyContext.js";
import { UnitLimitHandler } from "./unitLimit/unitLimitHandler.js";

export const Player = function(id, camera) {
    Actor.call(this, id);

    this.camera = camera;
    this.teamID = null;
    this.inventory = new Inventory();
    this.inputQueue = new Queue(10);
    this.hover = new PlayerCursor();
    this.attackVisualizer = new AttackVisualizer(this.camera);
    this.rangeVisualizer = new RangeVisualizer(this.camera);
    this.missions = new MissionHandler();
    this.limits = new UnitLimitHandler();
    
    this.states = new StateMachine(this);
    this.states.addState(Player.STATE.SPECTATE, new PlayerSpectateState());
    this.states.addState(Player.STATE.IDLE, new PlayerIdleState());
    this.states.addState(Player.STATE.SELL, new PlayerSellState());
    this.states.addState(Player.STATE.SELECTED, new PlayerSelectedState());
    this.states.addState(Player.STATE.FIRE_MISSION, new PlayerFireMissionState());
    this.states.addState(Player.STATE.PLACE, new PlayerPlaceState());
    this.states.addState(Player.STATE.HEAL, new PlayerHealState());
    this.states.addState(Player.STATE.DEBUG, new PlayerDebugState());
}

Player.COMMAND = {
    CLICK: "CLICK",
    TOGGLE_RANGE: "TOGGLE_RANGE"
};

Player.EVENT = {
    CLICK: 0,
    TILE_CHANGE: 1,
    TARGET_CHANGE: 2
};

Player.STATE = {
    SPECTATE: "SPECTATE",
    IDLE: "IDLE",
    SELECTED: "SELECTED",
    FIRE_MISSION: "FIRE_MISSION",
    PLACE: "PLACE",
    HEAL: "HEAL",
    SELL: "SELL",
    DEBUG: "DEBUG"
};

Player.SPRITE_TYPE = {
    MOVE: "move",
    SELECT: "select",
    ATTACK: "attack",
    FIRE_MISSION: "powerup",
    REPAIR: "repair",
    PLACE: "place",
    DEBRIS: "debris"
};

Player.prototype = Object.create(Actor.prototype);
Player.prototype.constructor = Player;

Player.prototype.save = function() {
    return {
        "missions": this.missions.save(),
        "inventory": this.inventory.save()
    }
}

Player.prototype.getSpriteType = function(typeID, spriteKey) {
    const spriteType = this.config.sprites[typeID];
    const spriteID = spriteType[spriteKey];

    return spriteID;
}

Player.prototype.selectFireMission = function(gameContext, fireMissionID) {
    const fireMission = gameContext.fireCallTypes[fireMissionID];

    if(!fireMission) {
        return;
    }

    this.states.setNextState(gameContext, Player.STATE.FIRE_MISSION, { "mission": fireMissionID });
}

Player.prototype.queueAttack = function(entityID) {
    const request = AttackAction.createRequest(this.id, entityID);

    this.inputQueue.enqueueLast(request);
}

Player.prototype.onClick = function(gameContext) {    
    this.hover.update(gameContext);
    this.states.eventEnter(gameContext, Player.EVENT.CLICK, null);
}

Player.prototype.onMakeChoice = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue, eventBus } = world;

    this.inputQueue.filterUntilFirstHit((request) => {
        const executionRequest = actionQueue.createExecutionRequest(gameContext, request);

        if(!executionRequest) {
            return Queue.FILTER.NO_SUCCESS;
        }

        eventBus.emit(ArmyEventHandler.TYPE.ACTION_REQUEST, { "actorID": this.id, "request": request, "choice": executionRequest });

        return Queue.FILTER.SUCCESS;
    });
}

Player.prototype.onTurnStart = function(gameContext) {
    this.states.setNextState(gameContext, Player.STATE.IDLE);
}

Player.prototype.onTurnEnd = function(gameContext) {
    this.states.setNextState(gameContext, Player.STATE.SPECTATE);
}

Player.prototype.update = function(gameContext) {
    this.hover.update(gameContext);

    if(this.hover.tileChanged) {
        this.states.eventEnter(gameContext, Player.EVENT.TILE_CHANGE, null);
    }

    if(this.hover.targetChanged) {
        this.states.eventEnter(gameContext, Player.EVENT.TARGET_CHANGE, null);
    }

    this.states.update(gameContext);
}

Player.prototype.initMapEvents = function(gameContext) {
    const { world } = gameContext;
    const { mapManager, eventBus }  = world;

    mapManager.events.on(MapManager.EVENT.MAP_CREATE, (id, data, map) => {
        if(data.missions) {
            this.missions.createGroup(id, data.missions, (group) => {
                group.events.on(MissionGroup.EVENT.MISSION_STARTED, (id, mission) => {
                    console.log(id, mission, "STARTED");
                });

                group.events.on(MissionGroup.EVENT.MISSION_COMPLETED, (id, mission) => {
                    eventBus.emit(ArmyEventHandler.TYPE.MISSION_COMPLETE, {
                        "id": id,
                        "mission": mission,
                        "actorID": this.id
                    });
                });
            });

            this.limits.createGroup(id, (group) => console.log(group));
        }
    });

    mapManager.events.on(MapManager.EVENT.MAP_ENABLE, (id, map) => {
        this.missions.selectGroup(id);
        this.limits.selectGroup(id);
        
        if(map.music && gameContext.modeID !== ArmyContext.GAME_MODE.EDIT) {
            gameContext.client.musicPlayer.playTrack(map.music);
        }
    });
}