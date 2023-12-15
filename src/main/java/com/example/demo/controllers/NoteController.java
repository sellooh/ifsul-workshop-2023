package com.example.demo.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.boot.autoconfigure.data.web.SpringDataWebProperties.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entities.Note;
import com.example.demo.requests.CreateNoteInput;
import com.example.demo.services.NoteService;

@RestController
public class NoteController {
	public NoteService noteService;

	public NoteController(NoteService noteService) {
		this.noteService = noteService;
	}

	@PostMapping("/notes")
	public ResponseEntity<Note> createNote(@RequestBody CreateNoteInput createNoteInput) {
		Note noteCreated = noteService.create(createNoteInput.toNote());

		return new ResponseEntity<>(noteCreated, HttpStatus.CREATED);
	}

	@GetMapping("/notes")
	public ResponseEntity<Page<Note>> allNotes(@PageableDefault(size = 10) Pageable pageable) {
		Page<Note> notes = noteService.findAll(pageable);

		return new ResponseEntity<>(notes, HttpStatus.OK);
	}

	@GetMapping("/notes/X-total-count")
	public ResponseEntity<Long> countNotes() {
		Long notes = noteService.countAll();

		return new ResponseEntity<>(notes, HttpStatus.OK);
	}

	@GetMapping("/notes/{id}")
	public ResponseEntity<Note> oneNote(@PathVariable int id) {
		Optional<Note> optionalNote = noteService.findById(id);

		if (optionalNote.isPresent()) {
			return new ResponseEntity<>(optionalNote.get(), HttpStatus.OK);
		}

		return new ResponseEntity<>(HttpStatus.NOT_FOUND);
	}

	@PatchMapping("/notes/{id}/likes")
	public ResponseEntity<Note> updateNote(@PathVariable int id) {
		Optional<Note> optionalNote = noteService.findById(id);

		if (optionalNote.isEmpty()) {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}

		Note noteToUpdate = optionalNote.get();

		noteToUpdate.setLikes(noteToUpdate.getLikes() + 1);

		Note noteUpdated = noteService.update(noteToUpdate);

		return new ResponseEntity<>(noteUpdated, HttpStatus.OK);
	}
}
