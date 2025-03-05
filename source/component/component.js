export const Component = function() {}

Component.prototype.save = function() {
    console.log("Save not implemented for:", this);
}

Component.prototype.load = function(blob) {
    console.log("Load not implemented for:", this);
}

Component.prototype.init = function(data) {
    console.log("Init not implemented for:", this);
}