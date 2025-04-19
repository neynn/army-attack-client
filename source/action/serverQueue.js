const enableServerQueue = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.toDirect();
    actionQueue.toFlush();
}

const processUserRequest = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const executionItem = actionQueue.getExecutionItem(gameContext, request, messengerID);

    if(!executionItem) {
        return;
    }

    actionQueue.enqueueExecutionItem(executionItem, request);

    const processNext = () => {
        if(!actionQueue.isEmpty()) {
            actionQueue.update(gameContext);
            setTimeout(processNext, 0);
        }
    };

    processNext();
}