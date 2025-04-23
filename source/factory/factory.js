export const Factory = function(DEBUG_NAME) {
    this.DEBUG_NAME = DEBUG_NAME;
    this.failCount = 0;
    this.successCount = 0;
}

Factory.prototype.onCreate = function(gameContext, config) {}

Factory.prototype.create = function(gameContext, config) {
    const product = this.onCreate(gameContext, config);

    if(!product) {
        this.failCount++;

        return null;
    }

    this.successCount++;

    return product;
} 