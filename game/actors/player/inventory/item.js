import { clampValue } from "../../../../source/math/math.js";

export const Item = function() {
    this.count = 0;
    this.maxCount = 0;
    this.maxDrop = 1;
}

Item.prototype.has = function(value) {
    return this.count >= value;
}

Item.prototype.add = function(value) {
    this.count = clampValue(this.count + value, this.maxCount, 0);
}

Item.prototype.remove = function(value) {
    this.count = clampValue(this.count - value, this.maxCount, 0);
}

Item.prototype.setMaxDrop = function(maxDrop) {
    if(maxDrop > 0) {
        this.maxDrop = maxDrop;
    }
}

Item.prototype.setMaxCount = function(maxCount) {
    if(maxCount > 0) {
        this.maxCount = maxCount;
    }
}

Item.prototype.setCount = function(count) {
    if(count < this.maxCount) {
        this.count = count;
    }
}