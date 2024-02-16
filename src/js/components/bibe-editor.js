import Debouncer from '../functions/debouncer';

// Base Block class
class Block {
    constructor(element) {
        this.element = element;
        this.content = element.innerHTML;
        this.isHovered = false;
        this.update_rect();
    }

    update_rect() {
        this.rect = this.element.getBoundingClientRect();
    }
}

// Specific Block classes
class ParagraphBlock extends Block {
    constructor(element) {
        super(element);
        this.alignment = 'left'; // Initial state
    }

}
class TitleBlock extends Block {
    constructor(element) {
        super(element);
        this.level = parseInt(element.tagName[1]);
    }

}
class ListBlock extends Block {
    constructor(element) {
        super(element);
        this.type = element.tagName === 'UL' ? 'unordered' : 'ordered';
    }

}
class QuoteBlock extends Block {
    constructor(element) {
        super(element);
        this.author = element.querySelector('cite')?.textContent;
    }

}
class ImageBlock extends Block {
    constructor(element) {
        super(element);

    }
}
class TextBlock extends Block {
    constructor(element) {
        super(element);
    }

}

// Base Command class
class Command {
    constructor(block) {
        this.block = block;
    }

    execute() {
        throw new Error("Execute method must be implemented");
    }

    undo() {
        throw new Error("Undo method must be implemented");
    }
}

// Specific Command classes for inline transformations
class BoldCommand extends Command {
    execute() {
        document.execCommand('bold', false, null);
    }

    undo() {
        // Specific undo functionality for bold
    }
}

class ItalicCommand extends Command {
    execute() {
        document.execCommand('italic', false, null);
    }

    undo() {
        // Specific undo functionality for italic
    }
}

class BibeEditor {

    constructor(cssSelector) {
        this.container = document.querySelector(cssSelector);
        this.init(this.container);
        this.editor = null;
        this.content = null;
        this.anchor = null;
        this.block_menu = null;
        this.block_menu_visible = false;
        this.new_block_menu = null;
        this.anchorHandlePressed = false;
        this.blocks = [];
        this.editorPaddingTop = null; // Editor's top padding
        this.editorPaddingLeft = null; // Editor's left padding
        this.hoveredBlock = null;
        this.draggedBlock = null;
        this.selectedBlock = null;
    }

    init(container) {

        console.log(container);

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
                <div class="block_menu">
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
        }, 0);

    }

    change_block_type(blockElement, toType) {

        console.log(blockElement, toType);

        switch (toType) {
            case 'paragraph':
                blockElement.outerHTML = `<p class="bibe_block">${blockElement.innerHTML}</p>`;
            case 'title':
                blockElement.outerHTML = `<h2 class="bibe_block">${blockElement.innerHTML}</h2>`;
                break;
            case 'list':
            case 'ul':
                blockElement.outerHTML = `<ul class="bibe_block">
                    <li>${blockElement.innerHTML}</li>
                </ul>`;
            case 'ol':
                blockElement.outerHTML = `<ol class="bibe_block">
                    <li>${blockElement.innerHTML}</li>
                </ol>`;
            case 'quote':
                blockElement.outerHTML = `<blockquote class="bibe_block">${blockElement.innerHTML}</blockquote>`;
                break;
        }

        this.#initBlocks();

    }

    #initBlocks() {
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
                case 'IMG':
                    return new ImageBlock(element);
                default:
                    return new TextBlock(element);
            }
        });
    }

    #updateBlocks() {
        this.blocks.forEach((block) => {
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

        this.#setupDelegatedBlockEvents();

    }

    #initBlockMenu(container) {
        this.block_menu = container.querySelector('.block_menu');

        this.block_menu.addEventListener('click', e => {
            if (e.target.closest('.block_type')) {
                const blockType = e.target.closest('.block_type').dataset.type;
                this.change_block_type(this.selectedBlock.element, blockType);
            }
            if (e.target.closest('.delete')) {
                this.selectedBlock.element.remove();
                this.#initBlocks();
            }
            this.selectedBlock = null;
        });
    }

    #setupDelegatedBlockEvents() {
        this.content.addEventListener('mouseenter', e => {
            const blockElement = e.target.closest('.bibe_block');
            if (blockElement) {
                const block = this.blocks.find(b => b.element === blockElement);
                if (block) {
                    block.isHovered = true;
                    this.hoveredBlock = block;
                    this.#showAnchor(block.element);
                }
            }
        }, true); // Use capture phase

        this.content.addEventListener('mouseleave', e => {
            const blockElement = e.target.closest('.bibe_block');
            if (blockElement) {
                const block = this.blocks.find(b => b.element === blockElement);
                if (block) {
                    block.isHovered = false;
                    this.hoveredBlock = null;
                    this.#hideAnchor();
                }
            }
        }, true); // Use capture phase
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
                // console.log(nearestBlock.block);
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

    #newBlockMenu() {
        console.log('add block');
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

}

export default BibeEditor;