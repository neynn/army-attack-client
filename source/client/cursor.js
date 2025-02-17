import { EventEmitter } from "../events/eventEmitter.js";

export const Cursor = function() {
    this.positionX = 0;
    this.positionY = 0;
    this.radius = 0;
    this.isLocked = false;

    this.rightDragHappened = false;
    this.leftDragHappened = false;
    this.isRightMouseDown = false;
    this.isLeftMouseDown = false;
    this.rightMouseDownTime = 0;
    this.leftMouseDownTime = 0;

    this.addEventHandler("mousedown", event => this.eventMouseDown(event));
    this.addEventHandler("mouseup", event => this.eventMouseUp(event));
    this.addEventHandler("mousemove", event => this.eventMouseMove(event)); 
    this.addEventHandler("wheel", event => this.eventMouseScroll(event));
    this.addEventHandler("pointerlockchange", event => this.eventPointerLockChange(event));
    
    this.events = new EventEmitter();
    this.events.listen(Cursor.EVENT.LEFT_MOUSE_CLICK);
    this.events.listen(Cursor.EVENT.RIGHT_MOUSE_CLICK);
    this.events.listen(Cursor.EVENT.LEFT_MOUSE_DRAG);
    this.events.listen(Cursor.EVENT.RIGHT_MOUSE_DRAG);
    this.events.listen(Cursor.EVENT.LEFT_MOUSE_UP);
    this.events.listen(Cursor.EVENT.RIGHT_MOUSE_UP);
    this.events.listen(Cursor.EVENT.LEFT_MOUSE_DOWN);
    this.events.listen(Cursor.EVENT.RIGHT_MOUSE_DOWN);
    this.events.listen(Cursor.EVENT.UP_MOUSE_SCROLL);
    this.events.listen(Cursor.EVENT.DOWN_MOUSE_SCROLL);
    this.events.listen(Cursor.EVENT.MOVE);
    this.events.listen(Cursor.EVENT.LEFT_MOUSE_HELD);
    this.events.listen(Cursor.EVENT.RIGHT_MOUSE_HELD);
}

Cursor.EVENT = {
    LEFT_MOUSE_CLICK: "LEFT_MOUSE_CLICK",
    RIGHT_MOUSE_CLICK: "RIGHT_MOUSE_CLICK",
    LEFT_MOUSE_DRAG: "LEFT_MOUSE_DRAG",
    RIGHT_MOUSE_DRAG: "RIGHT_MOUSE_DRAG",
    LEFT_MOUSE_UP: "LEFT_MOUSE_UP",
    RIGHT_MOUSE_UP: "RIGHT_MOUSE_UP",
    LEFT_MOUSE_DOWN: "LEFT_MOUSE_DOWN",
    RIGHT_MOUSE_DOWN: "RIGHT_MOUSE_DOWN",
    UP_MOUSE_SCROLL: "UP_MOUSE_SCROLL",
    DOWN_MOUSE_SCROLL: "DOWN_MOUSE_SCROLL",
    LEFT_MOUSE_HELD: "LEFT_MOUSE_HELD",
    RIGHT_MOUSE_HELD: "RIGHT_MOUSE_HELD",
    MOVE: "MOVE"
};

Cursor.DRAG_DISTANCE_THRESHOLD_SQUARED = 36;
Cursor.DRAG_DELAY_MILLISECONDS = 120;

Cursor.BUTTON_LEFT = 0;
Cursor.BUTTON_RIGHT = 2;

Cursor.prototype.addEventHandler = function(type, onEvent) {
    document.addEventListener(type, (event) => {
        event.preventDefault();
        onEvent(event);
    });
}

Cursor.prototype.eventMouseMove = function(event) {
    const { pageX, pageY, movementX, movementY } = event;
    const deltaX = this.isLocked ? - movementX : this.positionX - pageX;
    const deltaY = this.isLocked ? - movementY : this.positionY - pageY;

    if(this.isLeftMouseDown) {
        const elapsedTime = Date.now() - this.leftMouseDownTime;
        const hasDragged = this.hasDragged(deltaX, deltaY, elapsedTime);

        if(hasDragged) {
            this.leftDragHappened = true;
            this.events.emit(Cursor.EVENT.LEFT_MOUSE_DRAG, deltaX, deltaY);
        }
    }

    if(this.isRightMouseDown) {
        const elapsedTime = Date.now() - this.rightMouseDownTime;
        const hasDragged = this.hasDragged(deltaX, deltaY, elapsedTime);

        if(hasDragged) {
            this.rightDragHappened = true;
            this.events.emit(Cursor.EVENT.RIGHT_MOUSE_DRAG, deltaX, deltaY);
        }
    }

    this.positionX = pageX;
    this.positionY = pageY;
    this.events.emit(Cursor.EVENT.MOVE, deltaX, deltaY);
}

Cursor.prototype.eventMouseDown = function(event) {
    const { button } = event;

    if(button === Cursor.BUTTON_LEFT) {
        this.events.emit(Cursor.EVENT.LEFT_MOUSE_DOWN);
        this.isLeftMouseDown = true;
        this.leftMouseDownTime = Date.now();

    } else if(button === Cursor.BUTTON_RIGHT) {
        this.events.emit(Cursor.EVENT.RIGHT_MOUSE_DOWN);
        this.isRightMouseDown = true;
        this.rightMouseDownTime = Date.now();
    }
}   

Cursor.prototype.eventMouseUp = function(event) {
    const { button } = event;

    if(button === Cursor.BUTTON_LEFT) {
        if(!this.leftDragHappened) {
            this.events.emit(Cursor.EVENT.LEFT_MOUSE_CLICK);
        }

        this.events.emit(Cursor.EVENT.LEFT_MOUSE_UP);
        this.isLeftMouseDown = false;
        this.leftDragHappened = false;
        this.leftMouseDownTime = 0;

    } else if(button === Cursor.BUTTON_RIGHT) {
        if(!this.rightDragHappened) {
            this.events.emit(Cursor.EVENT.RIGHT_MOUSE_CLICK);
        }

        this.events.emit(Cursor.EVENT.RIGHT_MOUSE_UP);
        this.isRightMouseDown = false;
        this.rightDragHappened = false;
        this.rightMouseDownTime = 0;
    }
}

Cursor.prototype.hasDragged = function(deltaX, deltaY, elapsedTime) {
    if(elapsedTime >= Cursor.DRAG_DELAY_MILLISECONDS) {
        return true;
    }
    
    const distance = deltaX * deltaX + deltaY * deltaY;

    return distance >= Cursor.DRAG_DISTANCE_THRESHOLD_SQUARED;
}

Cursor.prototype.eventMouseScroll = function(event) {
    const { deltaY } = event;

    if(deltaY < 0) {
        this.events.emit(Cursor.EVENT.UP_MOUSE_SCROLL, deltaY);
    } else {
        this.events.emit(Cursor.EVENT.DOWN_MOUSE_SCROLL, deltaY);
    }
}

Cursor.prototype.eventPointerLockChange = function(event) {}

Cursor.prototype.lock = function(target) {
    if(!this.isLocked) {
        target.requestPointerLock();
        this.isLocked = true;
    }
}

Cursor.prototype.unlock = function() {
    if(this.isLocked) {
        document.exitPointerLock();
        this.isLocked = false;
    }
}

Cursor.prototype.update = function() {
    if(this.isRightMouseDown) {
        this.events.emit(Cursor.EVENT.RIGHT_MOUSE_HELD, this.rightDragHappened, this.rightMouseDownTime);
    }

    if(this.isLeftMouseDown) {
        this.events.emit(Cursor.EVENT.LEFT_MOUSE_HELD, this.leftDragHappened, this.leftMouseDownTime);
    }
}