/// <reference path="./CommonUser.ts" />

class Manager extends CommonUser {
    logout(): void {
        Api.forgotToken();
        window.location.replace("/manager/login");
    }

    // Рисует список "новые заявок"
    private renderRequests(): void {
        let self = this;
        let wrapper = $('#i-requests-wrapper');

        $.ajax(
            '/manager/_requests?statuses=all',
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
                    {
                        statuses: 'all'
                    },
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

    // Установить определённого инженера для заявки
    private initManualSetEngineer() {
        let form = $('#many-panels-form-panel_manual-set-engineer form');
        let self = this;

        form.on(
            'submit',
            function () {
                let msgWrapper = $('#i-msg');
                let request_id = form.find('[name="request_id"]').val();
                self.API.post(
                    `requests/${request_id}/try_set_engineer`,
                    form.serializeArray(),
                    function (response) {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('manual-set-engineer', 'wait-agree-from-engineer', 1);
                    },
                    function (response) {
                        msgWrapper.html(response);
                    }
                );

                return false;
            }
        );
    }

    // Сбросить установленного инженера в заявке
    private initResetRequestEngineer() {
        let form = $('#many-panels-form-panel_wait-agree-from-engineer form');
        let self = this;

        form.on(
            'submit',
            function () {
                let msgWrapper = $('#i-msg');
                let request_id = form.find('[name="request_id"]').val();
                self.API.post(
                    `requests/${request_id}/clear_engineer`,
                    [],
                    function (response) {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('wait-agree-from-engineer', 'manual-set-engineer', 1);
                    },
                    function (response) {
                        msgWrapper.html(response);
                    }
                );

                return false;
            }
        );
    }

    // Форма: подтвердить, что задача провалена или же вернуть задачу назад в работу инженеру
    private initFormRequestFailed(): void {
        let form = $('#many-panels-form-panel_wait-approve-failed form');
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
                let isFailed = form.find('[name="submit_value"]').val() === 'Y';
                let status = isFailed ? RequestModel.STATUS_FAIL_APPROVE : RequestModel.STATUS_IN_PROGRESS;
                let message = form.find('[name="message_about_failed"]').val();

                let params = {
                    status: status,
                    message_about_failed: message
                };

                self.API.patch(
                    `requests/${request_id}`,
                    params,
                    function () {
                        if (isFailed) {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('wait-approve-failed', 'failed', 1);
                        } else {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('wait-approve-failed', 'engineer-in-progress', 1);
                        }
                    },
                    () => {
                    }
                );

                return false;
            }
        );
    }

    // Форма: подтвердить, что задача успешно завершена или же вернуть задачу назад в работу инженеру
    private initFormRequestFinished(): void {
        let form = $('#many-panels-form-panel_wait-approve-finish form');
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
                let isFailed = form.find('[name="submit_value"]').val() === 'Y';
                let status = isFailed ? RequestModel.STATUS_FINISH_APPROVE : RequestModel.STATUS_IN_PROGRESS;
                let message = form.find('[name="message_about_finished"]').val();

                let params = {
                    status: status,
                    message_about_finished: message
                };

                self.API.patch(
                    `requests/${request_id}`,
                    params,
                    function () {
                        if (isFailed) {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('wait-approve-finish', 'finished', 1);
                        } else {
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('wait-approve-finish', 'engineer-in-progress', 1);
                        }
                    },
                    () => {
                    }
                );

                return false;
            }
        );
    }

    // Форма установки времени встречи
    private initFormSetMeetingTime(): void {
        let form = $('#many-panels-form-panel_set-meeting-time form');
        let self = this;

        form.on(
            'submit',
            function () {
                let request_id = form.find('[name="request_id"]').val();
                let status = form.find('[name="status"]').val();
                let time_offset = form.find('[name="time_offset"]').val();
                let timeZone = Math.ceil(<number>time_offset / 3600);
                let meeting_time = my_strtotime(
                    <string>form.find('[name="meeting_time__date"]').val() + ' ' +
                    <string>form.find('[name="meeting_time__hours"]').val() + ':' + <string>form.find('[name="meeting_time__mins"]').val() +
                    ' UTC' + (timeZone > 0 ? ('+' + timeZone) : timeZone)
                );

                self.API.patch(
                    `requests/${request_id}`,
                    {
                        status: status,
                        meeting_time: Math.floor(<number>meeting_time / 1000)
                    },
                    function () {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('set-meeting-time', 'engineer-in-progress', 1);
                    },
                    () => {
                    }
                );

                return false;
            }
        );
    }

    initRequestForm(): void {
        this.initManualSetEngineer();
        this.initResetRequestEngineer();
        this.initFormRequestFailed();
        this.initFormRequestFinished();
        this.initFormSetMeetingTime();
    }
}
