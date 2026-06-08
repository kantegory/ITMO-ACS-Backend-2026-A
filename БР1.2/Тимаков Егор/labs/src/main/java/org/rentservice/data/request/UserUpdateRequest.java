package org.rentservice.data.request;


import lombok.Data;

@Data
public class UserUpdateRequest {

    private String firstName;

    private String lastName;

    private String middleName;
}
