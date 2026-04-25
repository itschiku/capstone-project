package com.capstone.repository;

import com.capstone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    
    // Get users sorted by id in descending order (newest first)
    List<User> findAll(Sort sort);
}
