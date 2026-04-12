const STORAGE_KEY = "notesapp-notes";

export default class NotesAPI {
    static hasNativeAPI() {
        return typeof window !== "undefined" && typeof window.electronAPI?.getNotes === "function";
    }

    static deriveTitle(body, sourceUrl) {
        if (sourceUrl) {
            try {
                return new URL(sourceUrl).hostname.replace(/^www\./, "");
            } catch (error) {
                // Fall back to the body text when the URL is not valid.
            }
        }

        const firstLine = typeof body === "string"
            ? body.split(/\r?\n/).map(line => line.trim()).find(Boolean)
            : "";

        return firstLine ? firstLine.slice(0, 60) : "New Note";
    }

    static normalizeNote(note = {}) {
        const body = typeof note.body === "string"
            ? note.body
            : typeof note.content === "string"
                ? note.content
                : "";
        const sourceUrl = typeof note.sourceUrl === "string" ? note.sourceUrl : "";
        const title = typeof note.title === "string" && note.title.trim()
            ? note.title.trim()
            : NotesAPI.deriveTitle(body, sourceUrl);
        const updated = typeof note.updated === "string"
            ? note.updated
            : typeof note.timestamp === "string"
                ? note.timestamp
                : new Date().toISOString();
        const fallbackId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        return {
            id: note.id != null ? String(note.id) : fallbackId,
            title,
            body,
            sourceUrl,
            updated
        };
    }

    static sortNotes(notes) {
        return [...notes].sort((left, right) => new Date(right.updated) - new Date(left.updated));
    }

    static readLocalNotes() {
        const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return NotesAPI.sortNotes(notes.map(note => NotesAPI.normalizeNote(note)));
    }

    static writeLocalNotes(notes) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.map(note => NotesAPI.normalizeNote(note))));
    }

    static async getAllNotes() {
        if (NotesAPI.hasNativeAPI()) {
            const result = await window.electronAPI.getNotes();
            if (!result?.ok) {
                return [];
            }

            return NotesAPI.sortNotes((result.data || []).map(note => NotesAPI.normalizeNote(note)));
        }

        return NotesAPI.readLocalNotes();
    }

    static async saveNote(noteToSave) {
        const normalized = NotesAPI.normalizeNote({
            ...noteToSave,
            updated: new Date().toISOString()
        });

        if (NotesAPI.hasNativeAPI() && typeof window.electronAPI.saveNote === "function") {
            const result = await window.electronAPI.saveNote(normalized);
            if (!result?.ok) {
                throw new Error(result?.error || "Unable to save note");
            }

            return result.data ? NotesAPI.normalizeNote(result.data) : normalized;
        }

        const notes = NotesAPI.readLocalNotes();
        const existingIndex = notes.findIndex(note => note.id === normalized.id);

        if (existingIndex >= 0) {
            notes.splice(existingIndex, 1);
        }

        notes.unshift(normalized);
        NotesAPI.writeLocalNotes(notes);
        return normalized;
    }

    static async addAutoSavedNote(content, sourceUrl) {
        if (NotesAPI.hasNativeAPI() && typeof window.electronAPI.addNote === "function") {
            const result = await window.electronAPI.addNote({ content, sourceUrl });
            if (!result?.ok) {
                throw new Error(result?.error || "Unable to auto-save note");
            }

            return Boolean(result.added);
        }

        const notes = NotesAPI.readLocalNotes();
        const latest = notes[0];
        if (latest && latest.body === content && latest.sourceUrl === (sourceUrl || "")) {
            return false;
        }

        const note = NotesAPI.normalizeNote({
            body: content,
            sourceUrl: sourceUrl || "",
            updated: new Date().toISOString()
        });
        notes.unshift(note);
        NotesAPI.writeLocalNotes(notes);
        return true;
    }

    static async deleteNote(id) {
        if (NotesAPI.hasNativeAPI() && typeof window.electronAPI.deleteNote === "function") {
            const result = await window.electronAPI.deleteNote(id);
            if (!result?.ok) {
                throw new Error(result?.error || "Unable to delete note");
            }
            return;
        }

        const notes = NotesAPI.readLocalNotes();
        const newNotes = notes.filter(note => note.id !== String(id));
        NotesAPI.writeLocalNotes(newNotes);
    }
}
