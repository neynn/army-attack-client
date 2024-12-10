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

HealthComponent.create = function(setup = {}) {
    const healthComponent = new HealthComponent();
    const { health } = setup;

    healthComponent.health = health ?? 0;
    healthComponent.maxHealth = health ?? 0;

    if(healthComponent.health < 1) {
        health.health = 1;
    }
    
    return healthComponent;
}