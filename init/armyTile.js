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