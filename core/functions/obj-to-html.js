function OBJtoHTML(body) {
	let html = '';

	if (!body || body.length === 0) return html;

	for (const element of body) {
		switch (element.type) {
			case 'paragraph':
				const textAlign = element.attributes?.align ? `style="text-align: ${element.attributes.align}"` : '';
				html += `<p ${textAlign}>${element.content}</p>\r\n`;
				break;
			case 'heading':
				html += `<h${element.attributes?.level}>${element.content}</h${element.attributes.level}>\r\n`;
				break;
			case 'list':
				const listHtml = element.content.map(item => `\r\n\t<li>${item.item}</li>`).join('');
				if (element.attributes?.type === 'unordered') {
					html += `<ul>${listHtml}</ul>\r\n`;
				} else {
					html += `<ol>${listHtml}</ol>\r\n`;
				}
				break;
			case 'image':
				const classAttr = element.attributes?.width ? `class="${element.attributes.width}"` : '';
				html += `<picture ${classAttr}>\r\n\t<img src="${element.content}" alt="${element.attributes.alt}">\r\n\t<figcaption>${element.attributes.alt}</figcaption>\r\n</picture>\r\n`;
				break;
			case 'quote':
				html += `<blockquote>\r\n\t<p>${element.content}</p>\r\n\t<cite>${element.attributes.author}</cite>\r\n</blockquote>\r\n`;
				break;
			default:
				break;
		}
	};

	return html;
}
module.exports = OBJtoHTML;