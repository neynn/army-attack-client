import { EventEmitter } from "../events/eventEmitter.js";
import { Vec2 } from "../math/vec2.js";

export const Cursor = function() {
    this.position = new Vec2(0, 0);
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
    this.events.listen(Cursor.LEFT_MOUSE_CLICK);
    this.events.listen(Cursor.RIGHT_MOUSE_CLICK);
    this.events.listen(Cursor.LEFT_MOUSE_DRAG);
    this.events.listen(Cursor.RIGHT_MOUSE_DRAG);
    this.events.listen(Cursor.LEFT_MOUSE_UP);
    this.events.listen(Cursor.RIGHT_MOUSE_UP);
    this.events.listen(Cursor.LEFT_MOUSE_DOWN);
    this.events.listen(Cursor.RIGHT_MOUSE_DOWN);
    this.events.listen(Cursor.UP_MOUSE_SCROLL);
    this.events.listen(Cursor.DOWN_MOUSE_SCROLL);
    this.events.listen(Cursor.MOVE);
    this.events.listen(Cursor.LEFT_MOUSE_HELD);
    this.events.listen(Cursor.RIGHT_MOUSE_HELD);
}

Cursor.DRAG_DISTANCE_THRESHOLD_SQUARED = 36;
Cursor.DRAG_DELAY_MILLISECONDS = 120;

Cursor.LEFT_MOUSE_CLICK = 0;
Cursor.RIGHT_MOUSE_CLICK = 1;
Cursor.LEFT_MOUSE_DRAG = 2;
Cursor.RIGHT_MOUSE_DRAG = 3;
Cursor.LEFT_MOUSE_UP = 4;
Cursor.RIGHT_MOUSE_UP = 5;
Cursor.LEFT_MOUSE_DOWN = 6;
Cursor.RIGHT_MOUSE_DOWN = 7;
Cursor.UP_MOUSE_SCROLL = 8;
Cursor.DOWN_MOUSE_SCROLL = 9;
Cursor.MOVE = 10;
Cursor.LEFT_MOUSE_HELD = 11;
Cursor.RIGHT_MOUSE_HELD = 12;

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
    const deltaX = this.isLocked ? - movementX : this.position.x - pageX;
    const deltaY = this.isLocked ? - movementY : this.position.y - pageY;

    if(this.isLeftMouseDown) {
        const elapsedTime = Date.now() - this.leftMouseDownTime;
        const hasDragged = this.hasDragged(deltaX, deltaY, elapsedTime);

        if(hasDragged) {
            this.leftDragHappened = true;
            this.events.emit(Cursor.LEFT_MOUSE_DRAG, deltaX, deltaY);
        }
    }

    if(this.isRightMouseDown) {
        const elapsedTime = Date.now() - this.rightMouseDownTime;
        const hasDragged = this.hasDragged(deltaX, deltaY, elapsedTime);

        if(hasDragged) {
            this.rightDragHappened = true;
            this.events.emit(Cursor.RIGHT_MOUSE_DRAG, deltaX, deltaY);
        }
    }

    this.position.x = pageX;
    this.position.y = pageY;
    this.events.emit(Cursor.MOVE, deltaX, deltaY);
}

Cursor.prototype.eventMouseDown = function(event) {
    const { button } = event;

    if(button === Cursor.BUTTON_LEFT) {
        this.events.emit(Cursor.LEFT_MOUSE_DOWN);
        this.isLeftMouseDown = true;
        this.leftMouseDownTime = Date.now();

    } else if(button === Cursor.BUTTON_RIGHT) {
        this.events.emit(Cursor.RIGHT_MOUSE_DOWN);
        this.isRightMouseDown = true;
        this.rightMouseDownTime = Date.now();
    }
}   

Cursor.prototype.eventMouseUp = function(event) {
    const { button } = event;

    if(button === Cursor.BUTTON_LEFT) {
        if(!this.leftDragHappened) {
            this.events.emit(Cursor.LEFT_MOUSE_CLICK);
        }

        this.events.emit(Cursor.LEFT_MOUSE_UP);
        this.isLeftMouseDown = false;
        this.leftDragHappened = false;
        this.leftMouseDownTime = 0;

    } else if(button === Cursor.BUTTON_RIGHT) {
        if(!this.rightDragHappened) {
            this.events.emit(Cursor.RIGHT_MOUSE_CLICK);
        }

        this.events.emit(Cursor.RIGHT_MOUSE_UP);
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
        this.events.emit(Cursor.UP_MOUSE_SCROLL, deltaY);
    } else {
        this.events.emit(Cursor.DOWN_MOUSE_SCROLL, deltaY);
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
        this.events.emit(Cursor.RIGHT_MOUSE_HELD, this.rightDragHappened, this.rightMouseDownTime);
    }

    if(this.isLeftMouseDown) {
        this.events.emit(Cursor.LEFT_MOUSE_HELD, this.leftDragHappened, this.leftMouseDownTime);
    }
}