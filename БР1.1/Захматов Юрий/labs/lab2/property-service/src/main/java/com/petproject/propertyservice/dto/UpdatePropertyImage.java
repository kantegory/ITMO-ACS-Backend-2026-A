package com.petproject.propertyservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class UpdatePropertyImage {
    private List<String> images;
}
