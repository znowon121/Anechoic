import App from "./App.js";

// Track whether the app has been initialized (avoid double-init)
let notesAppInstance = null;

/**
 * Initialize the notes app inside #notes-app-root.
 * Explicitly mounted on window so React (inside type="module") can call it.
 * Guarded against double-initialization.
 */
window.initNotesApp = function () {
    if (notesAppInstance) {
        // Already initialized — do nothing
        return;
    }

    const root = document.getElementById("notes-app-root");
    if (!root) {
        console.error("[NotesApp] #notes-app-root not found");
        return;
    }

    notesAppInstance = new App(root);
};

/**
 * Called by the copy-capture handler in index.html when text is copied in a webview.
 * Delegates to App.addNoteFromCopy() which checks isAutoSaveEnabled.
 * @returns {boolean} true if a note was saved
 */
window.notesAutoSave = function (text, url) {
    if (!notesAppInstance) {
        return false;
    }
    return notesAppInstance.addNoteFromCopy(text, url);
};

/**
 * Returns whether auto-save is currently enabled.
 */
window.isNotesAutoSaveEnabled = function () {
    if (!notesAppInstance) {
        return false;
    }
    return notesAppInstance.isAutoSaveEnabled;
};
