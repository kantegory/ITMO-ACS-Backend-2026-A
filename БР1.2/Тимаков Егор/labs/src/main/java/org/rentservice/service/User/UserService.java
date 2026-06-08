package org.rentservice.service.User;

import org.rentservice.data.request.UserUpdateRequest;
import org.rentservice.data.response.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse getById(Long id);



    List<UserResponse> getAll();


    UserResponse update(
            Long id,
            UserUpdateRequest request

    );


    void delete(Long id);


}
