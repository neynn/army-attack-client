import { Cursor } from "../../../source/client/cursor.js";
import { EntityController } from "../../../source/controller/entityController.js";
import { CAMERA_TYPES } from "../../enums.js";
import { ArmyCamera } from "../../armyCamera.js";
import { AnimationSystem } from "../../systems/animation.js";
import { PathfinderSystem } from "../../systems/pathfinder.js";
import { AllianceSystem } from "../../systems/alliance.js";
import { AttackSystem } from "../../systems/attack.js";
import { MorphSystem } from "../../systems/morph.js";
import { DirectionSystem } from "../../systems/direction.js";
import { ControllerHover } from "./hover.js";
import { ArmyEntity } from "../armyEntity.js";

export const PlayerController = function(id) {
    EntityController.call(this, id);

    this.spriteID = null;
    this.teamID = null;
    this.attackers = new Set();
    this.hover = new ControllerHover();
}

PlayerController.STATE = {
    "IDLE": "IDLE",
    "SELECTED": "SELECTED",
    "BUILD": "BUILD"
};

PlayerController.prototype = Object.create(EntityController.prototype);
PlayerController.prototype.constructor = PlayerController;

PlayerController.prototype.isEntityMoveable = function(entity) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const isSelectable = entity.hasComponent(ArmyEntity.COMPONENT.MOVE) && healthComponent.health > 0;
    const selectedEntityID = this.getFirstSelected();

    return isSelectable && selectedEntityID === null;
}

PlayerController.prototype.resetAllAttackers = function(gameContext) {
    const { renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE_ATTACK);
    this.attackers.clear();
}

PlayerController.prototype.resetAttacker = function(gameContext, attackerID) {
    const { world, renderer } = gameContext;
    const { entityManager } = world;
    const attacker = entityManager.getEntity(attackerID);

    if(!attacker) {
        return;
    }

    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const positionComponent = attacker.getComponent(ArmyEntity.COMPONENT.POSITION);

    camera.removeOverlay(ArmyCamera.OVERLAY_TYPE_ATTACK, positionComponent.tileX, positionComponent.tileY);
    MorphSystem.toIdle(gameContext, attacker);
}

PlayerController.prototype.hightlightAttacker = function(gameContext, target, attackerID) {
    const { world, tileManager, renderer } = gameContext;
    const { entityManager } = world;
    const attacker = entityManager.getEntity(attackerID);
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const positionComponent = attacker.getComponent(ArmyEntity.COMPONENT.POSITION);
    const tileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    camera.addOverlay(ArmyCamera.OVERLAY_TYPE_ATTACK, positionComponent.tileX, positionComponent.tileY, tileID);
    DirectionSystem.lookAt(attacker, target);
    MorphSystem.toAim(gameContext, attacker);
}

PlayerController.prototype.updateAttackers = function(gameContext) {
    const mouseEntity = gameContext.getMouseEntity();

    if(!mouseEntity) {
        AnimationSystem.revertToIdle(gameContext, this.attackers);
        this.resetAllAttackers(gameContext);
        return;
    }

    const healthComponent = mouseEntity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const isAttackable = this.isEntityAttackable(gameContext, mouseEntity);

    if(!isAttackable || !healthComponent.isAlive()) {
        AnimationSystem.revertToIdle(gameContext, this.attackers);
        this.resetAllAttackers(gameContext);
        return;
    }

    const activeAttackers = AttackSystem.getActiveAttackers(gameContext, mouseEntity);
    const newAttackers = new Set(activeAttackers);

    for(const attackerID of newAttackers) {
        this.hightlightAttacker(gameContext, mouseEntity, attackerID);
    }

    for(const attackerID of this.attackers) {
        if(!newAttackers.has(attackerID)) {
            this.resetAttacker(gameContext, attackerID);
        }
    }

    this.attackers = newAttackers;
}

PlayerController.prototype.isEntityAttackable = function(gameContext, entity) {
    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const isEnemy = AllianceSystem.isEnemy(gameContext, this.teamID, teamComponent.teamID);

    return isEnemy;
}

PlayerController.prototype.addNodeOverlays = function(gameContext, nodeList) {
    const { tileManager, world, renderer } = gameContext;
    const DEBUG = world.getConfig("DEBUG");
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const enableTileID = tileManager.getTileID("overlay", "grid_enabled_1x1");
    const attackTileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    for(const node of nodeList) {
        const { positionX, positionY, state } = node;

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            if(DEBUG["SHOW_INVALID_MOVE_TILES"]) {
                camera.addOverlay(ArmyCamera.OVERLAY_TYPE_MOVE, positionX, positionY, attackTileID);
            }

        } else {
            const tileEntity = world.getTileEntity(positionX, positionY);

            if(!tileEntity) {
                camera.addOverlay(ArmyCamera.OVERLAY_TYPE_MOVE, positionX, positionY, enableTileID);
            }
        } 
    }
}

PlayerController.prototype.onClick = function(gameContext) {
    this.states.eventEnter(gameContext);
}

PlayerController.prototype.onSelectEntity = function(gameContext, entity) {
    const entityID = entity.getID();
    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);

    this.hover.updateNodes(gameContext, nodeList);
    this.addNodeOverlays(gameContext, nodeList);
    this.selectSingle(entityID);
    
    AnimationSystem.playSelect(gameContext, entity);
}

PlayerController.prototype.onDeselectEntity = function(gameContext, entity) {
    const { renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE_MOVE);

    this.deselectAll();
    this.hover.clearNodes();

    AnimationSystem.stopSelect(gameContext, entity);
}

PlayerController.prototype.updateHoverSprite = function(gameContext) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteID);

    if(!this.hover.isHoveringOnEntity()) {
        sprite.hide();
        return;
    }

    const hoveredEntity = this.hover.getEntity(gameContext);
    const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
    const spriteTypeID = this.attackers.size > 0 ? "attack" : "select"; 
    const spriteType = this.config.sprites[spriteTypeID][spriteKey];

    if(spriteType) {
        spriteManager.updateSprite(this.spriteID, spriteType);
        sprite.show();
    }
}

PlayerController.prototype.regulateSpritePosition = function(gameContext) {
    const { spriteManager, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const sprite = spriteManager.getSprite(this.spriteID);

    if(!this.hover.isHoveringOnEntity()) {
        const centerPosition = camera.transformTileToPositionCenter(this.hover.tileX, this.hover.tileY);

        sprite.setPosition(centerPosition.x, centerPosition.y); 

        return;
    }

    const hoverEntity = this.hover.getEntity(gameContext);
    const positionComponent = hoverEntity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const centerPosition = camera.transformTileToPositionCenter(positionComponent.tileX, positionComponent.tileY);

    sprite.setPosition(centerPosition.x, centerPosition.y);
}

PlayerController.prototype.addDragEvent = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.EVENT.LEFT_MOUSE_DRAG, this.id, (deltaX, deltaY) => {
        const context = gameContext.getCameraAtMouse();

        if(context) {
            context.dragCamera(deltaX, deltaY);
        }
    });
}

PlayerController.prototype.addClickEvent = function(gameContext) {
    const { client, uiManager } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.EVENT.LEFT_MOUSE_CLICK, this.id, () => {
        const clickedElements = uiManager.getCollidedElements(cursor.positionX, cursor.positionY, cursor.radius);

        if(clickedElements.length === 0) {
            this.onClick(gameContext);
        }
    });
}

PlayerController.prototype.update = function(gameContext) {
    this.hover.update(gameContext);
    this.states.update(gameContext);
}