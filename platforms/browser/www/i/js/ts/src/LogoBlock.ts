class LogoBlock {
    private updateByLogo(): void {
        $('.logo-block_logo').on(
            'click',
            function () {
                $('body').addClass('ptr-refresh ptr-loading');
            }
        )
    }

    init(): void {
        this.updateByLogo();
    }
}
