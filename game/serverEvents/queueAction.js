export const queueAction = function(gameContext, payload) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.enqueue(payload);
}