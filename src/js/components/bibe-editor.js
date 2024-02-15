import Debouncer from '../functions/debouncer';

class BibeEditor {

    constructor(cssSelector) {
        this.container = document.querySelector(cssSelector);
        this.init(this.container);
        this.editor = null;
        this.content = null;
        this.anchor = null;
        this.blocks = [];
        this.editorPaddingTop = null; // Editor's top padding
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

            this.editor = container.querySelector('.bibe_editor');
            this.content = container.querySelector('.content');
            this.#updateBlocks();
            this.#initAnchor(container);
        }, 0);

    }

    #initAnchor(container) {

        this.anchor = container.querySelector('.anchor');

        this.anchor.addEventListener('click', e => {
            if (e.target.closest('.add_block')) {
                this.#newBlockMenu();
            }
            if (e.target.closest('.handle')) {
                this.#showBlockMenu();
            }
        });

        this.anchor.addEventListener('mousedown', e => {
            if (e.target.closest('.handle')) {
                // prevent text selection
                e.preventDefault();

                this.editor.addEventListener('mousemove', this.#handleMouseMove);
                this.editor.addEventListener('mouseup', this.#handleMouseUp, { once: true });
            }
        });

        this.#setupDelegatedBlockEvents();

    }

    #setupDelegatedBlockEvents() {
        this.content.addEventListener('mouseenter', e => {
            const blockElement = e.target.closest('.bibe_block');
            if (blockElement) {
                const block = this.blocks.find(b => b.element === blockElement);
                if (block) {
                    block.isHovered = true;
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
                    this.#hideAnchor();
                }
            }
        }, true); // Use capture phase
    }

    #showAnchor(block) {
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
    }

    #handleMouseMove = (e) => {
        this.#updateBlocks();
        this.blocks.forEach(block => {
            block.element.style.borderTop = '';
            block.element.style.borderBottom = '';
        });

        const nearestBlock = this.blocks.reduce((nearest, block) => {
            const mouseY = e.clientY;
            const blockMiddleY = block.rect.top + (block.rect.height / 2);
            if (!nearest.block || (Math.abs(mouseY - blockMiddleY) < Math.abs(mouseY - nearest.middleY))) {
                return { block: block.element, middleY: blockMiddleY };
            }
            return nearest;
        }, {});

        if (nearestBlock.block) {
            const mouseY = e.clientY;
            const positionAbove = mouseY < nearestBlock.middleY;
            nearestBlock.block.style[positionAbove ? 'borderTop' : 'borderBottom'] = '3px solid deepskyblue';
        }
    }

    #handleMouseUp = () => {
        window.removeEventListener('mousemove', this.#handleMouseMove);
        this.blocks.forEach(block => {
            block.element.style.borderTop = '';
            block.element.style.borderBottom = '';
        });
    }

    #updateBlocks() {
        this.blocks = [...this.content.children].map(block => ({
            element: block,
            rect: block.getBoundingClientRect(),
            isHovered: false // Initial state
        }));
    }

    #newBlockMenu() {
        console.log('add block');
    }

    #showBlockMenu() {
        console.log('show block menu');
    }

}

export default BibeEditor;