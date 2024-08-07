import Debouncer from '../functions/debouncer';
import FileCRUD from '../components/file-crud';

export default async function () {

    const model = JSON.parse(document.querySelector('main[data-model]').dataset.model);
    const token = document.querySelector('meta[name="csrf"]').content;
    const id = document.querySelector('main[data-id]').dataset.id;
    const fieldsContainer = document.querySelector('#custom_model_fields');
    const fields = fieldsContainer.querySelectorAll('[name]');
    const fileCruds = fieldsContainer.querySelectorAll('.file_crud');

    const onSuccess = (fieldElem) => {
        fieldElem.classList.add('is-valid');
    };
    const onError = (fieldElem, message) => {
        fieldElem.classList.add('is-invalid');
        const invalidFeedback = fieldElem.parentElement.querySelector('.invalid-feedback');
        invalidFeedback.style.display = 'block';
        invalidFeedback.textContent = message;
    };
    const onInput = (fieldElem) => {
        fieldElem.classList.remove('is-valid', 'is-invalid');
        const invalidFeedback = fieldElem.parentElement.querySelector('.invalid-feedback');
        invalidFeedback.style.display = 'none';
    };

    fields.forEach(field => {
        new Debouncer({
            field_element: field,
            endpoint: `/api/custom/${model.modelName}/${id}`,
            token,
            method: 'PATCH',
            success_callback: onSuccess,
            error_callback: onError,
            input_callback: onInput
        });
    });

    fileCruds.forEach(fileCrudElem => {
        Object.assign(fileCrudElem.dataset, {
            endpoint: `/api/custom/${model.modelName}/${id}`,
            token
        });
        new FileCRUD(fileCrudElem);
    });

}