class RequestForm {
    elements: { [k: string]: any } = {};
    API: Api;

    private guarantySwitchery = null;

    constructor() {
        this.API = Api.getInstance();
    }

    private technicsInputs(): void {
        this.elements.msCategory = $('#i-category').magicSuggest({
            placeholder: 'Техника',
            allowFreeEntries: false,
            data: [],
            value: [],
            maxSelection: 1,
            selectionRenderer: function (data) {
                return data.name;
            }
        });
        this.elements.msMark = $('#i-mark').magicSuggest({
            placeholder: 'Марка',
            allowFreeEntries: true,
            data: [],
            value: [],
            maxSelection: 1,
            disabled: true,
            selectionRenderer: function (data) {
                return data.name;
            }
        });
        this.elements.msModel = $('#i-model').magicSuggest({
            placeholder: 'Модель',
            allowFreeEntries: true,
            data: [],
            value: [],
            maxSelection: 1,
            disabled: true,
            selectionRenderer: function (data) {
                return data.name;
            }
        });

        this.API.get(
            "technics/categories",
            [],
            (data) => {
                this.elements.msCategory.setData(data);
            },
            (error) => {
            }
        );

        let self = this;

        $(this.elements.msCategory).on(
            'selectionchange',
            function (e, m) {
                let value = this.getValue();
                $('[name="category_for_validator"]').val(value).trigger('focus').trigger('focusout');

                if (value.length) {
                    self.elements.msMark.clear();
                    self.elements.msModel.clear();
                    self.elements.msMark.enable();

                    self.API.get(
                        `technics/categories/${value}`,
                        [],
                        (data) => {
                            let data2 = [];
                            for (let k in data) {
                                data2.push(data[k].name);
                            }
                            self.elements.msMark.setData(data2);
                        },
                        (error) => {
                        }
                    );
                } else {
                    self.elements.msMark.clear();
                    self.elements.msModel.clear();
                    self.elements.msMark.disable();
                    self.elements.msModel.disable();
                }
            }
        );

        $(this.elements.msMark).on(
            'selectionchange',
            function (e, m) {
                let value = this.getValue();
                if (value.length) {
                    self.elements.msModel.clear();
                    self.elements.msModel.enable();
                    let category = self.elements.msCategory.getValue();

                    self.API.get(
                        `technics/categories/${category}/${value}`,
                        [],
                        (data) => {
                            let data2 = [];
                            for (let k in data) {
                                data2.push(data[k].name);
                            }
                            self.elements.msModel.setData(data2);
                        },
                        (error) => {
                        }
                    );
                } else {
                    self.elements.msMark.clear();
                    self.elements.msModel.clear();
                    self.elements.msModel.disable();
                }
            }
        );
    }

    private map(ymaps): void {
        ymaps.ready(function () {
            let suggestView1;
            let map;
            let mapContainerSelectorID = 'i-map';
            let mapContainer = $('#' + mapContainerSelectorID);
            let myPlacemark;

            // Создаём карту и центрируем пользователя
            ymaps.geolocation.get().then(function (res) {
                let bounds = res.geoObjects.get(0).properties.get('boundedBy'),
                    // Рассчитываем видимую область для текущей положения пользователя.
                    mapState = ymaps.util.bounds.getCenterAndZoom(
                        bounds,
                        [mapContainer.width(), mapContainer.height()]
                    );
                createMap(mapState);
            }, function (e) {
                // Если местоположение невозможно получить, то просто создаем карту.
                createMap({
                    center: [54, 20],
                    zoom: 2
                });
            });

            // Создаём карту и заполняем поле поиска
            function createMap(state) {
                let coords = state.center;
                state.controls = ['geolocationControl', 'zoomControl'];
                state.zoom = 14;
                map = new ymaps.Map(
                    mapContainerSelectorID,
                    state
                );
                specialCentringForMap(map);
                suggestView1 = new ymaps.SuggestView('suggest');

                // Слушаем клик на карте.
                map.events.add('click', function (e) {
                    let coords = e.get('coords');

                    // Если метка уже создана – просто передвигаем ее.
                    myPlacemark.geometry.setCoordinates(coords);
                    getAddress(coords);
                });

                myPlacemark = createPlacemark(coords);
                map.geoObjects.add(myPlacemark);
                getAddress(myPlacemark.geometry.getCoordinates());

                // Слушаем событие окончания перетаскивания на метке.
                myPlacemark.events.add('dragend', function () {
                    getAddress(myPlacemark.geometry.getCoordinates());
                });
            }

            // Создание метки.
            function createPlacemark(coords) {
                return new ymaps.Placemark(coords, {
                    iconCaption: 'Поиск...'
                }, {
                    preset: 'islands#violetDotIconWithCaption',
                    draggable: true
                });
            }

            // Специальное смещение карты
            function specialCentringForMap(map, offset = 0) {
                let coordinates = map.center;
                let pixelCenter = map.getGlobalPixelCenter(coordinates);
                pixelCenter = [
                    pixelCenter[0],
                    pixelCenter[1] - offset
                ];
                var geoCenter = map.options.get('projection').fromGlobalPixels(pixelCenter, map.getZoom());
                map.setCenter(geoCenter);
            }

            // Определяем адрес по координатам (обратное геокодирование).
            function getAddress(coordinates) {
                $('[name="place_latitude"]').val(coordinates[0]);
                $('[name="place_longitude"]').val(coordinates[1]);

                ymaps.geocode(coordinates).then(function (res) {
                    let firstGeoObject = res.geoObjects.get(0);

                    myPlacemark.properties
                        .set({
                            // Формируем строку с данными об объекте.
                            iconCaption: [
                                // Название населенного пункта или вышестоящее административно-территориальное образование.
                                firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
                                // Получаем путь до топонима, если метод вернул null, запрашиваем наименование здания.
                                firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
                            ].filter(Boolean).join(', '),
                            // В качестве контента балуна задаем строку с адресом объекта.
                            balloonContent: firstGeoObject.getAddressLine()
                        });
                    $('#suggest').val(firstGeoObject.getAddressLine());
                });
            }
        });
    }

    private setCountDown(valueWrapper, value: number, successCallback, preCallback = null): void {
        return this.setNumber(valueWrapper, value, successCallback, preCallback);
    }

    private setCountUp(valueWrapper, value: number, successCallback, preCallback = null): void {
        return this.setNumber(valueWrapper, value, successCallback, preCallback);
    }

    private setNumber(valueWrapper, value: number, successCallback, preCallback): void {
        let func = function () {
            if (preCallback) {
                preCallback();
            }

            const step = 10;
            value = +value;
            let curValue = +valueWrapper.html();
            let newValue: number;

            if (curValue === value) {
                return;
            }
            if (curValue > value) {
                newValue = curValue - step;
                newValue = newValue < value ? value : newValue;
            } else {
                newValue = curValue + step;
                newValue = newValue > value ? value : newValue;
            }

            valueWrapper.html(newValue + '');
            if (newValue != value) {
                setTimeout(func, 1);
            } else {
                successCallback();
            }
        };
        return func();
    }

    private getHeightOfHiddenElement(elem): number {
        elem = $(elem);
        let previousStyles = elem.attr('style');
        let previousClasses = elem.attr('class');
        elem.removeAttr('class');
        elem.css({
            position: 'absolute',
            visibility: 'hidden',
            display: 'block'
        });
        let ret = elem.height();
        elem.attr('style', previousStyles ? previousStyles : '');
        elem.attr('class', previousClasses ? previousClasses : '');
        return ret;
    }

    private scrollToTopForStepByStepForm(): void {
        let maxStepHeight = 0;
        let self = this;
        $('.request-form .one-panel').each(function () {
            let h = self.getHeightOfHiddenElement(this);
            maxStepHeight = Math.max(maxStepHeight, h);
        });

        let screenHeight = $(window).height();
        let screenWidth = $(window).width();
        let logoOffset = screenWidth >= 1200 ? 110 : (screenWidth >= 698 ? 60 : 0);
        let append = 51 + // menu
            157 + logoOffset + // height of logo-block
            30; // top and bottom padding for step-block

        if (screenHeight < maxStepHeight + append) {
            $('#content').css('min-height', maxStepHeight + append);
            $('.request-form').data('offset', 51);
        }
    }

    // Ф-я разблокирует возможность нажать на кнопку "у меня нет входящего звонка"
    private noCallButtonTimerActivated(): void {
        let delayTimer = 30;
        let delayFunc = function () {
            delayTimer--;
            let dateObj = new Date(delayTimer * 1000);
            let min = dateObj.getUTCMinutes().toString().padStart(2, '0');
            let sec = dateObj.getSeconds().toString().padStart(2, '0');
            let timerWrapper = $('.engineer-calling-block_no-call-button_timer');
            timerWrapper.html(
                min + ':' + sec
            );
            if (delayTimer) {
                setTimeout(delayFunc, 999);
            } else {
                timerWrapper.fadeOut();
                $('.engineer-calling-block_no-call-button').removeAttr('disabled');
            }
        };
        setTimeout(delayFunc, 999);
    }

    // Заполняет данными страницу done_step_2
    private fillDoneStep2() {
        let request_id = $('[name="request_id"]').val();
        let self = this;

        self.API.get(
            `requests/${request_id}`,
            [],
            function (response) {
                let hasEngineer = !!response.engineer_id;
                if (hasEngineer) {
                    self.API.get(
                        `engineers/${response.engineer_id}`,
                        [],
                        function (engineer) {
                            if (engineer.avatar) {
                                let avatarImg = $('#i-done-step-2-engineer_avatar');
                                avatarImg.attr(
                                    'src',
                                    avatarImg.data('start-src-path') + engineer.avatar
                                );
                            }
                            $('#i-done-step-2-engineer_name').html(engineer.full_name);
                        },
                        () => {
                        }
                    );
                }
            },
            () => {
            }
        );
    }

    // Ф-я отсчитывает 10 секунд на странице удачной оплаты и перекидывает на страницу done-2
    gotoDone2TimerActivated(): void {
        let delayTimer = 10;
        let self = this;
        let delayFunc = function () {
            delayTimer--;
            let dateObj = new Date(delayTimer * 1000);
            let min = dateObj.getUTCMinutes().toString().padStart(2, '0');
            let sec = dateObj.getSeconds().toString().padStart(2, '0');
            let timerWrapper = $('.payment-success-timer');
            timerWrapper.html(
                min + ':' + sec
            );
            if (delayTimer) {
                setTimeout(delayFunc, 999);
            } else {
                timerWrapper.fadeOut();
                self.fillDoneStep2();
                // @ts-ignore
                ManyPanelsForm_ShowStep('payment_success_2', 'request_done_step_2', 5);
            }
        };
        setTimeout(delayFunc, 999);
    }

    // Ф-я отсчитывает 10 секунд на странице удачной оплаты и перекидывает на страницу поиска инженера
    gotoSearchEngineerTimerActivated(): void {
        let self = this;
        let delayTimer = 10;
        let delayFunc = function () {
            delayTimer--;
            let dateObj = new Date(delayTimer * 1000);
            let min = dateObj.getUTCMinutes().toString().padStart(2, '0');
            let sec = dateObj.getSeconds().toString().padStart(2, '0');
            let timerWrapper = $('.payment-success-timer');
            timerWrapper.html(
                min + ':' + sec
            );
            if (delayTimer) {
                setTimeout(delayFunc, 999);
            } else {
                timerWrapper.fadeOut();
                // @ts-ignore
                ManyPanelsForm_ShowStep('payment_success', 'searching_engineer', 5);
                self.waitEngineer();
            }
        };
        setTimeout(delayFunc, 999);
    }

    timerWaitDoneStep2 = null;

    private waitDoneStep2Window(): void {
        let request_id = $('[name="request_id"]').val();
        let self = this;

        let checker = function () {
            self.API.get(
                `requests/${request_id}`,
                [],
                function (response) {
                    let isPayApprove = !!response.pay_approve_2;
                    if (isPayApprove) {
                        self.fillDoneStep2();
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('AUTO', 'request_done_step_2', 5);
                        clearInterval(self.timerWaitDoneStep2);
                        clearInterval(self.timerPauseChecker);
                        clearInterval(self.timerInProgressChecker);
                    }
                },
                () => {
                }
            )
        };

        self.timerWaitDoneStep2 = setInterval(checker, 999);
    }

    // Проверяем нужно ли показать окно DoneStep1
    timerWaitDoneStep1 = null;

    private waitDoneStep1Window(): void {
        let request_id = $('[name="request_id"]').val();
        let self = this;

        let checker = function () {
            self.API.get(
                `requests/${request_id}`,
                [],
                function (response) {
                    let isEngineerFinishRequest = response.status == RequestModel.STATUS_FINISH;
                    if (isEngineerFinishRequest) {
                        self.updateRequestInformationOnPage(
                            function () {
                                // @ts-ignore
                                ManyPanelsForm_ShowStep('AUTO', 'request_done_step_1', 5);
                                clearInterval(self.timerWaitDoneStep1);
                                clearInterval(self.timerPauseChecker);
                                clearInterval(self.timerInProgressChecker);
                                self.waitDoneStep2Window();
                            }
                        );
                    }
                },
                () => {
                }
            )
        };

        self.timerWaitDoneStep1 = setInterval(checker, 2999);
    }

    private updateRequestInformationOnPage(successFunction = null) {
        let request_id = $('[name="request_id"]').val();
        let self = this;

        self.API.get(
            `requests/${request_id}/short`,
            [],
            function (response) {
                $('.i-request-engineer-name').html(response.engineer_name);
                if (response.engineer_avatar) {
                    let avatarImg = $('.i-request-engineer-avatar');
                    avatarImg.attr(
                        'src',
                        avatarImg.data('start-src-path') + response.engineer_avatar
                    );
                }
                $('.i-request-number').html(response.request_number);
                $('.i-request-legend').html(response.request_legend);

                let timestamp = new Date(response.planned_work_time * 1000);
                let meeting_time = timestamp.getDate() + "-" + (timestamp.getMonth() + 1) + "-" + timestamp.getFullYear() + " " + timestamp.getHours() + ":" + timestamp.getMinutes();
                $('.i-request-planned-work-time').html(meeting_time);

                $('.i-prices-details').html(FormatMoney(response.prices_details));
                $('.i-prices-work').html(FormatMoney(response.prices_work));
                $('.i-prices-diagnostic').html(FormatMoney(response.prices_diagnostic));
                $('.i-prices-full').html(FormatMoney(response.prices_full));

                response.is_diagnostic_paid
                    ? $('.i-diagnostic-paid').show()
                    : $('.i-diagnostic-not-paid').show();

                if (successFunction) {
                    successFunction();
                }
            },
            () => {
            }
        )
    }

    // Проверяем нужно ли показать окно о том что идёт работа
    timerInProgressChecker = null

    private waitInProgressWindow(): void {
        let request_id = $('[name="request_id"]').val();
        let self = this;

        let checker = function () {
            self.API.get(
                `requests/${request_id}`,
                [],
                function (response) {
                    let isInProgressRequest = response.status == RequestModel.STATUS_IN_PROGRESS;
                    if (isInProgressRequest) {
                        self.updateRequestInformationOnPage();
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('AUTO', 'request_in_work', 5);
                    }
                },
                () => {
                }
            )
        };

        this.timerInProgressChecker = setInterval(checker, 2999);
    }

    // Проверяем нужно ли показать окно о том в котором показано назначенное время встречи
    timerPauseChecker = null

    private waitStartWorkWindow(): void {
        let request_id = $('[name="request_id"]').val();
        let self = this;

        let checker = function () {
            self.API.get(
                `requests/${request_id}`,
                [],
                function (response) {
                    let isRequestWaitStartWork = response.status == RequestModel.STATUS_WAIT_START_WORK || response.status == RequestModel.STATUS_PAUSE;
                    if (isRequestWaitStartWork) {
                        self.updateRequestInformationOnPage();
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('AUTO', 'request_pause', 5);
                    }
                },
                () => {
                }
            )
        };

        this.timerPauseChecker = setInterval(checker, 2999);
    }

    // Начинаем 5 минут ждать звонка инженера
    timerWaitEngineerCall = null;

    private waitEngineerCall(): void {
        let self = this;
        let isNotCallingBlockShow = false;
        let delayTimer = 300;
        let delayFunc = function () {
            delayTimer = delayTimer > 0 ? (delayTimer - 1) : 0;
            let dateObj = new Date(delayTimer * 1000);
            let min = dateObj.getUTCMinutes().toString().padStart(2, '0');
            let sec = dateObj.getSeconds().toString().padStart(2, '0');
            let timerWrapper = $('#i-call-timer');
            timerWrapper.html(
                min + ':' + sec
            );
            let initTimers = function () {
                self.waitStartWorkWindow();
                self.waitInProgressWindow();
                self.waitDoneStep1Window();
            }

            // Check engineer calling
            let request_id = $('[name="request_id"]').val();
            self.API.get(
                `requests/${request_id}`,
                [],
                function (response) {
                    // Если инженер уже нажал "позвонить" то показываем окно "Инженер уже звонит"
                    if (response.engineer_call_time) {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('AUTO', 'engineer_calling', 5);
                        clearInterval(self.timerWaitEngineerCall);
                        initTimers();
                        self.noCallButtonTimerActivated();
                    }
                    // Если инженер нажал "Не могу сейчас позвонить"
                    else if (response.engineer_cant_call_time) {
                        // @ts-ignore
                        ManyPanelsForm_ShowStep('AUTO', 'engineer_not_call', 5);
                        clearInterval(self.timerWaitEngineerCall);
                        initTimers();

                        self.API.patch(
                            `requests/${request_id}`,
                            {
                                need_call_manager: 1
                            },
                            () => {
                            },
                            () => {
                            }
                        );
                    }
                },
                () => {
                }
            );

            // Если время истекло, а ответа от инженера так и не поступило, то показываем окно "Вам позвонит менеджер"
            if (!delayTimer) {
                if (!isNotCallingBlockShow) {
                    clearInterval(self.timerWaitEngineerCall);
                    // @ts-ignore
                    ManyPanelsForm_ShowStep('AUTO', 'engineer_not_call', 5);
                    isNotCallingBlockShow = true;
                    initTimers();

                    let request_id = $('[name="request_id"]').val();
                    self.API.patch(
                        `requests/${request_id}`,
                        {
                            need_call_manager: 1
                        },
                        () => {
                        },
                        () => {
                        }
                    );
                }
            }
        };
        this.timerWaitEngineerCall = setInterval(delayFunc, 999);
    }

    // Проверялка "взяли ли кто заказ?"
    timerWaitEngineer = null;

    private waitEngineer(): void {
        let request_id = $('[name="request_id"]').val();
        let self = this;

        let checker = function () {
            self.API.get(
                `requests/${request_id}`,
                [],
                function (response) {
                    let hasEngineer = !!response.engineer_id && response.status == RequestModel.STATUS_ENGINEER_SET;
                    if (hasEngineer) {
                        self.API.get(
                            `engineers/${response.engineer_id}`,
                            [],
                            function (engineer) {
                                if (engineer.avatar) {
                                    let avatarImg = $('#i-found-engineer_avatar');
                                    avatarImg.attr(
                                        'src',
                                        avatarImg.data('start-src-path') + engineer.avatar
                                    );
                                }
                                $('#i-found-engineer_name').html(engineer.full_name)
                                $('#i-call-button').attr('href', 'tel:' + PhoneFilter(engineer.phone));

                                // @ts-ignore
                                ManyPanelsForm_ShowStep('searching_engineer', 'engineer_found', 5);
                                self.waitEngineerCall();
                                clearInterval(self.timerWaitEngineer);
                            },
                            () => {
                            }
                        );
                    }
                },
                () => {
                }
            )
        };

        self.timerWaitEngineer = setInterval(checker, 999);
    }

    clearTimers() {
        clearInterval(this.timerWaitEngineer);
        clearInterval(this.timerWaitEngineerCall);
        clearInterval(this.timerPauseChecker);
        clearInterval(this.timerInProgressChecker);
        clearInterval(this.timerWaitDoneStep1);
        clearInterval(this.timerWaitDoneStep2);
    }

    setRating(stars: number): void {
        if (stars <= 3) {
            $('.request-done_rating-good').slideUp();
            $('.request-done_rating-bad').slideDown();
        } else {
            $('.request-done_rating-bad').slideUp();
            $('.request-done_rating-good').slideDown();
        }

        let request_id = $('[name="request_id"]').val();
        this.API.patch(
            `requests/${request_id}`,
            {
                client_rating_stars: stars
            },
            function (response) {
                $('#i-price-block_amount').data('amount', response);
                $('[name="price_diagnostic"]').val(response);
                $('#i-price-block_amount .price-block_amount-value').html(response);
            },
            () => {
            }
        );
    }

    private initFormStep1(): void {
        // Init inputs for select technics (first step)
        this.technicsInputs();


        let self = this;
        let form = $('#request-form_step-1');

        form.validator().on(
            'submit',
            function (e) {
                if (e.isDefaultPrevented()) {
                    // Handle the invalid form...
                } else {
                    // Everything looks good!
                    let current_request_id = $('[name="request_id"]').val();
                    let successCallback = function (request_id) {
                        $('[name="request_id"]').val(request_id);
                        // @ts-ignore
                        ManyPanelsForm_NextFromStep(1, 5);

                        // Set diagnostic price for step5
                        self.API.get(
                            `requests/${request_id}/diagnostic_price`,
                            [],
                            function (response) {
                                $('#i-price-block_amount').data('amount', response);
                                $('[name="price_diagnostic"]').val(response);
                                $('#i-price-block_amount .price-block_amount-value').html(response);
                            },
                            () => {
                            }
                        );
                    };
                    let errorCallback = () => {
                    };
                    let params = form.serializeArray();

                    if (current_request_id) {
                        self.API.patch(
                            `requests/${current_request_id}`,
                            params,
                            successCallback,
                            errorCallback
                        );
                    } else {
                        self.API.post(
                            'requests',
                            params,
                            successCallback,
                            errorCallback
                        );
                    }
                }
                return false;
            }
        );
    }

    private initFormStep2(): void {
        let self = this;
        let form = $('#request-form_step-2');

        form.validator().on(
            'submit',
            function (e) {
                if (e.isDefaultPrevented()) {
                    // Handle the invalid form...
                } else {
                    // Everything looks good!
                    let request_id = form.find('[name="request_id"]').val();
                    let params = form.serializeArray();
                    let foundValue = null;
                    params.forEach(
                        function (val) {
                            if (val.name == 'file_1_rdy_name') {
                                foundValue = val.value;
                                return;
                            }
                        }
                    );
                    params.push({
                        name: 'file_1',
                        value: foundValue
                    });
                    self.API.patch(
                        `requests/${request_id}`,
                        params,
                        function (data) {
                            // @ts-ignore
                            ManyPanelsForm_NextFromStep(2, 5);
                        },
                        () => {
                        }
                    );
                }
                return false;
            }
        );
    }

    private initFormStep3(): void {
        let self = this;
        let form = $('#request-form_step-3');

        form.find('#i-full_name').val(
            // @ts-ignore
            g_client.data.full_name
        );

        form.find('#i-phone').val(
            // @ts-ignore
            g_client.data.phone
        );

        // @ts-ignore
        new IMask(
            form.find('#i-phone').get(0),
            // @ts-ignore
            g_phoneMask
        );

        form.validator().on(
            'submit',
            function (e) {
                if (e.isDefaultPrevented()) {
                    // Handle the invalid form...
                } else {
                    // Everything looks good!
                    let phone: string = <string>form.find('[name="phone"]').val();
                    phone = PhoneFilter(phone);

                    self.API.get(
                        'clients/is_need_verify_phone/' + encodeURIComponent(phone),
                        [],
                        function (isNeedVerifyPhone) {
                            let request_id = form.find('[name="request_id"]').val();
                            self.API.patch(
                                `requests/${request_id}`,
                                form.serializeArray(),
                                function (data) {
                                    if (isNeedVerifyPhone) {
                                        $('[name="phone_number_for_verification"]').val(phone);
                                        // @ts-ignore
                                        ManyPanelsForm_ShowStep(3, 'phone_verification', 5);
                                        self.API.post(
                                            'clients/send_pin',
                                            {
                                                phone: phone
                                            },
                                            () => {
                                                self.pinForm.startResendPinCodeTimer();
                                            },
                                            () => {
                                            }
                                        )
                                    } else {
                                        // @ts-ignore
                                        ManyPanelsForm_NextFromStep(3, 5);
                                    }
                                },
                                () => {
                                }
                            );
                        },
                        () => {
                        }
                    );

                }
                return false;
            }
        );
    }

    pinForm: PinForm = null;

    private initFormPhoneVerification(): void {
        let form = $('#request-form_phone-verification');
        this.pinForm = new PinForm();

        this.pinForm.init(
            form,
            function (isCorrectPin) {
                if (isCorrectPin) {
                    // @ts-ignore
                    ManyPanelsForm_ShowStep('phone_verification', 4, 5)
                } else {
                    $('.phone-verification-block_error-block').fadeIn();
                }
            },
            function () {
                $('.phone-verification-block_error-block').fadeIn();
            }
        );
    }

    private initFormStep4(ymaps): void {
        // Show additional information about address
        $('#i-button-additional-about-address').on(
            'click',
            function () {
                $(this).parent().slideUp();
                $('#i-additional-about-address').slideDown();
            }
        );


        // Init yandex map and button "additional about address"
        this.map(ymaps);


        // Form 4
        let self = this;
        let form = $('#request-form_step-4');

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
                        function (data) {
                            // @ts-ignore
                            ManyPanelsForm_NextFromStep(4, 5);
                        },
                        () => {
                        }
                    );
                }
                return false;
            }
        );
    }

    private initFormStep5(): void {
        // Init step with information about cost of service
        // @ts-ignore
        this.guarantySwitchery = new Switchery(document.querySelector('#i-is_guaranty'));


        // Price counter
        let self = this;
        let timer = null;


        $('#i-is_guaranty').on(
            'change',
            function () {
                let chkBox = this;
                const isChecked = $(chkBox).is(":checked");
                let amountWrapper = $('#i-price-block_amount');
                let amountValueWrapper = amountWrapper.find('.price-block_amount-value');
                let guarantyAgreements = $('#i-price-block_guaranty-agreements');
                let payTypeWrapper = $('#request-form_step-5_pay-type');

                if (isChecked) {
                    timer = self.setCountDown(
                        amountValueWrapper,
                        0,
                        function () {
                            self.guarantySwitchery.enable();
                        }
                    );
                    guarantyAgreements.stop().slideDown();
                    payTypeWrapper.slideUp();
                } else {
                    timer = self.setCountUp(
                        amountValueWrapper,
                        +amountWrapper.data('amount'),
                        function () {
                            self.guarantySwitchery.enable();
                        }
                    );
                    guarantyAgreements.stop().slideUp();
                    payTypeWrapper.slideDown();
                }

                setTimeout(
                    function () {
                        self.guarantySwitchery.disable();
                        setTimeout(
                            function () {
                                self.guarantySwitchery.enable();
                            },
                            1999
                        );
                    },
                    9
                );
            }
        );


        // Form 5
        let form = $('#request-form_step-5');

        form.find('.js-switch').on(
            'click',
            function () {
                $(this).trigger('focusout');
            }
        );

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
                        function (data) {
                            let payType = $('[name="pay_type"]:checked').val();
                            let isGuaranty = $('[name="is_guaranty"]').is(':checked');
                            if (!isGuaranty && payType == 'card') {
                                $('#goto-pay-system-form').submit();
                            } else {
                                // @ts-ignore
                                ManyPanelsForm_ShowStep(5, 'searching_engineer', 5);
                                self.waitEngineer();
                            }
                        },
                        () => {
                        }
                    );
                }
                return false;
            }
        );
    }

    private initFormCancelRequest(): void {
        let form = $('#request-form_cancel-request');
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
                        function (data) {
                            $('#request-form_cancel-request_cancel-btn').trigger('click');
                            // @ts-ignore
                            ManyPanelsForm_ShowStep('AUTO', 'cancel_success', 5);
                            self.clearTimers();

                            // Wait 10 second for autoclick by button at cancel_success window
                            let delayTimer = 10;
                            let delayFunc = function () {
                                delayTimer--;
                                let dateObj = new Date(delayTimer * 1000);
                                let min = dateObj.getUTCMinutes().toString().padStart(2, '0');
                                let sec = dateObj.getSeconds().toString().padStart(2, '0');
                                let timerWrapper = $('#i-request-form-cancel-success-button-timer');
                                timerWrapper.html(
                                    min + ':' + sec
                                );
                                if (delayTimer) {
                                    setTimeout(delayFunc, 999);
                                } else {
                                    timerWrapper.fadeOut();
                                    $('#i-request-form-cancel-success-button').get(0).click();
                                }
                            };
                            setTimeout(delayFunc, 999);
                        },
                        () => {
                        }
                    );
                }
                return false;
            }
        )
    }

    private initFormStepRequestDone1(): void {
        // Form 5
        let form = $('#request-form_done-step-1');
        let self = this;

        form.validator().on(
            'submit',
            function (e) {
                if (e.isDefaultPrevented()) {
                    // Handle the invalid form...
                } else {
                    // Everything looks good!
                    let request_id = form.find('[name="request_id"]').val();
                    let payType = $('[name="pay_type_2"]:checked').val();

                    self.API.patch(
                        `requests/${request_id}`,
                        form.serializeArray(),
                        function (data) {
                            if (payType == 'card') {
                                $('#goto-pay-system-form-2').submit();
                            } else {
                                self.updateRequestInformationOnPage();
                                // @ts-ignore
                                ManyPanelsForm_ShowStep('request_done_step_1', 'wait_pay_approve_2', 5);
                            }
                        },
                        () => {
                        }
                    );
                }
                return false;
            }
        );
    }

    private initFormStepRequestDone2(): void {
        // Form 5
        let form = $('#request-form_done-step-2');
        let self = this;

        form.validator().on(
            'submit',
            function (e) {
                if (e.isDefaultPrevented()) {
                    // Handle the invalid form...
                } else {
                    // Everything looks good!
                    let request_id = form.find('[name="request_id"]').val();
                    let rating_problem = $('[name="rating_problem"]').val();

                    self.API.patch(
                        `requests/${request_id}`,
                        {
                            client_rating_description: rating_problem
                        },
                        function (data) {
                            $('body').addClass('ptr-refresh ptr-loading');
                            setTimeout(
                                function () {
                                    window.location.replace('/');
                                },
                                250
                            );
                        },
                        () => {
                        }
                    );
                }
                return false;
            }
        );
    }

    // Форма "инженер уже звонит". На ней отсчитывается 30 секунд и доступна кнопка по которой кликаешь и тем самым говоришь, что у тебя звонка нет
    private initFormStepEngineerCalling(): void {
        let form = $('#request-form_engineer-calling');
        let self = this;

        form.validator().on(
            'submit',
            function (e) {
                if (e.isDefaultPrevented()) {
                    // Handle the invalid form...
                } else {
                    // Everything looks good!
                    // @ts-ignore
                    ManyPanelsForm_ShowStep('AUTO', 'engineer_not_call', 5);

                    let request_id = form.find('[name="request_id"]').val();
                    self.API.patch(
                        `requests/${request_id}`,
                        {
                            need_call_manager: 1
                        },
                        () => {
                        },
                        () => {
                        }
                    );
                }
                return false;
            }
        );
    }

    initAllForms(): void {
        let request_id = GetURLParameter('id');
        $('[name="request_id"]').val(request_id);

        let step = GetURLParameter('step') || 1;
        $('#many-panels-form-panel_' + step).removeClass('hidden');

        $('#request-form_loader').hide();
    }

    init(ymaps): void {
        this.initAllForms();

        this.initFormStep1();
        this.initFormStep2();
        this.initFormStep3();
        this.initFormPhoneVerification();
        this.initFormStep4(ymaps);
        this.initFormStep5();
        this.initFormCancelRequest();
        this.initFormStepRequestDone1();
        this.initFormStepRequestDone2();
        this.initFormStepEngineerCalling();

        // Init scroll to top where we click "next" into request form (For big screen we not scroll because all for on the window, but on small screens we scroll form to top)
        this.scrollToTopForStepByStepForm();

        $('.show-additional-actions').on(
            'click',
            function () {
                if ($(this).hasClass('is-show-additional-actions')) {
                    $(this).removeClass('is-show-additional-actions');
                    $(this).find('.fa')
                        .addClass('fa-caret-down')
                        .removeClass('fa-caret-up');
                    $($(this).data('toggle-block')).slideUp();
                } else {
                    $(this).addClass('is-show-additional-actions');
                    $(this).find('.fa')
                        .removeClass('fa-caret-down')
                        .addClass('fa-caret-up');
                    $($(this).data('toggle-block')).slideDown();
                }
            }
        );

        $('.request-form_button-upload-file').on(
            'click',
            function () {
                $('.request-form_ajax-uploader input[type=file]').click();
            }
        );
    }
}
