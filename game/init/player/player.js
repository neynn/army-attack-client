import { ACTION_TYPES, CAMERA_TYPES } from "../../enums.js";
import { ArmyCamera } from "../../armyCamera.js";
import { AnimationSystem } from "../../systems/animation.js";
import { PathfinderSystem } from "../../systems/pathfinder.js";
import { AttackSystem } from "../../systems/attack.js";
import { ControllerHover } from "./hover.js";
import { ArmyEntity } from "../armyEntity.js";
import { ConstructionSystem } from "../../systems/construction.js";
import { Controller } from "../../../source/controller/controller.js";
import { ArmyContext } from "../../armyContext.js";
import { RangeShow } from "./rangeShow.js";
import { TileManager } from "../../../source/tile/tileManager.js";

export const PlayerController = function(id) {
    Controller.call(this, id);

    this.spriteID = null;
    this.teamID = null;
    this.attackers = [];
    this.hover = new ControllerHover();
    this.rangeShow = new RangeShow();
    this.selectedEntities = new Set();
    this.state = PlayerController.STATE.NONE;
}

PlayerController.COMMAND = {
    CLICK: "CLICK",
    TOGGLE_RANGE: "TOGGLE_RANGE"
};

PlayerController.STATE = {
    NONE: 0,
    IDLE: 1,
    SELECTED: 2,
    BUILD: 3,
    SHOP: 4
};

PlayerController.SPRITE_TYPE = {
    MOVE: "move",
    SELECT: "select",
    ATTACK: "attack" 
};

PlayerController.OVERLAY_TYPE = {
    ENABLE: "enable",
    ATTACK: "attack"
};

PlayerController.prototype = Object.create(Controller.prototype);
PlayerController.prototype.constructor = PlayerController;

PlayerController.prototype.onEntityRemove = function(entityID) {
    if(this.selectedEntities.has(entityID)) {
        this.selectedEntities.delete(entityID);
    }
}

PlayerController.prototype.setState = function(state) {
    this.state = state;
}

PlayerController.prototype.clearAttackers = function(gameContext) {
    const { renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);

    this.attackers.length = 0;
}

PlayerController.prototype.resetAttacker = function(gameContext, attackerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const attacker = entityManager.getEntity(attackerID);

    if(attacker) {
        attacker.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    }
}

PlayerController.prototype.hightlightAttackers = function(gameContext, target) {
    const { world, renderer } = gameContext;
    const { entityManager } = world;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const tileID = this.getOverlayID(gameContext, PlayerController.OVERLAY_TYPE.ATTACK);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);

    for(let i = 0; i < this.attackers.length; i++) {
        const attackerID = this.attackers[i];
        const attacker = entityManager.getEntity(attackerID);
        const { tileX, tileY } = attacker.getComponent(ArmyEntity.COMPONENT.POSITION);

        attacker.lookAtEntity(target);
        attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.AIM, ArmyEntity.SPRITE_TYPE.AIM_UP);
        camera.addToOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK, tileID, tileX, tileY);
    }
}

PlayerController.prototype.updateAttackers = function(gameContext) {
    const mouseEntity = this.hover.getEntity(gameContext);

    if(!mouseEntity || !mouseEntity.isAttackable(gameContext, this.teamID)) {
        AnimationSystem.revertToIdle(gameContext, this.attackers);
        this.clearAttackers(gameContext);
        return;
    }

    const activeAttackers = AttackSystem.getActiveAttackers(gameContext, mouseEntity);
    const attackerIDs = [];

    for(let i = 0; i < activeAttackers.length; i++) {
        const attacker = activeAttackers[i];
        const attackerID = attacker.getID();

        attackerIDs.push(attackerID);
    }

    const newAttackers = new Set(attackerIDs);

    for(let i = 0; i < this.attackers.length; i++) {
        const attackerID = this.attackers[i];

        if(!newAttackers.has(attackerID)) {
            this.resetAttacker(gameContext, attackerID);
        }
    }

    this.attackers = attackerIDs;
    this.hightlightAttackers(gameContext, mouseEntity);
}

PlayerController.prototype.getOverlayID = function(gameContext, typeID) {
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

PlayerController.prototype.addNodeOverlays = function(gameContext, nodeList) {
    const { world, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const enableTileID = this.getOverlayID(gameContext, PlayerController.OVERLAY_TYPE.ENABLE);
    const attackTileID = this.getOverlayID(gameContext, PlayerController.OVERLAY_TYPE.ATTACK);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);

    for(let i = 0; i < nodeList.length; i++) {
        const { node, state } = nodeList[i];
        const { positionX, positionY } = node;

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            if(ArmyContext.DEBUG.SHOW_INVALID_MOVE_TILES) {
                camera.addToOverlay(ArmyCamera.OVERLAY_TYPE.MOVE, attackTileID, positionX, positionY);
            }

        } else {
            const tileEntity = world.getTileEntity(positionX, positionY);

            if(!tileEntity) {
                camera.addToOverlay(ArmyCamera.OVERLAY_TYPE.MOVE, enableTileID, positionX, positionY);
            }
        } 
    }
}

PlayerController.prototype.setSpriteTilePosition = function(gameContext, tileX, tileY) {
    const { renderer, spriteManager } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const sprite = spriteManager.getSprite(this.spriteID);
    const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);

    sprite.setPosition(x, y);
}

PlayerController.prototype.updateSpritePosition = function(gameContext) {
    if(this.hover.isHoveringOnEntity()) {
        const hoverEntity = this.hover.getEntity(gameContext);
        const { tileX, tileY } = hoverEntity.getComponent(ArmyEntity.COMPONENT.POSITION);

        this.setSpriteTilePosition(gameContext, tileX, tileY);
    } else {
        this.setSpriteTilePosition(gameContext, this.hover.tileX, this.hover.tileY);
    }
}

PlayerController.prototype.onClick = function(gameContext) {
    const { client, uiManager, world } = gameContext;
    const { cursor } = client;
    const { positionX, positionY, radius } = cursor;
    const clickedElements = uiManager.getCollidedElements(positionX, positionY, radius);

    if(clickedElements.length > 0) {
        return;
    }

    const mouseTile = gameContext.getMouseTile();
    const { x, y } = mouseTile;
    const mouseEntity = world.getTileEntity(x, y);

    switch(this.state) {
        case PlayerController.STATE.IDLE: {
            this.onIdleClick(gameContext, mouseTile, mouseEntity);
            break;
        }
        case PlayerController.STATE.SELECTED: {
            this.onSelectedClick(gameContext, mouseTile, mouseEntity);
            break;
        }
        case PlayerController.STATE.SHOP: {
            break;
        }
    }
}

PlayerController.prototype.selectEntity = function(gameContext, entity) {
    const entityID = entity.getID();

    if(!this.hasEntity(entityID)) {
        return;
    }

    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);

    this.selectedEntities.add(entityID);
    this.hover.updateNodes(gameContext, nodeList);
    this.addNodeOverlays(gameContext, nodeList);
    this.setState(PlayerController.STATE.SELECTED);

    AnimationSystem.playSelect(gameContext, entity);
}

PlayerController.prototype.deselectEntity = function(gameContext, entity) {
    const { renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);

    this.selectedEntities.clear();
    this.hover.clearNodes();
    this.setState(PlayerController.STATE.IDLE);

    AnimationSystem.stopSelect(gameContext, entity);
}

PlayerController.prototype.hideCursorSprite = function(gameContext) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteID);

    sprite.hide();
}

PlayerController.prototype.updateCursorSprite = function(gameContext, typeID, spriteKey) {
    const { spriteManager } = gameContext;
    const spriteType = this.config.sprites[typeID];
    const spriteID = spriteType[spriteKey];

    if(spriteID) {
        const sprite = spriteManager.getSprite(this.spriteID);

        spriteManager.updateSprite(this.spriteID, spriteID);
        sprite.show();
    }
}

PlayerController.prototype.updateIdleCursor = function(gameContext) {
    if(!this.hover.isHoveringOnEntity()) {
        this.hideCursorSprite(gameContext);
        return;
    }

    const hoveredEntity = this.hover.getEntity(gameContext);
    const typeID = this.attackers.length > 0 ? PlayerController.SPRITE_TYPE.ATTACK : PlayerController.SPRITE_TYPE.SELECT;
    const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;

    this.updateCursorSprite(gameContext, typeID, spriteKey);
}

PlayerController.prototype.updateSelectedCursor = function(gameContext) {
    if(this.hover.isHoveringOnEntity()) {
        this.updateIdleCursor(gameContext);
    } else if(!this.hover.isHoveringOnNode()) {
        this.hideCursorSprite(gameContext);
    } else {
        this.updateCursorSprite(gameContext, PlayerController.SPRITE_TYPE.MOVE, "1-1");
    }
}

PlayerController.prototype.updateSelectedEntity = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    const selectedEntityID = this.getFirstSelected();
    const selectedEntity = entityManager.getEntity(selectedEntityID);

    if(!selectedEntity) {
        return;
    }

    const { tileX } = selectedEntity.getComponent(ArmyEntity.COMPONENT.POSITION);
    
    if(this.hover.tileX !== tileX) {
        selectedEntity.lookHorizontal(this.hover.tileX < tileX);
        selectedEntity.updateSpriteHorizontal(gameContext, selectedEntity);
    }
}

PlayerController.prototype.queueAttack = function(gameContext, entity) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const isAttackable = entity.isAttackable(gameContext, this.teamID);

    if(isAttackable) {
        const entityID = entity.getID();

        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.ATTACK, entityID));
    }

    return isAttackable;
}

PlayerController.prototype.onSelectedClick = function(gameContext, mouseTile, mouseEntity) {
    const { world, client } = gameContext;
    const { actionQueue, entityManager } = world;
    const { soundPlayer } = client;
    const selectedEntityID = this.getFirstSelected();
    const selectedEntity = entityManager.getEntity(selectedEntityID);

    if(mouseEntity) {
        const success = this.queueAttack(gameContext, mouseEntity);

        if(!success) {
            soundPlayer.playSound("sound_error", 0.5); 
        }
    } else {
        const { x, y } = mouseTile;
        
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.MOVE, selectedEntityID, x, y));
    }

    this.deselectEntity(gameContext, selectedEntity);
}

PlayerController.prototype.onIdleClick = function(gameContext, mouseTile, mouseEntity) {
    const { world } = gameContext;
    const { actionQueue } = world;

    if(!mouseEntity) {
        return;
    }

    const entityID = mouseEntity.getID();
    const success = this.queueAttack(gameContext, mouseEntity);

    if(success || !this.hasEntity(entityID)) {
        return;
    }

    if(mouseEntity.hasComponent(ArmyEntity.COMPONENT.CONSTRUCTION)) {
        ConstructionSystem.onInteract(gameContext, mouseEntity);
    }

    if(!actionQueue.isRunning()) {
        if(mouseEntity.isMoveable()) {
            this.selectEntity(gameContext, mouseEntity);
        }
    }
}

PlayerController.prototype.getFirstSelected = function() {
    if(this.selectedEntities.size === 0) {
        return null;
    }

    const iterator = this.selectedEntities.values();
    const firstSelected = iterator.next().value;

    return firstSelected;
}

PlayerController.prototype.toggleRangeShow = function(gameContext) {
    const hoverEntity = this.hover.getEntity(gameContext);

    this.rangeShow.toggle(gameContext, hoverEntity);
}

PlayerController.prototype.updateRangeIndicator = function(gameContext) {
    if(!this.rangeShow.isEnabled() || !this.hover.targetChanged) {
        return;
    }

    this.rangeShow.reset(gameContext);

    if(this.hover.isHoveringOnEntity()) {
        const entity = this.hover.getEntity(gameContext);

        this.rangeShow.show(gameContext, entity);
    }
}

PlayerController.prototype.update = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    this.hover.update(gameContext);
    this.updateSpritePosition(gameContext);

    switch(this.state) {
        case PlayerController.STATE.IDLE: {
            if(actionQueue.isRunning()) {
                this.clearAttackers(gameContext);
            } else {
                this.updateAttackers(gameContext);   
            }
        
            this.updateIdleCursor(gameContext);
            this.updateRangeIndicator(gameContext);
            break;
        }
        case PlayerController.STATE.SELECTED: {
            this.updateAttackers(gameContext);
            this.updateSelectedEntity(gameContext);
            this.updateSelectedCursor(gameContext);
            this.updateRangeIndicator(gameContext);
            break;
        }
        case PlayerController.STATE.SHOP: {
            break;
        }
    }
}