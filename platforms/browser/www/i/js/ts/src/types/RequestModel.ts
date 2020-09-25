class RequestModel {
    static readonly PAY_TYPE_CARD = 1;
    static readonly PAY_TYPE_CASH = 2;

    static readonly STATUS_SETTING_DATA = 10;  // Установка данных по заявке
    static readonly STATUS_WAIT_ENGINEER = 20;  // Ждёт инженера
    static readonly STATUS_WAIT_ENGINEER_AGREE = 21;  // Ожидаем согласия инженера выполнить заявку (устанавливается когда инженер был назначен админом)
    static readonly STATUS_ENGINEER_SET = 30;  // Инженер найден
    static readonly STATUS_WAIT_START_WORK = 40;  // Ожидаем начала работ (инженер установил время когда работы должны начаться)
    static readonly STATUS_IN_PROGRESS = 50;  // Идёт работа
    static readonly STATUS_PAUSE = 60;  // Инженер поставил на паузу
    static readonly STATUS_FINISH = 70;  // Инженер сказал, что завершил
    static readonly STATUS_FINISH_APPROVE = 90;  // Админ подтвердил успешное заверешение заявки
    static readonly STATUS_FAIL = 100; // Инженер сказал, что не может завершить заявку
    static readonly STATUS_FAIL_APPROVE = 110; // Админ подтвердил провальное выполнение заявки
    static readonly STATUS_DELETE = -10; // Заявка удалена из системы
    static readonly STATUS_CANCEL = -20; // Заявка отменена
}
