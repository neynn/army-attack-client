export const FloodFill = function() {}

FloodFill.search = function(startX, startY, gLimit, mapWidth, mapHeight, array1D, isValid) {
    const createNode = (g, positionX, positionY, parent) => { return { "g": g, "positionX": positionX, "positionY": positionY, "parent": parent, "isValid": false } }; 
    const getNode = (positionX, positionY) => {
        if(positionX >= mapWidth || positionX < 0 || positionY >= mapHeight || positionY < 0) {
            return null;
        }

        return array1D[positionY * mapWidth + positionX];
    };
    const getKeyForPosition = (positionX, positionY) => `${positionX},${positionY}`;
    const getFirstEntry = (map) => map.entries().next().value;
    
    const openNodes = new Map();
    const visitedNodes = new Map();
    const allNodes = [];
    const startNode = createNode(0, startX, startY, null);

    openNodes.set(getKeyForPosition(startNode.positionX, startNode.positionY), startNode);

    while(openNodes.size !== 0) {
        const [nodeID, node] = getFirstEntry(openNodes);
        const {g, positionX, positionY} = node;

        openNodes.delete(nodeID);
        visitedNodes.set(nodeID, node);

        if(g >= gLimit) {
            return allNodes;
        }

        const matrixNode = getNode(positionX, positionY);
        const children = [
            createNode(g + 1, positionX, positionY - 1, node),
            createNode(g + 1, positionX + 1, positionY, node),
            createNode(g + 1, positionX, positionY + 1, node),
            createNode(g + 1, positionX - 1, positionY, node),
        ];

        for(const childNode of children) {
            const {positionX, positionY} = childNode;
            const childKey = getKeyForPosition(positionX, positionY);
            const childMatrixNode = getNode(positionX, positionY);

            if(!childMatrixNode || visitedNodes.has(childKey)) {
                continue;
            }

            if(openNodes.has(childKey)) {
                continue;
            }

            allNodes.push(childNode);

            if(isValid(childMatrixNode, matrixNode)) {
                childNode.isValid = true;
                openNodes.set(childKey, childNode);
            }
        }
    }

    return allNodes;
}

FloodFill.flatten = function(treeNode) {
    const walkedNodes = [];

    const walkTree = (node) => {
        walkedNodes.push(node);

        if(node.parent === null) {
            return walkedNodes;
        }

        return walkTree(node.parent);
    }

    return walkTree(treeNode);
}

FloodFill.reverse = function(flatTree) {
    const list = [];

    for(let i = flatTree.length - 1; i > - 1; i--) {
        list.push(flatTree[i]);
    }

    return list;
}