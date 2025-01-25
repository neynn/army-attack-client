import { Cursor } from "../../../source/client/cursor.js";
import { SpriteManager } from "../../../source/graphics/spriteManager.js";
import { EntityController } from "../../../source/controller/entityController.js";

import { CAMERA_TYPES, CONTROLLER_STATES } from "../../enums.js";
import { ControllerBuildState } from "../../states/controller/build.js";
import { ControllerSelectedState } from "../../states/controller/selected.js";
import { ControllerIdleState } from "../../states/controller/idle.js";
import { PositionComponent } from "../../components/position.js";
import { ArmyCamera } from "../../armyCamera.js";
import { AnimationSystem } from "../../systems/animation.js";
import { PathfinderSystem } from "../../systems/pathfinder.js";
import { AllianceSystem } from "../../systems/alliance.js";
import { TeamComponent } from "../../components/team.js";
import { AttackSystem } from "../../systems/attack.js";
import { MorphSystem } from "../../systems/morph.js";
import { DirectionSystem } from "../../systems/direction.js";
import { HealthComponent } from "../../components/health.js";
import { MoveComponent } from "../../components/move.js";

export const PlayerController = function(id) {
    EntityController.call(this, id);

    this.spriteID = null;
    this.teamID = null;
    this.hoveredEntity = null;
    this.nodeList = new Map();
    this.attackers = new Set();
    this.tileX = -1;
    this.tileY = -1;
}

PlayerController.prototype = Object.create(EntityController.prototype);
PlayerController.prototype.constructor = PlayerController;

PlayerController.prototype.isEntityMoveable = function(entity) {
    const healthComponent = entity.getComponent(HealthComponent);
    const isSelectable = entity.hasComponent(MoveComponent) && healthComponent.health > 0;
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
    const positionComponent = attacker.getComponent(PositionComponent);

    camera.removeOverlay(ArmyCamera.OVERLAY_TYPE_ATTACK, positionComponent.tileX, positionComponent.tileY);
    MorphSystem.toIdle(gameContext, attacker);
}

PlayerController.prototype.hightlightAttacker = function(gameContext, target, attackerID) {
    const { world, tileManager, renderer } = gameContext;
    const { entityManager } = world;
    const attacker = entityManager.getEntity(attackerID);
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const positionComponent = attacker.getComponent(PositionComponent);
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

    const healthComponent = mouseEntity.getComponent(HealthComponent);
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
    const teamComponent = entity.getComponent(TeamComponent);
    const isEnemy = AllianceSystem.isEnemy(gameContext, this.teamID, teamComponent.teamID);

    return isEnemy;
}

PlayerController.prototype.isCursorNodeValid = function() {
    const nodeKey = `${this.tileX}-${this.tileY}`;
    const hasNode =  this.nodeList.has(nodeKey);

    return hasNode;
}

PlayerController.prototype.showSelectEntity = function(gameContext, entity) {
    const { tileManager, world, renderer } = gameContext;
    const DEBUG = world.getConfig("DEBUG");
    const nodeList = new Map();
    const entityID = entity.getID();
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const nodes = PathfinderSystem.generateNodeList(gameContext, entity);
    const enableTileID = tileManager.getTileID("overlay", "grid_enabled_1x1");
    const attackTileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    for(const node of nodes) {
        const { positionX, positionY, state } = node;
        const nodeKey = `${positionX}-${positionY}`;

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            if(DEBUG["SHOW_INVALID_MOVE_TILES"]) {
                camera.addOverlay(ArmyCamera.OVERLAY_TYPE_MOVE, positionX, positionY, attackTileID);
            }
            continue;
        } 

        const tileEntity = world.getTileEntity(positionX, positionY);

        if(!tileEntity) {
            camera.addOverlay(ArmyCamera.OVERLAY_TYPE_MOVE, positionX, positionY, enableTileID);
            nodeList.set(nodeKey, node);
            continue;
        }
    }

    this.nodeList = nodeList;
    this.selectSingle(entityID);

    AnimationSystem.playSelect(gameContext, entity);
}

PlayerController.prototype.undoShowSelectEntity = function(gameContext, entity) {
    const { renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE_MOVE);

    this.deselectAll();
    this.nodeList.clear();

    AnimationSystem.stopSelect(gameContext, entity);
}

PlayerController.prototype.updateHoverSprite = function(gameContext) {
    const { spriteManager, world } = gameContext;
    const { entityManager } = world;
    const sprite = spriteManager.getSprite(this.spriteID);

    if(this.hoveredEntity === null) {
        sprite.hide();
        return;
    }

    const hoverEntity = entityManager.getEntity(this.hoveredEntity);
    const spriteKey = `${hoverEntity.config.dimX}-${hoverEntity.config.dimY}`;
    const spriteTypeID = this.attackers.size > 0 ? "attack" : "select"; 
    const spriteType = this.config.sprites[spriteTypeID][spriteKey];

    if(spriteType) {
        spriteManager.updateSprite(this.spriteID, spriteType);
        sprite.show();
    }
}

PlayerController.prototype.regulateSpritePosition = function(gameContext) {
    const { spriteManager, renderer, world } = gameContext;
    const { entityManager } = world;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const sprite = spriteManager.getSprite(this.spriteID);

    if(this.hoveredEntity !== null) {
        const entity = entityManager.getEntity(this.hoveredEntity);
        const positionComponent = entity.getComponent(PositionComponent);
        const centerPosition = camera.transformTileToPositionCenter(positionComponent.tileX, positionComponent.tileY);

        sprite.setPosition(centerPosition.x, centerPosition.y);
    } else {
        const centerPosition = camera.transformTileToPositionCenter(this.tileX, this.tileY);

        sprite.setPosition(centerPosition.x, centerPosition.y); 
    }
}

PlayerController.prototype.addDragEvent = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.LEFT_MOUSE_DRAG, this.id, (deltaX, deltaY) => {
        const context = gameContext.getCameraAtMouse();

        if(context) {
            context.dragCamera(deltaX, deltaY);
        }
    });
}

PlayerController.prototype.addClickEvent = function(gameContext) {
    const { client, uiManager } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, this.id, () => {
        const clickedElements = uiManager.getCollidedElements(cursor.position.x, cursor.position.y, cursor.radius);

        if(clickedElements.length === 0) {
            this.states.eventEnter(gameContext);
        }
    });
}

PlayerController.prototype.onCreate = function(gameContext, payload) {
    const { spriteManager, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const controllerSprite = spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER.TOP);
    const { x, y } = camera.transformTileToPositionCenter(0, 0);
    const spriteID = controllerSprite.getID();
    controllerSprite.setPosition(x, y);

    this.spriteID = spriteID;
    this.teamID = payload.team ?? null;
    this.addClickEvent(gameContext);
    this.addDragEvent(gameContext);

    this.states.addState(CONTROLLER_STATES.IDLE, new ControllerIdleState());
    this.states.addState(CONTROLLER_STATES.BUILD, new ControllerBuildState());
    this.states.addState(CONTROLLER_STATES.SELECTED, new ControllerSelectedState());

    this.states.setNextState(CONTROLLER_STATES.IDLE);
}

PlayerController.prototype.update = function(gameContext) {
    const { world } = gameContext;
    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = world.getTileEntity(x, y);

    if(!mouseEntity) {
        this.hoveredEntity = null;
    } else {
        const mouseEntityID = mouseEntity.getID();
        this.hoveredEntity = mouseEntityID;
    }

    this.tileX = x;
    this.tileY = y;
    this.states.update(gameContext);
}