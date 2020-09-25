class ClientLoginForm {
    API: Api;

    constructor() {
        this.API = Api.getInstance();
    }

    init(): void {
        let form = $('#i-login-form');
        let self = this;

        form.validator().on(
            'submit',
            function (e) {
                if (e.isDefaultPrevented()) {
                    // Handle the invalid form...
                } else {
                    // Everything looks good!
                    let phone = $('[name="phone"]').val();
                    let pwd = $('[name="pwd"]').val();

                    let uri = 'clients/generate_auth_token';
                    self.API.post(
                        uri,
                        {
                            'phone': phone,
                            'pwd': pwd
                        },
                        function (token) {
                            Api.rememberToken(token);
                            window.location.replace("/user/dashboard");
                        },
                        function (error) {
                            let errExample = $('#i-error-message-example');
                            let errBlock = $('#i-error-message');
                            errBlock.html(errExample.html());
                            errBlock.hide().find('.alert-content').html(error);
                            errBlock.fadeIn();
                        }
                    )
                }
                return false;
            }
        );
    }
}
