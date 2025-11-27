package com.techtest.inventory.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonApiErrorResponse {

    private List<JsonApiError> errors;

    public static JsonApiErrorResponse of(String status, String code, String title, String detail) {
        JsonApiError error = JsonApiError.builder()
                .status(status)
                .code(code)
                .title(title)
                .detail(detail)
                .timestamp(LocalDateTime.now())
                .build();

        return JsonApiErrorResponse.builder()
                .errors(Collections.singletonList(error))
                .build();
    }

    public static JsonApiErrorResponse ofList(List<JsonApiError> errors) {
        return JsonApiErrorResponse.builder()
                .errors(errors)
                .build();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class JsonApiError {
        private String status;
        private String code;
        private String title;
        private String detail;
        private String source;
        private LocalDateTime timestamp;
    }
}