export const HealthComponent = function() {
    this.maxHealth = 0;
    this.health = 0;
}

HealthComponent.prototype.save = function() {
    return {
        "maxHealth": this.maxHealth,
        "health": this.health
    }
}