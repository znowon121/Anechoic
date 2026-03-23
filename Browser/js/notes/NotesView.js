export default class NotesView {
    constructor(root, { onNoteSelect, onNoteAdd, onNoteEdit, onNoteDelete, onAutoSaveToggle } = {}, isAutoSaveEnabled = false) {
        this.root = root;
        this.onNoteSelect = onNoteSelect;
        this.onNoteAdd = onNoteAdd;
        this.onNoteEdit = onNoteEdit;
        this.onNoteDelete = onNoteDelete;
        this.onAutoSaveToggle = onAutoSaveToggle;
        this.root.innerHTML = `
            <div class="notes__sidebar">
                <button class="notes__autosave-toggle ${isAutoSaveEnabled ? 'notes__autosave-toggle--active' : ''}" type="button">
                    <span class="notes__autosave-icon">${isAutoSaveEnabled ? '✅' : '📋'}</span>
                    Auto Save Copy Link
                </button>
                <button class="notes__add" type="button">Add Note</button>
                <div class="notes__list"></div>
            </div>
            <div class="notes__preview">
                <div class="notes__title-wrapper" style="display: flex; gap: 12px; align-items: center; width: 100%;">
                    <input class="notes__title" type="text" placeholder="New Note..." style="flex: 1; min-width: 0;">
                    <button class="notes__open-btn" style="display: none;" title="Open Source Link">🌐 Open</button>
                </div>
                <textarea class="notes__body">Take Note...</textarea>
            </div>
        `;

        const btnAutoSave = this.root.querySelector(".notes__autosave-toggle");
        const btnAddNote = this.root.querySelector(".notes__add");
        const inpTitle = this.root.querySelector(".notes__title");
        const inpBody = this.root.querySelector(".notes__body");

        const btnOpen = this.root.querySelector(".notes__open-btn");
        btnOpen.addEventListener("click", () => {
            const url = btnOpen.dataset.url;
            if (url) {
                window.dispatchEvent(new CustomEvent('ANECHOIC_NAVIGATE', { detail: url }));
            }
        });

        btnAutoSave.addEventListener("click", () => {
            this.onAutoSaveToggle();
        });

        btnAddNote.addEventListener("click", () => {
            this.onNoteAdd();
        });

        [inpTitle, inpBody].forEach(inputField => {
            inputField.addEventListener("blur", () => {
                const updatedTitle = inpTitle.value.trim();
                const updatedBody = inpBody.value.trim();

                this.onNoteEdit(updatedTitle, updatedBody);
            });
        });

        this.updateNotePreviewVisibility(false);
    }

    _createListItemHTML(id, title, body, updated) {
        const MAX_BODY_LENGTH = 60;

        return `
            <div class="notes__list-item" data-note-id="${id}">
                <div class="notes__small-title">${title}</div>
                <div class="notes__small-body">
                    ${body.substring(0, MAX_BODY_LENGTH)}
                    ${body.length > MAX_BODY_LENGTH ? "..." : ""}
                </div>
                <div class="notes__small-updated">
                    <div class="notes__updated-date">${updated.toLocaleDateString(undefined, { dateStyle: "long" })}</div>
                    <div class="notes__updated-time">${updated.toLocaleTimeString(undefined, { timeStyle: "short" })}</div>
                </div>
            </div>
        `;
    }

    updateNoteList(notes) {
        const notesListContainer = this.root.querySelector(".notes__list");

        // Empty list
        notesListContainer.innerHTML = "";

        for (const note of notes) {
            const html = this._createListItemHTML(note.id, note.title, note.body, new Date(note.updated));

            notesListContainer.insertAdjacentHTML("beforeend", html);
        }

        // Add select/delete events for each list item
        notesListContainer.querySelectorAll(".notes__list-item").forEach(noteListItem => {
            noteListItem.addEventListener("click", () => {
                this.onNoteSelect(noteListItem.dataset.noteId);
            });

            noteListItem.addEventListener("dblclick", () => {
                const doDelete = confirm("Are you sure you want to delete this note?");

                if (doDelete) {
                    this.onNoteDelete(noteListItem.dataset.noteId);
                }
            });
        });
    }

    updateActiveNote(note) {
        this.root.querySelector(".notes__title").value = note.title;
        this.root.querySelector(".notes__body").value = note.body;

        const btnOpen = this.root.querySelector(".notes__open-btn");
        const sourceMatch = note.body.match(/Source:\s*(https?:\/\/[^\s]+)/);
        if (sourceMatch && sourceMatch[1]) {
            btnOpen.style.display = "block";
            btnOpen.dataset.url = sourceMatch[1];
        } else {
            btnOpen.style.display = "none";
            btnOpen.dataset.url = "";
        }

        this.root.querySelectorAll(".notes__list-item").forEach(noteListItem => {
            noteListItem.classList.remove("notes__list-item--selected");
        });

        this.root.querySelector(`.notes__list-item[data-note-id="${note.id}"]`).classList.add("notes__list-item--selected");
    }

    updateNotePreviewVisibility(visible) {
        this.root.querySelector(".notes__preview").style.visibility = visible ? "visible" : "hidden";
    }

    updateAutoSaveToggle(enabled) {
        const btn = this.root.querySelector(".notes__autosave-toggle");
        const icon = btn.querySelector(".notes__autosave-icon");
        if (enabled) {
            btn.classList.add("notes__autosave-toggle--active");
            icon.textContent = "✅";
        } else {
            btn.classList.remove("notes__autosave-toggle--active");
            icon.textContent = "📋";
        }
    }
}
