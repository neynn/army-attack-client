import { Graph } from "../graphics/graph.js";

export const UIElement = function(DEBUG_NAME) {
    Graph.call(this, Graph.TYPE.UI_ELEMENT, DEBUG_NAME);

    this.anchor = UIElement.ANCHOR_TYPE.TOP_LEFT;
    this.behavior = UIElement.BEHAVIOR.NONE;
    this.originX = 0;
    this.originY = 0;
    this.width = 0;
    this.height = 0;
}

UIElement.BEHAVIOR = {
    NONE: 0,
    COLLIDEABLE: 1 << 0,
    CLICKABLE: 1 << 1
};

UIElement.COLLISION_TYPE = {
    FIRST: 0,
    LAST: 1,
    REPEATED: 2
};

UIElement.EVENT = {
    LAST_COLLISION: "LAST_COLLISION",
    FIRST_COLLISION: "FIRST_COLLISION",
    REPEATED_COLLISION: "REPEATED_COLLISION",
    CLICKED: "CLICKED"
};

UIElement.ANCHOR_TYPE = {
    TOP_CENTER: 0,
    TOP_LEFT: 1,
    TOP_RIGHT: 2,
    BOTTOM_CENTER: 3,
    BOTTOM_LEFT: 4,
    BOTTOM_RIGHT: 5,
    CENTER: 6,
    LEFT: 7,
    RIGHT: 8
};

UIElement.prototype = Object.create(Graph.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.removeBehavior = function(flag) {
    this.behavior &= (~flag);
}

UIElement.prototype.hasBehavior = function(flag) {
    return (this.behavior & flag) !== 0;
}

UIElement.prototype.addBehavior = function(flag) {
    this.behavior |= flag;

    switch(flag) {
        case UIElement.BEHAVIOR.CLICKABLE: {
            if(this.onClick === undefined) {
                console.warn("onClick is not defined!");

                this.onClick = () => {};
            }
            break;
        }
        case UIElement.BEHAVIOR.COLLIDEABLE: {
            if(this.onCollision === undefined) {
                console.warn("onCollision is not defined!");

                this.onCollision = () => {};
            }

            if(this.isColliding === undefined) {
                console.warn("isColliding is not defined!");

                this.isColliding = () => false;
            }

            break;
        }
    }
}

UIElement.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
} 

UIElement.prototype.setOrigin = function(originX, originY) {
    this.originX = originX;
    this.originY = originY;
}

UIElement.prototype.setAnchor = function(anchor) {
    if(UIElement.ANCHOR_TYPE[anchor] !== undefined) {
        this.anchor = UIElement.ANCHOR_TYPE[anchor];
    }
}

UIElement.prototype.getCollisions = function(mouseX, mouseY, mouseRange) {
    if(!this.hasBehavior(UIElement.BEHAVIOR.COLLIDEABLE)) {
        return [];
    }

    const stack = [this];
    const positions = [mouseX, mouseY];
    const collisions = [];

    while(stack.length !== 0) {
        const positionY = positions.pop();
        const positionX = positions.pop();
        const graph = stack.pop();
        const isColliding = graph.isColliding(positionX, positionY, mouseRange);

        if(!isColliding) {
            continue;
        }

        const nextX = positionX - graph.positionX;
        const nextY = positionY - graph.positionY;
        const children = graph.children;

        for(let i = 0; i < children.length; i++) {
            const child = children[i];
            
            if(child.isType(Graph.TYPE.UI_ELEMENT)) {
                const hasFlag = child.hasBehavior(UIElement.BEHAVIOR.COLLIDEABLE);

                if(hasFlag) {
                    stack.push(child);
                    positions.push(nextX);
                    positions.push(nextY);
                }
            }
        }

        collisions.push(graph);
    }

    return collisions;
}

UIElement.prototype.updateAnchor = function(windowWidth, windowHeight) {    
    switch(this.anchor) {
        case UIElement.ANCHOR_TYPE.TOP_CENTER: {
            const anchorX = windowWidth / 2 - this.originX - this.width / 2;

            this.setPosition(anchorX, this.originY);
            break;
        }
        case UIElement.ANCHOR_TYPE.TOP_RIGHT: {
            const anchorX = windowWidth - this.originX - this.width;

            this.setPosition(anchorX, this.originY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_LEFT: {
            const anchorY = windowHeight - this.originY - this.height;

            this.setPosition(this.originX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_CENTER: {
            const anchorX = windowWidth / 2 - this.originX - this.width / 2;
            const anchorY = windowHeight - this.originY - this.height;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_RIGHT: {
            const anchorX = windowWidth - this.originX - this.width;
            const anchorY = windowHeight - this.originY - this.height;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.LEFT: {
            const anchorY = windowHeight / 2 - this.originY - this.height / 2;

            this.setPosition(this.originX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.CENTER: {
            const anchorX = windowWidth / 2 - this.originX - this.width / 2;
            const anchorY = windowHeight / 2 - this.originY - this.height / 2;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.RIGHT: {
            const anchorX = windowWidth - this.originX - this.width;
            const anchorY = windowHeight / 2 - this.originY - this.height / 2;

            this.setPosition(anchorX, anchorY);
            break;
        }
    }
}