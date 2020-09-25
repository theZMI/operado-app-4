function MainMenu() {
    this.MENU_SELECTOR = '#main-menu';

    this.clickByToggleButton = function () {
        var menu = $(this.MENU_SELECTOR);
        var isMenuOpen = menu.hasClass('menu-is-open');
        if (isMenuOpen) {
            setTimeout(
                function () {
                    menu.removeClass('menu-is-open');
                },
                250
            );
        } else {
            menu.addClass('menu-is-open');
        }
    };

    this.movePage = function () {
        var menu = $(this.MENU_SELECTOR);
        $(window).scrollTop() > 1
            ? menu.addClass('menu-in-move')
            : menu.removeClass('menu-in-move');
    };

    this.init = function () {
        var self = this;
        $(function () {
            $(window).on(
                'scroll touchstart touchmove touchend',
                function () {
                    self.movePage();
                }
            );
            self.movePage();
            $(self.MENU_SELECTOR + '_toggle').on(
                'click',
                function () {
                    self.clickByToggleButton();
                }
            );
        });
    };
}

var g_mainMenu = new MainMenu();
