import { isRectangleRectangleIntersect } from "../../../source/math/math.js";

export const Drop = function(transaction, inventory, sprite) {
    this.transaction = transaction; //Ref to the item that will be added. it is of type ItemType { id, type, value }
    this.inventory = inventory; //Ref to the inventory that gets the drop.
    this.sprite = sprite;
    this.positionX = 0;
    this.positionY = 0;
    this.width = 0;
    this.height = 0;
    this.targetX = -1;
    this.targetY = -1;
    this.timePassed = 0; //move much time has passed
    this.maxTime = 3; //Time until collection
    this.state = Drop.STATE.JUMPING;
}

Drop.STATE = {
    JUMPING: 0,
    DROPPED: 1,
    COLLECTING_AUTO: 2,
    COLLECTING_CURSOR: 3,
    COLLECTED: 4
};

Drop.prototype.setPosition = function(x, y) {
    this.positionX = x;
    this.positionY = y;
    this.sprite.setPosition(x, y);
}

Drop.prototype.update = function(gameContext, deltaTime) {
    const { client } = gameContext;
    const { cursor } = client;

    switch(this.state) {
        case Drop.STATE.JUMPING: {
            //Jump 2 times with reducing intensity until the target is reached.
            this.state = Drop.STATE.DROPPED;
            break;
        }
        case Drop.STATE.DROPPED: {
            this.timePassed += deltaTime;

            if(this.timePassed >= this.maxTime) {
                this.collect();
                this.state = Drop.STATE.COLLECTING_AUTO;
                this.targetX = -1; //Anywhere outside the screen
                this.targetY = -1; //Anywhere outside the screen
            } else {
                const isColliding = isRectangleRectangleIntersect(
                    this.positionX, this.positionY, this.width, this.height,
                    cursor.positionX, cursor.positionY, cursor.radius, cursor.radius
                );
            
                if(isColliding) {
                    this.collect();
                    this.state = Drop.STATE.COLLECTING_CURSOR;
                }
            }

            break;
        }
        case Drop.STATE.COLLECTING_AUTO: {
            //If the cursor did not collect it.
            //Move linearly to the target.
            //If target is reached, collect and put to collected.
            this.state = Drop.STATE.COLLECTED;
            break;
        }
        case Drop.STATE.COLLECTING_CURSOR: {
            //If the cursor collected it.
            //Show the value and name of the item.
            //After some time, put to collected.
            this.state = Drop.STATE.COLLECTED;
            break;
        }
    }
}

Drop.prototype.collect = function() {
    this.inventory.handleTransaction(this.transaction);
}