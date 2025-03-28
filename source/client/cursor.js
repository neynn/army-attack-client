import { EventEmitter } from "../events/eventEmitter.js";
import { MouseButton } from "./mouseButton.js";

export const Cursor = function() {
    this.positionX = 0;
    this.positionY = 0;
    this.radius = 0;
    this.isLocked = false;
    this.rightButton = new MouseButton();
    this.leftButton = new MouseButton(); 

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
    this.events.listen(Cursor.EVENT.LEFT_MOUSE_HELD);
    this.events.listen(Cursor.EVENT.RIGHT_MOUSE_HELD);
    this.events.listen(Cursor.EVENT.MOVE);
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

Cursor.BUTTON = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
};

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

    this.leftButton.onMouseMove(deltaX, deltaY);
    this.rightButton.onMouseMove(deltaX, deltaY);

    if(this.leftButton.state === MouseButton.STATE.DRAG) {
        this.events.emit(Cursor.EVENT.LEFT_MOUSE_DRAG, deltaX, deltaY);
    }

    if(this.rightButton.state === MouseButton.STATE.DRAG) {
        this.events.emit(Cursor.EVENT.RIGHT_MOUSE_DRAG, deltaX, deltaY);
    }

    this.positionX = pageX;
    this.positionY = pageY;
    this.events.emit(Cursor.EVENT.MOVE, deltaX, deltaY);
}

Cursor.prototype.eventMouseDown = function(event) {
    const { button } = event;

    switch(button) {
        case Cursor.BUTTON.LEFT: {
            this.events.emit(Cursor.EVENT.LEFT_MOUSE_DOWN, this.positionX, this.positionY);
            this.leftButton.onMouseDown();
            break;
        }
        case Cursor.BUTTON.RIGHT: {
            this.events.emit(Cursor.EVENT.RIGHT_MOUSE_DOWN, this.positionX, this.positionY);
            this.rightButton.onMouseDown();
            break;
        }
    }
}   

Cursor.prototype.eventMouseUp = function(event) {
    const { button } = event;

    switch(button) {
        case Cursor.BUTTON.LEFT: {
            if(this.leftButton.state !== MouseButton.STATE.DRAG) {
                this.events.emit(Cursor.EVENT.LEFT_MOUSE_CLICK, this.positionX, this.positionY);
            }

            this.events.emit(Cursor.EVENT.LEFT_MOUSE_UP, this.positionX, this.positionY);
            this.leftButton.onMouseUp();
            break;
        }
        case Cursor.BUTTON.RIGHT: {
            if(this.rightButton.state !== MouseButton.STATE.DRAG) {
                this.events.emit(Cursor.EVENT.RIGHT_MOUSE_CLICK, this.positionX, this.positionY);
            }

            this.events.emit(Cursor.EVENT.RIGHT_MOUSE_UP, this.positionX, this.positionY);
            this.rightButton.onMouseUp();
            break;
        }
    }
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
    if(this.rightButton.state !== MouseButton.STATE.UP) {
        this.events.emit(Cursor.EVENT.RIGHT_MOUSE_HELD);
    }

    if(this.leftButton.state !== MouseButton.STATE.UP) {
        this.events.emit(Cursor.EVENT.LEFT_MOUSE_HELD);
    }
}