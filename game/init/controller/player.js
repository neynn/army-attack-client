import { ACTION_TYPES, CAMERA_TYPES } from "../../enums.js";
import { ArmyCamera } from "../../armyCamera.js";
import { AnimationSystem } from "../../systems/animation.js";
import { PathfinderSystem } from "../../systems/pathfinder.js";
import { AttackSystem } from "../../systems/attack.js";
import { ControllerHover } from "./hover.js";
import { ArmyEntity } from "../armyEntity.js";
import { ConstructionSystem } from "../../systems/construction.js";
import { Controller } from "../../../source/controller/controller.js";
import { Autotiler } from "../../../source/tile/autotiler.js";

export const PlayerController = function(id) {
    Controller.call(this, id);

    this.spriteID = null;
    this.teamID = null;
    this.attackers = [];
    this.hover = new ControllerHover();
    this.selectedEntities = new Set();
    this.state = PlayerController.STATE.NONE;
    this.showRange = true;
}

PlayerController.STATE = {
    NONE: 0,
    IDLE: 1,
    SELECTED: 2,
    BUILD: 3,
    SHOP: 4
};

PlayerController.SPRITE_TYPE = {
    SELECT: "select",
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

PlayerController.prototype.resetAllAttackers = function(gameContext) {
    const { renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);

    this.attackers = [];
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
    const { world, tileManager, renderer } = gameContext;
    const { entityManager } = world;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const tileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);

    for(let i = 0; i < this.attackers.length; i++) {
        const attackerID = this.attackers[i];
        const attacker = entityManager.getEntity(attackerID);
        const { tileX, tileY } = attacker.getComponent(ArmyEntity.COMPONENT.POSITION);

        attacker.lookAtEntity(target);
        attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.AIM, ArmyEntity.SPRITE_TYPE.AIM_UP);
        camera.addOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK, tileX, tileY, tileID);
    }
}

PlayerController.prototype.updateAttackers = function(gameContext) {
    const mouseEntity = this.hover.getEntity(gameContext);

    if(!mouseEntity || !mouseEntity.isAttackable(gameContext, this.teamID)) {
        AnimationSystem.revertToIdle(gameContext, this.attackers);
        this.resetAllAttackers(gameContext);
        return;
    }

    const activeAttackers = AttackSystem.getActiveAttackers(gameContext, mouseEntity);
    const newAttackers = new Set(activeAttackers);

    for(let i = 0; i < this.attackers.length; i++) {
        const attackerID = this.attackers[i];

        if(!newAttackers.has(attackerID)) {
            this.resetAttacker(gameContext, attackerID);
        }
    }

    this.attackers = activeAttackers;
    this.hightlightAttackers(gameContext, mouseEntity);
}

PlayerController.prototype.addNodeOverlays = function(gameContext, nodeList) {
    const { tileManager, world, renderer } = gameContext;
    const DEBUG = world.getConfig("DEBUG");
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const enableTileID = tileManager.getTileID("overlay", "grid_enabled_1x1");
    const attackTileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);

    for(let i = 0; i < nodeList.length; i++) {
        const { positionX, positionY, state } = nodeList[i];

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            if(DEBUG["SHOW_INVALID_MOVE_TILES"]) {
                camera.addOverlay(ArmyCamera.OVERLAY_TYPE.MOVE, positionX, positionY, attackTileID);
            }

        } else {
            const tileEntity = world.getTileEntity(positionX, positionY);

            if(!tileEntity) {
                camera.addOverlay(ArmyCamera.OVERLAY_TYPE.MOVE, positionX, positionY, enableTileID);
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
    switch(this.state) {
        case PlayerController.STATE.IDLE: {
            this.onIdleClick(gameContext);
            break;
        }
        case PlayerController.STATE.SELECTED: {
            this.onSelectedClick(gameContext);
            break;
        }
        case PlayerController.STATE.SHOP: {
            break;
        }
    }
}

PlayerController.prototype.onSelectEntity = function(gameContext, entity) {
    const entityID = entity.getID();
    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);

    this.hover.updateNodes(gameContext, nodeList);
    this.addNodeOverlays(gameContext, nodeList);

    if(this.hasEntity(entityID)) {
        this.selectedEntities.add(entityID);
    }
    
    AnimationSystem.playSelect(gameContext, entity);
}

PlayerController.prototype.onDeselectEntity = function(gameContext, entity) {
    const { renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);

    this.selectedEntities.clear();
    this.hover.clearNodes();

    AnimationSystem.stopSelect(gameContext, entity);
}

PlayerController.prototype.updateIdleCursor = function(gameContext) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteID);

    if(!this.hover.isHoveringOnEntity()) {
        sprite.hide();
        return;
    }

    const hoveredEntity = this.hover.getEntity(gameContext);
    const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
    const spriteTypeID = this.attackers.length > 0 ? PlayerController.SPRITE_TYPE.ATTACK : PlayerController.SPRITE_TYPE.SELECT; 
    const spriteType = this.config.sprites[spriteTypeID][spriteKey];

    if(spriteType) {
        spriteManager.updateSprite(this.spriteID, spriteType);
        sprite.show();
    }
}

PlayerController.prototype.updateSelectedCursor = function(gameContext) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteID);

    if(this.hover.isHoveringOnEntity()) {
        this.updateIdleCursor(gameContext);
        return;
    }

    if(!this.hover.isHoveringOnNode()) {
        sprite.hide();
        return;
    }

    spriteManager.updateSprite(this.spriteID, this.config.sprites.move["1-1"]);
    sprite.show();
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

PlayerController.prototype.onSelectedClick = function(gameContext) {
    const { client, world } = gameContext;
    const { actionQueue, entityManager } = world;
    const { soundPlayer } = client;
    const selectedEntityID = this.getFirstSelected();
    const selectedEntity = entityManager.getEntity(selectedEntityID);

    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = world.getTileEntity(x, y);

    if(mouseEntity) {
        const mouseEntityID = mouseEntity.getID();
        const isAttackable = mouseEntity.isAttackable(gameContext, this.teamID);

        if(isAttackable) {
            actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.ATTACK, mouseEntityID));
        } else {
            soundPlayer.playSound("sound_error", 0.5);
        }
    } else {
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.MOVE, selectedEntityID, x, y));
    }

    this.onDeselectEntity(gameContext, selectedEntity);
    this.setState(PlayerController.STATE.IDLE);
}

PlayerController.prototype.getFirstSelected = function() {
    if(this.selectedEntities.size === 0) {
        return null;
    }

    const iterator = this.selectedEntities.values();
    const firstSelected = iterator.next().value;

    return firstSelected;
}

PlayerController.prototype.onIdleClick = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const mouseEntity = gameContext.getMouseEntity();

    if(!mouseEntity) {
        return;
    }

    const entityID = mouseEntity.getID();
    const isAttackable = mouseEntity.isAttackable(gameContext, this.teamID);
    const isControlled = this.hasEntity(entityID);

    if(isAttackable) {
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.ATTACK, entityID));
        return;
    }

    if(!isControlled) {
        return;
    }

    if(mouseEntity.hasComponent(ArmyEntity.COMPONENT.CONSTRUCTION)) {
        ConstructionSystem.onInteract(gameContext, mouseEntity);
    }

    if(!actionQueue.isRunning()) {
        if(mouseEntity.isMoveable()) {
            this.onSelectEntity(gameContext, mouseEntity);
            this.setState(PlayerController.STATE.SELECTED);
        }
    }
}

PlayerController.prototype.updateRangeIndicator = function(gameContext) {
    if(!this.showRange || !this.hover.targetChanged) {
        return;
    }

    const { renderer, tileManager, world } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.RANGE);

    if(!this.hover.isHoveringOnEntity()) {
        return;
    }

    const entity = this.hover.getEntity(gameContext);
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(!attackComponent) {
        return;
    }

    const autotilerTypes = world.getConfig("AutotilerType");
    const rangeAutotilerID = autotilerTypes["Range"].autotilerID;

    const { range } = attackComponent;
    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);

    const startX = tileX - range;
    const startY = tileY - range;
    const endX = tileX + range;
    const endY = tileY + range;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const nextIndex = Autotiler.autotile4Bits(j, i, (x, y) => {
                if(x >= startX && x <= endX && y >= startY && y <= endY) {
                    return 1;
                } 

                return 0;
            });

            const tileID = tileManager.getAutotilerID(rangeAutotilerID, nextIndex);

            camera.addOverlay(ArmyCamera.OVERLAY_TYPE.RANGE, j, i, tileID);
        }
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
                this.resetAllAttackers(gameContext);
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