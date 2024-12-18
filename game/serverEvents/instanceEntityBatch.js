export const instanceEntityBatch = function(gameContext, payload) {
    const { world } = gameContext;
    const { batch } = payload;
    
    batch.forEach(setup => world.createEntity(gameContext, setup));
}