export const queueEntityAction = function(gameContext, payload) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.enqueue(payload);
}