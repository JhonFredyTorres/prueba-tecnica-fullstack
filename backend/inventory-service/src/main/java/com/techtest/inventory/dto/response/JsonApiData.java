package com.techtest.inventory.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonApiData<T> {

    private String type;
    private String id;
    private T attributes;

    public static <T> JsonApiData<T> of(String type, Long id, T attributes) {
        return JsonApiData.<T>builder()
                .type(type)
                .id(id != null ? id.toString() : null)
                .attributes(attributes)
                .build();
    }
}