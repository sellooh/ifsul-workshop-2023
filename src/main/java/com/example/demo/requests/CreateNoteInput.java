package com.example.demo.requests;

import com.example.demo.entities.Note;

public record CreateNoteInput(String name) {
	public Note toNote() {
		Note note = new Note();

		note.setName(name);
		note.setLikes(0);

		return note;
	}
}
