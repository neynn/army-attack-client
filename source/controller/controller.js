export const Controller = function(id) {
    this.id = id;
    this.config = {};
}

Controller.prototype.getID = function() {
    return this.id;
}

Controller.prototype.update = function(gameContext) {

}

Controller.prototype.onCreate = function(gameContext, config) {

}

Controller.prototype.setConfig = function(config) {
    if(config !== undefined) {
        this.config = config;
    }
} 

Controller.prototype.getConfig = function() {
    return this.config;
}