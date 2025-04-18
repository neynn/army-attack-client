import { ACTION_TYPE, GAME_EVENT } from "../../../enums.js";
import { ArmyCamera } from "../../../armyCamera.js";
import { AnimationSystem } from "../../../systems/animation.js";
import { PathfinderSystem } from "../../../systems/pathfinder.js";
import { AttackSystem } from "../../../systems/attack.js";
import { ArmyEntity } from "../../armyEntity.js";
import { ConstructionSystem } from "../../../systems/construction.js";
import { Actor } from "../../../../source/turn/actor.js";
import { TileManager } from "../../../../source/tile/tileManager.js";
import { Hover } from "./hover.js";
import { AttackRangeOverlay } from "./attackRangeOverlay.js";
import { Inventory } from "./inventory.js";
import { Queue } from "../../../../source/queue.js";
import { EntityManager } from "../../../../source/entity/entityManager.js";
import { MoveSystem } from "../../../systems/move.js";
import { FireMissionSystem } from "../../../systems/fireMission.js";

export const Player = function() {
    Actor.call(this);

    this.teamID = null;
    this.selectedEntityID = EntityManager.ID.INVALID;
    this.selectedFireMissionID = null;
    this.attackers = [];
    this.state = Player.STATE.NONE;
    this.hover = new Hover();
    this.attackRangeOverlay = new AttackRangeOverlay();
    this.inventory = new Inventory();
    this.camera = new ArmyCamera();
    this.inputQueue = new Queue(10);
}

Player.CAMERA_ID = "ARMY_CAMERA";

Player.COMMAND = {
    CLICK: "CLICK",
    TOGGLE_RANGE: "TOGGLE_RANGE"
};

Player.STATE = {
    NONE: 0,
    IDLE: 1,
    SELECTED: 2,
    FIRE_MISSION: 3,
    BUILD: 4,
    SHOP: 5
};

Player.SPRITE_TYPE = {
    MOVE: "move",
    SELECT: "select",
    ATTACK: "attack",
    FIRE_MISSION: "powerup"
};

Player.OVERLAY_TYPE = {
    ENABLE: "enable",
    ATTACK: "attack"
};

Player.prototype = Object.create(Actor.prototype);
Player.prototype.constructor = Player;

Player.prototype.getCamera = function() {
    return this.camera;
}

Player.prototype.onEntityRemove = function(entityID) {
    if(this.selectedEntityID === entityID) {
        this.selectedEntityID = EntityManager.ID.INVALID;
    }
}

Player.prototype.clearAttackers = function() {
    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.attackers.length = 0;
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
    const tileID = this.getOverlayID(gameContext, Player.OVERLAY_TYPE.ATTACK);

    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);

    for(let i = 0; i < attackers.length; i++) {
        const attacker = attackers[i];
        const { tileX, tileY } = attacker.getComponent(ArmyEntity.COMPONENT.POSITION);

        attacker.lookAtEntity(target);
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

    const newAttackers = [];
    const activeAttackers = AttackSystem.getActiveAttackers(gameContext, mouseEntity, this.id);

    for(let i = 0; i < activeAttackers.length; i++) {
        const attacker = activeAttackers[i];
        const attackerID = attacker.getID();

        newAttackers.push(attackerID);
    }

    for(let i = 0; i < this.attackers.length; i++) {
        const attackerID = this.attackers[i];
        const isAttacking = newAttackers.includes(attackerID);

        if(!isAttacking) {
            this.resetAttacker(gameContext, attackerID);
        }
    }

    this.attackers = newAttackers;
    this.highlightAttackers(gameContext, mouseEntity, activeAttackers);
}

Player.prototype.getOverlayID = function(gameContext, typeID) {
    const { tileManager } = gameContext;
    const overlay = this.config.overlays[typeID];

    if(!overlay) {
        return TileManager.TILE_ID.EMPTY;
    }

    const { set, animation } = overlay;
    const tileID = tileManager.getTileID(set, animation);

    return tileID;
}

Player.prototype.addNodeOverlays = function(gameContext, nodeList) {
    const { world } = gameContext;
    const enableTileID = this.getOverlayID(gameContext, Player.OVERLAY_TYPE.ENABLE);
    const attackTileID = this.getOverlayID(gameContext, Player.OVERLAY_TYPE.ATTACK);
    const showInvalidTiles = gameContext.settings.debug.showInvalidMoveTiles;

    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);

    for(let i = 0; i < nodeList.length; i++) {
        const { node, state } = nodeList[i];
        const { positionX, positionY } = node;

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            if(showInvalidTiles) {
                this.camera.pushOverlay(ArmyCamera.OVERLAY_TYPE.MOVE, attackTileID, positionX, positionY);
            }

        } else {
            const tileEntity = world.getTileEntity(positionX, positionY);

            if(!tileEntity) {
                this.camera.pushOverlay(ArmyCamera.OVERLAY_TYPE.MOVE, enableTileID, positionX, positionY);
            }
        } 
    }
}

Player.prototype.onClick = function(gameContext) {
    const mouseTile = gameContext.getMouseTile();
    const { x, y } = mouseTile;

    switch(this.state) {
        case Player.STATE.IDLE: {
            this.onIdleClick(gameContext, x, y);
            break;
        }
        case Player.STATE.SELECTED: {
            //this.selectFireMission(gameContext, "Doomsday");
            this.onSelectedClick(gameContext, x, y);
            break;
        }
        case Player.STATE.FIRE_MISSION: {
            this.onFireMissionClick(gameContext, x, y);
            break;
        }
    }
}

Player.prototype.selectEntity = function(gameContext, entity) {
    if(this.selectedEntityID !== EntityManager.ID.INVALID) {
        return;
    }

    const entityID = entity.getID();
    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);

    this.selectedEntityID = entityID;
    this.hover.updateNodes(gameContext, nodeList);
    this.addNodeOverlays(gameContext, nodeList);

    AnimationSystem.playSelect(gameContext, entity);
}

Player.prototype.deselectEntity = function(gameContext) {
    if(this.selectedEntityID === EntityManager.ID.INVALID) {
        return;
    }

    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(this.selectedEntityID);

    if(entity) {
        AnimationSystem.stopSelect(gameContext, entity);
    }

    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);
    this.hover.clearNodes();
    this.selectedEntityID = EntityManager.ID.INVALID;
}

Player.prototype.getSpriteType = function(typeID, spriteKey) {
    const spriteType = this.config.sprites[typeID];
    const spriteID = spriteType[spriteKey];

    return spriteID;
}

Player.prototype.updateIdleCursor = function(gameContext) {
    switch(this.hover.state) {
        case Hover.STATE.HOVER_ON_ENTITY: {
            const hoveredEntity = this.hover.getEntity(gameContext);
            const typeID = this.attackers.length > 0 ? Player.SPRITE_TYPE.ATTACK : Player.SPRITE_TYPE.SELECT;
            const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
            const spriteID = this.getSpriteType(typeID, spriteKey);

            this.hover.updateSprite(gameContext, spriteID);
            break;
        }
        default: {
            this.hover.hideSprite(gameContext);
            break;
        }
    }
}

Player.prototype.updateSelectedCursor = function(gameContext) {
    switch(this.hover.state) {
        case Hover.STATE.HOVER_ON_ENTITY: {
            this.updateIdleCursor(gameContext);
            break;
        }
        case Hover.STATE.HOVER_ON_NODE: {
            const spriteID = this.getSpriteType(Player.SPRITE_TYPE.MOVE, "1-1");
            this.hover.updateSprite(gameContext, spriteID);
            break;
        }
        default: {
            this.hover.hideSprite(gameContext);
            break;
        }
    }
}

Player.prototype.updateFireMissionCursor = function(gameContext) {
    const fireMission = gameContext.fireCallTypes[this.selectedFireMissionID];

    if(!fireMission) {
        return;
    }

    const { sprites } = fireMission;

    if(sprites) {
        this.hover.updateSprite(gameContext, sprites.cursor);
    }
}

Player.prototype.selectFireMission = function(gameContext, fireMissionID) {
    if(this.selectedFireMissionID === fireMissionID) {
        return;
    }

    const fireMission = gameContext.fireCallTypes[fireMissionID];

    if(!fireMission) {
        return;
    }

    this.selectedFireMissionID = fireMissionID;
    this.swapState(gameContext, Player.STATE.FIRE_MISSION);
}

Player.prototype.updateSelectedEntity = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    const selectedEntity = entityManager.getEntity(this.selectedEntityID);

    if(!selectedEntity) {
        return;
    }

    const hoverTileX = this.hover.tileX;
    const { tileX } = selectedEntity.getComponent(ArmyEntity.COMPONENT.POSITION);
    
    if(hoverTileX !== tileX) {
        selectedEntity.lookHorizontal(hoverTileX < tileX);
        selectedEntity.updateSpriteHorizontal(gameContext, selectedEntity);
    }
}

Player.prototype.queueAttack = function(gameContext, entityID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const request = actionQueue.createRequest(ACTION_TYPE.ATTACK, entityID);

    if(request) {
        this.inputQueue.enqueueLast(request);
    }
}

Player.prototype.queueFireMission = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const request = actionQueue.createRequest(ACTION_TYPE.FIRE_MISSION, this.selectedFireMissionID, tileX, tileY);
    
    if(request) {
        this.inputQueue.enqueueLast(request);
    }
}

Player.prototype.onFireMissionClick = function(gameContext, tileX, tileY) {
    const isValid = FireMissionSystem.isValid(gameContext, this.selectedFireMissionID, tileX, tileY);

    if(isValid) {
        this.queueFireMission(gameContext, tileX, tileY);
        this.swapState(gameContext, Player.STATE.IDLE);
    }
}

Player.prototype.onSelectedClick = function(gameContext, tileX, tileY) {
    const { world, client } = gameContext;
    const { actionQueue } = world;
    const { soundPlayer } = client;
    const mouseEntity = world.getTileEntity(tileX, tileY);

    if(mouseEntity) {
        const isAttackable = mouseEntity.isAttackableByTeam(gameContext, this.teamID);

        if(isAttackable) {
            const entityID = mouseEntity.getID();

            this.queueAttack(gameContext, entityID);
        } else {
            soundPlayer.play("sound_error", 0.5); 
        }
    } else {
        const request = actionQueue.createRequest(ACTION_TYPE.MOVE, this.selectedEntityID, tileX, tileY);

        if(request) {
            this.inputQueue.enqueueLast(request);
        }
    }

    this.swapState(gameContext, Player.STATE.IDLE);
}

Player.prototype.onIdleClick = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const mouseEntity = world.getTileEntity(tileX, tileY);

    if(!mouseEntity) {
        return;
    }

    const entityID = mouseEntity.getID();
    const isAttackable = mouseEntity.isAttackableByTeam(gameContext, this.teamID);

    if(isAttackable) {
        this.queueAttack(gameContext, entityID);
        return;
    }

    if(!this.hasEntity(entityID)) {
        return;
    }

    const constructionRequest = ConstructionSystem.onInteract(gameContext, mouseEntity);

    if(constructionRequest) {
        this.inputQueue.enqueueLast(constructionRequest);
    }

    if(!actionQueue.isRunning()) {
        if(MoveSystem.isMoveable(mouseEntity)) {
            this.selectEntity(gameContext, mouseEntity);
            this.swapState(gameContext, Player.STATE.SELECTED);
        }
    }
}

Player.prototype.updateRangeIndicator = function(gameContext) {
    const entity = this.hover.getEntity(gameContext);

    this.attackRangeOverlay.update(gameContext, entity, this.camera);
}

Player.prototype.onMakeChoice = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue, eventBus } = world;

    this.inputQueue.filterUntilFirstHit((request) => {
        const executionItem = actionQueue.getExecutionItem(gameContext, request, this.id);

        if(!executionItem) {
            return Queue.FILTER.NO_SUCCESS;
        }

        actionQueue.enqueueExecutionItem(executionItem, request);
        eventBus.emit(GAME_EVENT.CHOICE_MADE, this.id);
        
        return Queue.FILTER.SUCCESS;
    });
}

Player.prototype.onTurnStart = function(gameContext) {
    if(this.state === Player.STATE.NONE) {
        this.swapState(gameContext, Player.STATE.IDLE);
    }
}

Player.prototype.onTurnEnd = function(gameContext) {
    this.swapState(gameContext, Player.STATE.NONE);
}

Player.prototype.update = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    this.hover.update(gameContext);

    switch(this.state) {
        case Player.STATE.NONE: {
            this.updateRangeIndicator(gameContext);
            break;
        }
        case Player.STATE.IDLE: {
            const isShowable = !actionQueue.isRunning() && this.inputQueue.isEmpty();

            if(isShowable) {
                this.updateAttackers(gameContext); 
            } else {
                this.clearAttackers();
            }
        
            this.updateIdleCursor(gameContext);
            this.updateRangeIndicator(gameContext);
            this.hover.autoAlignSprite(gameContext, this.camera);
            break;
        }
        case Player.STATE.SELECTED: {
            this.updateAttackers(gameContext);
            this.updateSelectedEntity(gameContext);
            this.updateSelectedCursor(gameContext);
            this.updateRangeIndicator(gameContext);
            this.hover.autoAlignSprite(gameContext, this.camera);
            break;
        }
        case Player.STATE.FIRE_MISSION: {
            /*
                Update fire mission overlays. OVERLAY_DISABLED when the attack is not possible.
            */
            this.hover.alignSprite(gameContext, this.camera);
            break;
        }
    }
}

Player.prototype.exitState = function(gameContext) {
    switch(this.state) {
        case Player.STATE.SELECTED: {
            this.deselectEntity(gameContext);
            break;
        }
        case Player.STATE.FIRE_MISSION: {
            this.selectedFireMissionID = null;
            this.attackRangeOverlay.unlock();
            break;
        }
    }

    this.state = Player.STATE.NONE;
}

Player.prototype.enterState = function(gameContext, stateID) {
    switch(stateID) {
        case Player.STATE.NONE: {
            this.clearAttackers();
            break;
        }
        case Player.STATE.FIRE_MISSION: {
            AnimationSystem.revertToIdle(gameContext, this.attackers);
            this.clearAttackers();
            this.updateFireMissionCursor(gameContext);
            this.inputQueue.clear();
            this.attackRangeOverlay.lock(gameContext, this.camera);
            break;
        }
    }

    this.state = stateID;
}

Player.prototype.swapState = function(gameContext, stateID) {
    if(this.state !== stateID) {
        this.exitState(gameContext);
        this.enterState(gameContext, stateID);
    }
}