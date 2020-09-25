/// <reference path="./CommonUser.ts" />

class Client extends CommonUser {
    data = null;

    constructor() {
        super();

        (Api.getInstance()).get
        (
            'clients/current',
            [],
            (response) => {
                this.data = response;
            },
            () => {}
        );
    }

    logout(): void {
        Api.forgotToken();
        window.location.replace("/user/login");
    }

    // Рисует список "мои заявки"
    private renderMyRequests(): void {
        let self = this;
        let wrapper = $('#i-requests-wrapper');

        $.ajax(
            '/user/_my_requests',
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
                    'clients/current/requests/hash',
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
}
