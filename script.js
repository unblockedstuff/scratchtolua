document.addEventListener('DOMContentLoaded', () => {
    let variables = ['my variable'];
    const categories = {
        motion: [
            { text: 'move {} steps', inputs: [{ type: 'number', value: 10 }] },
            { text: 'turn {} degrees', inputs: [{ type: 'number', value: 15 }] },
            { text: 'go to x: {} y: {}', inputs: [{ type: 'number', value: 0 }, { type: 'number', value: 0 }] },
        ],
        events: [
            { text: 'when flag clicked' },
            { text: 'when sprite clicked' },
        ],
        control: [
            { text: 'repeat {}', inputs: [{ type: 'number', value: 10 }], nested: true },
            { text: 'if {} then', inputs: [{ type: 'boolean' }], nested: true },
            { text: 'if {} then else', inputs: [{ type: 'boolean' }], nested: true, nested2: true },
            { text: 'wait {} secs', inputs: [{ type: 'number', value: 1 }] },
            { text: 'forever', nested: true },
        ],
        looks: [
            { text: 'say {}', inputs: [{ type: 'text', value: 'Hello!' }] },
            { text: 'change costume to {}', inputs: [{ type: 'text', value: 'costume1' }] },
        ],
        variables: [
            { text: 'set {} to {}', inputs: [{ type: 'variable' }, { type: 'text', value: '0' }] },
            { text: 'change {} by {}', inputs: [{ type: 'variable' }, { type: 'number', value: 1 }] },
        ],
        operators: [
            { text: '{} + {}', inputs: [{ type: 'number' }, { type: 'number' }], output: 'number' },
            { text: '{} - {}', inputs: [{ type: 'number' }, { type: 'number' }], output: 'number' },
            { text: '{} * {}', inputs: [{ type: 'number' }, { type: 'number' }], output: 'number' },
            { text: '{} / {}', inputs: [{ type: 'number' }, { type: 'number' }], output: 'number' },
            { text: '{} < {}', inputs: [{ type: 'any' }, { type: 'any' }], output: 'boolean' },
            { text: '{} > {}', inputs: [{ type: 'any' }, { type: 'any' }], output: 'boolean' },
            { text: '{} = {}', inputs: [{ type: 'any' }, { type: 'any' }], output: 'boolean' },
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

    function createBlockElement(block) {
        const blockElement = document.createElement('div');
        blockElement.classList.add('block');
        blockElement.dataset.type = block.type;
        if (block.nested) blockElement.dataset.nested = true;
        if (block.nested2) blockElement.dataset.nested2 = true;
        if (block.output) blockElement.dataset.output = block.output;

        const parts = block.text.split('{}');
        parts.forEach((part, i) => {
            blockElement.appendChild(document.createTextNode(part));
            if (i < parts.length - 1) {
                const inputConfig = block.inputs[i];
                let inputElement;
                if (inputConfig.type === 'variable') {
                    inputElement = document.createElement('select');
                    variables.forEach(v => {
                        const option = document.createElement('option');
                        option.value = v;
                        option.textContent = v;
                        inputElement.appendChild(option);
                    });
                } else {
                    inputElement = document.createElement('input');
                    inputElement.type = inputConfig.type === 'number' ? 'number' : 'text';
                    inputElement.value = inputConfig.value || '';
                    inputElement.placeholder = inputConfig.type;
                }
                inputElement.addEventListener('drop', (e) => {
                    e.stopPropagation();
                    const droppedBlock = document.querySelector('.dragging');
                    if (droppedBlock && droppedBlock.dataset.output) {
                         e.preventDefault();
                        const placeholder = e.target;
                        placeholder.replaceWith(droppedBlock.cloneNode(true));
                    }
                });
                 inputElement.addEventListener('dragover', (e) => {
                    e.preventDefault();
                });
                blockElement.appendChild(inputElement);
            }
        });
        blockElement.draggable = true;
        return blockElement;
    }

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
            const blockElement = createBlockElement({ ...block, type: category });
            blockList.appendChild(blockElement);
        });
    }

    document.body.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('block')) {
            draggingBlock = e.target;
            e.target.classList.add('dragging');
        }
    });

    document.body.addEventListener('dragend', (e) => {
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
        if (draggingBlock && !e.target.closest('.block')) {
            const newBlock = draggingBlock.cloneNode(true);
            newBlock.classList.remove('dragging');

            let dropTarget = e.target;
            if(!dropTarget.classList.contains('script-area') && !dropTarget.classList.contains('nested')){
                 dropTarget = dropTarget.closest('.nested, .script-area');
            }

            if (dropTarget) {
                 if (newBlock.dataset.nested) {
                    const nestedContainer = document.createElement('div');
                    nestedContainer.classList.add('nested');
                    nestedContainer.dataset.slot = "1";
                    newBlock.appendChild(nestedContainer);
                }
                if (newBlock.dataset.nested2) {
                    const elseText = document.createTextNode("else");
                    newBlock.appendChild(elseText);
                    const nestedContainer2 = document.createElement('div');
                    nestedContainer2.classList.add('nested');
                    nestedContainer2.dataset.slot = "2";
                    newBlock.appendChild(nestedContainer2);
                }
                dropTarget.appendChild(newBlock);
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

    function getBlockText(element) {
        let text = '';
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (node.tagName === 'INPUT') {
                text += `(${node.value})`;
            } else if (node.tagName === 'SELECT') {
                text += `[${node.value}]`;
            } else if (node.classList.contains('block')) {
                text += getBlockText(node);
            }
        });
        return text.replace(/\s+/g, ' ').trim();
    }


    function updateTextRepresentation() {
        let text = '';
        let indentLevel = 0;

        function traverse(element) {
            for (const child of element.children) {
                if (child.classList.contains('block')) {
                    text += ' '.repeat(indentLevel * 2) + getBlockText(child) + '\n';
                    if (child.dataset.nested) {
                        indentLevel++;
                        traverse(child.querySelector('.nested[data-slot="1"]'));
                         if (child.dataset.nested2) {
                            text += ' '.repeat((indentLevel-1) * 2) + 'else\n';
                            traverse(child.querySelector('.nested[data-slot="2"]'));
                        }
                        indentLevel--;
                        text += ' '.repeat(indentLevel * 2) + 'end\n';
                    }
                }
            }
        }

        traverse(scriptArea);
        textArea.textContent = text;
    }

    document.getElementById('create-variable-btn').addEventListener('click', () => {
        const variableNameInput = document.getElementById('variable-name');
        const variableName = variableNameInput.value.trim();
        if (variableName && !variables.includes(variableName)) {
            variables.push(variableName);
            displayBlocks('variables');
            document.getElementById('variable-modal').style.display = 'none';
            variableNameInput.value = '';
            // Update existing variable dropdowns
            document.querySelectorAll('select').forEach(select => {
                if(Array.from(select.options).some(opt => variables.includes(opt.value))) {
                    const newOption = document.createElement('option');
                    newOption.value = variableName;
                    newOption.textContent = variableName;
                    select.appendChild(newOption);
                }
            });
        }
    });

    document.getElementById('cancel-variable-btn').addEventListener('click', () => {
        document.getElementById('variable-modal').style.display = 'none';
        document.getElementById('variable-name').value = '';
    });

    // Initial display
    displayBlocks('motion');
});
