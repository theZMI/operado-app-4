function InitSwitchery() {
    var elems = Array.prototype.slice.call(document.querySelectorAll('.js-switch'));
    elems.forEach(function (html) {
        var has = $(html).data('switchery');
        if (!has) {
            var switchery = new Switchery(html, {size: 'normal'});
        }
    });
}

$(function () {
    InitSwitchery();
});
