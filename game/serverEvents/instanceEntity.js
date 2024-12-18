export const instanceEntity = function(gameContext, payload) {
    const { world } = gameContext;
    
    world.createEntity(gameContext, payload);
}