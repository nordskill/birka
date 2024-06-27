const AJAXForms = require('ajaxforms');

class CustomFields {

    constructor() {
        this.fields = document.querySelector('#custom_fields');
        
        this.ui = document.querySelector('#custom_fields_setup');

        if (this.ui) {
            this.endpoint = this.ui.dataset.endpoint;
            this.setup = this.ui.querySelector('textarea');
            if (this.ui) this.#bindEvents();
            this.token = document.head.querySelector('meta[name="csrf"]').content;
        }
        
        this.#init();

        return this;
    }

    #init() {

        const fieldData = this.fields.dataset.fields;
        if (!fieldData) return;

        const fields = JSON.parse(this.fields.dataset.fields);

        let settings = {};

        settings.container = '#custom_fields';
        settings.form_element = false;
        settings.ajax = false;
        settings.fields = fields;
        settings.bootstrap = true;

        new AJAXForms(settings);
    }

    #bindEvents() {

        const btnSave = this.ui.querySelector('#save_custom_fields');

        btnSave.onclick = this.#updateFields;

    }

    #updateFields = async () => {

        const data = {
            custom: JSON.parse(this.setup.value)
        }

        try {
            const response = await fetch(this.endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.token
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                location.reload();
            } else {
                alert('Failed to update custom fields');
            }

        } catch (error) {
            console.error(error);
        }

    }

}

export default CustomFields;