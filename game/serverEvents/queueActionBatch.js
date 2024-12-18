export const queueActionBatch = function(gameContext, payload) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const { batch } = payload;

    batch.forEach(setup => actionQueue.enqueue(setup));
}