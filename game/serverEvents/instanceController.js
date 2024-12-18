export const instanceController = function(gameContext, payload) {
    const { world } = gameContext;
    
    world.createController(gameContext, payload);
}