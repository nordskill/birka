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