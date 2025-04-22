export const Brush = function() {
    this.size = 0;
    this.id = -1;
    this.name = "";
    this.pallet = [];
    this.palletSize = 0;
}

/*
MapEditor.prototype.getDrawPage = function() {
    const pageElements = []; 
    const modeElements = this.getModeElements();

    if(!this.brushSet) {
        for(let i = 0; i < this.slots.length; i++) {
            pageElements.push(this.createBrush(0, "NONE"));
        }

        return pageElements;
    }

    const { values } = this.brushSet;

    for(let i = 0; i < this.slots.length; i++) {
        const index = this.slots.length * this.pageIndex + i;

        if(index > modeElements.length - 1) {
            pageElements.push(this.createBrush(0, "NONE"));

            continue;
        }

        const tileName = modeElements[index];
        const tileID = values[tileName];
        
        pageElements.push(this.createBrush(tileID, tileName));
    }

    return pageElements;
}
*/

Brush.prototype.createPallet = function() {

}

Brush.prototype.selectFromPallet = function(index) {
    if(index < 0 || index >= this.pallet) {
        return;
    }

    const { name, id } = this.pallet;

    this.id = id;
    this.name = name;
}

Brush.prototype.paint = function(tileX, tileY, onPaint) {
    if(typeof onPaint !== "function") {
        return;
    }

    const startX = tileX - this.size;
    const startY = tileY - this.size;
    const endX = tileX + this.size;
    const endY = tileY + this.size;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            onPaint(j, i, this.id, this.name);
        }
    }
}