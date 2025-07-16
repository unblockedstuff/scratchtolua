document.addEventListener('DOMContentLoaded', () => {
    const categories = {
        motion: [
            { text: 'move (10) steps', type: 'motion' },
            { text: 'turn (15) degrees', type: 'motion' },
            { text: 'go to (x: y:)', type: 'motion' },
        ],
        events: [
            { text: 'when flag clicked', type: 'events' },
            { text: 'when sprite clicked', type: 'events' },
        ],
        control: [
            { text: 'repeat', type: 'control', nested: true },
            { text: 'if', type: 'control', nested: true },
            { text: 'if else', type: 'control', nested: true },
            { text: 'wait (1) sec', type: 'control' },
            { text: 'forever', type: 'control', nested: true },
        ],
        looks: [
            { text: 'say (Hello!)', type: 'looks' },
            { text: 'change costume to', type: 'looks' },
        ],
        variables: [
            { text: 'set [var] to (value)', type: 'variables' },
            { text: 'change [var] by (1)', type: 'variables' },
        ],
        operators: [
            { text: '<>', type: 'operators' },
            { text: '=', type: 'operators' },
            { text: '+', type: 'operators' },
            { text: '-', type: 'operators' },
            { text: '*', type: 'operators' },
            { text: '/', type: 'operators' },
        ],
    };

    const sidebar = document.querySelector('.sidebar');
    const blockList = document.querySelector('.block-list');
    const workspace = document.querySelector('.workspace');
    const scriptArea = document.querySelector('.script-area');
    const textArea = document.querySelector('.text-area');
    const textModeBtn = document.getElementById('text-mode-btn');

    let draggingBlock = null;

    sidebar.addEventListener('click', (e) => {
        if (e.target.classList.contains('category')) {
            const category = e.target.dataset.category;
            displayBlocks(category);
        }
    });

    function displayBlocks(category) {
        blockList.innerHTML = '';
        if (category === 'variables') {
            const createVariableBtn = document.createElement('button');
            createVariableBtn.textContent = 'Create Variable';
            createVariableBtn.addEventListener('click', () => {
                document.getElementById('variable-modal').style.display = 'flex';
            });
            blockList.appendChild(createVariableBtn);
        }
        categories[category].forEach(block => {
            const blockElement = document.createElement('div');
            blockElement.classList.add('block');
            blockElement.textContent = block.text;
            blockElement.dataset.type = block.type;
            if (block.nested) {
                blockElement.dataset.nested = true;
            }
            blockElement.draggable = true;
            blockList.appendChild(blockElement);
        });
    }

    blockList.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('block')) {
            draggingBlock = e.target;
            e.target.classList.add('dragging');
        }
    });

    blockList.addEventListener('dragend', (e) => {
        if (draggingBlock) {
            draggingBlock.classList.remove('dragging');
            draggingBlock = null;
        }
    });

    workspace.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggingBlock) {
            const newBlock = draggingBlock.cloneNode(true);
            newBlock.classList.remove('dragging');
            if (e.target.closest('.script-area')) {
                if (newBlock.dataset.nested) {
                    const nestedContainer = document.createElement('div');
                    nestedContainer.classList.add('nested');
                    newBlock.appendChild(nestedContainer);
                }
                scriptArea.appendChild(newBlock);
            }
        }
    });

    textModeBtn.addEventListener('click', () => {
        const isTextMode = textArea.style.display === 'block';
        if (isTextMode) {
            textArea.style.display = 'none';
            scriptArea.style.display = 'block';
            textModeBtn.textContent = 'Text Mode';
        } else {
            textArea.style.display = 'block';
            scriptArea.style.display = 'none';
            textModeBtn.textContent = 'Block Mode';
            updateTextRepresentation();
        }
    });

    function updateTextRepresentation() {
        let text = '';
        let indentLevel = 0;

        function traverse(element) {
            for (const child of element.children) {
                if (child.classList.contains('block')) {
                    text += ' '.repeat(indentLevel * 2) + child.textContent.trim() + '\n';
                    if (child.dataset.nested) {
                        indentLevel++;
                        traverse(child.querySelector('.nested'));
                        indentLevel--;
                    }
                }
            }
        }

        traverse(scriptArea);
        textArea.textContent = text;
    }

    document.getElementById('create-variable-btn').addEventListener('click', () => {
        const variableName = document.getElementById('variable-name').value;
        if (variableName) {
            categories.variables.push({ text: `set [${variableName}] to (value)`, type: 'variables' });
            categories.variables.push({ text: `change [${variableName}] by (1)`, type: 'variables' });
            displayBlocks('variables');
            document.getElementById('variable-modal').style.display = 'none';
            document.getElementById('variable-name').value = '';
        }
    });

    document.getElementById('cancel-variable-btn').addEventListener('click', () => {
        document.getElementById('variable-modal').style.display = 'none';
        document.getElementById('variable-name').value = '';
    });
});
