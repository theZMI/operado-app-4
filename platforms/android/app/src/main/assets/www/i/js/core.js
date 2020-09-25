// Настройки AJAX по умолчанию
$(function () {
    $.ajaxSetup({
        cache: false
    });
});

// Глобальная инициализация
function _CoreInit() {
    // Bootstrap-подсказки
    $('.b3-tooltip').tooltip();
    $('.b3-tooltip-simple').tooltip();
    $('.b3-popover').popover({html: true});

    // Переключатели в стиле IOS
    InitSwitchery();

    // Поле выбора даты
    $(".datepicker").datepicker({
        dateFormat: "dd-mm-yy",
        regional: "ru"
    });
}

$(function () {
    _CoreInit();
});
$(document).ajaxComplete(function () {
    _CoreInit();
});
