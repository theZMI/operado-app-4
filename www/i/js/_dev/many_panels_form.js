function ManyPanelsForm_NextFromStep(step, count) {
    ManyPanelsForm_ShowStep(step, step + 1, count);
}

function ManyPanelsForm_PrevFromStep(step, count) {
    ManyPanelsForm_ShowStep(step, step - 1, count);
}

function ManyPanelsForm_ShowStep(prevStep, step, count) {
    if (prevStep === 'AUTO') {
        var curPanel = '';
        $('.one-panel').each(function () {
            if ($(this).is(":visible")) {
                curPanel = $(this).attr('id').replace('many-panels-form-panel_', '');
            }
        });
        prevStep = curPanel;
    }

    for (var i = 1; i <= count; i++) {
        $('#i-form-step-' + i).removeClass('active');
        if (i !== prevStep) {
            $('#many-panels-form-panel_' + i).hide();
        }
    }

    if (!$('#many-panels-form-panel_' + step).is(':visible')) {
        if ($('.many-panels-form_scroll-anchor').length) {
            var offset = $('.many-panels-form_scroll-anchor').data('offset');
            if (offset === 'top-of-page') {
                $([document.documentElement, document.body]).animate({
                    scrollTop: 0
                }, 700);
            } else {
                offset = +offset;
                $([document.documentElement, document.body]).animate({
                    scrollTop: parseInt($('.many-panels-form_scroll-anchor').offset().top - offset)
                }, 700);
            }
        }

        // Fade out->in
        $('#many-panels-form-panel_' + prevStep).fadeOut(
            'normal',
            function () {
                $('#i-form-step-' + step).addClass('active');
                $('#many-panels-form-panel_' + step)
                    .removeClass('hidden')
                    .hide()
                    .fadeIn();
            }
        );

        // Slide up->down
        /*
        $('#many-panels-form-panel_' + prevStep).slideUp(
            'normal',
            function () {
                $('#i-form-step-' + step).addClass('active');
                $('#many-panels-form-panel_' + step)
                    .removeClass('hidden')
                    .hide()
                    .slideDown();
            }
        );
        */

        // Slide left->right
        /*
        $('#many-panels-form-panel_' + prevStep).hide(
            'slide', { direction: 'left' }, 250,
            function () {
                $('#i-form-step-' + step).addClass('active');
                $('#many-panels-form-panel_' + step)
                    .removeClass('hidden')
                    .hide()
                    .show('slide', {direction: 'right'}, 250);
            }
        );
        */
    }
}
