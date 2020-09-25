var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Api = (function () {
    function Api() {
        this.CONF_TIMEOUT = 5000;
    }
    Api.getInstance = function () {
        if (!Api.instance) {
            Api.instance = new Api();
        }
        return Api.instance;
    };
    Api.rememberToken = function (token) {
        setCookie(Api.TOKEN_COOKIE_NAME, token, Api.TOKEN_COOKIE_EXPIRED_TIME_IN_DAYS);
    };
    Api.forgotToken = function () {
        removeCookie(Api.TOKEN_COOKIE_NAME);
    };
    Api.prepareResponse = function (response) {
        if (!IsApiResponse(response)) {
            response = ToApiResponse(response);
            response.is_error = true;
        }
        return response;
    };
    Api.prototype.call = function (uri, method, data, successCallback, errorCallback) {
        $.ajax({
            beforeSend: function (jqXHR, settings) {
                jqXHR.setRequestHeader('API-Request-Time', Math.floor(Date.now() / 1000).toString());
                var token = getCookie(Api.TOKEN_COOKIE_NAME);
                if (token) {
                    jqXHR.setRequestHeader('X-Auth-Token', token);
                }
            },
            complete: function () {
            },
            cache: false,
            dataType: "json",
            timeout: this.CONF_TIMEOUT,
            method: method,
            url: "" + Api.ROOT_URL + uri,
            data: data,
            success: function (data, textStatus, jqXHR) {
                var response = Api.prepareResponse(data);
                if (response.is_success) {
                    successCallback(response.data, response, textStatus);
                }
                if (response.is_error) {
                    errorCallback(response.data, response, textStatus);
                }
            },
            error: function (xhr) {
                var data = (typeof xhr.responseJSON.data !== "undefined") ? xhr.responseJSON.data : null;
                errorCallback(data, xhr.responseJSON, xhr.responseJSON.statusText);
            }
        });
    };
    Api.prototype.get = function (uri, data, successCallback, errorCallback) {
        this.call(uri, 'GET', data, successCallback, errorCallback);
    };
    Api.prototype.post = function (uri, data, successCallback, errorCallback) {
        this.call(uri, 'POST', data, successCallback, errorCallback);
    };
    Api.prototype.put = function (uri, data, successCallback, errorCallback) {
        this.call(uri, 'PUT', data, successCallback, errorCallback);
    };
    Api.prototype.patch = function (uri, data, successCallback, errorCallback) {
        this.call(uri, 'PATCH', data, successCallback, errorCallback);
    };
    Api.prototype.delete = function (uri, data, successCallback, errorCallback) {
        this.call(uri, 'DELETE', data, successCallback, errorCallback);
    };
    Api.ROOT_URL = API_ROOT_URL;
    Api.TOKEN_COOKIE_NAME = "api_auth_token";
    Api.TOKEN_COOKIE_EXPIRED_TIME_IN_DAYS = 365;
    Api.instance = null;
    return Api;
}());
var CommonUser = (function () {
    function CommonUser() {
        this.API = Api.getInstance();
    }
    return CommonUser;
}());
var Client = (function (_super) {
    __extends(Client, _super);
    function Client() {
        var _this = _super.call(this) || this;
        _this.data = null;
        _this.listenMyRequestTimer = null;
        _this.listerMyRequestTimeUpdate = 1999;
        (Api.getInstance()).get('clients/current', [], function (response) {
            _this.data = response;
        }, function () { });
        return _this;
    }
    Client.prototype.logout = function () {
        Api.forgotToken();
        window.location.replace("/user/login");
    };
    Client.prototype.renderMyRequests = function () {
        var self = this;
        var wrapper = $('#i-requests-wrapper');
        $.ajax('/user/_my_requests', {
            success: function (response, status, xhr) {
                wrapper.html(response);
            },
            error: function (jqXhr, textStatus, errorMessage) {
            }
        });
    };
    Client.prototype.listenMyRequests = function () {
        var self = this;
        var oldHash = null;
        self.renderMyRequests();
        self.listenMyRequestTimer = setInterval(function () {
            self.API.get('clients/current/requests/hash', [], function (newHash) {
                if (oldHash != newHash) {
                    oldHash = newHash;
                    self.renderMyRequests();
                }
            }, function () {
            });
        }, self.listerMyRequestTimeUpdate);
    };
    return Client;
}(CommonUser));
var ClientLoginForm = (function () {
    function ClientLoginForm() {
        this.API = Api.getInstance();
    }
    ClientLoginForm.prototype.init = function () {
        var form = $('#i-login-form');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var phone = $('[name="phone"]').val();
                var pwd = $('[name="pwd"]').val();
                var uri = 'clients/generate_auth_token';
                self.API.post(uri, {
                    'phone': phone,
                    'pwd': pwd
                }, function (token) {
                    Api.rememberToken(token);
                    window.location.replace("/user/dashboard");
                }, function (error) {
                    var errExample = $('#i-error-message-example');
                    var errBlock = $('#i-error-message');
                    errBlock.html(errExample.html());
                    errBlock.hide().find('.alert-content').html(error);
                    errBlock.fadeIn();
                });
            }
            return false;
        });
    };
    return ClientLoginForm;
}());
var ClientRegistrationForm = (function () {
    function ClientRegistrationForm() {
        this.API = Api.getInstance();
    }
    ClientRegistrationForm.prototype.setUserTimeOffsetAsFormParam = function () {
        var timeOffset = -new Date().getTimezoneOffset() / 60;
        $('[name="time_offset"]').val(timeOffset);
    };
    ClientRegistrationForm.prototype.initFormStep1 = function () {
        var form = $('#i-client-registration-form_step-1');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var phone = form.find('[name="phone"]').val();
                $('[name="phone"]').val(phone);
                self.API.post('clients/send_pin', {
                    phone: phone
                }, function () {
                    ManyPanelsForm_NextFromStep(1, 2);
                }, function () {
                    ManyPanelsForm_ShowStep(1, 'fail', 2);
                });
            }
            return false;
        });
    };
    ClientRegistrationForm.prototype.initFormStep2 = function () {
        var self = this;
        var form = $('#i-client-registration-form_step-2');
        var pinForm = new PinForm();
        pinForm.init(form, function (isCorrectPin) {
            if (isCorrectPin) {
                var phone_1 = $('[name="phone"]').val();
                self.API.get('clients/is_phone_busy/' + encodeURIComponent(PhoneFilter(phone_1)), [], function (isBusy) {
                    var uri = +isBusy ? 'clients/regenerate_password' : 'clients';
                    self.API.post(uri, {
                        phone: phone_1,
                        code: pinForm.getFullCode(form),
                        time_offset: $('[name="time_offset"]').val()
                    }, function () {
                        ManyPanelsForm_ShowStep(2, 'success', 2);
                    }, function () {
                        ManyPanelsForm_ShowStep(2, 'fail', 2);
                    });
                }, function () {
                    ManyPanelsForm_ShowStep(2, 'fail', 2);
                });
            }
            else {
                $('.phone-verification-block_error-block').fadeIn();
            }
        }, function () {
            ManyPanelsForm_ShowStep(2, 'fail', 2);
        });
    };
    ClientRegistrationForm.prototype.init = function () {
        this.setUserTimeOffsetAsFormParam();
        this.initFormStep1();
        this.initFormStep2();
    };
    return ClientRegistrationForm;
}());
var Engineer = (function (_super) {
    __extends(Engineer, _super);
    function Engineer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.listenRequestTimer = null;
        _this.listerRequestTimeUpdate = 1999;
        _this.listenMyRequestTimer = null;
        _this.listerMyRequestTimeUpdate = 1999;
        return _this;
    }
    Engineer.prototype.logout = function () {
        Api.forgotToken();
        window.location.replace("/engineer/login");
    };
    Engineer.prototype.renderRequests = function () {
        var self = this;
        var wrapper = $('#i-requests-wrapper');
        $.ajax('/engineer/_requests', {
            success: function (response, status, xhr) {
                wrapper.html(response);
            },
            error: function (jqXhr, textStatus, errorMessage) {
            }
        });
    };
    Engineer.prototype.listenRequests = function () {
        var self = this;
        var oldHash = null;
        self.renderRequests();
        self.listenRequestTimer = setInterval(function () {
            self.API.get('requests/hash', [], function (newHash) {
                if (oldHash != newHash) {
                    oldHash = newHash;
                    self.renderRequests();
                }
            }, function () {
            });
        }, self.listerRequestTimeUpdate);
    };
    Engineer.prototype.renderMyRequests = function () {
        var self = this;
        var wrapper = $('#i-requests-wrapper');
        $.ajax('/engineer/_my_requests', {
            success: function (response, status, xhr) {
                wrapper.html(response);
            },
            error: function (jqXhr, textStatus, errorMessage) {
            }
        });
    };
    Engineer.prototype.listenMyRequests = function () {
        var self = this;
        var oldHash = null;
        self.renderMyRequests();
        self.listenMyRequestTimer = setInterval(function () {
            self.API.get('engineers/current/requests/hash', [], function (newHash) {
                if (oldHash != newHash) {
                    oldHash = newHash;
                    self.renderMyRequests();
                }
            }, function () {
            });
        }, self.listerMyRequestTimeUpdate);
    };
    Engineer.prototype.initFormTryGetRequest = function () {
        var form = $('#many-panels-form-panel_assign_request_to_me form');
        var self = this;
        form.on('submit', function () {
            var msgWrapper = $('#i-msg');
            var request_id = form.find('[name="request_id"]').val();
            self.API.post("requests/" + request_id + "/try_set_engineer", [], function (response) {
                ManyPanelsForm_ShowStep('assign_request_to_me', 'call_to_client', 1);
            }, function (response) {
                msgWrapper.html(response);
            });
            return false;
        });
    };
    Engineer.prototype.initFormCallToClient = function () {
        var form = $('#many-panels-form-panel_call_to_client form');
        var self = this;
        form.find('[type="submit"]').each(function () {
            $(this).on("click", function () {
                form.find('[name="submit_value"]').val($(this).val());
            });
        });
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            var isCantCall = form.find('[name="submit_value"]').val() === 'N';
            var callTime = isCantCall ? 0 : Math.floor(Date.now() / 1000);
            var cantCallTime = isCantCall ? Math.floor(Date.now() / 1000) : 0;
            var params = {
                engineer_call_time: callTime,
                engineer_cant_call_time: cantCallTime
            };
            self.API.patch("requests/" + request_id, params, function () {
                if (isCantCall) {
                    ManyPanelsForm_ShowStep('call_to_client', 'cant_call_to_client', 1);
                }
                else {
                    ManyPanelsForm_ShowStep('call_to_client', 'set_meeting_time', 1);
                }
            }, function () {
            });
            return false;
        });
    };
    Engineer.prototype.initFormAgreeOrDisagreeForRequest = function () {
        var form = $('#many-panels-form-panel_set_by_admin form');
        var self = this;
        form.find('[type="submit"]').each(function () {
            $(this).on("click", function () {
                form.find('[name="submit_value"]').val($(this).val());
            });
        });
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            var isAgree = form.find('[name="submit_value"]').val() === 'Y';
            if (isAgree) {
                self.API.patch("requests/" + request_id, {
                    status: RequestModel.STATUS_ENGINEER_SET
                }, function () {
                    ManyPanelsForm_ShowStep('set_by_admin', 'call_to_client', 1);
                }, function () {
                });
            }
            else {
                self.API.post("requests/" + request_id + "/clear_engineer", [], function () {
                    ManyPanelsForm_ShowStep('set_by_admin', 'assign_request_to_me', 1);
                }, function () {
                });
            }
            return false;
        });
    };
    Engineer.prototype.initFormSetMeetingTime = function () {
        var form = $('#many-panels-form-panel_set_meeting_time form');
        var self = this;
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            var status = form.find('[name="status"]').val();
            var time_offset = form.find('[name="time_offset"]').val();
            var timeZone = Math.ceil(time_offset / 3600);
            var meeting_time_asString = form.find('[name="meeting_time__date"]').val() + ' ' +
                form.find('[name="meeting_time__hours"]').val() + ':' + form.find('[name="meeting_time__mins"]').val() +
                ' UTC' + (timeZone > 0 ? ('+' + timeZone) : timeZone);
            var meeting_time = my_strtotime(meeting_time_asString);
            self.API.patch("requests/" + request_id, {
                status: status,
                meeting_time: meeting_time
            }, function () {
                ManyPanelsForm_ShowStep('set_meeting_time', 'play', 1);
            }, function () {
            });
            return false;
        });
    };
    Engineer.prototype.initFormStartWork = function () {
        var form = $('#many-panels-form-panel_play form');
        var self = this;
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            var status = form.find('[name="status"]').val();
            self.API.patch("requests/" + request_id, {
                status: status
            }, function () {
                ManyPanelsForm_ShowStep('play', 'pause_finish_cant', 1);
            }, function () {
            });
            return false;
        });
    };
    Engineer.prototype.initFormPauseWork = function () {
        var form = $('#many-panels-form-panel_pause_finish_cant .form-pause-work');
        var self = this;
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            self.API.patch("requests/" + request_id, {
                status: form.find('[name="status"]').val(),
                reason: form.find('[name="reason"]').val()
            }, function () {
                ManyPanelsForm_ShowStep('pause_finish_cant', 'play', 1);
            }, function () {
            });
            return false;
        });
    };
    Engineer.prototype.initFormFinishWork = function () {
        var form = $('#many-panels-form-panel_pause_finish_cant .form-finish-work');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var request_id = form.find('[name="request_id"]').val();
                self.API.patch("requests/" + request_id, form.serializeArray(), function () {
                    ManyPanelsForm_ShowStep('pause_finish_cant', 'waiting_while_client_set_payment_method', 1);
                    self.waitWhileClientSetPaymentMethod();
                }, function () {
                });
            }
            return false;
        });
    };
    Engineer.prototype.initFormCantFinish = function () {
        var form = $('#many-panels-form-panel_pause_finish_cant .form-cant-finish-work');
        var self = this;
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            self.API.patch("requests/" + request_id, {
                status: form.find('[name="status"]').val(),
                reason: form.find('[name="reason"]').val()
            }, function () {
                ManyPanelsForm_ShowStep('pause_finish_cant', 'can_not_finish', 1);
            }, function () {
            });
            return false;
        });
    };
    Engineer.prototype.waitWhileClientSetPaymentMethod = function () {
        var request_id = $('[name="request_id"]').val();
        var self = this;
        var timer = null;
        var checker = function () {
            self.API.get("requests/" + request_id, [], function (response) {
                var hasPayMethod2 = !!response.pay_type_2;
                if (hasPayMethod2) {
                    if (response.pay_type_2 == RequestModel.PAY_TYPE_CASH) {
                        ManyPanelsForm_ShowStep('waiting_while_client_set_payment_method', 'approve_get_money', 1);
                        clearInterval(timer);
                    }
                    else if (response.pay_type_2 == RequestModel.PAY_TYPE_CARD) {
                        if (response.pay_approve_2) {
                            ManyPanelsForm_ShowStep('waiting_while_client_set_payment_method', 'rating', 1);
                            clearInterval(timer);
                        }
                    }
                }
            }, function () {
            });
        };
        timer = setInterval(checker, 999);
    };
    Engineer.prototype.initFormApproveGetMoney = function () {
        var form = $('#many-panels-form-panel_approve_get_money form');
        var self = this;
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            self.API.patch("requests/" + request_id, form.serializeArray(), function () {
                ManyPanelsForm_ShowStep('approve_get_money', 'rating', 1);
            }, function () {
            });
            return false;
        });
    };
    Engineer.prototype.initFormSetRating = function () {
        var form = $('#many-panels-form-panel_rating form');
        var self = this;
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            self.API.patch("requests/" + request_id, form.serializeArray(), function () {
                ManyPanelsForm_ShowStep('rating', 'thank_you', 1);
            }, function () {
            });
            return false;
        });
    };
    Engineer.prototype.initRequestForm = function () {
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
    };
    return Engineer;
}(CommonUser));
var EngineerForgotPasswordForm = (function () {
    function EngineerForgotPasswordForm() {
        this.API = Api.getInstance();
    }
    EngineerForgotPasswordForm.prototype.setUserTimeOffsetAsFormParam = function () {
        var timeOffset = -new Date().getTimezoneOffset() / 60;
        $('[name="time_offset"]').val(timeOffset);
    };
    EngineerForgotPasswordForm.prototype.initFormStep1 = function () {
        var form = $('#i-engineer-forgot-password-form_step-1');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var phone = form.find('[name="phone"]').val();
                $('[name="phone"]').val(phone);
                self.API.post('engineers/send_pin', {
                    phone: phone
                }, function () {
                    ManyPanelsForm_NextFromStep(1, 2);
                }, function () {
                    ManyPanelsForm_ShowStep(1, 'fail', 2);
                });
            }
            return false;
        });
    };
    EngineerForgotPasswordForm.prototype.initFormStep2 = function () {
        var self = this;
        var form = $('#i-engineer-forgot-password-form_step-2');
        var pinForm = new PinForm();
        pinForm.init(form, function (isCorrectPin) {
            if (isCorrectPin) {
                var phone_2 = $('[name="phone"]').val();
                self.API.get('engineers/is_phone_busy/' + encodeURIComponent(PhoneFilter(phone_2)), [], function (isBusy) {
                    if (!+isBusy) {
                        ManyPanelsForm_ShowStep(2, 'fail', 2);
                    }
                    else {
                        self.API.post('engineers/regenerate_password', {
                            phone: phone_2,
                            code: pinForm.getFullCode(form),
                            time_offset: $('[name="time_offset"]').val()
                        }, function () {
                            ManyPanelsForm_ShowStep(2, 'success', 2);
                        }, function () {
                            ManyPanelsForm_ShowStep(2, 'fail', 2);
                        });
                    }
                }, function () {
                    ManyPanelsForm_ShowStep(2, 'fail', 2);
                });
            }
            else {
                $('.phone-verification-block_error-block').fadeIn();
            }
        }, function () {
            ManyPanelsForm_ShowStep(2, 'fail', 2);
        });
    };
    EngineerForgotPasswordForm.prototype.init = function () {
        this.setUserTimeOffsetAsFormParam();
        this.initFormStep1();
        this.initFormStep2();
    };
    return EngineerForgotPasswordForm;
}());
var EngineerLoginForm = (function () {
    function EngineerLoginForm() {
        this.API = Api.getInstance();
    }
    EngineerLoginForm.prototype.init = function () {
        var form = $('#i-login-form');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var phone = $('[name="phone"]').val();
                var pwd = $('[name="pwd"]').val();
                var uri = 'engineers/generate_auth_token';
                self.API.post(uri, {
                    'phone': phone,
                    'pwd': pwd
                }, function (token) {
                    Api.rememberToken(token);
                    window.location.replace("/engineer/dashboard");
                }, function (error) {
                    var errExample = $('#i-error-message-example');
                    var errBlock = $('#i-error-message');
                    errBlock.html(errExample.html());
                    errBlock.hide().find('.alert-content').html(error);
                    errBlock.fadeIn();
                });
            }
            return false;
        });
    };
    return EngineerLoginForm;
}());
var EngineerRegistrationForm = (function () {
    function EngineerRegistrationForm() {
        this.API = Api.getInstance();
    }
    EngineerRegistrationForm.prototype.setUserTimeOffsetAsFormParam = function () {
        var timeOffset = -new Date().getTimezoneOffset() / 60;
        $('[name="time_offset"]').val(timeOffset);
    };
    EngineerRegistrationForm.prototype.initFormStep1 = function () {
        var form = $('#i-engineer-registration-form_step-1');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var phone = form.find('[name="phone"]').val();
                $('[name="phone"]').val(phone);
                var fields = ['full_name', 'about_me'];
                for (var i in fields) {
                    var field = fields[i];
                    $("[name=\"" + field + "\"]").val(form.find("[name=\"" + field + "\"]").val());
                }
                self.API.post('engineers/send_pin', {
                    phone: phone
                }, function () {
                    ManyPanelsForm_NextFromStep(1, 2);
                }, function () {
                    ManyPanelsForm_ShowStep(1, 'fail', 2);
                });
            }
            return false;
        });
    };
    EngineerRegistrationForm.prototype.initFormStep2 = function () {
        var self = this;
        var form = $('#i-engineer-registration-form_step-2');
        var pinForm = new PinForm();
        pinForm.init(form, function (isCorrectPin) {
            if (isCorrectPin) {
                var phone_3 = $('[name="phone"]').val();
                self.API.get('engineers/is_phone_busy/' + encodeURIComponent(PhoneFilter(phone_3)), [], function (isBusy) {
                    var uri = +isBusy ? 'engineers/regenerate_password' : 'engineers';
                    self.API.post(uri, {
                        phone: phone_3,
                        code: pinForm.getFullCode(form),
                        time_offset: $('[name="time_offset"]').val()
                    }, function () {
                        ManyPanelsForm_ShowStep(2, 'success', 2);
                    }, function () {
                        ManyPanelsForm_ShowStep(2, 'fail', 2);
                    });
                }, function () {
                    ManyPanelsForm_ShowStep(2, 'fail', 2);
                });
            }
            else {
                $('.phone-verification-block_error-block').fadeIn();
            }
        }, function () {
            ManyPanelsForm_ShowStep(2, 'fail', 2);
        });
    };
    EngineerRegistrationForm.prototype.init = function () {
        this.setUserTimeOffsetAsFormParam();
        this.initFormStep1();
        this.initFormStep2();
    };
    return EngineerRegistrationForm;
}());
var LogoBlock = (function () {
    function LogoBlock() {
    }
    LogoBlock.prototype.updateByLogo = function () {
        $('.logo-block_logo').on('click', function () {
            $('body').addClass('ptr-refresh ptr-loading');
        });
    };
    LogoBlock.prototype.init = function () {
        this.updateByLogo();
    };
    return LogoBlock;
}());
var Manager = (function (_super) {
    __extends(Manager, _super);
    function Manager() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.listenRequestTimer = null;
        _this.listerRequestTimeUpdate = 1999;
        return _this;
    }
    Manager.prototype.logout = function () {
        Api.forgotToken();
        window.location.replace("/manager/login");
    };
    Manager.prototype.renderRequests = function () {
        var self = this;
        var wrapper = $('#i-requests-wrapper');
        $.ajax('/manager/_requests?statuses=all', {
            success: function (response, status, xhr) {
                wrapper.html(response);
            },
            error: function (jqXhr, textStatus, errorMessage) {
            }
        });
    };
    Manager.prototype.listenRequests = function () {
        var self = this;
        var oldHash = null;
        self.renderRequests();
        self.listenRequestTimer = setInterval(function () {
            self.API.get('requests/hash', {
                statuses: 'all'
            }, function (newHash) {
                if (oldHash != newHash) {
                    oldHash = newHash;
                    self.renderRequests();
                }
            }, function () {
            });
        }, self.listerRequestTimeUpdate);
    };
    Manager.prototype.initManualSetEngineer = function () {
        var form = $('#many-panels-form-panel_manual-set-engineer form');
        var self = this;
        form.on('submit', function () {
            var msgWrapper = $('#i-msg');
            var request_id = form.find('[name="request_id"]').val();
            self.API.post("requests/" + request_id + "/try_set_engineer", form.serializeArray(), function (response) {
                ManyPanelsForm_ShowStep('manual-set-engineer', 'wait-agree-from-engineer', 1);
            }, function (response) {
                msgWrapper.html(response);
            });
            return false;
        });
    };
    Manager.prototype.initResetRequestEngineer = function () {
        var form = $('#many-panels-form-panel_wait-agree-from-engineer form');
        var self = this;
        form.on('submit', function () {
            var msgWrapper = $('#i-msg');
            var request_id = form.find('[name="request_id"]').val();
            self.API.post("requests/" + request_id + "/clear_engineer", [], function (response) {
                ManyPanelsForm_ShowStep('wait-agree-from-engineer', 'manual-set-engineer', 1);
            }, function (response) {
                msgWrapper.html(response);
            });
            return false;
        });
    };
    Manager.prototype.initFormRequestFailed = function () {
        var form = $('#many-panels-form-panel_wait-approve-failed form');
        var self = this;
        form.find('[type="submit"]').each(function () {
            $(this).on("click", function () {
                form.find('[name="submit_value"]').val($(this).val());
            });
        });
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            var isFailed = form.find('[name="submit_value"]').val() === 'Y';
            var status = isFailed ? RequestModel.STATUS_FAIL_APPROVE : RequestModel.STATUS_IN_PROGRESS;
            var message = form.find('[name="message_about_failed"]').val();
            var params = {
                status: status,
                message_about_failed: message
            };
            self.API.patch("requests/" + request_id, params, function () {
                if (isFailed) {
                    ManyPanelsForm_ShowStep('wait-approve-failed', 'failed', 1);
                }
                else {
                    ManyPanelsForm_ShowStep('wait-approve-failed', 'engineer-in-progress', 1);
                }
            }, function () {
            });
            return false;
        });
    };
    Manager.prototype.initFormRequestFinished = function () {
        var form = $('#many-panels-form-panel_wait-approve-finish form');
        var self = this;
        form.find('[type="submit"]').each(function () {
            $(this).on("click", function () {
                form.find('[name="submit_value"]').val($(this).val());
            });
        });
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            var isFailed = form.find('[name="submit_value"]').val() === 'Y';
            var status = isFailed ? RequestModel.STATUS_FINISH_APPROVE : RequestModel.STATUS_IN_PROGRESS;
            var message = form.find('[name="message_about_finished"]').val();
            var params = {
                status: status,
                message_about_finished: message
            };
            self.API.patch("requests/" + request_id, params, function () {
                if (isFailed) {
                    ManyPanelsForm_ShowStep('wait-approve-finish', 'finished', 1);
                }
                else {
                    ManyPanelsForm_ShowStep('wait-approve-finish', 'engineer-in-progress', 1);
                }
            }, function () {
            });
            return false;
        });
    };
    Manager.prototype.initFormSetMeetingTime = function () {
        var form = $('#many-panels-form-panel_set-meeting-time form');
        var self = this;
        form.on('submit', function () {
            var request_id = form.find('[name="request_id"]').val();
            var status = form.find('[name="status"]').val();
            var time_offset = form.find('[name="time_offset"]').val();
            var timeZone = Math.ceil(time_offset / 3600);
            var meeting_time = my_strtotime(form.find('[name="meeting_time__date"]').val() + ' ' +
                form.find('[name="meeting_time__hours"]').val() + ':' + form.find('[name="meeting_time__mins"]').val() +
                ' UTC' + (timeZone > 0 ? ('+' + timeZone) : timeZone));
            self.API.patch("requests/" + request_id, {
                status: status,
                meeting_time: Math.floor(meeting_time / 1000)
            }, function () {
                ManyPanelsForm_ShowStep('set-meeting-time', 'engineer-in-progress', 1);
            }, function () {
            });
            return false;
        });
    };
    Manager.prototype.initRequestForm = function () {
        this.initManualSetEngineer();
        this.initResetRequestEngineer();
        this.initFormRequestFailed();
        this.initFormRequestFinished();
        this.initFormSetMeetingTime();
    };
    return Manager;
}(CommonUser));
var ManagerForgotPasswordForm = (function () {
    function ManagerForgotPasswordForm() {
        this.API = Api.getInstance();
    }
    ManagerForgotPasswordForm.prototype.setUserTimeOffsetAsFormParam = function () {
        var timeOffset = -new Date().getTimezoneOffset() / 60;
        $('[name="time_offset"]').val(timeOffset);
    };
    ManagerForgotPasswordForm.prototype.initFormStep1 = function () {
        var form = $('#i-manager-forgot-password-form_step-1');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var phone = form.find('[name="phone"]').val();
                $('[name="phone"]').val(phone);
                self.API.post('managers/send_pin', {
                    phone: phone
                }, function () {
                    ManyPanelsForm_NextFromStep(1, 2);
                }, function () {
                    ManyPanelsForm_ShowStep(1, 'fail', 2);
                });
            }
            return false;
        });
    };
    ManagerForgotPasswordForm.prototype.initFormStep2 = function () {
        var self = this;
        var form = $('#i-manager-forgot-password-form_step-2');
        var pinForm = new PinForm();
        pinForm.init(form, function (isCorrectPin) {
            if (isCorrectPin) {
                var phone_4 = $('[name="phone"]').val();
                self.API.get('managers/is_phone_busy/' + encodeURIComponent(PhoneFilter(phone_4)), [], function (isBusy) {
                    if (!+isBusy) {
                        ManyPanelsForm_ShowStep(2, 'fail', 2);
                    }
                    else {
                        self.API.post('managers/regenerate_password', {
                            phone: phone_4,
                            code: pinForm.getFullCode(form),
                            time_offset: $('[name="time_offset"]').val()
                        }, function () {
                            ManyPanelsForm_ShowStep(2, 'success', 2);
                        }, function () {
                            ManyPanelsForm_ShowStep(2, 'fail', 2);
                        });
                    }
                }, function () {
                    ManyPanelsForm_ShowStep(2, 'fail', 2);
                });
            }
            else {
                $('.phone-verification-block_error-block').fadeIn();
            }
        }, function () {
            ManyPanelsForm_ShowStep(2, 'fail', 2);
        });
    };
    ManagerForgotPasswordForm.prototype.init = function () {
        this.setUserTimeOffsetAsFormParam();
        this.initFormStep1();
        this.initFormStep2();
    };
    return ManagerForgotPasswordForm;
}());
var ManagerLoginForm = (function () {
    function ManagerLoginForm() {
        this.API = Api.getInstance();
    }
    ManagerLoginForm.prototype.init = function () {
        var form = $('#i-login-form');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var phone = $('[name="phone"]').val();
                var pwd = $('[name="pwd"]').val();
                var uri = 'managers/generate_auth_token';
                self.API.post(uri, {
                    'phone': phone,
                    'pwd': pwd
                }, function (token) {
                    Api.rememberToken(token);
                    window.location.replace("/manager/dashboard");
                }, function (error) {
                    var errExample = $('#i-error-message-example');
                    var errBlock = $('#i-error-message');
                    errBlock.html(errExample.html());
                    errBlock.hide().find('.alert-content').html(error);
                    errBlock.fadeIn();
                });
            }
            return false;
        });
    };
    return ManagerLoginForm;
}());
var PinForm = (function () {
    function PinForm() {
        this.resendPinCodeTimer = null;
        this.API = Api.getInstance();
    }
    PinForm.prototype.checkPinCodeForm = function () {
        var hasEmptyInput = false;
        $('.input-focus-sequence').each(function () {
            var val = $(this).val();
            if (!val.length) {
                hasEmptyInput = true;
            }
        });
        if (!hasEmptyInput) {
            $('#request-form_phone-verification').submit();
        }
    };
    PinForm.prototype.activatedInputFocusSequence = function () {
        var self = this;
        $('.input-focus-sequence').each(function () {
            $(this).on('input', function () {
                var cur = $(this).val();
                var curLen = cur.length;
                var maxLen = +$(this).attr('maxlength');
                if (curLen >= maxLen) {
                    var nextElement = $(this).data('next-focus');
                    $(nextElement).trigger('focus');
                }
                self.checkPinCodeForm();
            });
            $(this).on('onpaste', function (e) {
                var max = $(this).attr("maxlength");
                e.originalEvent["clipboardData"].getData('text/plain').slice(0, max);
            });
        });
    };
    PinForm.prototype.startResendPinCodeTimer = function () {
        var delayTimer = 60;
        var self = this;
        self.resendPinCodeTimer = setInterval(function () {
            var dateObj = new Date(delayTimer * 1000);
            var min = dateObj.getUTCMinutes().toString().padStart(2, '0');
            var sec = dateObj.getSeconds().toString().padStart(2, '0');
            $('#i-resend-sms-timer').html(min + ':' + sec);
            delayTimer--;
            if (delayTimer <= 0) {
                clearInterval(self.resendPinCodeTimer);
                $('.is-wait-resend-sms-code-message').slideUp();
                $('.is-resend-sms-code-message').slideDown();
            }
        }, 1000);
    };
    PinForm.prototype.resendPinCode = function () {
        var form = $('#request-form_step-3');
        var self = this;
        var phone = form.find('[name="phone"]').val();
        phone = PhoneFilter(phone);
        self.API.post('clients/send_pin', {
            phone: phone
        }, function () {
            $('.is-wait-resend-sms-code-message').slideDown();
            $('.is-resend-sms-code-message').slideUp();
            self.startResendPinCodeTimer();
        }, function () {
        });
    };
    PinForm.prototype.getFullCode = function (form) {
        var code = '';
        var codes = [];
        for (var i = 1; i <= 4; i++) {
            codes.push(form.find('[name="code_' + i + '"]').val());
            code = codes.join('');
        }
        return code;
    };
    PinForm.prototype.init = function (form, successCallback, errorCallback) {
        var self = this;
        this.activatedInputFocusSequence();
        $('.phone-verification-block_input').on('change', function () {
            $('.phone-verification-block_error-block').hide();
        });
        $('.is-resend-sms-code-message button').on('click', function () {
            self.resendPinCode();
        });
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var phone = $('[name="phone"]').val();
                var code = self.getFullCode(form);
                self.API.post('clients/is_correct_pin', {
                    phone: phone,
                    code: code
                }, successCallback, errorCallback);
            }
            return false;
        });
    };
    return PinForm;
}());
var RequestForm = (function () {
    function RequestForm() {
        this.elements = {};
        this.guarantySwitchery = null;
        this.timerWaitDoneStep2 = null;
        this.timerWaitDoneStep1 = null;
        this.timerInProgressChecker = null;
        this.timerPauseChecker = null;
        this.timerWaitEngineerCall = null;
        this.timerWaitEngineer = null;
        this.pinForm = null;
        this.API = Api.getInstance();
    }
    RequestForm.prototype.technicsInputs = function () {
        var _this = this;
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
        this.API.get("technics/categories", [], function (data) {
            _this.elements.msCategory.setData(data);
        }, function (error) {
        });
        var self = this;
        $(this.elements.msCategory).on('selectionchange', function (e, m) {
            var value = this.getValue();
            $('[name="category_for_validator"]').val(value).trigger('focus').trigger('focusout');
            if (value.length) {
                self.elements.msMark.clear();
                self.elements.msModel.clear();
                self.elements.msMark.enable();
                self.API.get("technics/categories/" + value, [], function (data) {
                    var data2 = [];
                    for (var k in data) {
                        data2.push(data[k].name);
                    }
                    self.elements.msMark.setData(data2);
                }, function (error) {
                });
            }
            else {
                self.elements.msMark.clear();
                self.elements.msModel.clear();
                self.elements.msMark.disable();
                self.elements.msModel.disable();
            }
        });
        $(this.elements.msMark).on('selectionchange', function (e, m) {
            var value = this.getValue();
            if (value.length) {
                self.elements.msModel.clear();
                self.elements.msModel.enable();
                var category = self.elements.msCategory.getValue();
                self.API.get("technics/categories/" + category + "/" + value, [], function (data) {
                    var data2 = [];
                    for (var k in data) {
                        data2.push(data[k].name);
                    }
                    self.elements.msModel.setData(data2);
                }, function (error) {
                });
            }
            else {
                self.elements.msMark.clear();
                self.elements.msModel.clear();
                self.elements.msModel.disable();
            }
        });
    };
    RequestForm.prototype.map = function (ymaps) {
        ymaps.ready(function () {
            var suggestView1;
            var map;
            var mapContainerSelectorID = 'i-map';
            var mapContainer = $('#' + mapContainerSelectorID);
            var myPlacemark;
            ymaps.geolocation.get().then(function (res) {
                var bounds = res.geoObjects.get(0).properties.get('boundedBy'), mapState = ymaps.util.bounds.getCenterAndZoom(bounds, [mapContainer.width(), mapContainer.height()]);
                createMap(mapState);
            }, function (e) {
                createMap({
                    center: [54, 20],
                    zoom: 2
                });
            });
            function createMap(state) {
                var coords = state.center;
                state.controls = ['geolocationControl', 'zoomControl'];
                state.zoom = 14;
                map = new ymaps.Map(mapContainerSelectorID, state);
                specialCentringForMap(map);
                suggestView1 = new ymaps.SuggestView('suggest');
                map.events.add('click', function (e) {
                    var coords = e.get('coords');
                    myPlacemark.geometry.setCoordinates(coords);
                    getAddress(coords);
                });
                myPlacemark = createPlacemark(coords);
                map.geoObjects.add(myPlacemark);
                getAddress(myPlacemark.geometry.getCoordinates());
                myPlacemark.events.add('dragend', function () {
                    getAddress(myPlacemark.geometry.getCoordinates());
                });
            }
            function createPlacemark(coords) {
                return new ymaps.Placemark(coords, {
                    iconCaption: 'Поиск...'
                }, {
                    preset: 'islands#violetDotIconWithCaption',
                    draggable: true
                });
            }
            function specialCentringForMap(map, offset) {
                if (offset === void 0) { offset = 0; }
                var coordinates = map.center;
                var pixelCenter = map.getGlobalPixelCenter(coordinates);
                pixelCenter = [
                    pixelCenter[0],
                    pixelCenter[1] - offset
                ];
                var geoCenter = map.options.get('projection').fromGlobalPixels(pixelCenter, map.getZoom());
                map.setCenter(geoCenter);
            }
            function getAddress(coordinates) {
                $('[name="place_latitude"]').val(coordinates[0]);
                $('[name="place_longitude"]').val(coordinates[1]);
                ymaps.geocode(coordinates).then(function (res) {
                    var firstGeoObject = res.geoObjects.get(0);
                    myPlacemark.properties
                        .set({
                        iconCaption: [
                            firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
                            firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
                        ].filter(Boolean).join(', '),
                        balloonContent: firstGeoObject.getAddressLine()
                    });
                    $('#suggest').val(firstGeoObject.getAddressLine());
                });
            }
        });
    };
    RequestForm.prototype.setCountDown = function (valueWrapper, value, successCallback, preCallback) {
        if (preCallback === void 0) { preCallback = null; }
        return this.setNumber(valueWrapper, value, successCallback, preCallback);
    };
    RequestForm.prototype.setCountUp = function (valueWrapper, value, successCallback, preCallback) {
        if (preCallback === void 0) { preCallback = null; }
        return this.setNumber(valueWrapper, value, successCallback, preCallback);
    };
    RequestForm.prototype.setNumber = function (valueWrapper, value, successCallback, preCallback) {
        var func = function () {
            if (preCallback) {
                preCallback();
            }
            var step = 10;
            value = +value;
            var curValue = +valueWrapper.html();
            var newValue;
            if (curValue === value) {
                return;
            }
            if (curValue > value) {
                newValue = curValue - step;
                newValue = newValue < value ? value : newValue;
            }
            else {
                newValue = curValue + step;
                newValue = newValue > value ? value : newValue;
            }
            valueWrapper.html(newValue + '');
            if (newValue != value) {
                setTimeout(func, 1);
            }
            else {
                successCallback();
            }
        };
        return func();
    };
    RequestForm.prototype.getHeightOfHiddenElement = function (elem) {
        elem = $(elem);
        var previousStyles = elem.attr('style');
        var previousClasses = elem.attr('class');
        elem.removeAttr('class');
        elem.css({
            position: 'absolute',
            visibility: 'hidden',
            display: 'block'
        });
        var ret = elem.height();
        elem.attr('style', previousStyles ? previousStyles : '');
        elem.attr('class', previousClasses ? previousClasses : '');
        return ret;
    };
    RequestForm.prototype.scrollToTopForStepByStepForm = function () {
        var maxStepHeight = 0;
        var self = this;
        $('.request-form .one-panel').each(function () {
            var h = self.getHeightOfHiddenElement(this);
            maxStepHeight = Math.max(maxStepHeight, h);
        });
        var screenHeight = $(window).height();
        var screenWidth = $(window).width();
        var logoOffset = screenWidth >= 1200 ? 110 : (screenWidth >= 698 ? 60 : 0);
        var append = 51 +
            157 + logoOffset +
            30;
        if (screenHeight < maxStepHeight + append) {
            $('#content').css('min-height', maxStepHeight + append);
            $('.request-form').data('offset', 51);
        }
    };
    RequestForm.prototype.noCallButtonTimerActivated = function () {
        var delayTimer = 30;
        var delayFunc = function () {
            delayTimer--;
            var dateObj = new Date(delayTimer * 1000);
            var min = dateObj.getUTCMinutes().toString().padStart(2, '0');
            var sec = dateObj.getSeconds().toString().padStart(2, '0');
            var timerWrapper = $('.engineer-calling-block_no-call-button_timer');
            timerWrapper.html(min + ':' + sec);
            if (delayTimer) {
                setTimeout(delayFunc, 999);
            }
            else {
                timerWrapper.fadeOut();
                $('.engineer-calling-block_no-call-button').removeAttr('disabled');
            }
        };
        setTimeout(delayFunc, 999);
    };
    RequestForm.prototype.fillDoneStep2 = function () {
        var request_id = $('[name="request_id"]').val();
        var self = this;
        self.API.get("requests/" + request_id, [], function (response) {
            var hasEngineer = !!response.engineer_id;
            if (hasEngineer) {
                self.API.get("engineers/" + response.engineer_id, [], function (engineer) {
                    if (engineer.avatar) {
                        var avatarImg = $('#i-done-step-2-engineer_avatar');
                        avatarImg.attr('src', avatarImg.data('start-src-path') + engineer.avatar);
                    }
                    $('#i-done-step-2-engineer_name').html(engineer.full_name);
                }, function () {
                });
            }
        }, function () {
        });
    };
    RequestForm.prototype.gotoDone2TimerActivated = function () {
        var delayTimer = 10;
        var self = this;
        var delayFunc = function () {
            delayTimer--;
            var dateObj = new Date(delayTimer * 1000);
            var min = dateObj.getUTCMinutes().toString().padStart(2, '0');
            var sec = dateObj.getSeconds().toString().padStart(2, '0');
            var timerWrapper = $('.payment-success-timer');
            timerWrapper.html(min + ':' + sec);
            if (delayTimer) {
                setTimeout(delayFunc, 999);
            }
            else {
                timerWrapper.fadeOut();
                self.fillDoneStep2();
                ManyPanelsForm_ShowStep('payment_success_2', 'request_done_step_2', 5);
            }
        };
        setTimeout(delayFunc, 999);
    };
    RequestForm.prototype.gotoSearchEngineerTimerActivated = function () {
        var self = this;
        var delayTimer = 10;
        var delayFunc = function () {
            delayTimer--;
            var dateObj = new Date(delayTimer * 1000);
            var min = dateObj.getUTCMinutes().toString().padStart(2, '0');
            var sec = dateObj.getSeconds().toString().padStart(2, '0');
            var timerWrapper = $('.payment-success-timer');
            timerWrapper.html(min + ':' + sec);
            if (delayTimer) {
                setTimeout(delayFunc, 999);
            }
            else {
                timerWrapper.fadeOut();
                ManyPanelsForm_ShowStep('payment_success', 'searching_engineer', 5);
                self.waitEngineer();
            }
        };
        setTimeout(delayFunc, 999);
    };
    RequestForm.prototype.waitDoneStep2Window = function () {
        var request_id = $('[name="request_id"]').val();
        var self = this;
        var checker = function () {
            self.API.get("requests/" + request_id, [], function (response) {
                var isPayApprove = !!response.pay_approve_2;
                if (isPayApprove) {
                    self.fillDoneStep2();
                    ManyPanelsForm_ShowStep('AUTO', 'request_done_step_2', 5);
                    clearInterval(self.timerWaitDoneStep2);
                    clearInterval(self.timerPauseChecker);
                    clearInterval(self.timerInProgressChecker);
                }
            }, function () {
            });
        };
        self.timerWaitDoneStep2 = setInterval(checker, 999);
    };
    RequestForm.prototype.waitDoneStep1Window = function () {
        var request_id = $('[name="request_id"]').val();
        var self = this;
        var checker = function () {
            self.API.get("requests/" + request_id, [], function (response) {
                var isEngineerFinishRequest = response.status == RequestModel.STATUS_FINISH;
                if (isEngineerFinishRequest) {
                    self.updateRequestInformationOnPage(function () {
                        ManyPanelsForm_ShowStep('AUTO', 'request_done_step_1', 5);
                        clearInterval(self.timerWaitDoneStep1);
                        clearInterval(self.timerPauseChecker);
                        clearInterval(self.timerInProgressChecker);
                        self.waitDoneStep2Window();
                    });
                }
            }, function () {
            });
        };
        self.timerWaitDoneStep1 = setInterval(checker, 2999);
    };
    RequestForm.prototype.updateRequestInformationOnPage = function (successFunction) {
        if (successFunction === void 0) { successFunction = null; }
        var request_id = $('[name="request_id"]').val();
        var self = this;
        self.API.get("requests/" + request_id + "/short", [], function (response) {
            $('.i-request-engineer-name').html(response.engineer_name);
            if (response.engineer_avatar) {
                var avatarImg = $('.i-request-engineer-avatar');
                avatarImg.attr('src', avatarImg.data('start-src-path') + response.engineer_avatar);
            }
            $('.i-request-number').html(response.request_number);
            $('.i-request-legend').html(response.request_legend);
            var timestamp = new Date(response.planned_work_time * 1000);
            var meeting_time = timestamp.getDate() + "-" + (timestamp.getMonth() + 1) + "-" + timestamp.getFullYear() + " " + timestamp.getHours() + ":" + timestamp.getMinutes();
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
        }, function () {
        });
    };
    RequestForm.prototype.waitInProgressWindow = function () {
        var request_id = $('[name="request_id"]').val();
        var self = this;
        var checker = function () {
            self.API.get("requests/" + request_id, [], function (response) {
                var isInProgressRequest = response.status == RequestModel.STATUS_IN_PROGRESS;
                if (isInProgressRequest) {
                    self.updateRequestInformationOnPage();
                    ManyPanelsForm_ShowStep('AUTO', 'request_in_work', 5);
                }
            }, function () {
            });
        };
        this.timerInProgressChecker = setInterval(checker, 2999);
    };
    RequestForm.prototype.waitStartWorkWindow = function () {
        var request_id = $('[name="request_id"]').val();
        var self = this;
        var checker = function () {
            self.API.get("requests/" + request_id, [], function (response) {
                var isRequestWaitStartWork = response.status == RequestModel.STATUS_WAIT_START_WORK || response.status == RequestModel.STATUS_PAUSE;
                if (isRequestWaitStartWork) {
                    self.updateRequestInformationOnPage();
                    ManyPanelsForm_ShowStep('AUTO', 'request_pause', 5);
                }
            }, function () {
            });
        };
        this.timerPauseChecker = setInterval(checker, 2999);
    };
    RequestForm.prototype.waitEngineerCall = function () {
        var self = this;
        var isNotCallingBlockShow = false;
        var delayTimer = 300;
        var delayFunc = function () {
            delayTimer = delayTimer > 0 ? (delayTimer - 1) : 0;
            var dateObj = new Date(delayTimer * 1000);
            var min = dateObj.getUTCMinutes().toString().padStart(2, '0');
            var sec = dateObj.getSeconds().toString().padStart(2, '0');
            var timerWrapper = $('#i-call-timer');
            timerWrapper.html(min + ':' + sec);
            var initTimers = function () {
                self.waitStartWorkWindow();
                self.waitInProgressWindow();
                self.waitDoneStep1Window();
            };
            var request_id = $('[name="request_id"]').val();
            self.API.get("requests/" + request_id, [], function (response) {
                if (response.engineer_call_time) {
                    ManyPanelsForm_ShowStep('AUTO', 'engineer_calling', 5);
                    clearInterval(self.timerWaitEngineerCall);
                    initTimers();
                    self.noCallButtonTimerActivated();
                }
                else if (response.engineer_cant_call_time) {
                    ManyPanelsForm_ShowStep('AUTO', 'engineer_not_call', 5);
                    clearInterval(self.timerWaitEngineerCall);
                    initTimers();
                    self.API.patch("requests/" + request_id, {
                        need_call_manager: 1
                    }, function () {
                    }, function () {
                    });
                }
            }, function () {
            });
            if (!delayTimer) {
                if (!isNotCallingBlockShow) {
                    clearInterval(self.timerWaitEngineerCall);
                    ManyPanelsForm_ShowStep('AUTO', 'engineer_not_call', 5);
                    isNotCallingBlockShow = true;
                    initTimers();
                    var request_id_1 = $('[name="request_id"]').val();
                    self.API.patch("requests/" + request_id_1, {
                        need_call_manager: 1
                    }, function () {
                    }, function () {
                    });
                }
            }
        };
        this.timerWaitEngineerCall = setInterval(delayFunc, 999);
    };
    RequestForm.prototype.waitEngineer = function () {
        var request_id = $('[name="request_id"]').val();
        var self = this;
        var checker = function () {
            self.API.get("requests/" + request_id, [], function (response) {
                var hasEngineer = !!response.engineer_id && response.status == RequestModel.STATUS_ENGINEER_SET;
                if (hasEngineer) {
                    self.API.get("engineers/" + response.engineer_id, [], function (engineer) {
                        if (engineer.avatar) {
                            var avatarImg = $('#i-found-engineer_avatar');
                            avatarImg.attr('src', avatarImg.data('start-src-path') + engineer.avatar);
                        }
                        $('#i-found-engineer_name').html(engineer.full_name);
                        $('#i-call-button').attr('href', 'tel:' + PhoneFilter(engineer.phone));
                        ManyPanelsForm_ShowStep('searching_engineer', 'engineer_found', 5);
                        self.waitEngineerCall();
                        clearInterval(self.timerWaitEngineer);
                    }, function () {
                    });
                }
            }, function () {
            });
        };
        self.timerWaitEngineer = setInterval(checker, 999);
    };
    RequestForm.prototype.clearTimers = function () {
        clearInterval(this.timerWaitEngineer);
        clearInterval(this.timerWaitEngineerCall);
        clearInterval(this.timerPauseChecker);
        clearInterval(this.timerInProgressChecker);
        clearInterval(this.timerWaitDoneStep1);
        clearInterval(this.timerWaitDoneStep2);
    };
    RequestForm.prototype.setRating = function (stars) {
        if (stars <= 3) {
            $('.request-done_rating-good').slideUp();
            $('.request-done_rating-bad').slideDown();
        }
        else {
            $('.request-done_rating-bad').slideUp();
            $('.request-done_rating-good').slideDown();
        }
        var request_id = $('[name="request_id"]').val();
        this.API.patch("requests/" + request_id, {
            client_rating_stars: stars
        }, function (response) {
            $('#i-price-block_amount').data('amount', response);
            $('[name="price_diagnostic"]').val(response);
            $('#i-price-block_amount .price-block_amount-value').html(response);
        }, function () {
        });
    };
    RequestForm.prototype.initFormStep1 = function () {
        this.technicsInputs();
        var self = this;
        var form = $('#request-form_step-1');
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var current_request_id = $('[name="request_id"]').val();
                var successCallback = function (request_id) {
                    $('[name="request_id"]').val(request_id);
                    ManyPanelsForm_NextFromStep(1, 5);
                    self.API.get("requests/" + request_id + "/diagnostic_price", [], function (response) {
                        $('#i-price-block_amount').data('amount', response);
                        $('[name="price_diagnostic"]').val(response);
                        $('#i-price-block_amount .price-block_amount-value').html(response);
                    }, function () {
                    });
                };
                var errorCallback = function () {
                };
                var params = form.serializeArray();
                if (current_request_id) {
                    self.API.patch("requests/" + current_request_id, params, successCallback, errorCallback);
                }
                else {
                    self.API.post('requests', params, successCallback, errorCallback);
                }
            }
            return false;
        });
    };
    RequestForm.prototype.initFormStep2 = function () {
        var self = this;
        var form = $('#request-form_step-2');
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var request_id = form.find('[name="request_id"]').val();
                var params = form.serializeArray();
                var foundValue_1 = null;
                params.forEach(function (val) {
                    if (val.name == 'file_1_rdy_name') {
                        foundValue_1 = val.value;
                        return;
                    }
                });
                params.push({
                    name: 'file_1',
                    value: foundValue_1
                });
                self.API.patch("requests/" + request_id, params, function (data) {
                    ManyPanelsForm_NextFromStep(2, 5);
                }, function () {
                });
            }
            return false;
        });
    };
    RequestForm.prototype.initFormStep3 = function () {
        var self = this;
        var form = $('#request-form_step-3');
        form.find('#i-full_name').val(g_client.data.full_name);
        form.find('#i-phone').val(g_client.data.phone);
        new IMask(form.find('#i-phone').get(0), g_phoneMask);
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var phone_5 = form.find('[name="phone"]').val();
                phone_5 = PhoneFilter(phone_5);
                self.API.get('clients/is_need_verify_phone/' + encodeURIComponent(phone_5), [], function (isNeedVerifyPhone) {
                    var request_id = form.find('[name="request_id"]').val();
                    self.API.patch("requests/" + request_id, form.serializeArray(), function (data) {
                        if (isNeedVerifyPhone) {
                            $('[name="phone_number_for_verification"]').val(phone_5);
                            ManyPanelsForm_ShowStep(3, 'phone_verification', 5);
                            self.API.post('clients/send_pin', {
                                phone: phone_5
                            }, function () {
                                self.pinForm.startResendPinCodeTimer();
                            }, function () {
                            });
                        }
                        else {
                            ManyPanelsForm_NextFromStep(3, 5);
                        }
                    }, function () {
                    });
                }, function () {
                });
            }
            return false;
        });
    };
    RequestForm.prototype.initFormPhoneVerification = function () {
        var form = $('#request-form_phone-verification');
        this.pinForm = new PinForm();
        this.pinForm.init(form, function (isCorrectPin) {
            if (isCorrectPin) {
                ManyPanelsForm_ShowStep('phone_verification', 4, 5);
            }
            else {
                $('.phone-verification-block_error-block').fadeIn();
            }
        }, function () {
            $('.phone-verification-block_error-block').fadeIn();
        });
    };
    RequestForm.prototype.initFormStep4 = function (ymaps) {
        $('#i-button-additional-about-address').on('click', function () {
            $(this).parent().slideUp();
            $('#i-additional-about-address').slideDown();
        });
        this.map(ymaps);
        var self = this;
        var form = $('#request-form_step-4');
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var request_id = form.find('[name="request_id"]').val();
                self.API.patch("requests/" + request_id, form.serializeArray(), function (data) {
                    ManyPanelsForm_NextFromStep(4, 5);
                }, function () {
                });
            }
            return false;
        });
    };
    RequestForm.prototype.initFormStep5 = function () {
        this.guarantySwitchery = new Switchery(document.querySelector('#i-is_guaranty'));
        var self = this;
        var timer = null;
        $('#i-is_guaranty').on('change', function () {
            var chkBox = this;
            var isChecked = $(chkBox).is(":checked");
            var amountWrapper = $('#i-price-block_amount');
            var amountValueWrapper = amountWrapper.find('.price-block_amount-value');
            var guarantyAgreements = $('#i-price-block_guaranty-agreements');
            var payTypeWrapper = $('#request-form_step-5_pay-type');
            if (isChecked) {
                timer = self.setCountDown(amountValueWrapper, 0, function () {
                    self.guarantySwitchery.enable();
                });
                guarantyAgreements.stop().slideDown();
                payTypeWrapper.slideUp();
            }
            else {
                timer = self.setCountUp(amountValueWrapper, +amountWrapper.data('amount'), function () {
                    self.guarantySwitchery.enable();
                });
                guarantyAgreements.stop().slideUp();
                payTypeWrapper.slideDown();
            }
            setTimeout(function () {
                self.guarantySwitchery.disable();
                setTimeout(function () {
                    self.guarantySwitchery.enable();
                }, 1999);
            }, 9);
        });
        var form = $('#request-form_step-5');
        form.find('.js-switch').on('click', function () {
            $(this).trigger('focusout');
        });
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var request_id = form.find('[name="request_id"]').val();
                self.API.patch("requests/" + request_id, form.serializeArray(), function (data) {
                    var payType = $('[name="pay_type"]:checked').val();
                    var isGuaranty = $('[name="is_guaranty"]').is(':checked');
                    if (!isGuaranty && payType == 'card') {
                        $('#goto-pay-system-form').submit();
                    }
                    else {
                        ManyPanelsForm_ShowStep(5, 'searching_engineer', 5);
                        self.waitEngineer();
                    }
                }, function () {
                });
            }
            return false;
        });
    };
    RequestForm.prototype.initFormCancelRequest = function () {
        var form = $('#request-form_cancel-request');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var request_id = form.find('[name="request_id"]').val();
                self.API.patch("requests/" + request_id, form.serializeArray(), function (data) {
                    $('#request-form_cancel-request_cancel-btn').trigger('click');
                    ManyPanelsForm_ShowStep('AUTO', 'cancel_success', 5);
                    self.clearTimers();
                    var delayTimer = 10;
                    var delayFunc = function () {
                        delayTimer--;
                        var dateObj = new Date(delayTimer * 1000);
                        var min = dateObj.getUTCMinutes().toString().padStart(2, '0');
                        var sec = dateObj.getSeconds().toString().padStart(2, '0');
                        var timerWrapper = $('#i-request-form-cancel-success-button-timer');
                        timerWrapper.html(min + ':' + sec);
                        if (delayTimer) {
                            setTimeout(delayFunc, 999);
                        }
                        else {
                            timerWrapper.fadeOut();
                            $('#i-request-form-cancel-success-button').get(0).click();
                        }
                    };
                    setTimeout(delayFunc, 999);
                }, function () {
                });
            }
            return false;
        });
    };
    RequestForm.prototype.initFormStepRequestDone1 = function () {
        var form = $('#request-form_done-step-1');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var request_id = form.find('[name="request_id"]').val();
                var payType_1 = $('[name="pay_type_2"]:checked').val();
                self.API.patch("requests/" + request_id, form.serializeArray(), function (data) {
                    if (payType_1 == 'card') {
                        $('#goto-pay-system-form-2').submit();
                    }
                    else {
                        self.updateRequestInformationOnPage();
                        ManyPanelsForm_ShowStep('request_done_step_1', 'wait_pay_approve_2', 5);
                    }
                }, function () {
                });
            }
            return false;
        });
    };
    RequestForm.prototype.initFormStepRequestDone2 = function () {
        var form = $('#request-form_done-step-2');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                var request_id = form.find('[name="request_id"]').val();
                var rating_problem = $('[name="rating_problem"]').val();
                self.API.patch("requests/" + request_id, {
                    client_rating_description: rating_problem
                }, function (data) {
                    $('body').addClass('ptr-refresh ptr-loading');
                    setTimeout(function () {
                        window.location.replace('/');
                    }, 250);
                }, function () {
                });
            }
            return false;
        });
    };
    RequestForm.prototype.initFormStepEngineerCalling = function () {
        var form = $('#request-form_engineer-calling');
        var self = this;
        form.validator().on('submit', function (e) {
            if (e.isDefaultPrevented()) {
            }
            else {
                ManyPanelsForm_ShowStep('AUTO', 'engineer_not_call', 5);
                var request_id = form.find('[name="request_id"]').val();
                self.API.patch("requests/" + request_id, {
                    need_call_manager: 1
                }, function () {
                }, function () {
                });
            }
            return false;
        });
    };
    RequestForm.prototype.initAllForms = function () {
        var request_id = GetURLParameter('id');
        $('[name="request_id"]').val(request_id);
        var step = GetURLParameter('step') || 1;
        $('#many-panels-form-panel_' + step).removeClass('hidden');
        $('#request-form_loader').hide();
    };
    RequestForm.prototype.init = function (ymaps) {
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
        this.scrollToTopForStepByStepForm();
        $('.show-additional-actions').on('click', function () {
            if ($(this).hasClass('is-show-additional-actions')) {
                $(this).removeClass('is-show-additional-actions');
                $(this).find('.fa')
                    .addClass('fa-caret-down')
                    .removeClass('fa-caret-up');
                $($(this).data('toggle-block')).slideUp();
            }
            else {
                $(this).addClass('is-show-additional-actions');
                $(this).find('.fa')
                    .removeClass('fa-caret-down')
                    .addClass('fa-caret-up');
                $($(this).data('toggle-block')).slideDown();
            }
        });
        $('.request-form_button-upload-file').on('click', function () {
            $('.request-form_ajax-uploader input[type=file]').click();
        });
    };
    return RequestForm;
}());
function IsApiResponse(object) {
    var is = true;
    if (object && typeof object === 'object') {
        var fields = [
            'is_success', 'is_error', 'data'
        ];
        for (var k in fields) {
            var field = fields[k];
            if (!(field in object)) {
                is = false;
                break;
            }
        }
    }
    else {
        is = false;
    }
    return is;
}
function ToApiResponse(data) {
    return {
        is_success: false,
        is_error: false,
        data: data
    };
}
var RequestModel = (function () {
    function RequestModel() {
    }
    RequestModel.PAY_TYPE_CARD = 1;
    RequestModel.PAY_TYPE_CASH = 2;
    RequestModel.STATUS_SETTING_DATA = 10;
    RequestModel.STATUS_WAIT_ENGINEER = 20;
    RequestModel.STATUS_WAIT_ENGINEER_AGREE = 21;
    RequestModel.STATUS_ENGINEER_SET = 30;
    RequestModel.STATUS_WAIT_START_WORK = 40;
    RequestModel.STATUS_IN_PROGRESS = 50;
    RequestModel.STATUS_PAUSE = 60;
    RequestModel.STATUS_FINISH = 70;
    RequestModel.STATUS_FINISH_APPROVE = 90;
    RequestModel.STATUS_FAIL = 100;
    RequestModel.STATUS_FAIL_APPROVE = 110;
    RequestModel.STATUS_DELETE = -10;
    RequestModel.STATUS_CANCEL = -20;
    return RequestModel;
}());
function PhoneFilter(phone) {
    return phone.replace(/[^\+|^0-9]/g, '');
}
function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}
function basename(path) {
    return path.replace(/.*\//, '');
}
function dirname(path) {
    return path.match(/.*\//);
}
function my_strtotime(dateInString) {
    var formatForDefaultFunc = dateInString.replace(/(\d{2})-(\d{2})-(\d{4})(.*?)/, "$2/$1/$3$4");
    return Math.floor(Date.parse(formatForDefaultFunc) / 1000);
}
function FormatMoney(amount) {
    var ret = 0;
    if (amount) {
        ret = parseInt(amount);
    }
    return ret.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function setCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}
function removeCookie(name) {
    setCookie(name, "", -1);
}
//# sourceMappingURL=ts_combined.js.map