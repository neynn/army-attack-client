export const Component = function(instance) {
    this.instance = instance;
}

Component.prototype.createInstance = function() {
    const Instance = new this.instance();

    return Instance;
}