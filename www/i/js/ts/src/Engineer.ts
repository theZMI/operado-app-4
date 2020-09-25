/// <reference path="./CommonUser.ts" />

class Engineer extends CommonUser {
    logout(): void {
        Api.forgotToken();
        window.location.replace("/engineer/login");
    }

    // Рисует список "новые заявок"
    private renderRequests(): void {
        let self = this;
        let wrapper = $('#i-requests-wrapper');

        $.ajax(
            '/engineer/_requests',
            {
                success: function (response, status, xhr) {
                    wrapper.html(response);
                },
                error: function (jqXhr, textStatus, errorMessage) {
                }
            }
        );
    }

    // Занимается обновлением списка новых заявок если в этом появляется необходимость
    listenRequestTimer = null;
    readonly listerRequestTimeUpdate = 1999;

    listenRequests(): void {
        let self = this;
        let oldHash = null;

        self.renderRequests();
        self.listenRequestTimer = setInterval(
            function () {
                self.API.get(
                    'requests/hash',
                    [],
                    function (newHash) {
                        if (oldHash != newHash) {
                            oldHash = newHash;
                            self.renderRequests();
                        }
                    },
                    () => {
                    }
                );
            },
            self.listerRequestTimeUpdate
        );
    }

    // Рисует список "мои заявки"
    private renderMyRequests(): void {
        let self = this;
        let wrapper = $('#i-requests-wrapper');

        $.ajax(
            '/engineer/_my_requests',
            {
                success: function (response, status, xhr) {
                    wrapper.html(response);
                },
                error: function (jqXhr, textStatus, errorMessage) {
                }
            }
        );
    }

    // Занимается обновлением списка моих заявок если в этом появляется необходимость
    listenMyRequestTimer = null;
    readonly listerMyRequestTimeUpdate = 1999;

    listenMyRequests(): void {
        let self = this;
        let oldHash = null;

        self.renderMyRequests();
        self.listenMyRequestTimer = setInterval(
            function () {
                self.API.get(
                    'engineers/current/requests/hash',
                    [],
                    function (newHash) {
                        if (oldHash != newHash) {
                            oldHash = newHash;
                            self.renderMyRequests();
                        }
                    },
                    () => {
                    }
                );
            },
            self.listerMyRequestTimeUpdate
        );
    }

    // Обработчик формы "Взять эту заявку" -> "Да"
    private initFormTryGetRequest(): void {
        let form = $('#many-panels-form-panel_assign_request_to_me form');
        let self = this;

        form.on(
            'submit',
            function () {
                let msgWrapper = $('#i-msg');
                let request_id = form.find('[name="request_id"]').val();
                self.API.post(
                    `requests/${request_id}/try_set_engineer`,
                    [],
                    function (response) {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('assign_request_to_me', 'call_to_client', 1);
                    },
                    function (response) {
                        msgWrapper.html(response);
                    }
                );

                return false;
            }
        );
    }

    // Обработчик формы "позвонить клиенту"
    private initFormCallToClient(): void {
        let form = $('#many-panels-form-panel_call_to_client form');
        let self = this;

        form.find('[type="submit"]').each(function () {
            $(this).on(
                "click",
                function () {
                    form.find('[name="submit_value"]').val($(this).val());
                }
            )
        });

        form.on(
            'submit',
            function () {
                let request_id = form.find('[name="request_id"]').val();
                let isCantCall = form.find('[name="submit_value"]').val() === 'N';
                let callTime = isCantCall ? 0 : Math.floor(Date.now() / 1000);
                let cantCallTime = isCantCall ? Math.floor(Date.now() / 1000) : 0;

                let params = {
                    engineer_call_time: callTime,
                    engineer_cant_call_time: cantCallTime
                };

                self.API.patch(
                    `requests/${request_id}`,
                    params,
                    function () {
                        if (isCantCall) {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('call_to_client', 'cant_call_to_client', 1);
                        } else {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('call_to_client', 'set_meeting_time', 1);
                        }
                    },
                    () => {
                    }
                );

                return false;
            }
        );
    }

    private initFormAgreeOrDisagreeForRequest(): void {
        let form = $('#many-panels-form-panel_set_by_admin form');
        let self = this;

        form.find('[type="submit"]').each(function () {
            $(this).on(
                "click",
                function () {
                    form.find('[name="submit_value"]').val($(this).val());
                }
            )
        });

        form.on(
            'submit',
            function () {
                let request_id = form.find('[name="request_id"]').val();
                let isAgree = form.find('[name="submit_value"]').val() === 'Y';

                if (isAgree) {
                    self.API.patch(
                        `requests/${request_id}`,
                        {
                            status: RequestModel.STATUS_ENGINEER_SET
                        },
                        function () {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('set_by_admin', 'call_to_client', 1);
                        },
                        () => {
                        }
                    );
                } else {
                    self.API.post(
                        `requests/${request_id}/clear_engineer`,
                        [],
                        function () {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('set_by_admin', 'assign_request_to_me', 1);
                        },
                        () => {
                        }
                    );
                }


                return false;
            }
        );
    }

    private initFormSetMeetingTime(): void {
        let form = $('#many-panels-form-panel_set_meeting_time form');
        let self = this;

        form.on(
            'submit',
            function () {
                let request_id = form.find('[name="request_id"]').val();
                let status = form.find('[name="status"]').val();
                let time_offset = form.find('[name="time_offset"]').val();
                let timeZone = Math.ceil(<number>time_offset / 3600);
                let meeting_time_asString = <string>form.find('[name="meeting_time__date"]').val() + ' ' +
                    <string>form.find('[name="meeting_time__hours"]').val() + ':' + <string>form.find('[name="meeting_time__mins"]').val() +
                    ' UTC' + (timeZone > 0 ? ('+' + timeZone) : timeZone);
                let meeting_time = my_strtotime(meeting_time_asString);

                self.API.patch(
                    `requests/${request_id}`,
                    {
                        status: status,
                        meeting_time: meeting_time
                    },
                    function () {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('set_meeting_time', 'play', 1);
                    },
                    () => {
                    }
                );

                return false;
            }
        );
    }

    private initFormStartWork(): void {
        let form = $('#many-panels-form-panel_play form');
        let self = this;

        form.on(
            'submit',
            function () {
                let request_id = form.find('[name="request_id"]').val();
                let status = form.find('[name="status"]').val();

                self.API.patch(
                    `requests/${request_id}`,
                    {
                        status: status
                    },
                    function () {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('play', 'pause_finish_cant', 1);
                    },
                    () => {
                    }
                );

                return false;
            }
        );
    }

    // Инженер нажал на кнопку "Я завершил задачу" после этого ему откроется формочка для заполнения конечной информации по заявке (цена деталей, цена работы...)
    private initFormPauseWork(): void {
        let form = $('#many-panels-form-panel_pause_finish_cant .form-pause-work');
        let self = this;

        form.on(
            'submit',
            function () {
                let request_id = form.find('[name="request_id"]').val();

                self.API.patch(
                    `requests/${request_id}`,
                    {
                        status: form.find('[name="status"]').val(),
                        reason: form.find('[name="reason"]').val()
                    },
                    function () {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('pause_finish_cant', 'play', 1);
                    },
                    () => {
                    }
                );

                return false;
            }
        );
    }

    // Инженер нажал на кнопку "Я завершил задачу" после этого ему откроется формочка для заполнения конечной информации по заявке (цена деталей, цена работы...)
    private initFormFinishWork(): void {
        let form = $('#many-panels-form-panel_pause_finish_cant .form-finish-work');
        let self = this;

        form.validator().on(
            'submit',
            function (e) {
                if (e.isDefaultPrevented()) {
                    // Handle the invalid form...
                } else {
                    // Everything looks good!
                    let request_id = form.find('[name="request_id"]').val();
                    self.API.patch(
                        `requests/${request_id}`,
                        form.serializeArray(),
                        function () {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('pause_finish_cant', 'waiting_while_client_set_payment_method', 1);
                            self.waitWhileClientSetPaymentMethod();
                        },
                        () => {
                        }
                    );
                }
                return false;
            }
        );
    }

    // Инженер нажал, что не может завершить заявку
    private initFormCantFinish(): void {
        let form = $('#many-panels-form-panel_pause_finish_cant .form-cant-finish-work');
        let self = this;

        form.on(
            'submit',
            function () {
                let request_id = form.find('[name="request_id"]').val();

                self.API.patch(
                    `requests/${request_id}`,
                    {
                        status: form.find('[name="status"]').val(),
                        reason: form.find('[name="reason"]').val()
                    },
                    function () {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('pause_finish_cant', 'can_not_finish', 1);
                    },
                    () => {
                    }
                );

                return false;
            }
        );
    }

    // Ожидаем пока клиент выберет метод оплаты. Если это наличными, то показываем окно подтверждения получения денег инженером. Если карта, то ожидаем успешности проведения платежа
    private waitWhileClientSetPaymentMethod(): void {
        let request_id = $('[name="request_id"]').val();
        let self = this;

        let timer = null;
        let checker = function () {
            self.API.get(
                `requests/${request_id}`,
                [],
                function (response) {
                    let hasPayMethod2 = !!response.pay_type_2;
                    if (hasPayMethod2) {
                        if (response.pay_type_2 == RequestModel.PAY_TYPE_CASH) {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('waiting_while_client_set_payment_method', 'approve_get_money', 1);
                            clearInterval(timer);
                        } else if (response.pay_type_2 == RequestModel.PAY_TYPE_CARD) {
                            if (response.pay_approve_2) {
                                // @ts-ignore
                                ManyPanelsForm_ShowStep('waiting_while_client_set_payment_method', 'rating', 1);
                                clearInterval(timer);
                            }
                        }
                    }
                },
                () => {
                }
            )
        };

        timer = setInterval(checker, 999);
    }

    // Инженер сказал, что получил деньги от клиента
    private initFormApproveGetMoney(): void {
        let form = $('#many-panels-form-panel_approve_get_money form');
        let self = this;

        form.on(
            'submit',
            function () {
                let request_id = form.find('[name="request_id"]').val();

                self.API.patch(
                    `requests/${request_id}`,
                    form.serializeArray(),
                    function () {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('approve_get_money', 'rating', 1);
                    },
                    () => {
                    }
                );

                return false;
            }
        );
    }

    // Инженер устанвовил рейтинг для клиента
    private initFormSetRating() {
        let form = $('#many-panels-form-panel_rating form');
        let self = this;

        form.on(
            'submit',
            function () {
                let request_id = form.find('[name="request_id"]').val();

                self.API.patch(
                    `requests/${request_id}`,
                    form.serializeArray(),
                    function () {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('rating', 'thank_you', 1);
                    },
                    () => {
                    }
                );

                return false;
            }
        );
    }

    initRequestForm(): void {
        this.initFormTryGetRequest();
        this.initFormCallToClient();
        this.initFormSetMeetingTime();
        this.initFormAgreeOrDisagreeForRequest();
        this.initFormStartWork();
        this.initFormPauseWork();
        this.initFormFinishWork();
        this.initFormCantFinish();
        this.initFormApproveGetMoney();
        this.initFormSetRating();
    }
}
