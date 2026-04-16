import NotesView from "./NotesView.js";
import NotesAPI from "./NotesAPI.js";

export default class App {
    constructor(root) {
        this.notes = [];
        this.activeNote = null;
        this.isAutoSaveEnabled = localStorage.getItem("notesapp-autosave") === "true";
        this.view = new NotesView(root, this._handlers(), this.isAutoSaveEnabled);

        void this._refreshNotes();
    }

    async _refreshNotes(preferredNoteId = this.activeNote?.id) {
        const notes = await NotesAPI.getAllNotes();

        this._setNotes(notes);

        const nextActiveNote = notes.find(note => note.id == preferredNoteId) || notes[0] || null;
        if (nextActiveNote) {
            this._setActiveNote(nextActiveNote);
        } else {
            this.activeNote = null;
            this.view.clearActiveNote();
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

    async addNoteFromCopy(text, url) {
        if (!this.isAutoSaveEnabled) {
            return false;
        }

        const saved = await NotesAPI.addAutoSavedNote(text, url);
        if (saved) {
            await this._refreshNotes();
        }

        return saved;
    }

    _handlers() {
        return {
            onNoteSelect: noteId => {
                const selectedNote = this.notes.find(note => note.id == noteId);
                if (selectedNote) {
                    this._setActiveNote(selectedNote);
                }
            },
            onNoteAdd: async () => {
                const savedNote = await NotesAPI.saveNote({
                    title: "New Note",
                    body: "Take note...",
                    sourceUrl: ""
                });

                await this._refreshNotes(savedNote.id);
            },
            onNoteEdit: async (title, body) => {
                if (!this.activeNote) {
                    return;
                }

                const savedNote = await NotesAPI.saveNote({
                    id: this.activeNote.id,
                    title,
                    body,
                    sourceUrl: this.activeNote.sourceUrl || ""
                });

                await this._refreshNotes(savedNote.id);
            },
            onNoteDelete: async noteId => {
                await NotesAPI.deleteNote(noteId);
                await this._refreshNotes();
            },
            onAutoSaveToggle: () => {
                this.isAutoSaveEnabled = !this.isAutoSaveEnabled;
                localStorage.setItem("notesapp-autosave", this.isAutoSaveEnabled.toString());
                this.view.updateAutoSaveToggle(this.isAutoSaveEnabled);
            }
        };
    }
}
