/**
 * Convert string to time
 *
 * @param dateInString - datetime in format dd-mm-yyyy hh:mm:ss UTC+N
 */
function my_strtotime(dateInString: string): number {
    let formatForDefaultFunc = dateInString.replace(/(\d{2})-(\d{2})-(\d{4})(.*?)/, "$2/$1/$3$4");
    return Math.floor(Date.parse(formatForDefaultFunc) / 1000);
}
