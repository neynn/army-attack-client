export const AttackComponent = function() {
    this.damage = 0;
    this.range = 0;
    this.type = AttackComponent.ATTACK_TYPE_PASSIVE;
}

AttackComponent.ATTACK_TYPE_PASSIVE = 0;
AttackComponent.ATTACK_TYPE_ACTIVE = 1;

AttackComponent.prototype.toPassive = function() {
    this.type = AttackComponent.ATTACK_TYPE_PASSIVE;
}

AttackComponent.prototype.toActive = function() {
    this.type = AttackComponent.ATTACK_TYPE_ACTIVE;
}

AttackComponent.prototype.getDamage = function(armor) {
    const damage = this.damage - armor;

    if(damage < 0) {
        return 0;
    }

    return damage;
}

AttackComponent.prototype.save = function() {
    return {
        "damage": this.damage,
        "range": this.range
    }
}

AttackComponent.create = function(config = {}) {
    const attackComponent = new AttackComponent();
    const {
        damage = 0,
        attackRange = 0
    } = config;

    attackComponent.damage = damage;
    attackComponent.range = attackRange;

    return attackComponent;
}