const enableServerQueue = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.toFlush();
}

const processUserRequest = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    /*
        Perform IS_MESSENGER_ACTOR check.
    */
    const executionItem = actionQueue.getExecutionItem(gameContext, request, messengerID);

    if(!executionItem) {
        return;
    }

    actionQueue.enqueue(executionItem);

    const processNext = () => {
        if(!actionQueue.isEmpty()) {
            actionQueue.update(gameContext);
            setTimeout(processNext, 0);
        }
    };

    processNext();
}