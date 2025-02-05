export const FloodFill = function() {}

FloodFill.IGNORE_NEXT = 0;
FloodFill.USE_NEXT = 1;

FloodFill.NEIGHBOR_COST = {
    "STRAIGHT": 1,
    "CROSS": 1.5
};

FloodFill.createNode = function(cost, positionX, positionY, parent) {
    return { 
        "cost": cost,
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
        const { cost, positionX, positionY } = node;

        if(cost >= gLimit) {
            continue;
        }

        const neighbor_cost = cost + FloodFill.NEIGHBOR_COST.STRAIGHT;
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

            if(visitedNodes.has(key) || !FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight)) {
                continue;
            }

            const childNode = FloodFill.createNode(neighbor_cost, x, y, node);

            allNodes.push(childNode);
            visitedNodes.add(key);

            if(onCheck(childNode, node) === FloodFill.USE_NEXT) {
                queue.push(childNode);
            }
        }
    }

    return allNodes;
}

FloodFill.search_cross = function(startX, startY, gLimit, mapWidth, mapHeight, onCheck) {
    const queue = [];
    const allNodes = [];
    const visitedNodes = new Set();
    const validNeighbors = new Set();

    const startNode = FloodFill.createNode(0, startX, startY, null);
    const startKey = FloodFill.getPositionKey(startX, startY);

    queue.push(startNode);
    visitedNodes.add(startKey);

    while(queue.length !== 0) {
        const node = queue.shift();
        const { cost, positionX, positionY } = node;

        if(cost >= gLimit) {
            continue;
        }

        validNeighbors.clear();

        const neighbor_cost = cost + FloodFill.NEIGHBOR_COST.STRAIGHT;
        const neighbors = [
            { x: positionX, y: positionY - 1 },
            { x: positionX + 1, y: positionY },
            { x: positionX, y: positionY + 1 },
            { x: positionX - 1, y: positionY }
        ];

        const cross_neighbor_cost = cost + FloodFill.NEIGHBOR_COST.CROSS;
        const cross_neighbors = [
            { x: positionX - 1, y: positionY - 1, requires: [3, 0] },
            { x: positionX + 1, y: positionY - 1, requires: [1, 0] },
            { x: positionX - 1, y: positionY + 1, requires: [3, 2] },
            { x: positionX + 1, y: positionY + 1, requires: [1, 2] }
        ];

        for(let i = 0; i < neighbors.length; i++) {
            const neighbor = neighbors[i];
            const { x, y } = neighbor;
            const key = FloodFill.getPositionKey(x, y);

            if(visitedNodes.has(key) || !FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight)) {
                continue;
            }

            const childNode = FloodFill.createNode(neighbor_cost, x, y, node);

            allNodes.push(childNode);
            visitedNodes.add(key);

            if(onCheck(childNode, node) === FloodFill.USE_NEXT) {
                validNeighbors.add(i);
                queue.push(childNode);
            }
        }

        for(let i = 0; i < cross_neighbors.length; i++) {
            const cross_neighbor = cross_neighbors[i];
            const { x, y, requires } = cross_neighbor;
            const key = FloodFill.getPositionKey(x, y);

            if(visitedNodes.has(key) || !FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight)) {
                continue;
            }
            
            for(let j = 0; j < requires.length; j++) {
                const required = requires[j];

                if(validNeighbors.has(required)) {
                    const childNode = FloodFill.createNode(cross_neighbor_cost, x, y, node);

                    allNodes.push(childNode);
                    visitedNodes.add(key);
        
                    if(onCheck(childNode, node) === FloodFill.USE_NEXT) {
                        queue.push(childNode);
                    }

                    break;
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