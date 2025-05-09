import { ACTION_TYPE } from "../../enums.js";
import { ArmyCamera } from "../../armyCamera.js";
import { PlayerCursor } from "./playerCursor.js";
import { RangeVisualizer } from "./rangeVisualizer.js";
import { Inventory } from "./inventory/inventory.js";
import { PlayerIdleState } from "./states/idle.js";
import { PlayerSelectedState } from "./states/selected.js";
import { PlayerFireMissionState } from "./states/fireMission.js";
import { PlayerBuildState } from "./states/build.js";
import { PlayerSpectateState } from "./states/spectate.js";
import { Actor } from "../../../source/turn/actor.js";
import { StateMachine } from "../../../source/state/stateMachine.js";
import { Queue } from "../../../source/queue.js";
import { GameEvent } from "../../gameEvent.js";
import { AttackVisualizer } from "./attackVisualizer.js";
import { PlayerHealState } from "./states/heal.js";

export const Player = function() {
    Actor.call(this);

    this.helper = false;
    this.teamID = null;
    this.inventory = new Inventory();
    this.camera = new ArmyCamera();
    this.inputQueue = new Queue(10);
    this.hover = new PlayerCursor(this.camera);
    this.attackVisualizer = new AttackVisualizer(this.camera);
    this.rangeVisualizer = new RangeVisualizer(this.camera);

    this.states = new StateMachine(this);
    this.states.addState(Player.STATE.SPECTATE, new PlayerSpectateState());
    this.states.addState(Player.STATE.IDLE, new PlayerIdleState());
    this.states.addState(Player.STATE.SELECTED, new PlayerSelectedState());
    this.states.addState(Player.STATE.FIRE_MISSION, new PlayerFireMissionState());
    this.states.addState(Player.STATE.BUILD, new PlayerBuildState());
    this.states.addState(Player.STATE.HEAL, new PlayerHealState());
}

Player.CAMERA_ID = "ARMY_CAMERA";

Player.COMMAND = {
    CLICK: "CLICK",
    TOGGLE_RANGE: "TOGGLE_RANGE"
};

Player.EVENT = {
    CLICK: 0
};

Player.STATE = {
    SPECTATE: "SPECTATE",
    IDLE: "IDLE",
    SELECTED: "SELECTED",
    FIRE_MISSION: "FIRE_MISSION",
    BUILD: "BUILD",
    HEAL: "HEAL"
};

Player.SPRITE_TYPE = {
    MOVE: "move",
    SELECT: "select",
    ATTACK: "attack",
    FIRE_MISSION: "powerup",
    REPAIR: "repair"
};

Player.prototype = Object.create(Actor.prototype);
Player.prototype.constructor = Player;

Player.prototype.getCamera = function() {
    return this.camera;
}

Player.prototype.onEntityRemove = function(entityID) {
    if(this.states.isCurrent(Player.STATE.SELECTED)) {
        //TODO: Go back to regular on removal!
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

Player.prototype.queueAttack = function(gameContext, entityID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const request = actionQueue.createRequest(ACTION_TYPE.ATTACK, entityID);

    if(request) {
        this.inputQueue.enqueueLast(request);
    }
}

Player.prototype.onClick = function(gameContext) {    
    this.hover.update(gameContext);
    this.states.eventEnter(gameContext, Player.EVENT.CLICK);
}

Player.prototype.onMakeChoice = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue, eventBus } = world;

    this.inputQueue.filterUntilFirstHit((request) => {
        const executionItem = actionQueue.getExecutionItem(gameContext, request, this.id);

        if(!executionItem) {
            return Queue.FILTER.NO_SUCCESS;
        }

        eventBus.emit(GameEvent.TYPE.ACTION_REQUEST, { "actorID": this.id, "request": request, "choice": executionItem });
        
        return Queue.FILTER.SUCCESS;
    });
}

Player.prototype.onTurnStart = function(gameContext) {
    if(!this.helper) {
        this.states.setNextState(gameContext, Player.STATE.FIRE_MISSION, { "missionID": "OrbitalLaser" });
        this.helper = true;
        return;
    }

    this.states.setNextState(gameContext, Player.STATE.HEAL);
}

Player.prototype.onTurnEnd = function(gameContext) {
    this.states.setNextState(gameContext, Player.STATE.SPECTATE);
}

Player.prototype.update = function(gameContext) {
    this.hover.update(gameContext);
    this.states.update(gameContext);
}