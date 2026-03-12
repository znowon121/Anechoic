import NotesView from "./NotesView.js";
import NotesAPI from "./NotesAPI.js";

export default class App {
    constructor(root) {
        this.notes = [];
        this.activeNote = null;
        this.isAutoSaveEnabled = localStorage.getItem("notesapp-autosave") === "true";
        this.view = new NotesView(root, this._handlers(), this.isAutoSaveEnabled);

        this._refreshNotes();
    }

    _refreshNotes() {
        const notes = NotesAPI.getAllNotes();

        this._setNotes(notes);

        if (notes.length > 0) {
            this._setActiveNote(notes[0]);
        }
    }

    _setNotes(notes) {
        this.notes = notes;
        this.view.updateNoteList(notes);
        this.view.updateNotePreviewVisibility(notes.length > 0);
    }

    _setActiveNote(note) {
        this.activeNote = note;
        this.view.updateActiveNote(note);
    }

    /**
     * Called externally (via window.notesAutoSave) when text is copied in a webview.
     * Saves as a note only if auto-save is enabled.
     * @returns {boolean} true if a note was saved
     */
    addNoteFromCopy(text, url) {
        if (!this.isAutoSaveEnabled) {
            return false;
        }

        NotesAPI.saveNote({
            title: url || "Copied Text",
            body: text
        });

        this._refreshNotes();
        return true;
    }

    _handlers() {
        return {
            onNoteSelect: noteId => {
                const selectedNote = this.notes.find(note => note.id == noteId);
                this._setActiveNote(selectedNote);
            },
            onNoteAdd: () => {
                const newNote = {
                    title: "New Note",
                    body: "Take note..."
                };

                NotesAPI.saveNote(newNote);
                this._refreshNotes();
            },
            onNoteEdit: (title, body) => {
                NotesAPI.saveNote({
                    id: this.activeNote.id,
                    title,
                    body
                });

                this._refreshNotes();
            },
            onNoteDelete: noteId => {
                NotesAPI.deleteNote(noteId);
                this._refreshNotes();
            },
            onAutoSaveToggle: () => {
                this.isAutoSaveEnabled = !this.isAutoSaveEnabled;
                localStorage.setItem("notesapp-autosave", this.isAutoSaveEnabled.toString());
                this.view.updateAutoSaveToggle(this.isAutoSaveEnabled);
            },
        };
    }
}
