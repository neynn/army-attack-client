export const Listener = function(type) {
    this.id = type;
    this.observers = [];
    this.singleObservers = [];
}

Listener.ID = {
    NEXT: 0,
    SUPER: -1
};

Listener.OBSERVER_TYPE = {
    DEFAULT: 0,
    SINGLE: 1
};

Listener.prototype.getType = function(options) {
    if(!options) {
        return Listener.OBSERVER_TYPE.DEFAULT;
    }

    const { once } = options;

    if(once) {
        return Listener.OBSERVER_TYPE.SINGLE;
    }

    return Listener.OBSERVER_TYPE.DEFAULT;
}

Listener.prototype.getID = function(options) {
    if(!options) {
        return Listener.ID.NEXT++;
    }

    const { permanent, id } = options;

    if(permanent) {
        return Listener.ID.SUPER;
    }

    if(id && typeof id !== "number") {
        return id;
    }

    return Listener.ID.NEXT++;
}

Listener.prototype.addObserver = function(type, id, onCall) {
    switch(type) {
        case Listener.OBSERVER_TYPE.SINGLE: {
            this.singleObservers.push({
                "subscriber": id,
                "onCall": onCall
            });

            break;
        }
        default: {
            this.observers.push({
                "subscriber": id,
                "onCall": onCall
            });

            break; 
        }
    }
}

Listener.prototype.getFilteredObservers = function(oldList, onCheck) {
    const observers = [];

    for(let i = 0; i < oldList.length; i++) {
        const observer = oldList[i];
        const result = onCheck(observer);

        if(result) {
            observers.push(observer);
        }
    }

    return observers;
}

Listener.prototype.filterObservers = function(onCheck) {
    if(typeof onCheck !== "function") {
        return;
    }

    if(this.observers.length > 0) {
        this.observers = this.getFilteredObservers(this.observers, onCheck);
    }

    if(this.singleObservers.length > 0) {    
        this.singleObservers = this.getFilteredObservers(this.singleObservers, onCheck);
    }
}