import { ACTION_TYPE } from "../../enums.js";
import { ArmyCamera } from "../../armyCamera.js";
import { AnimationSystem } from "../../systems/animation.js";
import { AttackSystem } from "../../systems/attack.js";
import { ArmyEntity } from "../../init/armyEntity.js";
import { PlayerCursor } from "./playerCursor.js";
import { AttackRangeOverlay } from "./attackRangeOverlay.js";
import { Inventory } from "./inventory.js";
import { LookSystem } from "../../systems/look.js";
import { PlayerIdleState } from "./states/idle.js";
import { PlayerSelectedState } from "./states/selected.js";
import { PlayerFireMissionState } from "./states/fireMission.js";
import { PlayerBuildState } from "./states/build.js";
import { PlayerSpectateState } from "./states/spectate.js";
import { Actor } from "../../../source/turn/actor.js";
import { TileManager } from "../../../source/tile/tileManager.js";
import { StateMachine } from "../../../source/state/stateMachine.js";
import { Queue } from "../../../source/queue.js";
import { GameEvent } from "../../gameEvent.js";

export const Player = function() {
    Actor.call(this);

    this.teamID = null;
    this.attackers = new Set();
    this.hover = new PlayerCursor();
    this.attackRangeOverlay = new AttackRangeOverlay();
    this.inventory = new Inventory();
    this.camera = new ArmyCamera();
    this.inputQueue = new Queue(10);

    this.states = new StateMachine(this);
    this.states.addState(Player.STATE.SPECTATE, new PlayerSpectateState());
    this.states.addState(Player.STATE.IDLE, new PlayerIdleState());
    this.states.addState(Player.STATE.SELECTED, new PlayerSelectedState());
    this.states.addState(Player.STATE.FIRE_MISSION, new PlayerFireMissionState());
    this.states.addState(Player.STATE.BUILD, new PlayerBuildState());
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
    BUILD: "BUILD"
};

Player.SPRITE_TYPE = {
    MOVE: "move",
    SELECT: "select",
    ATTACK: "attack",
    FIRE_MISSION: "powerup"
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

Player.prototype.clearAttackers = function() {
    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.attackers.clear();
}

Player.prototype.resetAttacker = function(gameContext, attackerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const attacker = entityManager.getEntity(attackerID);

    if(attacker) {
        attacker.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    }
}

Player.prototype.highlightAttackers = function(gameContext, target, attackers) {
    const tileID = this.getOverlayID(gameContext, this.config.overlays.attack);

    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);

    for(let i = 0; i < attackers.length; i++) {
        const attacker = attackers[i];
        const { tileX, tileY } = attacker.getComponent(ArmyEntity.COMPONENT.POSITION);

        LookSystem.lookAtEntity(attacker, target);
        attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.AIM, ArmyEntity.SPRITE_TYPE.AIM_UP);
        
        this.camera.pushOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK, tileID, tileX, tileY);
    }
}

Player.prototype.updateAttackers = function(gameContext) {
    const mouseEntity = this.hover.getEntity(gameContext);

    if(!mouseEntity || !mouseEntity.isAttackableByTeam(gameContext, this.teamID)) {
        AnimationSystem.revertToIdle(gameContext, this.attackers);
        this.clearAttackers();
        return;
    }

    const activeAttackers = AttackSystem.getActiveAttackers(gameContext, mouseEntity, this.id);

    if(!activeAttackers) {
        for(let i = 0; i < this.attackers.length; i++) {
            const attackerID = this.attackers[i];
            
            this.resetAttacker(gameContext, attackerID);
        }
        return;
    }

    const currentAttackers = new Set();

    for(let i = 0; i < activeAttackers.length; i++) {
        const attacker = activeAttackers[i];
        const attackerID = attacker.getID();

        currentAttackers.add(attackerID);
    }

    for(let i = 0; i < this.attackers.length; i++) {
        const attackerID = this.attackers[i];
        const isAttacking = currentAttackers.has(attackerID);

        if(!isAttacking) {
            this.resetAttacker(gameContext, attackerID);
        }
    }

    this.attackers = currentAttackers;
    this.highlightAttackers(gameContext, mouseEntity, activeAttackers);
}

Player.prototype.getOverlayID = function(gameContext, overlay) {
    if(!overlay) {
        return TileManager.TILE_ID.EMPTY;
    }

    const { tileManager } = gameContext;
    const [atlas, texture] = overlay;
    const tileID = tileManager.getTileID(atlas, texture);

    return tileID;
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

Player.prototype.updateRangeIndicator = function(gameContext) {
    const entity = this.hover.getEntity(gameContext);

    this.attackRangeOverlay.update(gameContext, entity, this.camera);
}

Player.prototype.onClick = function(gameContext) {
    const mouseTile = gameContext.getMouseTile();
    
    this.states.eventEnter(gameContext, Player.EVENT.CLICK, mouseTile);
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
    this.states.setNextState(gameContext, Player.STATE.FIRE_MISSION, { "missionID": "Artillery" });
}

Player.prototype.onTurnEnd = function(gameContext) {
    this.states.setNextState(gameContext, Player.STATE.SPECTATE);
}

Player.prototype.update = function(gameContext) {
    this.hover.update(gameContext);
    this.states.update(gameContext);
}