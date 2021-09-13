export function isDocHidden() {
    const keys = ['hidden', 'webkitHidden', 'mozHidden'] as const;
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        if (key in document) {
            return document[key];
        }
    }
    return false;
}

export function isIDR(array: Uint8Array): boolean {
    var i = 0,
        len = array.byteLength,
        value,
        state = 0; //state = this.avcNaluState;
    var unitType;
    let isIDRFrame = false;
    while (i < len) {
        value = array[i++];
        // finding 3 or 4-byte start codes (00 00 01 OR 00 00 00 01)
        switch (state) {
            case 0:
                if (value === 0) {
                    state = 1;
                }
                break;
            case 1:
                if (value === 0) {
                    state = 2;
                } else {
                    state = 0;
                }
                break;
            case 2:
            case 3:
                if (value === 0) {
                    state = 3;
                } else if (value === 1 && i < len) {
                    unitType = array[i] & 0x1f;
                    if (unitType === 5 || unitType === 7 || unitType === 8) {
                        isIDRFrame = true;
                    }
                } else {
                    isIDRFrame = false;
                }
                return isIDRFrame;
            default:
                return isIDRFrame;
        }
    }
    return isIDRFrame;
}
