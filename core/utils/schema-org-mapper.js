import { parse } from 'csv-parse/browser/esm/sync';

class SchemaOrgMapper {
    constructor(container, mongooseSchema, data, options) {
        this.container = container;
        this.mongooseSchema = mongooseSchema;
        this.data = data;
        this.options = options;
        this.types = [];
        this.properties = [];
        this.selectedType = null;
        this.mappings = {};

        this.init();
    }

    async init() {
        await this.fetch_data();
        this.render();
        this.attach_event_listeners();
        if (this.data.seo && this.data.seo.jsonld_template) {
            this.initialize_from_template(this.data.seo.jsonld_template);
        }
    }

    async fetch_data() {
        const typesResponse = await fetch('https://schema.org/version/latest/schemaorg-current-https-types.csv');
        const propertiesResponse = await fetch('https://schema.org/version/latest/schemaorg-current-https-properties.csv');

        const typesText = await typesResponse.text();
        const propertiesText = await propertiesResponse.text();

        this.types = parse(typesText, { columns: true });
        this.properties = parse(propertiesText, { columns: true });
    }

    render() {
        this.container.innerHTML = `
          <div class="mb-3">
            <label for="schemaType" class="form-label">Select Schema.org Type:</label>
            <div class="input-group">
              <input type="text" class="form-control" id="schemaType" list="schemaTypeList">
              <a id="schemaTypeLink" href="https://schema.org/docs/full.html" target="_blank" class="btn btn-outline-secondary">
                <span class="badge rounded-pill bg-info">?</span>
              </a>
            </div>
            <datalist id="schemaTypeList">
              ${this.types.map(type => `<option value="${type.label}">`).join('')}
            </datalist>
          </div>
          <button id="set_jsonld" class="btn btn-primary mb-3">Set</button>
          <div id="propertyList" class="list-group"></div>
          <button id="save_jsonld" class="btn btn-success mt-3">Save</button>
        `;
    }

    attach_event_listeners() {
        document.getElementById('set_jsonld').addEventListener('click', () => this.set_type());
        document.getElementById('save_jsonld').addEventListener('click', () => this.save());
    }

    initialize_from_template(template) {
        const jsonld = this.parse_jsonld_template(template);
        if (jsonld) {
            this.set_type(jsonld['@type']);
            this.set_properties(jsonld);
        }
    }

    parse_jsonld_template(template) {
        try {
            const jsonString = template.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error parsing JSON-LD template:', error);
            return null;
        }
    }

    set_type(type = null) {
        const typeInput = document.getElementById('schemaType');
        if (type) {
            typeInput.value = type;
        }
        this.selectedType = this.types.find(t => t.label === typeInput.value);

        if (!this.selectedType) {
            alert('Invalid type selected');
            return;
        }

        const schemaTypeLink = document.getElementById('schemaTypeLink');
        schemaTypeLink.href = this.selectedType.id;

        const propertyList = document.getElementById('propertyList');
        propertyList.innerHTML = '';

        this.render_properties_for_type(this.selectedType, propertyList);
    }

    set_properties(jsonld) {
        this.mappings = {}; // Reset mappings
        for (const [key, value] of Object.entries(jsonld)) {
            if (key !== '@context' && key !== '@type') {
                const prop = this.properties.find(p => p.label === key);
                if (prop) {
                    const switchEl = document.getElementById(`switch_${prop.label}`);
                    const selectEl = document.getElementById(`select_${prop.label}`);
                    const textareaEl = document.getElementById(`textarea_${prop.label}`);

                    if (switchEl && selectEl && textareaEl) {
                        if (typeof value === 'string' && value.startsWith('<%= data.')) {
                            const fieldValue = value.match(/data\.(.*?)\s/)?.[1];
                            if (fieldValue) {
                                switchEl.checked = true;
                                selectEl.value = fieldValue;
                                selectEl.style.display = 'block';
                                textareaEl.style.display = 'none';
                                this.mappings[prop.id] = { type: 'field', value: fieldValue };
                            }
                        } else {
                            switchEl.checked = false;
                            textareaEl.value = JSON.stringify(value);
                            selectEl.style.display = 'none';
                            textareaEl.style.display = 'block';
                            this.mappings[prop.id] = { type: 'text', value: textareaEl.value };
                        }
                    } else {
                        console.warn(`UI elements for property ${key} not found. This property might not be applicable to the current Schema.org type.`);
                    }
                } else {
                    console.warn(`Property ${key} not found in the current Schema.org type.`);
                }
            }
        }
    }

    render_properties_for_type(type, container) {
        const typeProperties = this.get_properties_for_type(type.id);

        const typeContainer = document.createElement('div');
        typeContainer.className = 'mb-4';
        typeContainer.innerHTML = `<h5>${type.label} Properties</h5>`;

        const listGroup = document.createElement('div');
        listGroup.className = 'list-group';

        if (typeProperties.length === 0) {
            listGroup.innerHTML = '<div class="list-group-item">No specific properties for this type</div>';
        } else {
            typeProperties.forEach(prop => this.render_property(prop, listGroup));
        }

        typeContainer.appendChild(listGroup);
        container.appendChild(typeContainer);

        // Render parent type properties
        if (type.subTypeOf) {
            const parentType = this.types.find(t => t.id === type.subTypeOf);
            if (parentType) {
                this.render_properties_for_type(parentType, container);
            }
        }
    }

    get_properties_for_type(typeId) {
        return this.properties.filter(prop =>
            prop.domainIncludes.includes(typeId)
        );
    }

    render_property(prop, container) {
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item';
        listItem.innerHTML = `
          <div class="row align-items-center">
            <div class="col-3">${prop.label}</div>
            <div class="col-2">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="switch_${prop.label}" checked>
                <label class="form-check-label" for="switch_${prop.label}">Text</label>
              </div>
            </div>
            <div class="col-5">
              <select class="form-select" id="select_${prop.label}">
                <option value="">Select a field</option>
                ${Object.keys(this.mongooseSchema).map(field => `<option value="${field}">${field}</option>`).join('')}
              </select>
              <textarea class="form-control mt-2" id="textarea_${prop.label}" style="display: none;"></textarea>
            </div>
            <div class="col-2 text-end">
              <a href="${prop.id}" target="_blank" class="badge rounded-pill bg-info text-decoration-none">?</a>
            </div>
          </div>
        `;

        container.appendChild(listItem);

        const switchEl = listItem.querySelector(`#switch_${prop.label}`);
        const selectEl = listItem.querySelector(`#select_${prop.label}`);
        const textareaEl = listItem.querySelector(`#textarea_${prop.label}`);

        switchEl.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectEl.style.display = 'block';
                textareaEl.style.display = 'none';
                if (selectEl.value) {
                    this.mappings[prop.id] = { type: 'field', value: selectEl.value };
                } else {
                    delete this.mappings[prop.id];
                }
            } else {
                selectEl.style.display = 'none';
                textareaEl.style.display = 'block';
                if (textareaEl.value) {
                    this.mappings[prop.id] = { type: 'text', value: textareaEl.value };
                } else {
                    delete this.mappings[prop.id];
                }
            }
        });

        selectEl.addEventListener('change', (e) => {
            if (e.target.value) {
                this.mappings[prop.id] = { type: 'field', value: e.target.value };
            } else {
                delete this.mappings[prop.id];
            }
        });

        textareaEl.addEventListener('input', (e) => {
            if (e.target.value) {
                this.mappings[prop.id] = { type: 'text', value: e.target.value };
            } else {
                delete this.mappings[prop.id];
            }
        });
    }

    save() {
        if (!this.selectedType) {
            alert('Please select a type first');
            return;
        }

        let template = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "${this.selectedType.label}",
  ${Object.entries(this.mappings)
    .filter(([key, mapping]) => mapping.value !== '') // Filter out empty mappings
    .map(([key, mapping]) => {
        const prop = this.properties.find(p => p.id === key);
        if (mapping.type === 'field') {
            return `"${prop.label}": "<%= data.${mapping.value} %>"`;
        } else {
            return `"${prop.label}": ${mapping.value}`;
        }
    })
    .join(',\n  ')}
}
</script>`;

        this.update_document(template, this.options);
    }

    async update_document(template, options) {
        const button = document.getElementById('save_jsonld');
        button.disabled = true;

        const data = {
            [options.field]: template
        };

        try {
            const response = await fetch(options.endpoint, {
                method: options.method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': options.token
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                button.disabled = false;
                const json = await response.json();
                console.log(json);
            } else {
                alert('Failed to update JSON+LD');
            }
        } catch (error) {
            console.error(error);
        } finally {
            button.disabled = false;
        }
    }
}

export default function init_schema_org_mapper(selector, mongooseSchema, data, options) {
    const container = document.querySelector(selector);
    new SchemaOrgMapper(container, mongooseSchema, data, options);
}