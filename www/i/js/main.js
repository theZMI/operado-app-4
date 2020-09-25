var g_client = new Client();
var g_engineer = new Engineer();
var g_manager = new Manager();

$(function () {
    // Вставляем и инициализируем меню
    $('#main-menu-wrapper').load(
        '/_main_tpl/main_menu?is_ajax=1',
        function () {
            g_mainMenu.init();
        }
    );
});
