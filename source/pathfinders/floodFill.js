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

            if (!FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight) || visitedNodes.has(key)) {
                continue;
            }

            const childNode = FloodFill.createNode(g + 1, x, y, node);

            allNodes.push(childNode);
            visitedNodes.add(key);

            if(onCheck(childNode, node) === FloodFill.USE_NEXT) {
                queue.push(childNode);
            }
        }
    }

    return allNodes;
}

FloodFill.walkTree = function(node, walkedNodes) {
    walkedNodes.push(node);

    if(node.parent === null) {
        return walkedNodes;
    }

    return FloodFill.walkTree(node.parent, walkedNodes);
}

FloodFill.flatten = function(mainNode) {
    const walkedNodes = [];
    
    return FloodFill.walkTree(mainNode, walkedNodes);
}

FloodFill.reverse = function(flatTree) {
    const list = [];

    for(let i = flatTree.length - 1; i >= 0; i--) {
        list.push(flatTree[i]);
    }

    return list;
}