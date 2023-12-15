package com.example.demo.repositories;

import com.example.demo.entities.Note;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NoteRepository extends CrudRepository<Note, Integer> {
  List<Note> findAll(Pageable pageable);
}
