import { ArmyEntity } from "../init/armyEntity.js";

/**
 * Updates the sprite of an entity to inherit the position of the entity.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 */
const updateSpritePosition = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { positionX, positionY } = positionComponent;

    spriteComponent.setPosition(gameContext, positionX, positionY);
}

/**
 * Collection of functions revolving around the movement of entities.
 */
export const MoveSystem = function() {}

/**
 * Checks if an entity can be moved.
 * 
 * @param {*} entity 
 * @returns {boolean}
 */
MoveSystem.isMoveable = function(entity) {
    const isMoveable = entity.isAlive() && entity.hasComponent(ArmyEntity.COMPONENT.MOVE);

    return isMoveable;
}

/**
 * Lets the entity follow its current movement path.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns 
 */
MoveSystem.updatePath = function(gameContext, entity) {
    const { timer, transform2D } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    if(moveComponent.isPathDone()) {
        return;
    }

    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const deltaDistance = moveComponent.updateDistance(deltaTime);
    const { deltaX, deltaY } = moveComponent.getCurrentStep();

    positionComponent.updatePosition(deltaX * deltaDistance, deltaY * deltaDistance);

    while(moveComponent.canPathAdvance(gameContext.settings.travelDistance)) {
        const { deltaX, deltaY } = moveComponent.getCurrentStep();
        const tileX = positionComponent.tileX + deltaX;
        const tileY = positionComponent.tileY + deltaY;
        const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);
        
        positionComponent.setPosition(x, y);
        positionComponent.setTile(tileX, tileY);
        moveComponent.advancePath(gameContext.settings.travelDistance);
    }

    updateSpritePosition(gameContext, entity);
}

/**
 * Ends the moving action and puts the entity on the specified position.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @param {int} targetX 
 * @param {int} targetY 
 */
MoveSystem.endMove = function(gameContext, entity, targetX, targetY) {
    const { transform2D } = gameContext;
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);
    const { x, y } = transform2D.transformTileToWorldCenter(targetX, targetY);

    positionComponent.setPosition(x, y);
    positionComponent.setTile(targetX, targetY);
    moveComponent.clearPath();

    updateSpritePosition(gameContext, entity);
}