import { EventEmitter } from "../events/eventEmitter.js";
import { isCircleCicleIntersect, isRectangleRectangleIntersect } from "../math/math.js";

export const UICollider = function() {
    this.positionX = -1;
    this.positionY = -1;
    this.width = -1;
    this.height = -1;
    this.collisions = 0;
    this.shape = UICollider.SHAPE.RECTANGLE;
    this.state = UICollider.STATE.NOT_COLLIDED;

    this.events = new EventEmitter();
    this.events.listen(UICollider.EVENT.CLICKED);
    this.events.listen(UICollider.EVENT.FIRST_COLLISION);
    this.events.listen(UICollider.EVENT.LAST_COLLISION);
    this.events.listen(UICollider.EVENT.REPEATED_COLLISION);
}

UICollider.STATE = {
    NOT_COLLIDED: 0,
    COLLIDED: 1
};

UICollider.COLLISION_TYPE = {
    FIRST: 0,
    LAST: 1,
    REPEATED: 2
};

UICollider.EVENT = {
    LAST_COLLISION: "LAST_COLLISION",
    FIRST_COLLISION: "FIRST_COLLISION",
    REPEATED_COLLISION: "REPEATED_COLLISION",
    CLICKED: "CLICKED"
};

UICollider.SHAPE = {
    RECTANGLE: 0,
    CIRCLE: 1
};

UICollider.prototype.setShape = function(shape) {
    const shapes = Object.values(UICollider.SHAPE);
    const isShapeValid = shapes.includes(shape);

    if(isShapeValid) {
        this.shape = shape;
    }
}

UICollider.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;
}

UICollider.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
}

UICollider.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    switch(this.shape) {
        case UICollider.SHAPE.RECTANGLE: {
            const isColliding = isRectangleRectangleIntersect(this.positionX, this.positionY, this.width, this.height, mouseX, mouseY, mouseRange, mouseRange);

            return isColliding;
        }
        case UICollider.SHAPE.CIRCLE: {
            const isColliding = isCircleCicleIntersect(this.positionX, this.positionY, this.width, mouseX, mouseY, mouseRange);

            return isColliding;
        }
        default: {
            return false;
        }
    }
}

UICollider.prototype.updateCollision = function(mouseX, mouseY, mouseRange) {
    const isColliding = this.isColliding(mouseX, mouseY, mouseRange);

    if(isColliding) {
        switch(this.state) {
            case UICollider.STATE.NOT_COLLIDED: {
                this.collisions++;
                this.state = UICollider.STATE.COLLIDED;
                this.events.emit(UICollider.EVENT.FIRST_COLLISION, mouseX, mouseY, mouseRange);
                break;
            }
            case UICollider.STATE.COLLIDED: {
                this.collisions++;
                this.events.emit(UICollider.EVENT.REPEATED_COLLISION, mouseX, mouseY, mouseRange);
                break;
            }
        }
    } else {
        switch(this.state) {
            case UICollider.STATE.COLLIDED: {
                this.collisions = 0;
                this.state = UICollider.STATE.NOT_COLLIDED;
                this.events.emit(UICollider.EVENT.LAST_COLLISION, mouseX, mouseY, mouseRange);
                break;
            }
            case UICollider.STATE.NOT_COLLIDED: {
                break;
            }
        }
    }

    return isColliding;
}

UICollider.prototype.click = function(mouseX, mouseY, mouseRange) {
    this.events.emit(UICollider.EVENT.CLICKED, mouseX, mouseY, mouseRange);
}