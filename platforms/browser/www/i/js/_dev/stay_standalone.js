/*!
 * jQuery stayInWebApp Plugin
 * version: 0.4 (2012-06-19)
 */

(function ($) {
    $.extend
    ({
        stayInWebApp: function (selector) {
            // Detect iOS full screen mode
            if (("standalone" in window.navigator) && window.navigator.standalone) {
                // If the selector is empty, default to all links
                if (!selector) {
                    selector = 'a';
                }

                // Bind to the click event of all specified elements
                $("body").delegate
                (
                    selector,
                    "click",
                    function (event) {
                        //TODO: execute all other events if this element has more bound events
                        /* NEEDS TESTING
                        for(i = 0; i < $(this).data('events'); i++) {
                                console.log($(this).data('events'));
                        }
                        */

                        // Only stay in web app for links that are set to _self (or not set)
                        if (
                            (
                                $(this).attr("target") == undefined ||
                                $(this).attr("target") == "" ||
                                $(this).attr("target") == "_self"
                            )
                            &&
                            (
                                !$(this).hasClass('open-not-in-app')
                            )
                        ) {
                            // Get the destination of the link clicked
                            var dest = $(this).attr("href");

                            // If the destination is an absolute url, ignore it
                            if (!dest.match(/^http(s?)/g)) {
                                // Prevent default behavior (opening safari)
                                event.preventDefault();
                                // Update location of the web app
                                self.location = dest;
                            }
                        }
                    });
            }
        }
    });
})(jQuery);


// Init plugin
$(function () {
    $.stayInWebApp();
});
