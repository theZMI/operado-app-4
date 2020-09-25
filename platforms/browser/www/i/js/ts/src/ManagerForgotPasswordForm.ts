class ManagerForgotPasswordForm {
    API: Api;

    constructor() {
        this.API = Api.getInstance();
    }

    private setUserTimeOffsetAsFormParam(): void {
        let timeOffset = -new Date().getTimezoneOffset() / 60;
        $('[name="time_offset"]').val(timeOffset);
    }

    private initFormStep1(): void {
        let form = $('#i-manager-forgot-password-form_step-1');
        let self = this;

        form.validator().on(
            'submit',
            function (e) {
                if (e.isDefaultPrevented()) {
                    // Handle the invalid form...
                } else {
                    // Everything looks good!
                    let phone = form.find('[name="phone"]').val();
                    $('[name="phone"]').val(phone);
                    self.API.post(
                        'managers/send_pin',
                        {
                            phone: phone
                        },
                        function () {
                            // @ts-ignore
                            ManyPanelsForm_NextFromStep(1, 2);
                        },
                        function () {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep(1, 'fail', 2);
                        }
                    );
                }
                return false;
            }
        );
    }

    private initFormStep2(): void {
        let self = this;
        let form = $('#i-manager-forgot-password-form_step-2');
        let pinForm = new PinForm();

        pinForm.init(
            form,
            function (isCorrectPin) {
                // If PIN code is correct, then register the client (or regenerate password for him)
                if (isCorrectPin) {
                    let phone = $('[name="phone"]').val();
                    self.API.get(
                        'managers/is_phone_busy/' + encodeURIComponent(PhoneFilter(phone as string)),
                        [],
                        function (isBusy) {
                            if (!+isBusy) {
                                // @ts-ignore
                                ManyPanelsForm_ShowStep(2, 'fail', 2);
                            } else {
                                self.API.post(
                                    'managers/regenerate_password',
                                    {
                                        phone: phone,
                                        code: pinForm.getFullCode(form),
                                        time_offset: $('[name="time_offset"]').val()
                                    },
                                    function () {
                                        // @ts-ignore
                                        ManyPanelsForm_ShowStep(2, 'success', 2);
                                    },
                                    function () {
                                        // @ts-ignore
                                        ManyPanelsForm_ShowStep(2, 'fail', 2);
                                    }
                                );
                            }
                        },
                        function () {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep(2, 'fail', 2);
                        }
                    )
                } else {
                    $('.phone-verification-block_error-block').fadeIn();
                }
            },
            function () {
                // @ts-ignore
                ManyPanelsForm_ShowStep(2, 'fail', 2);
            }
        );
    }

    init(): void {
        this.setUserTimeOffsetAsFormParam();
        this.initFormStep1();
        this.initFormStep2();
    }
}
