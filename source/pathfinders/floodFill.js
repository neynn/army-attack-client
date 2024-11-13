export const FloodFill = function() {}

FloodFill.createNode = function(g, positionX, positionY, parent) {
    return { 
        "g": g,
        "positionX": positionX,
        "positionY": positionY,
        "parent": parent,
        "isValid": false
    }
}

FloodFill.isNodeInBounds = function(positionX, positionY, mapWidth, mapHeight) {
    return positionX < mapWidth && positionX >= 0 && positionY < mapHeight && positionY >= 0;
}

FloodFill.getPositionKey = function(positionX, positionY) {
    return `${positionX}-${positionY}`;
}

FloodFill.getFirstEntry = function(map) {
    return map.entries().next().value;
}

FloodFill.search = function(startX, startY, gLimit, mapWidth, mapHeight, onCheck) {
    const openNodes = new Map();
    const visitedNodes = new Set();
    const allNodes = [];
    const startNode = FloodFill.createNode(0, startX, startY, null);

    openNodes.set(FloodFill.getPositionKey(startNode.positionX, startNode.positionY), startNode);

    while(openNodes.size !== 0) {
        const [nodeID, node] = FloodFill.getFirstEntry(openNodes);
        const { g, positionX, positionY } = node;

        openNodes.delete(nodeID);
        visitedNodes.add(nodeID);

        if(g >= gLimit) {
            return allNodes;
        }

        const children = [
            FloodFill.createNode(g + 1, positionX, positionY - 1, node),
            FloodFill.createNode(g + 1, positionX + 1, positionY, node),
            FloodFill.createNode(g + 1, positionX, positionY + 1, node),
            FloodFill.createNode(g + 1, positionX - 1, positionY, node),
        ];

        for(const childNode of children) {
            const { positionX, positionY } = childNode;
            const isChildInBounds = FloodFill.isNodeInBounds(positionX, positionY, mapWidth, mapHeight);
            const childKey = FloodFill.getPositionKey(positionX, positionY);

            if(!isChildInBounds || visitedNodes.has(childKey) || openNodes.has(childKey)) {
                continue;
            }

            allNodes.push(childNode);

            if(onCheck(childNode, node)) {
                childNode.isValid = true;
                openNodes.set(childKey, childNode);
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

    for(let i = flatTree.length - 1; i > - 1; i--) {
        list.push(flatTree[i]);
    }

    return list;
}