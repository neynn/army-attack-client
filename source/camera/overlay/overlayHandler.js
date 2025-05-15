import { Overlay } from "./overlay.js";

export const OverlayHandler = function() {
    this.overlays = new Map();
}

OverlayHandler.prototype.getOverlay = function(overlayID) {
    const overlay = this.overlays.get(overlayID);

    if(!overlay) {
        return null;
    }

    return overlay;
}

OverlayHandler.prototype.clearOverlay = function(overlayID) {
    const overlay = this.overlays.get(overlayID);

    if(!overlay) {
        return;
    }

    overlay.clear();
}

OverlayHandler.prototype.deleteOverlay = function(overlayID) {
    if(!this.overlays.has(overlayID)) {
        return;
    }

    this.overlays.delete(overlayID);
}

OverlayHandler.prototype.createOverlay = function(overlayID) {
    if(this.overlays.has(overlayID)) {
        return;
    }

    this.overlays.set(overlayID, new Overlay());
}