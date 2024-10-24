import { Tile } from "../source/tile/tile.js";

export const ArmyTile = function() {
    Tile.call(this);

    this.team = null;
    this.passability = null;
    this.hasAutoCapture = false;
    this.hasBorder = false;
}

ArmyTile.prototype = Object.create(Tile.prototype);
ArmyTile.prototype.constructor = ArmyTile;

ArmyTile.prototype.getAutoCapture = function() {
    return this.hasAutoCapture;
}

ArmyTile.prototype.getBorder = function() {
    return this.hasBorder;
}

ArmyTile.prototype.getTeam = function() {
    return this.team;
}

ArmyTile.prototype.getPassability = function() {
    return this.passability;
}