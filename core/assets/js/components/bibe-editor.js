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
    }

    update_rect() {
        this.rect = this.element.getBoundingClientRect();
    }

    serialize() {
        return {
            type: this.type,
            content: this.get_content(),
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

    // Static method to initialize from an existing DOM element
    static fromElement(element) {
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

    static create(content = '') {
        const p = document.createElement('p');
        p.innerHTML = content || '&#8203;';
        p.classList.add('bibe_block');
        return new this(p);
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

    static create(content = '', level = 1) {
        const h = document.createElement(`h${level}`);
        h.innerHTML = content;
        h.classList.add('bibe_block');
        return new this(h);
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
        items.forEach(itemContent => {
            const li = document.createElement('li');
            li.innerHTML = itemContent;
            listElement.appendChild(li);
        });
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

    static create(content = '', author = '') {
        const blockquote = document.createElement('blockquote');
        blockquote.classList.add('bibe_block');
        blockquote.innerHTML = `<p>${content}</p><cite>${author}</cite>`;
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
        if (!this.img) return '';
        return this.img.src;
    }

    get_attributes() {
        if (!this.img) return {};
        return {
            width: this.img.style.width,
            alt: this.img.alt,
            caption: this.element.querySelector('figcaption')?.textContent || ''
        };
    }

    static create(src = '', alt = '', caption = '') {
        const figure = document.createElement('figure');
        figure.classList.add('bibe_block');
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        figure.appendChild(img);
        if (caption) {
            const figcaption = document.createElement('figcaption');
            figcaption.textContent = caption;
            figure.appendChild(figcaption);
        }
        return new this(figure);
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
        title: {
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
        }
    };

    constructor(options) {
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

        // if trimmed container is empty then generate a h1 tags with "Start With a Title" span
        // the span will be semitransparent, not selectable, not clickable

        let placeholder = '';

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
                    <div class="minibtn add_block">
                        <svg viewBox="0 0 14 14">
                            <path d="m8.746 7.001 4.888-4.888A1.236 1.236 0 0 0 11.888.364L7.001 5.25 2.112.362a1.237 1.237 0 1 0-1.75 1.75L5.25 7.001.362 11.888a1.237 1.237 0 0 0 1.749 1.749l4.89-4.888 4.888 4.888a1.237 1.237 0 0 0 1.749-1.749Z"></path>
                        </svg>
                    </div>
                    <div class="minibtn handle">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="red" stroke-width="10" fill="none"></circle>
                        </svg>
                    </div>
                </div>
                <div class="menu block">
                    <div class="controls">
                        <div class="bibe_btn block_type" data-type="paragraph">P</div>
                        <div class="bibe_btn block_type" data-type="title">T</div>
                        <div class="bibe_btn block_type" data-type="list">L</div>
                        <div class="bibe_btn block_type" data-type="quote">Q</div>
                        <div class="divider"></div>
                        <div class="bibe_btn delete" data-cmd="del">
                            <svg viewBox="0 0 13.714 16">
                                <g fill="#ff0014">
                                    <path d="M4.571 5.714h1.143v6.857H4.571Z" />
                                    <path d="M8 5.714h1.143v6.857H8Z" />
                                    <path d="M0 2.286v1.143h1.143v11.428A1.143 1.143 0 0 0 2.286 16h9.143a1.143 1.143 0 0 0 1.143-1.143V3.429h1.143V2.286Zm2.286 12.571V3.429h9.143v11.428Z" />
                                    <path d="M4.571 0h4.571v1.143H4.571Z" />
                                </g>
                            </svg>
                        </div>
                    </div>
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

            // Add class "block" to every direct child of the `.content`
            const contentChildren = container.querySelector('.content').children;
            for (let child of contentChildren) {
                child.classList.add('bibe_block');
            }

            // get the top padding of the .bibe_editor
            const editorStyle = window.getComputedStyle(container.querySelector('.bibe_editor'));
            this.editorPaddingTop = parseInt(editorStyle.paddingTop);
            this.editorPaddingLeft = parseInt(editorStyle.paddingLeft);

            this.editor = container.querySelector('.bibe_editor');
            this.editor.addEventListener('mousemove', this.#handleMouseMove);

            this.notification = new Notification(this.editor);

            this.contentElement = container.querySelector('.content');
            this.#init_blocks();
            this.#initAnchor(container);
            this.#initBlockMenu(container);
            this.#initTextMenu(container);
            this.#init_content_observer();

            this.editor.addEventListener('keydown', this.#handle_keys);

            window.addEventListener('click', this.#handleWindowClick);
            window.addEventListener('mousedown', this.#handleWindowMouseDown);

        }, 4);

    }

    change_block_type(blockElement, toType) {

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
                this.change_block_type(element, 'list');
                return;
            default:
                console.warn('Unknown transformation type:', textType);
                // Exit if type is unknown
                return;
        }

        if (newElement) {
            let selectedText = range.extractContents();
            newElement.appendChild(selectedText);
            range.insertNode(newElement);
        }

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
                case 'PICTURE': return ImageBlock.fromElement(element);
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
                this.#handleEnterKey(event);
                break;
            case 'Backspace':
                this.#handleBackspaceKey(event);
                break;
            case 'Delete':
                this.#handleDeleteKey(event);
                break;
            default:
                if (this.ignored_keys.includes(event.key)) return;
                this.debounced_content_update();
                break;
        }

        this.blockWithCursor.update();

    }

    #handleEnterKey(event) {

        const selection = window.getSelection();
        const selectedNode = selection.anchorNode;
        const parentTag = selectedNode.parentNode;

        if (selection.anchorOffset === selectedNode.length || selectedNode?.innerText?.trim().length === 0) {
            this.skip_update = true;

            if (parentTag.tagName.match(/^H[1-6]$/)) {

                event.preventDefault();
                const newParagraph = ParagraphBlock.create('');
                const currentBlock = selectedNode.parentNode.closest('.bibe_block');
                currentBlock.insertAdjacentElement('afterend', newParagraph.element);
                this.#focusOnNewBlock(newParagraph.element);
                this.blockWithCursor = newParagraph;
                this.#init_blocks();

            }

        }

    }

    #handleBackspaceKey(event) {
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

    #handleDeleteKey(event) {

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
            block.isHovered = block.element === this.hoveredBlock?.element;
        });
    }

    #initAnchor(container) {

        this.anchor = container.querySelector('.anchor');

        this.anchor.addEventListener('click', e => {
            if (e.target.closest('.add_block')) {
                this.#newBlockMenu();
            }
            if (e.target.closest('.handle')) {
                this.selectedBlock = this.hoveredBlock;
                this.#showBlockMenu();
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
            if (e.target.closest('.block_type')) {
                const blockType = e.target.closest('.block_type').dataset.type;
                if (!this.selectedBlock) console.log('this.selectedBlock', this.selectedBlock);
                this.change_block_type(this.selectedBlock.element, blockType);
            }
            if (e.target.closest('.delete')) {
                this.selectedBlock.element.remove();
                this.#init_blocks();
            }
            this.selectedBlock = null;
            this.#hideBlockMenu();
        });
    }

    #showBlockMenu() {

        this.block_menu.style.top = this.anchor.style.top;
        this.block_menu.style.left = this.anchor.style.left;
        this.block_menu.style.visibility = 'visible';
        this.block_menu_visible = true;

        this.block_menu.addEventListener('mouseleave', this.#hideBlockMenu, { once: true });

    }

    #hideBlockMenu = () => {
        this.block_menu.style.visibility = 'hidden';
        this.block_menu_visible = false;
    }

    #showAnchor(block) {

        block.isHovered = true;
        // Calculate and adjust the anchor's position to the block's top left corner
        const blockRect = block.getBoundingClientRect();
        const blockStyle = window.getComputedStyle(block);
        const blockPaddingTop = parseInt(blockStyle.paddingTop);
        const blockLineHeight = parseInt(blockStyle.lineHeight);

        const contentRect = this.contentElement.getBoundingClientRect();
        const relativeTop = blockRect.top - contentRect.top + blockPaddingTop + blockLineHeight;

        this.anchor.style.left = `0px`;
        this.anchor.style.top = `${relativeTop}px`;
        this.anchor.style.display = 'block'; // Show the anchor
    }

    #hideAnchor() {
        this.anchor.style.display = 'none'; // Hide the anchor
        this.blocks.forEach(block => {
            block.isHovered = false;
        });
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
            const clickedBlock = this.blocks.find(block => block.element.contains(selection.anchorNode));

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
            const block = this.blocks.find(b => {
                return b.element === blockElem;
            });
            block.isHovered = true;
            this.hoveredBlock = block;
            this.#showAnchor(elementAtPoint.closest('.bibe_block'));
        } else {
            this.hoveredBlock = null;
            this.#hideAnchor();
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

    #newBlockMenu() {
        console.log('add block');
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
            childList: true
        };

        observer.observe(targetElement, config);
        return observer;
    }

    #gather_content() {

        this.content = this.blocks.map(block => block.serialize());

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

}

export default BibeEditor;