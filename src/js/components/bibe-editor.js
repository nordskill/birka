// Base Block class
class Block {
    constructor(element) {
        this.tag = element.tagName;
        this.element = element;
        this.isHovered = false;
        this.attributes = {
            align: element.style.textAlign || 'left',
        };

        this.update_rect();

        // prevent dragging portions of selected text
        this.element.addEventListener('dragover', e => e.preventDefault());
    }

    update_rect() {
        this.rect = this.element.getBoundingClientRect();
    }

    set alignment(newAlignment) {
        this.element.style.textAlign = newAlignment;
        this.attributes.align = newAlignment;
    }

    get alignment() {
        return this.attributes.align;
    }

}

// Specific Block classes
class ParagraphBlock extends Block {
    constructor(element) {
        super(element);
        this.type = 'paragraph';
        this.content = element.innerHTML;
    }
}
class TitleBlock extends Block {
    constructor(element) {
        super(element);
        this.type = 'heading';
        this.content = element.innerHTML;
        this.attributes.level = parseInt(element.tagName[1]);
    }
}
class ListBlock extends Block {
    constructor(element) {
        super(element);
        this.type = 'list';
        this.content = [...element.querySelectorAll('li')].map(li => ({
            item: li.innerHTML
        }));
        this.attributes.type = element.tagName === 'UL' ? 'unordered' : 'ordered';
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
}

class BibeEditor {

    constructor(options) {
        this.container = document.querySelector(options.container);
        this.init(this.container);
        this.read_url = options.read_url;
        this.update_url = options.update_url;
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

            this.content = container.querySelector('.content');
            this.#initBlocks();
            this.#initAnchor(container);
            this.#initBlockMenu(container);
            this.#initTextMenu(container)

            this.#observeChildChanges(this.content, this.#initBlocks);

            this.editor.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {

                    const selection = window.getSelection();
                    const selectedNode = selection.anchorNode;
                    const parentTag = selectedNode.parentNode.tagName;

                    if (parentTag.match(/^H[1-6]$/)) {

                        // if cursor is not at the end of the title
                        if (selection.anchorOffset !== selectedNode.length) return;

                        event.preventDefault();

                        const newBlock = this.create_block('paragraph');
                        const currentBlock = selectedNode.parentNode.closest('.bibe_block');
                        currentBlock.insertAdjacentElement('afterend', newBlock);

                        // place cursor into the new block
                        const newRange = document.createRange();
                        newRange.setStart(newBlock, 0);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);

                    }
                }
            });

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

    create_block(type, content = '') {

        let tag;

        switch (type) {
            case 'paragraph':
                tag = 'p'
                break;
            case 'title':
                tag = 'h1';
                break;
            case 'list':
            case 'ul':
                tag = 'ul';
                break;
            case 'ol':
                tag = 'ol';
                break;
            case 'quote':
                tag = 'blockquote';
                break;
        }

        const block = document.createElement(tag);
        block.classList.add('bibe_block');
        block.innerHTML = content || '&#8203;';

        return block;
    }

    #initBlocks = () => {
        this.blocks = [...this.content.children].map(element => {
            switch (element.tagName) {
                case 'P':
                    return new ParagraphBlock(element);
                case 'H1':
                case 'H2':
                case 'H3':
                case 'H4':
                case 'H5':
                case 'H6':
                    return new TitleBlock(element);
                case 'UL':
                case 'OL':
                    return new ListBlock(element);
                case 'BLOCKQUOTE':
                    return new QuoteBlock(element);
                case 'PICTURE':
                    return new ImageBlock(element);
                default:
                    return new ParagraphBlock(element);
            }
        });
        console.log(this.blocks);
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
                this.#initBlocks();
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

}

export default BibeEditor;