export const Listener = function(type) {
    this.id = type;
    this.observers = [];
    this.singleObservers = [];
}

Listener.OBSERVER_TYPE = {
    DEFAULT: 0,
    SINGLE: 1
};

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

Listener.prototype.filterObservers = function(onCheck) {
    if(this.observers.length > 0) {
        const observers = [];

        for(let i = 0; i < this.observers.length; i++) {
            const observer = this.observers[i];
            const result = onCheck(observer);
    
            if(result) {
                observers.push(observer);
            }
        }
    
        this.observers = observers;
    }

    if(this.singleObservers.length > 0) {
        const observers = [];
    
        for(let i = 0; i < this.singleObservers.length; i++) {
            const observer = this.singleObservers[i];
            const result = onCheck(observer);
    
            if(result) {
                observers.push(observer);
            }
        }
    
        this.singleObservers = observers;
    }
}