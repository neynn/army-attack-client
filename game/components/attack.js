export const AttackComponent = function() {
    this.damage = 0;
    this.range = 0;
    this.type = AttackComponent.ATTACK_TYPE_PASSIVE;
}

AttackComponent.ATTACK_TYPE_PASSIVE = 0;
AttackComponent.ATTACK_TYPE_ACTIVE = 1;

AttackComponent.prototype.save = function() {
    return {
        "damage": this.damage,
        "range": this.range
    }
}

AttackComponent.create = function(setup = {}) {
    const attackComponent = new AttackComponent();
    const { damage, attackRange } = setup;

    attackComponent.damage = damage ?? 0;
    attackComponent.range = attackRange ?? 0;

    return attackComponent;
}