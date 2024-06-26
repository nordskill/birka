class FieldGenerator {
    constructor(model, values = {}) {
        this.model = model;
        this.values = values;
        this.html = '';
        this.idCounter = 0;
    }

    generate() {
        Object.keys(this.model).forEach(key => {
            const field = this.model[key];
            if (this.shouldSkipField(key, field)) return;

            const fieldValue = this.values[key] || '';
            const strategy = this.getStrategy(field);
            this.html += strategy.generateHTML(key, field, fieldValue, ++this.idCounter);
        });
        return this.html;
    }

    shouldSkipField(key, field) {
        const skipFields = ['__v', '_id', 'createdAt', 'updatedAt'];
        return skipFields.includes(key) || field.instance === 'Mixed' || field.instance === 'Array' || field.instance === 'ObjectId' || field.instance === 'Map';
    }

    getStrategy(field) {
        switch (field.instance) {
            case 'String':
                return new StringFieldStrategy();
            case 'Number':
            case 'Decimal128':
                return new NumberFieldStrategy();
            case 'Date':
                return new DateFieldStrategy();
            case 'Buffer':
                return new BufferFieldStrategy();
            case 'Boolean':
                return new BooleanFieldStrategy();
            case 'UUID':
                return new StringFieldStrategy();
            default:
                throw new Error(`Unsupported field type: ${field.instance}`);
        }
    }
}

class StringFieldStrategy {
    generateHTML(name, field, value, idCounter) {
        const element = field.options.ui?.element || 'input';
        const type = field.options.ui?.type || 'text';
        const additionalAttributes = getAdditionalAttributes(field.options.ui);
        return `
            <div class="mb-3">
                <label for="${name}-${idCounter}" class="form-label">${getLabel(field)}</label>
                <${element} id="${name}-${idCounter}" name="${name}" type="${type}" value="${value}" ${additionalAttributes}></${element}>
            </div>`;
    }
}

class NumberFieldStrategy {
    generateHTML(name, field, value, idCounter) {
        const element = field.options.ui?.element || 'input';
        const type = field.options.ui?.type || 'number';
        const additionalAttributes = getAdditionalAttributes(field.options.ui);
        return `
            <div class="mb-3">
                <label for="${name}-${idCounter}" class="form-label">${getLabel(field)}</label>
                <${element} id="${name}-${idCounter}" name="${name}" type="${type}" value="${value}" ${additionalAttributes}></${element}>
            </div>`;
    }
}

class DateFieldStrategy {
    generateHTML(name, field, value, idCounter) {
        const element = field.options.ui?.element || 'input';
        const type = field.options.ui?.type || 'date';
        const additionalAttributes = getAdditionalAttributes(field.options.ui);
        return `
            <div class="mb-3">
                <label for="${name}-${idCounter}" class="form-label">${getLabel(field)}</label>
                <${element} id="${name}-${idCounter}" name="${name}" type="${type}" value="${value}" ${additionalAttributes}></${element}>
            </div>`;
    }
}

class BufferFieldStrategy {
    generateHTML(name, field, value, idCounter) {
        const element = field.options.ui?.element || 'input';
        const type = field.options.ui?.type || 'file';
        const additionalAttributes = getAdditionalAttributes(field.options.ui);
        return `
            <div class="mb-3">
                <label for="${name}-${idCounter}" class="form-label">${getLabel(field)}</label>
                <${element} id="${name}-${idCounter}" name="${name}" type="${type}" ${additionalAttributes}></${element}>
            </div>`;
    }
}

class BooleanFieldStrategy {
    generateHTML(name, field, value, idCounter) {
        const checked = value ? 'checked' : '';
        return `
            <div class="form-check mb-3">
                <input type="checkbox" class="form-check-input" id="${name}-${idCounter}" name="${name}" ${checked}>
                <label class="form-check-label" for="${name}-${idCounter}">${getLabel(field)}</label>
            </div>`;
    }
}

class UUIDFieldStrategy {
    generateHTML(name, field, value, idCounter) {
        const element = field.options.ui?.element || 'input';
        const type = field.options.ui?.type || 'text';
        const additionalAttributes = getAdditionalAttributes(field.options.ui);
        return `
            <div class="mb-3">
                <label for="${name}-${idCounter}" class="form-label">${getLabel(field)}</label>
                <${element} id="${name}-${idCounter}" name="${name}" type="${type}" value="${value}" ${additionalAttributes}></${element}>
            </div>`;
    }
}

function getLabel(field) {
    return field.options.ui?.label || field.path.charAt(0).toUpperCase() + field.path.slice(1);
}

function getAdditionalAttributes(uiOptions = {}) {
    return Object.keys(uiOptions).map(key => {
        if (key === 'element' || key === 'type' || key === 'label') return '';
        if (key === 'data') {
            return Object.keys(uiOptions.data).map(dataKey => `data-${dataKey}="${uiOptions.data[dataKey]}"`).join(' ');
        }
        return typeof uiOptions[key] === 'boolean' ? `${key}` : `${key}="${uiOptions[key]}"`;
    }).join(' ');
}

module.exports = FieldGenerator;


