export const AttackComponent = function() {
    this.damage = 0;
    this.range = 0;
}

AttackComponent.prototype.save = function() {
    return {
        "damage": this.damage,
        "range": this.range
    }
}