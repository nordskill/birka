// Base Block Class
class Block {
    constructor(element) {
        this.tag = element.tagName;
        this.element = element;
        this.isHovered = false;
        this.attributes = {
            align: element.style.textAlign || 'left',
        };

        this.update_rect();
        this.element.addEventListener('dragover', e => e.preventDefault());
    }

    update_rect() {
        this.rect = this.element.getBoundingClientRect();
    }

    serialize() {
        return {
            type: this.type,
            content: this.element.innerHTML,
            attributes: this.attributes
        };
    }

    set alignment(newAlignment) {
        this.element.style.textAlign = newAlignment;
        this.attributes.align = newAlignment;
    }

    get alignment() {
        return this.attributes.align;
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
        this.content = element.innerHTML;
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
        this.content = element.innerHTML;
        this.attributes.level = parseInt(element.tagName[1]);
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
        this.content = [...this.element.querySelectorAll('li')].map(li => ({ item: li.innerHTML }));
        this.attributes.type = element.tagName === 'UL' ? 'unordered' : 'ordered';
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

    serialize() {
        const items = [...this.element.querySelectorAll('li')].map(li => ({ item: li.innerHTML }));
        return {
            type: this.type,
            content: items,
            attributes: this.attributes, // Assuming attributes are updated elsewhere if they can change
        };
    }
}
class QuoteBlock extends Block {
    constructor(element) {
        super(element);
        this.type = 'quote';
        this.content = element.querySelector('p')?.innerHTML || '';
        const author = element.querySelector('cite')?.textContent || '';
        this.attributes.author = author;
    }

    static create(content = '', author = '') {
        const blockquote = document.createElement('blockquote');
        blockquote.classList.add('bibe_block');
        blockquote.innerHTML = `<p>${content}</p><cite>${author}</cite>`;
        return new this(blockquote);
    }

    serialize() {
        const content = this.element.querySelector('p')?.innerHTML || '';
        const author = this.element.querySelector('cite')?.textContent || '';
        return {
            type: this.type,
            content: content,
            attributes: { author: author },
        };
    }
}
class ImageBlock extends Block {
    constructor(element) {
        super(element);
        this.type = 'image';
        this.img = element.querySelector('img');
        this.content = this.img.src;
        this.attributes.width = this.img.width;
        this.attributes.alt = this.img.alt;
        this.attributes.caption = element.querySelector('figcaption')?.textContent || '';
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

    serialize() {
        return {
            type: this.type,
            content: this.img.src, // Assuming `this.img` is the img element
            attributes: {
                width: this.img.style.width,
                align: this.element.style.textAlign,
                alt: this.img.alt,
                caption: this.element.querySelector('figcaption')?.textContent || '',
            },
        };
    }
}

// Update Status Notification
class Notification {
    constructor(editor) {
        this.editor = editor;
        this.notification = document.createElement('div');
        this.notification.style.display = 'none';
        this.notification.style.position = 'absolute';
        this.notification.style.left = '4px';
        this.notification.style.bottom = '4px';
        this.notification.style.padding = '2px 4px';
        this.notification.style.fontSize = '10px';
        this.notification.style.textTransform = 'uppercase';
        this.notification.style.letterSpacing = '0.01em';
        this.notification.style.color = 'white';
        this.notification.style.fontWeight = 'bold';
        this.notification.style.borderRadius = '4px';
        this.notification.style.zIndex = '1000';
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

// Main Class
class BibeEditor {

    constructor(options) {
        this.container = document.querySelector(options.container);
        this.read_url = options.read_url;
        this.update_url = options.update_url;
        this.token = options.token;
        this.editor = null;
        this.content = null;
        this.anchor = null;
        this.block_menu = null;
        this.block_menu_visible = false;
        this.text_menu = null;
        this.text_menu_visible = false;
        this.new_block_menu = null;
        this.anchorHandlePressed = false;
        this.editorPaddingTop = null; // Editor's top padding
        this.editorPaddingLeft = null; // Editor's left padding
        this.hoveredBlock = null;
        this.draggedBlock = null;
        this.selectedBlock = null;
        this.blockWithSeletion = null;
        this.blocks = [];
        this.notification = null;
        this.updatePending = false; // To prevent overlapping updates
        this.debounceTimer = null; // To manage debouncing
        this.init(this.container);
        this.skip_update = false;
        this.debouncer_delay = 1000;

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

    init(container) {

        if (!container) {
            console.error('BibeEditor container not found');
            return;
        };

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

            this.content = container.querySelector('.content');
            this.#initBlocks();
            this.#initAnchor(container);
            this.#initBlockMenu(container);
            this.#initTextMenu(container);

            this.#observeChildChanges(this.content, () => {

                this.#initBlocks();

                if (!this.skip_update) {
                    this.#send_content_update();
                }

                this.skip_update = false;

            });

            this.editor.addEventListener('keydown', this.#handleKeys);

            window.addEventListener('click', this.#handleWindowClick);
            window.addEventListener('mousedown', this.#handleWindowMouseDown);

        }, 0);

    }

    change_block_type(blockElement, toType) {

        let wrapper = '';
        let content = '';

        // if the current block is ul or ol then convert its li children to array
        let array = [];
        if (blockElement.children.length > 1 || blockElement?.children[0]?.tagName === 'LI') {
            array = [...blockElement.children].map(li => li.innerHTML);
        }

        if (array.length) {
            content = array.join('<br>');
        } else {
            content = blockElement.innerHTML;
        }

        switch (toType) {
            case 'paragraph':
                if (blockElement.tagName === 'P') return;
                wrapper = `<p class="bibe_block">${content}</p>`;
                break;
            case 'title':
                if (blockElement.tagName.startsWith('H')) return;
                wrapper = `<h2 class="bibe_block">${content}</h2>`;
                break;
            case 'list':
            case 'ul':
                if (blockElement.tagName === 'UL') return;
                wrapper = `<ul class="bibe_block">
                    <li>${blockElement.innerHTML}</li>
                </ul>`;
                break;
            case 'ol':
                if (blockElement.tagName === 'OL') return;
                wrapper = `<ol class="bibe_block">
                    <li>${blockElement.innerHTML}</li>
                </ol>`;
                break;
            case 'quote':
                if (blockElement.tagName === 'BLOCKQUOTE') return;
                wrapper = `<blockquote class="bibe_block">
                    <p>${content}</p>
                    <cite>Author</cite>
                </blockquote>`;
                break;
        }

        blockElement.outerHTML = wrapper;
        this.#initBlocks();

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

    #initBlocks = () => {

        this.blocks = Array.from(this.content.children).map(element => {
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

    };

    #handleKeys = (event) => {

        if (event.key === 'Enter') {
            this.handleEnterKey(event);
        } else if (event.key === 'Backspace') {
            this.handleBackspaceKey(event);
        } else {
            if (this.ignored_keys.includes(event.key)) return;
            this.debouncedContentUpdate();
        }

    }

    handleEnterKey(event) {

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
                this.focusOnNewBlock(newParagraph.element);

            }

        }

    }

    handleBackspaceKey(event) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        if (range.startOffset === 0 && range.endOffset === 0) { // The caret is at the start of a block
            this.skip_update = true;

            setTimeout(() => { // let browser do its thing
                this.#initBlocks();
                this.#send_content_update();
            }, 0);

        } else {
            this.debouncedContentUpdate();
        }
    }

    focusOnNewBlock(element) {

        const range = document.createRange();
        const selection = window.getSelection();
        selection.removeAllRanges();
        range.setStart(element, 0);
        range.collapse(true);
        selection.addRange(range);
        element.focus();

    }

    debouncedContentUpdate() {

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(this.#send_content_update, this.debouncer_delay);

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
                this.#initBlocks();
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

        const contentRect = this.content.getBoundingClientRect();
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

        this.content.addEventListener('click', (e) => {

            if (this.text_menu_visible) return;

            const selection = document.getSelection();
            this.blockWithSeletion = this.blocks.find(block => block.element.contains(selection.anchorNode));

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
            const block = this.blocks.find(b => b.element === blockElem);
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

    // Send content to the server

    #gather_content() {

        return this.blocks.map(block => block.serialize());

    }

    #send_content_update = async () => {

        if (this.updatePending) return;

        try {
            const content = this.#gather_content();
            console.trace();

            this.updatePending = true;

            const response = await fetch(this.update_url, {
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
            this.#on_update_ok();
            this.updatePending = false;

        } catch (error) {

            this.#on_update_error(error.message);

        }
    }

    #on_update_ok() {
        this.notification.show('', 'success');
    }

    #on_update_error(errorMessage) {
        this.notification.show(errorMessage, 'error');
    }

}

export default BibeEditor;