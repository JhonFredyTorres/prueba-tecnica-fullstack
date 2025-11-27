package com.techtest.inventory.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonApiResponse<T> {

    private JsonApiData<T> data;

    public static <T> JsonApiResponse<T> of(String type, Long id, T attributes) {
        return JsonApiResponse.<T>builder()
                .data(JsonApiData.of(type, id, attributes))
                .build();
    }
}