import { ArmyEntity } from "../init/armyEntity.js";

/**
 * Collection of functions revolving around the movement of entities.
 */
export const MoveSystem = function() {}

MoveSystem.SPEED = {
    STRAIGHT: 1,
    CROSS: Math.SQRT2
};

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
    const { deltaX, deltaY } = moveComponent.getCurrentStep();
    const distance = moveComponent.updateDistance(deltaTime, MoveSystem.SPEED.STRAIGHT, MoveSystem.SPEED.CROSS);

    positionComponent.updatePosition(deltaX * distance, deltaY * distance);

    while(moveComponent.canPathAdvance(gameContext.settings.travelDistance)) {
        const { deltaX, deltaY } = moveComponent.getCurrentStep();
        const tileX = positionComponent.tileX + deltaX;
        const tileY = positionComponent.tileY + deltaY;
        const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);
        
        positionComponent.setPosition(x, y);
        positionComponent.setTile(tileX, tileY);
        moveComponent.advancePath(gameContext.settings.travelDistance);
    }

    entity.updateSpritePosition(gameContext);
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

    entity.updateSpritePosition(gameContext);
}