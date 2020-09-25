function FormatMoney(amount: string | number): string {
    let ret = 0;
    if (amount) {
        ret = parseInt(amount as string);
    }
    return ret.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
