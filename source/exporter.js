export const InefficientJSONExporter = function(spacing) {
    this.spacing = spacing;
    this.jsonString = "";
    this.writes = 0;
    this.openLists = [];
}

InefficientJSONExporter.LIST_TYPE = {
    OBJECT: 0,
    ARRAY: 1
};

InefficientJSONExporter.prototype.pad = function(depth) {
    const whitespace = depth * this.spacing;

    for(let i = 0; i < whitespace; i++) {
        this.jsonString += " ";
    }
}

InefficientJSONExporter.prototype.newLine = function(depth) {
    if(this.openLists.length === 0) {
        if(this.writes > 0) {
            this.jsonString += ",\n";
        }
    } else {
        const list = this.openLists[this.openLists.length - 1];
        const { writes } = list;

        if(writes > 0) {
            this.jsonString += ",\n";
        }
    }

    this.pad(depth);
}

InefficientJSONExporter.prototype.newEmptyLine = function(depth) {
    this.jsonString += "\n";
    this.pad(depth);
}

InefficientJSONExporter.prototype.getJoinString = function(depth) {
    let join = ",\n";
    const whitespace = depth * this.spacing;

    for(let i = 0; i < whitespace; i++) {
        join += " ";
    }

    return join;
}

InefficientJSONExporter.prototype.open = function(depth = 0, name) {
    this.pad(depth);

    if(name) {
        this.jsonString += `"${name}": {\n`;
    } else {
        this.jsonString += "{\n";
    }

    return this;
}

InefficientJSONExporter.prototype.close = function(depth = 0) {
    while(this.openLists.length !== 0) {
        this.closeList();
    }

    this.newEmptyLine(depth);
    this.jsonString += "}";

    return this;
}

InefficientJSONExporter.prototype.writeLine = function(id, depth, data) {
    this.newLine(depth);
    this.jsonString += `"${id}": ${JSON.stringify(data)}`;

    if(this.openLists.length === 0) {
        this.writes++;
    } else {
        const list = this.openLists[this.openLists.length - 1];
        list.writes++;
    }

    return this;
}

InefficientJSONExporter.prototype.openList = function(id, depth, type) {
    if(type === undefined) {
        type = InefficientJSONExporter.LIST_TYPE.OBJECT;
    }

    switch(type) {
        case InefficientJSONExporter.LIST_TYPE.OBJECT: {
            this.newLine(depth);
            this.jsonString += `"${id}": {\n`;
            break;
        }
        case InefficientJSONExporter.LIST_TYPE.ARRAY: {
            this.newLine(depth);
            this.jsonString += `"${id}": [\n`;
            break;
        }
    }

    this.openLists.push({
        "type": type,
        "depth": depth,
        "writes": 0
    });

    return this;
}

InefficientJSONExporter.prototype.writeList = function(id, depth, jsonStrings, type) {
    const nestedDepth = depth + 1;
    const joinString = this.getJoinString(nestedDepth);
    const joined = jsonStrings.join(joinString);

    this.openList(id, depth, type);
    this.pad(nestedDepth);
    this.jsonString += joined;
    this.closeList();

    return this;
}

InefficientJSONExporter.prototype.closeList = function() {
    if(this.openLists.length === 0) {
        return this;
    }

    const list = this.openLists.pop();
    const { depth, type } = list;

    switch(type) {
        case InefficientJSONExporter.LIST_TYPE.OBJECT: {
            this.newEmptyLine(depth);
            this.jsonString += "}";
            break;
        }
        case InefficientJSONExporter.LIST_TYPE.ARRAY: {
            this.newEmptyLine(depth);
            this.jsonString += "]";
            break;
        }
    }

    if(this.openLists.length === 0) {
        this.writes++;
    } else {
        const list = this.openLists[this.openLists.length - 1];
        list.writes++;
    }

    return this;
}

InefficientJSONExporter.prototype.build = function() {
    return this.jsonString;
}

InefficientJSONExporter.prototype.reset = function() {
    this.openLists = [];
    this.jsonString = "";
    this.writes = 0;

    return this;
}

InefficientJSONExporter.prototype.download = function(filename) {
    const blob = new Blob([this.jsonString], { type: "text/json" });
    const link = document.createElement("a");
  
    link.download = `${filename}.json`;
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");
  
    const evt = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    });
  
    link.dispatchEvent(evt);
    link.remove();
}