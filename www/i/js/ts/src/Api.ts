class Api {
    // @ts-ignore
    static readonly ROOT_URL = API_ROOT_URL;

    static readonly TOKEN_COOKIE_NAME = "api_auth_token";

    static readonly TOKEN_COOKIE_EXPIRED_TIME_IN_DAYS = 365;

    private readonly CONF_TIMEOUT = 5000;

    private static instance = null;

    private constructor() {
    }

    static getInstance() {
        if (!Api.instance) {
            Api.instance = new Api();
        }
        return Api.instance;
    }

    static rememberToken(token): void {
        setCookie(Api.TOKEN_COOKIE_NAME, token, Api.TOKEN_COOKIE_EXPIRED_TIME_IN_DAYS);
    }

    static forgotToken(): void {
        removeCookie(Api.TOKEN_COOKIE_NAME);
    }

    private static prepareResponse(response): ApiResponse {
        if (!IsApiResponse(response)) {
            response = ToApiResponse(response);
            response.is_error = true;
        }
        return response;
    }

    private call(uri: string, method: string, data, successCallback, errorCallback): void {
        $.ajax({
            beforeSend(jqXHR, settings) {
                jqXHR.setRequestHeader('API-Request-Time', Math.floor(Date.now() / 1000).toString());

                let token = getCookie(Api.TOKEN_COOKIE_NAME);
                if (token) {
                    jqXHR.setRequestHeader('X-Auth-Token', token);
                }
            },
            complete: () => {
            },
            cache: false,
            dataType: "json",
            timeout: this.CONF_TIMEOUT,
            method: method,
            url: `${Api.ROOT_URL}${uri}`,
            data: data,
            success: function (data, textStatus, jqXHR) {
                let response: ApiResponse = Api.prepareResponse(data);
                if (response.is_success) {
                    successCallback(response.data, response, textStatus);
                }
                if (response.is_error) {
                    errorCallback(response.data, response, textStatus);
                }
            },
            error: function (xhr) {
                let data = (typeof xhr.responseJSON.data !== "undefined") ? xhr.responseJSON.data : null;
                errorCallback(data, xhr.responseJSON, xhr.responseJSON.statusText);
            }
        });
    }

    get(uri: string, data, successCallback, errorCallback) {
        this.call(uri, 'GET', data, successCallback, errorCallback);
    }

    // Создание ресурса
    post(uri: string, data, successCallback, errorCallback) {
        this.call(uri, 'POST', data, successCallback, errorCallback);
    }

    // Замена ресурса целиком
    put(uri: string, data, successCallback, errorCallback) {
        this.call(uri, 'PUT', data, successCallback, errorCallback);
    }

    // Редактирование ресурса
    patch(uri: string, data, successCallback, errorCallback) {
        this.call(uri, 'PATCH', data, successCallback, errorCallback);
    }

    delete(uri: string, data, successCallback, errorCallback) {
        this.call(uri, 'DELETE', data, successCallback, errorCallback);
    }
}
