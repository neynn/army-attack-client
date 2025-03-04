import { ACTION_TYPES } from "../enums.js";
import { ArmyCamera } from "../armyCamera.js";
import { AnimationSystem } from "../systems/animation.js";
import { PathfinderSystem } from "../systems/pathfinder.js";
import { AttackSystem } from "../systems/attack.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ConstructionSystem } from "../systems/construction.js";
import { Controller } from "../../source/controller/controller.js";
import { ArmyContext } from "../armyContext.js";
import { TileManager } from "../../source/tile/tileManager.js";
import { Hover } from "./hover.js";
import { RangeShow } from "./rangeShow.js";
import { Inventory } from "./inventory.js";

export const Player = function() {
    Controller.call(this);

    this.spriteID = null;
    this.teamID = null;
    this.selectedEntityID = null;
    this.selectedFireMissionID = null;
    this.attackers = [];
    this.state = Player.STATE.NONE;
    this.hover = new Hover();
    this.rangeShow = new RangeShow();
    this.inventory = new Inventory();
    this.camera = new ArmyCamera();
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
    ATTACK: "attack" 
};

Player.OVERLAY_TYPE = {
    ENABLE: "enable",
    ATTACK: "attack"
};

Player.prototype = Object.create(Controller.prototype);
Player.prototype.constructor = Player;

Player.prototype.getCamera = function() {
    return this.camera;
}

Player.prototype.onEntityRemove = function(entityID) {
    if(this.selectedEntityID === entityID) {
        this.selectedEntityID = null;
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
        this.camera.addToOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK, tileID, tileX, tileY);
    }
}

Player.prototype.updateAttackers = function(gameContext) {
    const mouseEntity = this.hover.getEntity(gameContext);

    if(!mouseEntity || !mouseEntity.isAttackable(gameContext, this.teamID)) {
        AnimationSystem.revertToIdle(gameContext, this.attackers);
        this.clearAttackers();
        return;
    }

    const newAttackers = [];
    const activeAttackers = AttackSystem.getActiveAttackers(gameContext, mouseEntity);

    for(let i = 0; i < activeAttackers.length; i++) {
        const attacker = activeAttackers[i];
        const attackerID = attacker.getID();

        newAttackers.push(attackerID);
    }

    for(let i = 0; i < this.attackers.length; i++) {
        const oldAttackerID = this.attackers[i];
        const isAttacking = newAttackers.includes(oldAttackerID);

        if(!isAttacking) {
            this.resetAttacker(gameContext, oldAttackerID);
        }
    }

    this.attackers = newAttackers;
    this.highlightAttackers(gameContext, mouseEntity, activeAttackers);
}

Player.prototype.getOverlayID = function(gameContext, typeID) {
    const { tileManager } = gameContext;
    const { meta } = tileManager; 
    const overlay = this.config.overlays[typeID];

    if(!overlay) {
        return TileManager.TILE_ID.INVALID;
    }

    const { set, animation } = overlay;
    const tileID = meta.getTileID(set, animation);

    return tileID;
}

Player.prototype.addNodeOverlays = function(gameContext, nodeList) {
    const { world } = gameContext;
    const enableTileID = this.getOverlayID(gameContext, Player.OVERLAY_TYPE.ENABLE);
    const attackTileID = this.getOverlayID(gameContext, Player.OVERLAY_TYPE.ATTACK);

    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);

    for(let i = 0; i < nodeList.length; i++) {
        const { node, state } = nodeList[i];
        const { positionX, positionY } = node;

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            if(ArmyContext.DEBUG.SHOW_INVALID_MOVE_TILES) {
                this.camera.addToOverlay(ArmyCamera.OVERLAY_TYPE.MOVE, attackTileID, positionX, positionY);
            }

        } else {
            const tileEntity = world.getTileEntity(positionX, positionY);

            if(!tileEntity) {
                this.camera.addToOverlay(ArmyCamera.OVERLAY_TYPE.MOVE, enableTileID, positionX, positionY);
            }
        } 
    }
}

Player.prototype.alignSpriteWithHover = function(gameContext) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteID);
    const { x, y } = this.camera.transformTileToPositionCenter(this.hover.tileX, this.hover.tileY);

    sprite.setPosition(x, y);
}

Player.prototype.alignSpriteWithEntity = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteID);
    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { x, y } = this.camera.transformTileToPositionCenter(tileX, tileY);

    sprite.setPosition(x, y);
}

Player.prototype.autoUpdateSpritePosition = function(gameContext) {
    switch(this.hover.state) {
        case Hover.STATE.HOVER_ON_ENTITY: {
            const hoverEntity = this.hover.getEntity(gameContext);

            this.alignSpriteWithEntity(gameContext, hoverEntity);
            break;
        }
        default: {
            this.alignSpriteWithHover(gameContext);
            break;
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
    if(this.selectedEntityID !== null) {
        return;
    }

    const entityID = entity.getID();

    if(!this.hasEntity(entityID)) {
        return;
    }

    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);

    this.selectedEntityID = entityID;
    this.hover.updateNodes(gameContext, nodeList);
    this.addNodeOverlays(gameContext, nodeList);

    AnimationSystem.playSelect(gameContext, entity);
}

Player.prototype.deselectEntity = function(gameContext) {
    if(this.selectedEntityID === null) {
        return;
    }

    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(this.selectedEntityID);

    if(entity) {
        AnimationSystem.stopSelect(gameContext, entity);
    }

    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);
    this.selectedEntityID = null;
    this.hover.clearNodes();
}

Player.prototype.hideCursorSprite = function(gameContext) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteID);

    sprite.hide();
}

Player.prototype.updateCursorSprite = function(gameContext, typeID, spriteKey) {
    const { spriteManager } = gameContext;
    const spriteType = this.config.sprites[typeID];
    const spriteID = spriteType[spriteKey];

    if(spriteID) {
        const sprite = spriteManager.getSprite(this.spriteID);

        spriteManager.updateSprite(this.spriteID, spriteID);
        sprite.show();
    }
}

Player.prototype.updateIdleCursor = function(gameContext) {
    switch(this.hover.state) {
        case Hover.STATE.HOVER_ON_ENTITY: {
            const hoveredEntity = this.hover.getEntity(gameContext);
            const typeID = this.attackers.length > 0 ? Player.SPRITE_TYPE.ATTACK : Player.SPRITE_TYPE.SELECT;
            const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
        
            this.updateCursorSprite(gameContext, typeID, spriteKey);
            break;
        }
        default: {
            this.hideCursorSprite(gameContext);
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
            this.updateCursorSprite(gameContext, Player.SPRITE_TYPE.MOVE, "1-1");
            break;
        }
        default: {
            this.hideCursorSprite(gameContext);
            break;
        }
    }
}

Player.prototype.selectFireMission = function(gameContext, fireMission) {
    const { world } = gameContext;
    const fireCallTypes = world.getConfig("FireCallType");
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

Player.prototype.queueAttack = function(gameContext, entity) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const isAttackable = entity.isAttackable(gameContext, this.teamID);

    if(isAttackable) {
        const entityID = entity.getID();

        actionQueue.addRequest(ACTION_TYPES.ATTACK, entityID);
    }

    return isAttackable;
}

Player.prototype.onSelectedClick = function(gameContext, tileX, tileY) {
    const { world, client } = gameContext;
    const { actionQueue } = world;
    const { soundPlayer } = client;
    const mouseEntity = world.getTileEntity(tileX, tileY);

    if(mouseEntity) {
        const success = this.queueAttack(gameContext, mouseEntity);

        if(!success) {
            soundPlayer.playSound("sound_error", 0.5); 
        }
    } else {        
        actionQueue.addRequest(ACTION_TYPES.MOVE, this.selectedEntityID, tileX, tileY);
    }

    this.deselectEntity(gameContext);
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
    const success = this.queueAttack(gameContext, mouseEntity);

    if(success || !this.hasEntity(entityID)) {
        return;
    }

    ConstructionSystem.onInteract(gameContext, mouseEntity);

    if(!actionQueue.isRunning()) {
        if(mouseEntity.isMoveable()) {
            this.selectEntity(gameContext, mouseEntity);
            this.swapState(gameContext, Player.STATE.SELECTED);
        }
    }
}

Player.prototype.onFireMissionClick = function(gameContext, tileX, tileY) {

}

Player.prototype.toggleRangeShow = function(gameContext) {
    const hoverEntity = this.hover.getEntity(gameContext);
    const isActive = this.rangeShow.toggle();

    if(isActive) {
        if(hoverEntity) {
            this.rangeShow.show(gameContext, hoverEntity, this.camera);
        }
    } else {
        this.rangeShow.reset(gameContext, this.camera);
    }
}

Player.prototype.updateRangeIndicator = function(gameContext) {
    if(!this.rangeShow.isEnabled() || !this.hover.targetChanged) {
        return;
    }

    this.rangeShow.reset(gameContext, this.camera);

    if(this.hover.state === Hover.STATE.HOVER_ON_ENTITY) {
        const entity = this.hover.getEntity(gameContext);

        this.rangeShow.show(gameContext, entity, this.camera);
    }
}

Player.prototype.update = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    this.hover.update(gameContext);

    switch(this.state) {
        case Player.STATE.IDLE: {
            if(actionQueue.isRunning()) {
                this.clearAttackers();
            } else {
                this.updateAttackers(gameContext);   
            }
        
            this.updateIdleCursor(gameContext);
            this.updateRangeIndicator(gameContext);
            this.autoUpdateSpritePosition(gameContext);
            break;
        }
        case Player.STATE.SELECTED: {
            this.updateAttackers(gameContext);
            this.updateSelectedEntity(gameContext);
            this.updateSelectedCursor(gameContext);
            this.updateRangeIndicator(gameContext);
            this.autoUpdateSpritePosition(gameContext);
            break;
        }
        case Player.STATE.FIRE_MISSION: {
            this.updateFireMissionCursor(gameContext);
            this.alignSpriteWithHover(gameContext);
            break;
        }
    }
}

Player.prototype.exitState = function(gameContext) {
    switch(this.state) {
        default: {
            break;
        }
    }

    this.state = Player.STATE.NONE;
}

Player.prototype.enterState = function(gameContext, stateID) {
    switch(stateID) {
        case Player.STATE.FIRE_MISSION: {
            this.rangeShow.reset(gameContext, this.camera);
            this.clearAttackers();
            break;
        }
        default: {
            break;
        }
    }

    this.state = stateID;
}

Player.prototype.swapState = function(gameContext, stateID) {
    this.exitState(gameContext);
    this.enterState(gameContext, stateID);
}