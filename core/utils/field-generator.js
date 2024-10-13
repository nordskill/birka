const componentsLibrary = {
    input_text: {
        generateHTML(name, field, value, idCounter) {
            return `
                <div class="mb-3">
                    <label for="${idCounter}_${name}" class="form-label">${getLabel(field)}</label>
                    <input class="form-control" id="${idCounter}_${name}" name="${name}" type="text" value="${value}" ${getAdditionalAttributes(field.options.ui)}>
                    <div class="invalid-feedback"></div>
                </div>`;
        }
    },
    input_url: {
        generateHTML(name, field, value, idCounter) {
            return `
                <div class="mb-3">
                    <label for="${idCounter}_${name}" class="form-label">${getLabel(field)}</label>
                    <input class="form-control" id="${idCounter}_${name}" name="${name}" type="url" value="${value}" ${getAdditionalAttributes(field.options.ui)}>
                    <div class="invalid-feedback"></div>
                </div>`;
        }
    },
    input_email: {
        generateHTML(name, field, value, idCounter) {
            return `
                <div class="mb-3">
                    <label for="${idCounter}_${name}" class="form-label">${getLabel(field)}</label>
                    <input class="form-control" id="${idCounter}_${name}" name="${name}" type="email" value="${value}" ${getAdditionalAttributes(field.options.ui)}>
                    <div class="invalid-feedback"></div>
                </div>`;
        }
    },
    input_password: {
        generateHTML(name, field, value, idCounter) {
            return `
                <div class="mb-3">
                    <label for="${idCounter}_${name}" class="form-label">${getLabel(field)}</label>
                    <input class="form-control" id="${idCounter}_${name}" name="${name}" type="password" value="${value}" ${getAdditionalAttributes(field.options.ui)}>
                    <div class="invalid-feedback"></div>
                </div>`;
        }
    },
    input_tel: {
        generateHTML(name, field, value, idCounter) {
            return `
                <div class="mb-3">
                    <label for="${idCounter}_${name}" class="form-label">${getLabel(field)}</label>
                    <input class="form-control" id="${idCounter}_${name}" name="${name}" type="tel" value="${value}" ${getAdditionalAttributes(field.options.ui)}>
                    <div class="invalid-feedback"></div>
                </div>`;
        }
    },
    input_number: {
        generateHTML(name, field, value, idCounter) {
            return `
                <div class="mb-3">
                    <label for="${idCounter}_${name}" class="form-label">${getLabel(field)}</label>
                    <input class="form-control" id="${idCounter}_${name}" name="${name}" type="number" value="${value}" ${getAdditionalAttributes(field.options.ui)}>
                    <div class="invalid-feedback"></div>
                </div>`;
        }
    },
    input_date: {
        generateHTML(name, field, value, idCounter) {
            return `
                <div class="mb-3">
                    <label for="${idCounter}_${name}" class="form-label">${getLabel(field)}</label>
                    <input class="form-control" id="${idCounter}_${name}" name="${name}" type="date" value="${value}" ${getAdditionalAttributes(field.options.ui)}>
                    <div class="invalid-feedback"></div>
                </div>`;
        }
    },
    input_file: {
        generateHTML(name, field, value, idCounter) {
            return `
                <div class="mb-3">
                    <label for="${idCounter}_${name}" class="form-label">${getLabel(field)}</label>
                    <input class="form-control" id="${idCounter}_${name}" name="${name}" type="file" ${getAdditionalAttributes(field.options.ui)}>
                    <div class="invalid-feedback"></div>
                </div>`;
        }
    },
    input_checkbox: {
        generateHTML(name, field, value, idCounter) {
            const checked = value ? 'checked' : '';
            return `
                <div class="form-check mb-3">
                    <input type="checkbox" class="form-check-input" id="${idCounter}_${name}" name="${name}" ${checked}>
                    <label class="form-check-label" for="${idCounter}_${name}">${getLabel(field)}</label>
                    <div class="invalid-feedback"></div>
                </div>`;
        }
    },
    textarea: {
        generateHTML(name, field, value, idCounter) {
            return `
                <div class="mb-3">
                    <label for="${idCounter}_${name}" class="form-label">${getLabel(field)}</label>
                    <textarea class="form-control" id="${idCounter}_${name}" name="${name}" ${getAdditionalAttributes(field.options.ui)}>${value}</textarea>
                    <div class="invalid-feedback"></div>
                </div>`;
        }
    },
    file_crud: {
        generateHTML(name, field, value, idCounter) {
            return `
                <div class="mb-3">
                    <div>${getLabel(field)}</div>
                    <div class="file_crud position-relative static"
                        data-files-api="/api/files"
                        data-endpoint=""
                        data-field-name="${name}"
                        data-file-id="${value}"
                        data-size="300"
                        data-token="">
                        <div class="fc_wrapper">
                            <div class="file_preview"></div>
                            <svg viewBox="0 0 21 18.373">
                                <path d="M18.375 0H2.626A2.624 2.624 0 0 0 0 2.622v13.127a2.624 2.624 0 0 0 2.624 2.624h15.751A2.625 2.625 0 0 0 21 15.749V2.624A2.625 2.625 0 0 0 18.375 0M2.626 1.312h15.749a1.313 1.313 0 0 1 1.313 1.312v8.208l-4.743-2.445a.686.686 0 0 0-.8.129l-5.114 5.117-3.667-2.445a.687.687 0 0 0-.869.085L1.314 14.1V2.624a1.313 1.313 0 0 1 1.312-1.312" />
                                <path d="M5.908 7.874a1.969 1.969 0 1 0-1.97-1.968 1.969 1.969 0 0 0 1.97 1.968" />
                            </svg>
                            <div class="icons">
                                <ul class="list_meta_icons d-flex justify-content-center position-absolute list-unstyled d-flex bottom-0 start-0 end-0"></ul>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    
    }
};

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
        const isSkippedField = skipFields.includes(key);
        const isUnsupportedInstance = ['Mixed', 'Array', 'Map'].includes(field.instance);
        const notFileReference = field.instance === 'ObjectId' && field.options.ref !== 'File';
    
        return isSkippedField || isUnsupportedInstance || notFileReference;
    }

    getStrategy(field) {
        if (field.options && field.options.ui && field.options.ui.element) {
            const element = field.options.ui.element;
            const type = field.options.ui.type || '';
            const suffix = type ? `_${type}` : '';
            const componentKey = `${element}${suffix}`;
            if (componentsLibrary[componentKey]) {
                return componentsLibrary[componentKey];
            }
            throw new Error(`Unsupported component: ${componentKey}`);
        }

        switch (field.instance) {
            case 'String':
            case 'UUID':
                return componentsLibrary.input_text;
            case 'Number':
            case 'Decimal128':
                return componentsLibrary.input_number;
            case 'Date':
                return componentsLibrary.input_date;
            case 'Buffer':
                return componentsLibrary.input_file;
            case 'Boolean':
                return componentsLibrary.input_checkbox;
            default:
                throw new Error(`Unsupported field type: ${field.instance}`);
        }
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

export default FieldGenerator;