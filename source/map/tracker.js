export const Tracker = function() {
    this.lists = new Map();
}

Tracker.prototype.addElement = function(listID, element) {
    const list = this.lists.get(listID);

    if(!list) {
        this.lists.set(listID, [element]);
    } else {
        list.push(element);
    }
}

Tracker.prototype.removeElement = function(listID, element) {
    const list = this.lists.get(listID);

    if(!list) {
        return;
    }

    for(let i = 0; i < list.length; i++) {
        const entry = list[i];

        if(entry === element) {
            list.splice(i, 1);
            break;
        }
    }

    if(list.length === 0) {
        this.lists.delete(listID);
    }
}

Tracker.prototype.getList = function(listID) {
    const list = this.lists.get(listID);

    if(!list) {
        return [];
    }

    return list;
}

Tracker.prototype.getTopElement = function(listID) {
    const list = this.lists.get(listID);

    if(!list || list.length === 0) {
        return null;
    }

    return list[list.length - 1];
}

Tracker.prototype.getBottomElement = function(listID) {
    const list = this.lists.get(listID);

    if(!list || list.length === 0) {
        return null;
    }

    return list[0];
}

Tracker.prototype.isListActive = function(listID) {
    const list = this.lists.get(listID);

    if(!list) {
        return false;
    }

    return list.length > 0;
}