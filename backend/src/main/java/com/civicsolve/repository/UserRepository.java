package com.civicsolve.repository;

import com.civicsolve.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(User.UserRole role);
    List<User> findByActiveTrue();
}
