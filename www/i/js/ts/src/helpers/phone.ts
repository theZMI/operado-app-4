function PhoneFilter(phone: string): string {
    return phone.replace(/[^\+|^0-9]/g, '');
}
