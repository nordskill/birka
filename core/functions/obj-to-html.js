import getData from './get-data.js';
import getImgTag from './get-img-tag.js';


async function OBJtoHTML(body, options = {}) {

	// default option vaolues
	const {
		imgIDs = false
	} = options;

	let html = '';
	
	if (!body || body.length === 0) return html;

	for (const element of body) {

		const contentFalsyValues = ['null', 'undefined'];
		
		if (!element.content || contentFalsyValues.includes(element.content)) {
			continue;
		}

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
				const imgObj = await getData('Image', { _id: element.content });
				let attributes = {
					'class': element.attributes.width
				};
				if (imgIDs) {
					attributes['data-id'] = imgObj._id;
				}
				html += getImgTag(imgObj, {
					figureTag: true,
					caption: element.attributes.caption || '',
					attributes
				});
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

export default OBJtoHTML;