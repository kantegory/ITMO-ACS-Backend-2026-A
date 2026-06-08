package org.rentservice.service.User;


import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.rentservice.data.entity.User;
import org.rentservice.data.mapper.UserMapper;
import org.rentservice.data.request.UserUpdateRequest;
import org.rentservice.data.response.UserResponse;
import org.rentservice.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "User not found"));

        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAll() {

        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .toList();
    }

    @Override
    public UserResponse update(
            Long id,
            UserUpdateRequest request
    ) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "User not found"));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setMiddleName(request.getMiddleName());

        return userMapper.toResponse(
                userRepository.save(user)
        );
    }

    @Override
    public void delete(Long id) {

        userRepository.deleteById(id);
    }
}

