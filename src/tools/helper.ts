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
