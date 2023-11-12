package com.example.demo.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.demo.entities.Note;
import com.example.demo.repositories.NoteRepository;

@Service
public class NoteService {
    private final NoteRepository NoteRepository;

    public NoteService(NoteRepository NoteRepository) {
        this.NoteRepository = NoteRepository;
    }

    public Note create(Note Note) {
        return NoteRepository.save(Note);
    }

    public List<Note> findAll() {
        List<Note> Notes = new ArrayList<>();
        NoteRepository.findAll().forEach(Notes::add);

        return Notes;
    }

    public Optional<Note> findById(int id) {
        return NoteRepository.findById(id);
    }

    public Note update(Note NoteToUpdate) {
        return NoteRepository.save(NoteToUpdate);
    }

    public void delete(int id) {
        NoteRepository.deleteById(id);
    }
}
