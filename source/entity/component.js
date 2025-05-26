export const Component = function(instance) {
    this.instance = instance;

    if(typeof instance.prototype.update === "function") {
        this.type = Component.TYPE.ACTIVE;
    } else {
        this.type = Component.TYPE.INACTIVE;
    }
}

Component.TYPE = {
    INACTIVE: 0,
    ACTIVE: 1
};

Component.prototype.isActive = function() {
    return this.type === Component.TYPE.ACTIVE;
}

Component.prototype.createInstance = function() {
    const Instance = new this.instance();

    return Instance;
}