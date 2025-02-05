export const FloodFill = function() {}

FloodFill.IGNORE_NEXT = 0;
FloodFill.USE_NEXT = 1;

FloodFill.createNode = function(g, positionX, positionY, parent) {
    return { 
        "g": g,
        "positionX": positionX,
        "positionY": positionY,
        "parent": parent,
        "state": null
    }
}

FloodFill.isNodeInBounds = function(positionX, positionY, mapWidth, mapHeight) {
    return positionX < mapWidth && positionX >= 0 && positionY < mapHeight && positionY >= 0;
}

FloodFill.getPositionKey = function(positionX, positionY) {
    return `${positionX}-${positionY}`;
}

FloodFill.search = function(startX, startY, gLimit, mapWidth, mapHeight, onCheck) {
    const queue = [];
    const allNodes = [];
    const visitedNodes = new Set();

    const startNode = FloodFill.createNode(0, startX, startY, null);
    const startKey = FloodFill.getPositionKey(startX, startY);

    queue.push(startNode);
    visitedNodes.add(startKey);

    while(queue.length !== 0) {
        const node = queue.shift();
        const { g, positionX, positionY } = node;

        if(g >= gLimit) {
            break;
        }

        const neighbors = [
            { x: positionX, y: positionY - 1 },
            { x: positionX + 1, y: positionY },
            { x: positionX, y: positionY + 1 },
            { x: positionX - 1, y: positionY }
        ];

        for(let i = 0; i < neighbors.length; i++) {
            const neighbor = neighbors[i];
            const { x, y } = neighbor;
            const key = FloodFill.getPositionKey(x, y);

            if(!visitedNodes.has(key) && FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight)) {
                const childNode = FloodFill.createNode(g + 1, x, y, node);

                allNodes.push(childNode);
                visitedNodes.add(key);
    
                if(onCheck(childNode, node) === FloodFill.USE_NEXT) {
                    queue.push(childNode);
                }
            }
        }
    }

    return allNodes;
}

FloodFill.walkTree = function(startNode) {
    const nodeStack = [startNode];
    const walkedNodes = [];

    while(nodeStack.length !== 0) {
        const node = nodeStack.pop();
        const { parent } = node;

        walkedNodes.push(node);

        if(parent === null) {
            break;
        }

        nodeStack.push(parent);
    }

    return walkedNodes;
}