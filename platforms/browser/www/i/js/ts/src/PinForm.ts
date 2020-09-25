class PinForm {
    API: Api;

    constructor() {
        this.API = Api.getInstance();
    }

    private checkPinCodeForm(): void {
        let hasEmptyInput = false;
        $('.input-focus-sequence').each(function () {
            let val = <string>$(this).val();
            if (!val.length) {
                hasEmptyInput = true;
            }
        });
        if (!hasEmptyInput) {
            $('#request-form_phone-verification').submit();
        }
    }

    // Sequence inputs ( [*][*][*][*] ) for insert code from SMS
    private activatedInputFocusSequence(): void {
        let self = this;

        $('.input-focus-sequence').each(function () {
            $(this).on(
                'input',
                function () {
                    let cur = $(this).val();
                    let curLen = (<string>cur).length;
                    let maxLen = +$(this).attr('maxlength');
                    if (curLen >= maxLen) {
                        let nextElement = $(this).data('next-focus');
                        $(nextElement).trigger('focus');
                    }
                    self.checkPinCodeForm();
                }
            );

            $(this).on(
                'onpaste',
                function (e) {
                    var max = $(this).attr("maxlength");
                    e.originalEvent["clipboardData"].getData('text/plain').slice(0, max);
                }
            )
        });
    }

    resendPinCodeTimer = null;

    startResendPinCodeTimer() {
        let delayTimer = 60;
        let self = this;
        self.resendPinCodeTimer = setInterval(
            function () {
                let dateObj = new Date(delayTimer * 1000);
                let min = dateObj.getUTCMinutes().toString().padStart(2, '0');
                let sec = dateObj.getSeconds().toString().padStart(2, '0');
                $('#i-resend-sms-timer').html(
                    min + ':' + sec
                );
                delayTimer--;
                if (delayTimer <= 0) {
                    clearInterval(self.resendPinCodeTimer);
                    $('.is-wait-resend-sms-code-message').slideUp();
                    $('.is-resend-sms-code-message').slideDown();
                }
            },
            1000
        );
    }

    resendPinCode() {
        let form = $('#request-form_step-3');
        let self = this;
        let phone: string = <string>form.find('[name="phone"]').val();
        phone = PhoneFilter(phone);

        self.API.post(
            'clients/send_pin',
            {
                phone: phone
            },
            () => {
                $('.is-wait-resend-sms-code-message').slideDown();
                $('.is-resend-sms-code-message').slideUp();
                self.startResendPinCodeTimer();
            },
            () => {
            }
        )
    }

    getFullCode(form): string {
        let code = '';
        let codes = [];
        for (let i = 1; i <= 4; i++) {
            codes.push(
                form.find('[name="code_' + i + '"]').val()
            );
            code = codes.join('');
        }
        return code;
    }

    init(form, successCallback, errorCallback): void {
        let self = this;

        this.activatedInputFocusSequence();

        // Hidden error message if user correct pin
        $('.phone-verification-block_input').on(
            'change',
            function () {
                $('.phone-verification-block_error-block').hide();
            }
        );

        // Click resend pin-code
        $('.is-resend-sms-code-message button').on(
            'click',
            function () {
                self.resendPinCode();
            }
        )

        form.validator().on(
            'submit',
            function (e) {
                if (e.isDefaultPrevented()) {
                    // Handle the invalid form...
                } else {
                    // Everything looks good!
                    let phone = $('[name="phone"]').val();
                    let code = self.getFullCode(form);

                    // Check Pin
                    self.API.post(
                        'clients/is_correct_pin',
                        {
                            phone: phone,
                            code: code
                        },
                        successCallback,
                        errorCallback
                    );
                }
                return false;
            }
        );
    }
}
