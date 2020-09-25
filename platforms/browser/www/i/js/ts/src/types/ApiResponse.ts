interface ApiResponse {
    is_success: boolean;
    is_error: boolean;
    data: any;
}

function IsApiResponse(object): boolean {
    let is = true;
    if (object && typeof object === 'object') {
        let fields = [
            'is_success', 'is_error', 'data'
        ];
        for (let k in fields) {
            let field = fields[k];
            if (!(field in object)) {
                is = false;
                break;
            }
        }
    } else {
        is = false;
    }
    return is;
}

function ToApiResponse(data): ApiResponse {
    return {
        is_success: false,
        is_error: false,
        data: data
    };
}
