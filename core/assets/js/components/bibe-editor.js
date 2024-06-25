import FileCRUD from './file-crud';
import EventBus from '../../../utils/events';

const blockEvents = new EventBus();

// Base Block Class
class Block {
    constructor(element) {
        this.tag = element.tagName;
        this.element = element;
        this.isHovered = false;
        this.content = this.get_content();
        this.attributes = this.get_attributes();

        this.update_rect();

        this.element.addEventListener('dragover', e => e.preventDefault());

        this.element.addEventListener('mouseenter', e => {
            this.isHovered = true;
            blockEvents.emit('block:mouse:in', this);
        });

        this.element.addEventListener('mouseleave', e => {
            this.isHovered = false;
            // blockEvents.emit('block:mouse:out', this);
        });

        // this.element.addEventListener('paste', e => {
        //     e.preventDefault();
        //     this.replace_content(e.clipboardData.getData('text/plain'));
        // });
    }

    update_rect() {
        this.rect = this.element.getBoundingClientRect();
    }

    serialize() {

        const content = this.get_content();
        const contentFalsyValues = ['null', 'undefined'];

        if (!content || contentFalsyValues.includes(content)) return null;

        return {
            type: this.type,
            content,
            attributes: this.get_attributes()
        };

    }

    update() {
        this.content = this.get_content();
        this.attributes = this.get_attributes();
    }

    get_content() {
        // To be implemented by subclasses
    }

    get_attributes() {
        // To be implemented by subclasses
    }

    set alignment(newAlignment) {
        this.element.style.textAlign = newAlignment;
        this.attributes.align = newAlignment;
    }

    get alignment() {
        return this.attributes.align;
    }

    remove_placeholder() {
        this.element.removeAttribute('data-placeholder');
    }

    add_placeholder() {
        // To be implemented by subclasses
    }

    destroy() {

        if (this.element) {
            this.element.removeEventListener('dragover', this.handleDragOver);
            this.element.remove();
        }

    }

    replace_content(content) {
        this.element.innerHTML = content;
    }

    // Static method to initialize from an existing DOM element
    static fromElement(element) {
        element.classList.add('bibe_block');
        return new this(element);
    }

}

// Specific Block Subclasses
class ParagraphBlock extends Block {
    constructor(element) {
        super(element);
        this.type = 'paragraph';
    }

    get_content() {
        return this.element.innerHTML;
    }

    get_attributes() {
        return {
            align: this.element.style.textAlign || 'left',
        };
    }

    add_placeholder() {
        this.element.dataset.placeholder = 'Paragraph';
    }

    static create(content = '&#8203;') {
        const elem = document.createElement('p');
        elem.dataset.placeholder = 'Paragraph';
        elem.innerHTML = content;
        elem.classList.add('bibe_block');
        return new this(elem);
    }
}
class TitleBlock extends Block {
    constructor(element) {
        super(element);
        this.type = 'heading';
    }

    get_content() {
        return this.element.innerHTML;
    }

    get_attributes() {
        return {
            level: parseInt(this.element.tagName[1]),
            align: this.element.style.textAlign || 'left'
        };
    }

    add_placeholder() {
        this.element.dataset.placeholder = `Heading ${this.attributes.level}`;
    }

    static create(content = '&#8203;', level = 2) {
        const elem = document.createElement(`h${level}`);
        elem.dataset.placeholder = 'Heading 2';
        elem.innerHTML = content;
        elem.classList.add('bibe_block');
        return new this(elem);
    }
}
class ListBlock extends Block {
    constructor(element) {
        super(element);
        this.type = 'list';
    }

    get_content() {
        return [...this.element.querySelectorAll('li')].map(li => ({ item: li.innerHTML }));
    }

    get_attributes() {
        return {
            type: this.element.tagName === 'UL' ? 'unordered' : 'ordered',
            align: this.element.style.textAlign || 'left'
        };
    }

    add_placeholder() {
        this.element.dataset.placeholder = 'List';
    }

    static create(items = [], ordered = false) {
        const listElement = document.createElement(ordered ? 'ol' : 'ul');
        listElement.classList.add('bibe_block');

        if (!items.length) {
            const li = document.createElement('li');
            li.innerHTML = '&#8203;';
            listElement.appendChild(li);
        } else {
            items.forEach(itemContent => {
                const li = document.createElement('li');
                li.innerHTML = itemContent;
                listElement.appendChild(li);
            });
        }

        return new this(listElement);
    }
}
class QuoteBlock extends Block {
    constructor(element) {
        super(element);
        this.type = 'quote';
    }

    get_content() {
        return this.element.querySelector('p')?.innerHTML || '';
    }

    get_attributes() {
        return {
            author: this.element.querySelector('cite')?.textContent || '',
            align: this.element.style.textAlign || 'left'
        };
    }

    add_placeholder() {
        this.element.dataset.placeholder = 'Quote';
    }

    static create(content = '&#8203;', author = '&#8203;') {
        const blockquote = document.createElement('blockquote');
        blockquote.classList.add('bibe_block');
        blockquote.innerHTML = `<p>${content}</p><cite data-placeholder="Citation">${author}</cite>`;
        return new this(blockquote);
    }
}
class ImageBlock extends Block {
    constructor(element) {
        super(element);
        this.type = 'image';
        this.img = element.querySelector('img');
    }

    get_content() {
        return this.element.dataset.fileId;
    }

    get_attributes() {
        const img = this.element.querySelector('.file_preview img');
        return {
            width: img?.classList[0],
            alt: img?.alt,
            caption: this.element.querySelector('.caption')?.value || ''
        };
    }

    static create(figureElement = '', imgID = '', options) {

        const fileCRUDElem = document.createElement('div');
        fileCRUDElem.classList.add('file_crud', 'position-relative', 'static', 'bibe_block');
        fileCRUDElem.dataset.fileId = imgID;
        fileCRUDElem.dataset.filesApi = options.files_api;
        fileCRUDElem.dataset.endpoint = options.update_url;
        fileCRUDElem.dataset.size = 1024;

        fileCRUDElem.innerHTML = `
            <div class="fc_wrapper">
                <div class="file_preview">${figureElement?.outerHTML || ''}</div>
                <svg viewBox="0 0 21 18.373">
                    <path d="M18.375 0H2.626A2.624 2.624 0 0 0 0 2.622v13.127a2.624 2.624 0 0 0 2.624 2.624h15.751A2.625 2.625 0 0 0 21 15.749V2.624A2.625 2.625 0 0 0 18.375 0M2.626 1.312h15.749a1.313 1.313 0 0 1 1.313 1.312v8.208l-4.743-2.445a.686.686 0 0 0-.8.129l-5.114 5.117-3.667-2.445a.687.687 0 0 0-.869.085L1.314 14.1V2.624a1.313 1.313 0 0 1 1.312-1.312"></path>
                    <path d="M5.908 7.874a1.969 1.969 0 1 0-1.97-1.968 1.969 1.969 0 0 0 1.97 1.968"></path>
                </svg>
                <div class="icons">
                    <ul class="list_meta_icons d-flex justify-content-center position-absolute list-unstyled d-flex bottom-0 start-0 end-0"></ul>
                </div>
            </div>`;

        let captionText = '';
        const figcaption = fileCRUDElem.querySelector('figcaption');
        if (figcaption) {
            captionText = figcaption.textContent;
            figcaption.remove();
        }
        fileCRUDElem.insertAdjacentHTML('beforeend', `<input type="text" value="${captionText}" placeholder="Caption" class="caption form-control">`);

        return new this(fileCRUDElem);
    }
}

// Update Status Notification
class Notification {
    constructor(editor) {
        this.editor = editor;
        this.notification = document.createElement('div');
        Object.assign(this.notification.style, {
            display: 'none',
            position: 'absolute',
            left: '4px',
            bottom: '4px',
            padding: '2px 4px',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '4px',
            zIndex: '1000',
        });
        this.editor.appendChild(this.notification);
        this.hideTimeout = null;
    }

    async show(message, type) {
        clearTimeout(this.hideTimeout); // clear any existing hide timeout

        this.notification.textContent = message;
        this.notification.style.backgroundColor = type === 'success' ? 'green' : 'salmon';
        this.notification.style.padding = type === 'success' ? '4px' : '2px 4px';

        if (this.notification.style.display === 'none') {
            // if notification is not visible, show it with animation
            this.notification.style.display = 'block';
            this.notification.style.opacity = 0;

            await this.notification.animate([
                { opacity: 0 },
                { opacity: 0.5 }
            ], {
                duration: 150,
                easing: 'ease-in-out',
                fill: 'forwards'
            }).finished;
        }

        this.hideTimeout = setTimeout(this.hide, type === 'error' ? 5000 : 500);
    }

    hide = async () => {

        await this.notification.animate([
            { opacity: 0.5 },
            { opacity: 0 }
        ], {
            duration: 400,
            easing: 'ease-in-out',
            fill: 'forwards'
        }).finished;

        this.notification.style.display = 'none';
    }
}

// ways to store content
class ContentUpdateStrategy {
    constructor(onSuccessCallback, onErrorCallback) {
        this.onSuccessCallback = onSuccessCallback;
        this.onErrorCallback = onErrorCallback;
    }

    update(content) {
        throw new Error("Method 'update()' must be implemented.");
    }
}

class ServerUpdateStrategy extends ContentUpdateStrategy {

    constructor(updateUrl, token, onSuccessCallback, onErrorCallback) {
        super(onSuccessCallback, onErrorCallback);
        this.updateUrl = updateUrl;
        this.token = token;
        this.updatePending = false;
    }

    async update(content) {
        if (this.updatePending) return;

        try {
            this.updatePending = true;

            const response = await fetch(this.updateUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.token
                },
                body: JSON.stringify(content),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            await response.json();
            this.onSuccessCallback();
        } catch (error) {
            this.onErrorCallback(error.message);
        } finally {
            this.updatePending = false;
        }
    }
}

class LocalStorageStrategy extends ContentUpdateStrategy {

    constructor(onSuccessCallback, onErrorCallback) {
        super(onSuccessCallback, onErrorCallback);
    }

    update(content) {
        localStorage.setItem('BibeEditorContent', JSON.stringify(content));
        console.log('Content saved to local storage');
    }
}

// Main Class
class BibeEditor {

    static #blockTypeStrategies = {
        paragraph: {
            check: (element) => element.tagName === 'P',
            transform: (content) => `<p class="bibe_block">${content}</p>`
        },
        heading: {
            check: (element) => element.tagName.startsWith('H'),
            transform: (content) => `<h2 class="bibe_block">${content}</h2>`
        },
        list: {
            check: (element) => element.tagName === 'UL',
            transform: (content) => `<ul class="bibe_block"><li>${content}</li></ul>`
        },
        ul: {
            check: (element) => element.tagName === 'UL',
            transform: (content) => `<ul class="bibe_block"><li>${content}</li></ul>`
        },
        ol: {
            check: (element) => element.tagName === 'OL',
            transform: (content) => `<ol class="bibe_block"><li>${content}</li></ol>`
        },
        quote: {
            check: (element) => element.tagName === 'BLOCKQUOTE',
            transform: (content) => `<blockquote class="bibe_block"><p>${content}</p><cite>Author</cite></blockquote>`
        },
        image: {
            // check: (element) => element.tagName === 'PICTURE',
            // transform: (content) => `<figure><img src="" alt="Image"><figcaption>${content}</figcaption></figure>`
        }
    };

    constructor(options) {
        this.options = options;
        this.container = document.querySelector(options.container);
        this.editor = null;
        this.contentElement = null;
        this.content = '';
        this.anchor = null;
        this.block_menu = null;
        this.block_menu_visible = false;
        this.text_menu = null;
        this.text_menu_visible = false;
        this.new_block_menu = null;
        this.anchorHandlePressed = false;
        this.editorPaddingTop = null; // Editor's top padding
        this.editorPaddingLeft = null; // Editor's left padding

        this.previousHoveredBlock = null;
        this.hoveredBlock = null;       // The block currently hovered over
        this.draggedBlock = null;       // The block currently being dragged
        this.selectedBlock = null;      // The hovered block or the one with anchor menu active
        this.blockWithSeletion = null;  // The block containing selected text
        this.blockWithCursor = null;    // The block containing visible cursor

        this.blocks = [];
        this.notification = null;
        this.updatePending = false; // To prevent overlapping updates
        this.debounceTimer = null; // To manage debouncing
        this.init(this.container, options);
        this.skip_update = false;
        this.debouncer_delay = 1000;
        this.updateStrategies = [];

        this.#initializeUpdateStrategy(options);

        this.ignored_keys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'PageUp', 'PageDown',
            'Home', 'End',
            'Control', 'Alt', 'Shift', 'Escape',
            'CapsLock',
            'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
            'ContextMenu', 'Meta', 'Tab'
        ];

    }

    init(container, options) {

        if (!container) {
            console.error(`BibeEditor container "${options.container}" not found`);
            return;
        };

        if (container.innerHTML.trim() === '') {
            container.innerHTML = `<h2 data-placeholder="Heading 2">&ZeroWidthSpace;</h2>`;
        }

        // wrap content
        container.innerHTML = `
            <div class="bibe_editor">
                <div class="content" contenteditable>
                    ${container.innerHTML}
                </div>
                <div class="anchor">
                    <div class="minibtn handle"></div>
                </div>
                <div class="menu block">
                    <div class="controls"></div>
                </div>
                <div class="menu text">
                    <div class="controls">
                        <div class="bibe_btn text_type" data-type="bold">B</div>
                        <div class="bibe_btn text_type" data-type="italic">I</div>
                        <div class="bibe_btn text_type" data-type="underlined">U</div>
                        <div class="divider"></div>
                        <div class="bibe_btn text_type" data-type="align_left"><</div>
                        <div class="bibe_btn text_type" data-type="align_center">|</div>
                        <div class="bibe_btn text_type" data-type="align_right">></div>
                        <div class="divider"></div>
                        <div class="bibe_btn text_type" data-type="link">8</div>
                        <div class="divider"></div>
                        <div class="bibe_btn text_type" data-type="list">L</div>
                    </div>
                </div>
            </div>`;

        setTimeout(() => {

            // get the top padding of the .bibe_editor
            const editorStyle = window.getComputedStyle(container.querySelector('.bibe_editor'));
            this.editorPaddingTop = parseInt(editorStyle.paddingTop);
            this.editorPaddingLeft = parseInt(editorStyle.paddingLeft);

            this.editor = container.querySelector('.bibe_editor');
            this.contentElement = container.querySelector('.content');
            this.notification = new Notification(this.editor);

            this.#init_blocks();
            this.#initAnchor(container);
            this.#initBlockMenu(container);
            this.#initTextMenu(container);
            this.#init_content_observer();

            this.editor.addEventListener('mousemove', this.#handleMouseMove);
            this.editor.addEventListener('keydown', this.#handle_keys);
            this.editor.addEventListener('mouseleave', this.#hideAnchor);

            window.addEventListener('click', this.#handleWindowClick);
            window.addEventListener('mousedown', this.#handleWindowMouseDown);

            blockEvents.on('block:mouse:in', block => {
                this.hoveredBlock = block;
                this.#showAnchor(block.element);
            });
            blockEvents.on('block:mouse:out', block => {
                this.hoveredBlock = null;
                this.#hideAnchor();
            });

        }, 4);

    }

    create_block(type, referenceElement) {

        let block;

        switch (type) {
            case 'paragraph':
                block = ParagraphBlock.create();
                break;
            case 'heading':
                block = TitleBlock.create('', 2);
                break;
            case 'list':
                block = ListBlock.create();
                break;
            case 'quote':
                block = QuoteBlock.create();
                break;
            case 'image':
                block = ImageBlock.create(null, null, this.options);
                new FileCRUD(block.element);
                break;
            default:
                console.warn('Unknown block type:', type);
                return;
        }

        referenceElement.insertAdjacentElement('beforebegin', block.element);
        referenceElement.remove();

        if (type === 'paragraph' || type === 'heading') {
            this.place_cursor_into(block.element);
        } else if (type === 'list') {
            this.place_cursor_into(block.element.querySelector('li'));
        } else if (type === 'quote') {
            this.place_cursor_into(block.element.querySelector('p'));
        }

        this.blockWithCursor = block;
    }

    place_cursor_into(element) {

        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(element);
        range.collapse(false);

        selection.removeAllRanges();
        selection.addRange(range);

    }

    change_block_action(blockElement, toType) {

        const strategy = BibeEditor.#blockTypeStrategies[toType];

        if (!strategy) {
            console.warn(`No strategy found for block type: ${toType}`);
            return;
        }

        if (strategy.check(blockElement)) return;

        const content = this.#get_block_content(blockElement);
        blockElement.outerHTML = strategy.transform(content);
        this.#init_blocks();

    }

    change_text(element, selection, textType) {

        if (!selection.rangeCount) return;

        let range = selection.getRangeAt(0);
        let newElement;

        switch (textType) {
            case 'bold':
                newElement = document.createElement('strong');
                break;
            case 'italic':
                newElement = document.createElement('em');
                break;
            case 'underlined':
                newElement = document.createElement('u');
                break;
            case 'link':
                const url = prompt('Enter the URL:', 'https://');
                if (url) {
                    newElement = document.createElement('a');
                    newElement.href = url;
                    newElement.target = '_blank';
                    newElement.rel = 'noopener noreferrer';
                    newElement.contentEditable = 'false';
                } else {
                    // Exit if no URL is provided
                    return;
                }
                break;
            case 'align_left':
            case 'align_center':
            case 'align_right':
                const alignment = textType.split('_')[1];
                this.blockWithSeletion.alignment = alignment;
                return;
            case 'list':
                // Custom method for changing block type; no selection manipulation needed
                this.change_block_action(element, 'list');
                return;
            default:
                console.warn('Unknown transformation type:', textType);
                // Exit if type is unknown
                return;
        }

        if (newElement) this.applyStyle(element, range, newElement, textType);

    }

    removeEmptyTags(htmlString) {
        const regex = /<(\w+)><\/\1>/g;
        return htmlString.replace(regex, '');
    }

    applyStyle(blockElement, range, newElement, textType) {

        if (range.collapsed) return;

        // Check if the entire range is already styled
        let parentElement = range.commonAncestorContainer;
        if (parentElement.nodeType === Node.TEXT_NODE) {
            parentElement = parentElement.parentNode;
        }

        // Function to check if a node has the style we're applying
        const hasStyle = (node) => {
            return (textType === 'bold' && node.nodeName === 'STRONG') ||
                (textType === 'italic' && node.nodeName === 'EM') ||
                (textType === 'underlined' && node.nodeName === 'U') ||
                (textType === 'link' && node.nodeName === 'A');
        };

        // If the entire selection has the style, remove it
        if (hasStyle(parentElement)) {
            if (range.toString() === parentElement.textContent) {
                let textNode = document.createTextNode(parentElement.textContent);
                parentElement.parentNode.replaceChild(textNode, parentElement);
                range.selectNodeContents(textNode);
                return;
            }
        }

        // Handle partial overlaps and complex intersections
        let fragment = range.extractContents();
        let newRange = document.createRange();

        // Recursive function to apply or remove style
        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                let wrapper = newElement.cloneNode();
                wrapper.appendChild(node.cloneNode());
                return wrapper;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (hasStyle(node)) {
                    // If node already has the style, remove it
                    return document.createTextNode(node.textContent);
                } else {
                    // Apply new style while preserving existing styles
                    let newNode = newElement.cloneNode();
                    for (let child of node.childNodes) {
                        newNode.appendChild(processNode(child));
                    }
                    return newNode;
                }
            }
            return node.cloneNode(true);
        }

        let newFragment = document.createDocumentFragment();
        for (let child of fragment.childNodes) {
            newFragment.appendChild(processNode(child));
        }

        newFragment.normalize();

        // Special handling for links
        if (textType === 'link') {
            // Ensure link integrity
            let linkNode = newFragment.querySelector('a');
            if (linkNode) {
                newFragment = linkNode;
            }
        }

        range.insertNode(newFragment);
        newRange.selectNodeContents(newFragment);
        range.setStart(newRange.startContainer, newRange.startOffset);
        range.setEnd(newRange.endContainer, newRange.endOffset);

        // Collapse the selection to the end
        range.collapse(false);

        blockElement.innerHTML = this.removeEmptyTags(blockElement.innerHTML);

        this.debounced_content_update();
    }

    #showRemoveLinkButton(linkElement) {
        let buttonWrapper = this.editor.querySelector('.remove-link-wrapper');
        if (!buttonWrapper) {
            buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'remove-link-wrapper';
            Object.assign(buttonWrapper.style, {
                position: 'absolute',
                zIndex: '1000',
                padding: '10px 50px 10px 0px'
            });

            const button = document.createElement('button');
            button.textContent = 'Remove link';
            Object.assign(button.style, {
                fontSize: '12px',
                padding: '2px 5px',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
            });

            button.onclick = (e) => this.#handleRemoveLinkClick(e, linkElement);

            buttonWrapper.appendChild(button);
            this.editor.appendChild(buttonWrapper);
        }

        const linkRect = linkElement.getBoundingClientRect();
        const editorRect = this.editor.getBoundingClientRect();

        Object.assign(buttonWrapper.style, {
            left: `${linkRect.left - editorRect.left}px`,
            top: `${linkRect.top - editorRect.top - buttonWrapper.offsetHeight}px`,
            display: 'block'
        });
    }

    #hideRemoveLinkButton() {
        const buttonWrapper = this.editor.querySelector('.remove-link-wrapper');
        if (buttonWrapper) {
            buttonWrapper.remove();
        }
    }

    #handleRemoveLinkClick(e, linkElement) {
        e.preventDefault();
        e.stopPropagation();

        const textContent = linkElement.textContent;
        const textNode = document.createTextNode(textContent);
        linkElement.parentNode.replaceChild(textNode, linkElement);

        this.#hideRemoveLinkButton();

        // Trigger content update
        this.debounced_content_update();
    }

    #initializeUpdateStrategy(options) {

        const server = new ServerUpdateStrategy(
            options.update_url,
            options.token,
            () => this.on_update_success(),
            (error) => this.on_update_error(error)
        );

        // const localStorage = new LocalStorageStrategy(
        //     () => this.on_update_success(),
        //     (error) => this.on_update_error(error)
        // );

        this.#add_update_strategy(server);
        // this.#add_update_strategy(localStorage);

    }

    #add_update_strategy(strategy) {
        this.updateStrategies.push(strategy);
    }

    #remove_update_strategy(strategy) {
        const index = this.updateStrategies.indexOf(strategy);
        if (index > -1) {
            this.updateStrategies.splice(index, 1);
        }
    }

    #update_content(content) {
        this.updateStrategies.forEach(strategy => strategy.update(content));
    }

    on_update_success() {
        this.notification.show('', 'success');
    }

    on_update_error(errorMessage) {
        this.notification.show(errorMessage, 'error');
    }

    #init_content_observer() {

        this.#observeChildChanges(this.contentElement, () => {
            this.#init_blocks();

            if (!this.skip_update) {
                this.debounced_content_update();
            }

            this.skip_update = false;
        });

    }

    #get_block_content(blockElement) {
        if (blockElement.children.length > 1 || blockElement?.children[0]?.tagName === 'LI') {
            return [...blockElement.children].map(li => li.innerHTML).join('<br>');
        }
        return blockElement.innerHTML;
    }

    #init_blocks = () => {

        this.blocks = Array.from(this.contentElement.children).map(element => {

            switch (element.tagName) {
                case 'P': return ParagraphBlock.fromElement(element);
                case 'H1':
                case 'H2':
                case 'H3':
                case 'H4':
                case 'H5':
                case 'H6': return TitleBlock.fromElement(element);
                case 'UL':
                case 'OL': return ListBlock.fromElement(element);
                case 'BLOCKQUOTE': return QuoteBlock.fromElement(element);
                case 'FIGURE': // first init for images
                    const img = element.querySelector('img');
                    const imgBlock = ImageBlock.create(element, img.dataset.id, this.options);
                    element.replaceWith(imgBlock.element);
                    new FileCRUD(imgBlock.element);
                    return imgBlock;
                case 'DIV': // not a first init for images
                    if (element.classList.contains('file_crud')) {
                        return new ImageBlock(element);
                    }
                default: return new Block(element);
            }
        });

    }

    #handle_keys = (event) => {

        if (this.blockWithCursor.element.dataset.placeholder) { // if the block has a placeholder
            this.blockWithCursor.remove_placeholder();
        }

        switch (event.key) {
            case 'Enter':
                this.#handle_enter_key(event);
                break;
            case 'Backspace':
                this.#handle_backspace_key(event);
                break;
            case 'Delete':
                this.#handle_delete_key(event);
                break;
            default:
                if (this.ignored_keys.includes(event.key)) return;
                this.debounced_content_update();
                break;
        }

        this.blockWithCursor.update();

    }

    #handle_enter_key(event) {

        const selection = window.getSelection();
        const selectedNode = selection?.anchorNode;
        const currentBlock = this.blockWithCursor.element;

        if (selection.anchorOffset === selectedNode?.length || selectedNode?.innerText?.trim().length === 0) {
            this.skip_update = true;

            if (this.blockWithCursor.type === 'heading' || this.blockWithCursor.type === 'paragraph') {

                event.preventDefault();
                const newParagraph = ParagraphBlock.create();
                currentBlock.insertAdjacentElement('afterend', newParagraph.element);
                this.#focusOnNewBlock(newParagraph.element);
                this.blockWithCursor = newParagraph;
                this.#init_blocks();

            } else if (this.blockWithCursor.type === 'quote') {

                if (selectedNode.parentElement.tagName === 'CITE') {
                    event.preventDefault();
                    const newParagraph = ParagraphBlock.create();
                    this.blockWithCursor.element.insertAdjacentElement('afterend', newParagraph.element);
                    this.#focusOnNewBlock(newParagraph.element);
                    this.blockWithCursor = newParagraph;
                    this.#init_blocks();
                } else {
                    event.preventDefault();
                    this.place_cursor_into(this.blockWithCursor.element.querySelector('cite'));
                }

            } else if (this.blockWithCursor.type === 'list') {

                // Check if the cursor is in the last LI
                let node = selection.anchorNode;
                while (node && node.nodeName !== 'LI') {
                    node = node.parentNode;
                }

                const isLastLi = node === this.blockWithCursor.element.lastElementChild;
                const isEmptyLi = selectedNode.textContent.trim() === '';

                if (isEmptyLi) {
                    if (isLastLi) {
                        event.preventDefault();
                        node.remove(); // Remove the last LI
    
                        const newParagraph = ParagraphBlock.create();
                        this.blockWithCursor.element.insertAdjacentElement('afterend', newParagraph.element);
                        this.#focusOnNewBlock(newParagraph.element);
                        this.blockWithCursor = newParagraph;
                        this.#init_blocks();
                    } else {
                        event.preventDefault();
                        const newLi = document.createElement('li');
                        newLi.innerHTML = '&#8203;';
                        node.insertAdjacentElement('afterend', newLi);
                        this.place_cursor_into(newLi);
                    }
                }
            }
        }
    }

    #handle_backspace_key(event) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        if (range.startOffset === 0 && range.endOffset === 0) { // The caret is at the start of a block
            this.skip_update = true;

            if (this.#contentIsEmpty()) event.preventDefault();

            setTimeout(() => { // let browser do its thing
                this.#init_blocks();
                this.debounced_content_update();
            }, 4);

        } else {
            this.debounced_content_update();
        }
    }

    #handle_delete_key(event) {

        const blockContent = this.blockWithCursor.element.innerHTML.trim();

        if (blockContent === '<br>' || blockContent === '') {
            if (this.blocks.length > 1) {
                event.preventDefault();
                this.blockWithCursor.element.remove();
                this.#init_blocks();
            }
        }

    }

    #focusOnNewBlock(element) {

        const range = document.createRange();
        const selection = window.getSelection();
        selection.removeAllRanges();
        range.setStart(element, 0);
        range.collapse(true);
        selection.addRange(range);
        element.focus();

    }

    debounced_content_update() {

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.content = this.#gather_content();
            this.#update_content(this.content);
        }, this.debouncer_delay);

    }

    #updateBlocks() {
        this.blocks.forEach(block => {
            block.update_rect();
            // block.isHovered = block.element === this.hoveredBlock?.element;
        });
    }

    #initAnchor(container) {

        this.anchor = container.querySelector('.anchor');

        this.anchor.addEventListener('click', e => {
            if (e.target.closest('.handle')) {
                this.selectedBlock = this.hoveredBlock;

                let action = 'change';
                if (this.#blockIsEmpty(this.selectedBlock)) action = 'create';

                this.#showBlockMenu(action);
            }
        });

        this.anchor.addEventListener('mousedown', e => {
            if (e.target.closest('.handle')) {
                // prevent text selection
                e.preventDefault();

                this.anchorHandlePressed = true;
                this.draggedBlock = this.hoveredBlock;
                this.hoveredBlock.element.style.backgroundColor = 'hsla(195, 100%, 50%, 0.18';
                this.hoveredBlock.element.style.borderRadius = '3px';
                this.editor.addEventListener('mouseup', this.#handleMouseUp, { once: true });
            }
        });

    }

    #initBlockMenu(container) {
        this.block_menu = container.querySelector('.menu.block');

        this.block_menu.addEventListener('click', e => {
            if (e.target.closest('.block_action')) {

                const action = e.target.closest('.block_action').dataset.action;

                if (action === 'delete') {
                    this.selectedBlock.destroy();
                    this.selectedBlock = null;
                    this.#init_blocks();
                } else if (action === 'change') {
                    const blockType = e.target.closest('.block_action').dataset.type;
                    if (!this.selectedBlock) console.log('this.selectedBlock', this.selectedBlock);
                    this.change_block_action(this.selectedBlock.element, blockType);
                } else if (action === 'create') {
                    const blockType = e.target.closest('.block_action').dataset.type;
                    this.create_block(blockType, this.selectedBlock.element);
                }

            }
            this.selectedBlock = null;
            this.#hideBlockMenu();
        });
    }

    #showBlockMenu(action = 'create') {

        this.block_menu.dataset.action = action;

        this.block_menu.style.top = this.anchor.style.top;
        this.block_menu.style.left = this.anchor.style.left;
        this.block_menu.style.visibility = 'visible';
        this.block_menu_visible = true;

        this.block_menu.addEventListener('mouseleave', this.#hideBlockMenu, { once: true });

        let buttons = [];

        if (action === 'create') {
            buttons = [
                {
                    type: 'paragraph',
                    icon: 'P',
                    title: 'Paragraph',
                    action
                },
                {
                    type: 'heading',
                    icon: 'H',
                    title: 'Heading',
                    action
                },
                {
                    type: 'list',
                    icon: 'L',
                    title: 'List',
                    action
                },
                {
                    type: 'quote',
                    icon: 'Q',
                    title: 'Quote',
                    action
                },
                {
                    type: 'image',
                    icon: 'I',
                    title: 'Image',
                    action
                }
            ];
        } else if (action === 'change') {
            buttons = [
                {
                    type: 'paragraph',
                    icon: 'P',
                    title: 'Paragraph',
                    action
                },
                {
                    type: 'heading',
                    icon: 'H',
                    title: 'Heading',
                    action
                },
                {
                    type: 'list',
                    icon: 'L',
                    title: 'List',
                    action
                },
                {
                    type: 'quote',
                    icon: 'Q',
                    title: 'Quote',
                    action
                },
                {
                    type: 'divider'
                },
                {
                    type: 'delete',
                    icon: '<svg viewBox="0 0 13.714 16"><g fill="#ff0014"><path d="M4.571 5.714h1.143v6.857H4.571Z"></path><path d="M8 5.714h1.143v6.857H8Z"></path><path d="M0 2.286v1.143h1.143v11.428A1.143 1.143 0 0 0 2.286 16h9.143a1.143 1.143 0 0 0 1.143-1.143V3.429h1.143V2.286Zm2.286 12.571V3.429h9.143v11.428Z"></path><path d="M4.571 0h4.571v1.143H4.571Z"></path></g></svg>',
                    title: 'Delete',
                    action: 'delete'
                }
            ];
        }

        this.block_menu.firstElementChild.innerHTML = buttons.map(button => {
            if (button.type === 'divider') {
                return '<div class="divider"></div>';
            }
            return `<div class="bibe_btn block_action" data-type="${button.type}" data-action="${button.action}">${button.icon}</div>`;
        }).join('');

    }

    #hideBlockMenu = () => {
        this.block_menu.style.visibility = 'hidden';
        this.block_menu_visible = false;
    }

    #showAnchor(block) {

        // block.isHovered = true;
        // Calculate and adjust the anchor's position to the block's top left corner
        const blockRect = block.getBoundingClientRect();
        const blockStyle = window.getComputedStyle(block);
        const blockPaddingTop = parseInt(blockStyle.paddingTop);
        const blockLineHeight = parseInt(blockStyle.lineHeight);

        const contentRect = this.contentElement.getBoundingClientRect();
        const relativeTop = blockRect.top - contentRect.top + blockPaddingTop + blockLineHeight;

        const miniBtn = this.anchor.firstElementChild;

        if (this.#blockIsEmpty(this.hoveredBlock)) {
            miniBtn.innerHTML = `<svg viewBox="0 0 12 12"><path d="M11.044 5H7V.956a1 1 0 0 0-2 0V5H.956a1 1 0 0 0 0 2H5v4.044a1 1 0 0 0 2 0V7h4.044a1 1 0 0 0 0-2Z"/></svg>`;
        } else {
            miniBtn.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="red" stroke-width="10" fill="none"></circle></svg>`;
        }

        this.anchor.style.left = `0px`;
        this.anchor.style.top = `${relativeTop}px`;
        this.anchor.style.display = 'block'; // Show the anchor
    }

    #hideAnchor = () => {
        this.anchor.style.display = 'none'; // Hide the anchor
        // this.blocks.forEach(block => {
        //     block.isHovered = false;
        // });
    }

    #initTextMenu() {
        this.text_menu = this.container.querySelector('.menu.text');

        this.text_menu.addEventListener('click', e => {
            if (e.target.closest('.text_type')) {
                const textType = e.target.closest('.text_type').dataset.type;
                this.change_text(this.blockWithSeletion.element, document.getSelection(), textType);
                this.#hideTextMenu();
                document.getSelection().removeAllRanges(); // deselect text
            }
        });

        this.contentElement.addEventListener('click', (e) => {

            const selection = document.getSelection();
            const clickedBlock = this.blocks.find(block => block.element === e.target.closest('.bibe_block'));

            if (!clickedBlock) return;

            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (range.startOffset === range.endOffset) {
                    this.blockWithCursor = clickedBlock;
                } else {
                    this.blockWithCursor = clickedBlock;
                    this.blockWithSeletion = clickedBlock;
                }
            }

            if (this.#blockIsEmpty(clickedBlock)) {
                clickedBlock.add_placeholder();
            } else {
                for (const block of this.blocks) {
                    if (block !== clickedBlock && block.element.dataset.placeholder) {
                        block.remove_placeholder();
                    }
                }
            }

            if (this.text_menu_visible) return;

            if (selection.rangeCount > 0 && !selection.isCollapsed) {

                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const editorRect = this.editor.getBoundingClientRect();
                const left = rect.left - editorRect.left;
                const top = rect.bottom - editorRect.top;

                setTimeout(() => {
                    this.#showTextMenu(left, top);
                }, 0);

            }
        });

    }

    #showTextMenu(left, top) {
        this.text_menu.style.left = `${left}px`;
        this.text_menu.style.top = `${top}px`; // Adjust if necessary for better appearance
        this.text_menu.style.visibility = 'visible';
        this.text_menu_visible = true;
    }

    #hideTextMenu() {
        this.text_menu.style.visibility = 'hidden';
        this.text_menu_visible = false;
        this.blockWithSeletion = null;
    }

    #handleMouseMove = (e) => {

        const checkX = e.clientX + this.editorPaddingLeft;
        const checkY = e.clientY;

        const elementAtPoint = document.elementFromPoint(checkX, checkY);
        const blockElem = elementAtPoint?.closest('.bibe_block');

        if (blockElem) {

            const linkElement = e.target.closest('a');
            if (linkElement) {
                this.#showRemoveLinkButton(linkElement);
            } else {
                this.#hideRemoveLinkButton();
            }

        }

        if (this.anchorHandlePressed === true) {

            this.#updateBlocks();
            this.blocks.forEach(block => {
                block.drop = null;
                block.element.style.borderTop = '';
                block.element.style.borderBottom = '';
            });

            const nearestBlock = this.blocks.reduce((nearest, block) => {
                const mouseY = e.clientY;
                const blockMiddleY = block.rect.top + (block.rect.height / 2);
                if (!nearest.block || (Math.abs(mouseY - blockMiddleY) < Math.abs(mouseY - nearest.middleY))) {
                    return { element: block.element, block, middleY: blockMiddleY };
                }
                return nearest;
            }, {});

            if (nearestBlock.element) {
                const mouseY = e.clientY;
                const positionAbove = mouseY < nearestBlock.middleY;
                nearestBlock.element.style[positionAbove ? 'borderTop' : 'borderBottom'] = '3px solid deepskyblue';
                nearestBlock.block.drop = positionAbove ? 'beforeBegin' : 'afterEnd';
            }

        }

    }

    #handleMouseUp = () => {
        if (this.anchorHandlePressed === true) {
            this.anchorHandlePressed = false;
            const dropBlock = this.blocks.find(b => b.drop);
            if (dropBlock) {
                dropBlock.element.insertAdjacentElement(dropBlock.drop, this.draggedBlock.element);
                this.draggedBlock = null;
            }
        }
        this.blocks.forEach(block => {
            block.element.style.borderTop = '';
            block.element.style.borderBottom = '';
            block.element.style.backgroundColor = null;
            block.element.style.borderRadius = null;
        });
    }

    #handleWindowClick = (e) => {
        if (!this.text_menu_visible) return;
        if (!e.target.closest('.menu.text')) this.#hideTextMenu();

    }

    #handleWindowMouseDown = (e) => {
        if (e.target.closest('.menu.text')) e.preventDefault();
    }

    #observeChildChanges(targetElement, callback) {

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    callback();
                    break;
                }
            }
        });

        const config = {
            childList: true,
            subtree: true,
            attributes: true
        };

        observer.observe(targetElement, config);
        return observer;
    }

    #gather_content() {

        this.content = this.blocks
            .map(block => block.serialize())
            .filter(blockData => blockData);

        if (this.#contentIsEmpty()) return [];
        return this.content;

    }

    #contentIsEmpty() {

        const content = this.content;

        if (content.length === 0) return true;
        if (content.length === 1) {
            if (content[0].content === '') return true;
            if (content[0].content === '<br>') return true;
        }

        return false;

    }

    #blockIsEmpty(block) {
        const content = block.element.innerHTML.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        return content === '' || content === '<br>';
    }

    #is_cursor_at_end(element) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;

        // Create a range that selects the element's contents
        const elementRange = document.createRange();
        elementRange.selectNodeContents(element);
        elementRange.collapse(false); // Collapse the range to the end of the content

        // Get the user's current selection range
        const userRange = selection.getRangeAt(0);
        const beyondUserRange = document.createRange(); // Create a new range to check the end condition

        // Set the start of this range to the end of the user's range
        beyondUserRange.setStart(userRange.endContainer, userRange.endOffset);
        beyondUserRange.setEnd(elementRange.endContainer, elementRange.endOffset);

        // Check if there's any non-whitespace text or non-empty editable elements left
        return !beyondUserRange.toString().trim() && beyondUserRange.endOffset === elementRange.endOffset;
    }

}

export default BibeEditor;