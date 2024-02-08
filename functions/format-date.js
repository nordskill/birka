/**
 * Formats a date according to the specified style.
 *
 * @param {Date} date - The date to format.
 * @param {string} style - The style to format the date in. Can be 'yyyy-mm-dd', 'yyyymmdd', or 'dd mon yyyy'.
 * @returns {string} The formatted date.
 *
 * @example
 * // Returns '2022-12-31'
 * formatDate(new Date(2022, 11, 31), 'yyyy-mm-dd');
 *
 * @example
 * // Returns '20221231'
 * formatDate(new Date(2022, 11, 31), 'yyyymmdd');
 *
 * @example
 * // Returns '31 Dec 2022'
 * formatDate(new Date(2022, 11, 31), 'dd mon yyyy');
 */
function formatDate(date, style) {

	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');

	switch (style) {
		case 'yyyy-mm-dd':
			return `${year}-${month}-${day}`;
		case 'yyyymmdd':
			return `${year}${month}${day}`;
		case 'dd mon yyyy':
			return `${day} ${date.toLocaleString('en-us', { month: 'short' })} ${year}`;
		default:
			break;
	}
}
module.exports = formatDate;