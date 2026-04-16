const STORAGE_KEY = "notesapp-notes";
const NOTE_DEFAULT_TITLE = "New Note";
const LEGACY_LONG_TITLE_THRESHOLD = 56;

export default class NotesAPI {
    static hasNativeAPI() {
        return typeof window !== "undefined" && typeof window.electronAPI?.getNotes === "function";
    }

    static isSourceBasedTitle(title, sourceUrl) {
        if (typeof title !== "string" || typeof sourceUrl !== "string") {
            return false;
        }

        const normalizedTitle = title.trim();
        const normalizedSourceUrl = sourceUrl.trim();
        if (!normalizedTitle || !normalizedSourceUrl) {
            return false;
        }

        if (normalizedTitle === normalizedSourceUrl || normalizedTitle === normalizedSourceUrl.replace(/\/$/, "")) {
            return true;
        }

        try {
            const parsed = new URL(normalizedSourceUrl);
            const hostname = parsed.hostname.replace(/^www\./, "");
            const fullHref = parsed.href.trim();
            const fullHrefWithoutSlash = fullHref.replace(/\/$/, "");

            return normalizedTitle === parsed.hostname
                || normalizedTitle === hostname
                || normalizedTitle === fullHref
                || normalizedTitle === fullHrefWithoutSlash;
        } catch (error) {
            return false;
        }
    }

    static isUrlLikeTitle(title) {
        if (typeof title !== "string") {
            return false;
        }
        const normalized = title.trim();
        if (!normalized) {
            return false;
        }
        if (/^(https?:\/\/|www\.)/i.test(normalized)) {
            return true;
        }
        return /\bhttps?:\/\//i.test(normalized);
    }

    static isHostnameLikeTitle(title) {
        if (typeof title !== "string") {
            return false;
        }
        const normalized = title.trim();
        if (!normalized || /\s/.test(normalized)) {
            return false;
        }
        return /^([a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(\/\S*)?$/i.test(normalized);
    }

    static deriveLegacyBodyTitle(body) {
        if (typeof body !== "string") {
            return "";
        }
        const firstLine = body
            .split(/\r?\n/)
            .map(line => line.trim())
            .find(Boolean);
        if (!firstLine) {
            return "";
        }
        return firstLine
            .replace(/^#{1,6}\s+/, "")
            .replace(/^>\s+/, "")
            .replace(/^[-*]\s+/, "")
            .replace(/^\d+[.)]\s+/, "")
            .trim()
            .slice(0, 60);
    }

    static shouldNormalizeLegacyTitle(title, body, sourceUrl) {
        if (!sourceUrl || typeof title !== "string") {
            return false;
        }

        const normalizedTitle = title.trim();
        if (!normalizedTitle) {
            return false;
        }

        if (
            NotesAPI.isSourceBasedTitle(normalizedTitle, sourceUrl)
            || NotesAPI.isUrlLikeTitle(normalizedTitle)
            || NotesAPI.isHostnameLikeTitle(normalizedTitle)
        ) {
            return true;
        }

        const legacyBodyTitle = NotesAPI.deriveLegacyBodyTitle(body);
        if (
            legacyBodyTitle
            && normalizedTitle === legacyBodyTitle
            && normalizedTitle.length >= LEGACY_LONG_TITLE_THRESHOLD
        ) {
            return true;
        }

        return false;
    }

    static deriveTitle(body, sourceUrl, options = {}) {
        const fallbackTitle = typeof options.fallbackTitle === "string" && options.fallbackTitle.trim()
            ? options.fallbackTitle.trim()
            : NOTE_DEFAULT_TITLE;
        return fallbackTitle;
    }

    static normalizeNote(note = {}) {
        const body = typeof note.body === "string"
            ? note.body
            : typeof note.content === "string"
                ? note.content
                : "";
        const sourceUrl = typeof note.sourceUrl === "string" ? note.sourceUrl : "";
        const hasExplicitTitle = typeof note.title === "string";
        let title = hasExplicitTitle
            ? note.title
            : NotesAPI.deriveTitle(body, sourceUrl);
        if (sourceUrl && hasExplicitTitle && NotesAPI.shouldNormalizeLegacyTitle(title, body, sourceUrl)) {
            title = NotesAPI.deriveTitle(body, sourceUrl, {
                fallbackTitle: NOTE_DEFAULT_TITLE
            });
        }
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
