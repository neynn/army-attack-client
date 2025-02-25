export const FloodFill = function() {}

FloodFill.RESPONSE = {
    IGNORE_NEXT: 0,
    USE_NEXT: 1
};

FloodFill.NEIGHBOR_COST = {
    STRAIGHT: 1,
    CROSS: 1.5
};

FloodFill.STRAIGHT = {
    UP: 1 << 0,
    RIGHT: 1 << 1,
    DOWN: 1 << 2,
    LEFT: 1 << 3
};

FloodFill.CROSS = {
    UP_LEFT: FloodFill.STRAIGHT.UP | FloodFill.STRAIGHT.LEFT,
    UP_RIGHT: FloodFill.STRAIGHT.UP | FloodFill.STRAIGHT.RIGHT,
    DOWN_LEFT: FloodFill.STRAIGHT.DOWN | FloodFill.STRAIGHT.LEFT,
    DOWN_RIGHT: FloodFill.STRAIGHT.DOWN | FloodFill.STRAIGHT.RIGHT
};

FloodFill.createNode = function(positionX, positionY, cost, type, parent) {
    return {
        "positionX": positionX,
        "positionY": positionY,
        "cost": cost,
        "type": type,
        "parent": parent
    }
}

FloodFill.isNodeInBounds = function(positionX, positionY, mapWidth, mapHeight) {
    return positionX < mapWidth && positionX >= 0 && positionY < mapHeight && positionY >= 0;
}

FloodFill.getNeighbors = function(positionX, positionY) {
    return [
        positionX, positionY - 1, FloodFill.STRAIGHT.UP,
        positionX + 1, positionY, FloodFill.STRAIGHT.RIGHT,
        positionX, positionY + 1, FloodFill.STRAIGHT.DOWN,
        positionX - 1, positionY, FloodFill.STRAIGHT.LEFT
    ]
}

FloodFill.getCrossNeighbors = function(positionX, positionY) {
    return [
        positionX - 1, positionY - 1, FloodFill.CROSS.UP_LEFT,
        positionX + 1, positionY - 1, FloodFill.CROSS.UP_RIGHT,
        positionX - 1, positionY + 1, FloodFill.CROSS.DOWN_LEFT,
        positionX + 1, positionY + 1, FloodFill.CROSS.DOWN_RIGHT
    ]
}

FloodFill.search = function(startX, startY, gLimit, mapWidth, mapHeight, onCheck) {
    const queue = [];
    const visitedNodes = new Set();

    const startNode = FloodFill.createNode(startX, startY, 0, null, null);
    const startID = startY * mapWidth + startX;

    let index = 0;

    queue.push(startNode);
    visitedNodes.add(startID);

    while(index < queue.length) {
        const node = queue[index++];
        const { cost, positionX, positionY } = node;

        if(cost >= gLimit) {
            continue;
        }

        const neighbor_cost = cost + FloodFill.NEIGHBOR_COST.STRAIGHT;
        const neighbors = FloodFill.getNeighbors(positionX, positionY);

        for(let i = 0; i < neighbors.length; i += 3) {
            const x = neighbors[i];
            const y = neighbors[i + 1];
            const type = neighbors[i + 2];
            const neighborID = y * mapWidth + x;

            if(visitedNodes.has(neighborID) || !FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight)) {
                continue;
            }

            const childNode = FloodFill.createNode(x, y, neighbor_cost, type, node);

            visitedNodes.add(neighborID);

            if(onCheck(childNode, node) === FloodFill.RESPONSE.USE_NEXT) {
                queue.push(childNode);
            }
        }
    }
}

FloodFill.search_cross = function(startX, startY, gLimit, mapWidth, mapHeight, onCheck) {
    const queue = [];
    const visitedNodes = new Set();

    const startNode = FloodFill.createNode(startX, startY, 0, null, null);
    const startID = startY * mapWidth + startX;

    let index = 0;

    queue.push(startNode);
    visitedNodes.add(startID);

    while(index < queue.length) {
        const node = queue[index++];
        const { cost, positionX, positionY } = node;

        if(cost >= gLimit) {
            continue;
        }

        let validStraights = 0b00000000;

        const neighbor_cost = cost + FloodFill.NEIGHBOR_COST.STRAIGHT;
        const neighbors = FloodFill.getNeighbors(positionX, positionY);

        for(let i = 0; i < neighbors.length; i += 3) {
            const x = neighbors[i];
            const y = neighbors[i + 1];
            const type = neighbors[i + 2];
            const neighborID = y * mapWidth + x;

            if(visitedNodes.has(neighborID) || !FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight)) {
                continue;
            }

            const childNode = FloodFill.createNode(x, y, neighbor_cost, type, node);

            visitedNodes.add(neighborID);

            if(onCheck(childNode, node) === FloodFill.RESPONSE.USE_NEXT) {
                if(neighbor_cost <= gLimit) {
                    validStraights |= type;
                }

                queue.push(childNode);
            }
        }

        const cross_neighbor_cost = cost + FloodFill.NEIGHBOR_COST.CROSS;
        const cross_neighbors = FloodFill.getCrossNeighbors(positionX, positionY);

        for(let i = 0; i < cross_neighbors.length; i += 3) {
            const x = cross_neighbors[i];
            const y = cross_neighbors[i + 1];
            const type = cross_neighbors[i + 2];

            if((validStraights & type) !== type) {
                continue;
            }

            const neighborID = y * mapWidth + x;

            if(visitedNodes.has(neighborID) || !FloodFill.isNodeInBounds(x, y, mapWidth, mapHeight)) {
                continue;
            }

            const childNode = FloodFill.createNode(x, y, cross_neighbor_cost, type, node);

            visitedNodes.add(neighborID);

            if(onCheck(childNode, node) === FloodFill.RESPONSE.USE_NEXT) {
                queue.push(childNode);
            }
        }
    }
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