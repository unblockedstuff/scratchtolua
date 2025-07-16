        let variables = [];
        let draggedBlock = null;
        let scriptBlocks = [];
        let draggedElement = null;
        let dropIndicator = null;

        // Create drop indicator
        function createDropIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'drop-indicator';
            return indicator;
        }

        function toggleCategory(header) {
            const category = header.parentElement;
            const allCategories = document.querySelectorAll('.category');
            
            allCategories.forEach(cat => {
                if (cat !== category) {
                    cat.classList.remove('active');
                }
            });
            
            category.classList.toggle('active');
        }

        function addVariable() {
            const input = document.getElementById('newVarName');
            const name = input.value.trim();
            
            if (name && !variables.includes(name)) {
                variables.push(name);
                updateVariableDropdowns();
                updateVariableList();
                input.value = '';
            }
        }

        function deleteVariable(name) {
            variables = variables.filter(v => v !== name);
            updateVariableDropdowns();
            updateVariableList();
        }

        function updateVariableDropdowns() {
            const dropdowns = document.querySelectorAll('.variable-dropdown');
            dropdowns.forEach(dropdown => {
                const currentValue = dropdown.value;
                dropdown.innerHTML = '<option value="">select variable</option>';
                variables.forEach(varName => {
                    const option = document.createElement('option');
                    option.value = varName;
                    option.textContent = varName;
                    if (varName === currentValue) {
                        option.selected = true;
                    }
                    dropdown.appendChild(option);
                });
            });
        }

        function updateVariableList() {
            const list = document.getElementById('variableList');
            list.innerHTML = '';
            variables.forEach(varName => {
                const item = document.createElement('div');
                item.className = 'variable-item';
                item.innerHTML = `
                    <span>${varName}</span>
                    <button class="delete-var-btn" onclick="deleteVariable('${varName}')">Delete</button>
                `;
                list.appendChild(item);
            });
        }

        function cloneBlock(originalBlock) {
            const clone = originalBlock.cloneNode(true);
            clone.removeAttribute('data-original');
            
            // Generate unique IDs for inputs
            const inputs = clone.querySelectorAll('input, select');
            inputs.forEach((input, index) => {
                input.id = `input_${Date.now()}_${index}`;
            });
            
            return clone;
        }

        function createContainerBlock(blockType, blockElement) {
            const container = document.createElement('div');
            container.className = 'script-block container-block';
            container.appendChild(blockElement);
            
            const content = document.createElement('div');
            content.className = 'container-content';
            content.setAttribute('data-container', 'true');
            container.appendChild(content);
            
            // Add end block for certain types
            if (['repeat', 'if', 'if_else', 'forever'].includes(blockType)) {
                const endBlock = document.createElement('div');
                endBlock.className = 'block control end-block';
                endBlock.textContent = blockType === 'if_else' ? 'end if' : 'end';
                endBlock.style.pointerEvents = 'none';
                container.appendChild(endBlock);
            }
            
            return container;
        }

        function isValidBlockOrder(blocks) {
            if (blocks.length === 0) return true;
            
            const firstBlock = blocks[0];
            const eventBlock = firstBlock.querySelector('[data-type="event"]');
            
            return eventBlock !== null;
        }

        function setupDragAndDrop() {
            const blocks = document.querySelectorAll('.sidebar .block');
            const scriptArea = document.getElementById('scriptArea');
            
            blocks.forEach(block => {
                block.addEventListener('dragstart', handleDragStart);
                block.addEventListener('dragend', handleDragEnd);
                block.draggable = true;
            });
            
            scriptArea.addEventListener('dragover', handleDragOver);
            scriptArea.addEventListener('drop', handleDrop);
            scriptArea.addEventListener('dragenter', handleDragEnter);
            scriptArea.addEventListener('dragleave', handleDragLeave);
        }

        function handleDragStart(e) {
            draggedBlock = e.target;
            draggedElement = cloneBlock(draggedBlock);
            draggedElement.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/html', draggedElement.outerHTML);
        }

        function handleDragEnd(e) {
            draggedBlock = null;
            draggedElement = null;
            if (dropIndicator) {
                dropIndicator.remove();
                dropIndicator = null;
            }
        }

        function handleDragEnter(e) {
            e.preventDefault();
            document.getElementById('scriptArea').classList.add('drag-over');
        }

        function handleDragLeave(e) {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                document.getElementById('scriptArea').classList.remove('drag-over');
            }
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            
            const scriptArea = document.getElementById('scriptArea');
            const afterElement = getDragAfterElement(scriptArea, e.clientY);
            
            if (!dropIndicator) {
                dropIndicator = createDropIndicator();
            }
            
            if (afterElement == null) {
                scriptArea.appendChild(dropIndicator);
            } else {
                scriptArea.insertBefore(dropIndicator, afterElement);
            }
            
            dropIndicator.classList.add('active');
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll(':scope > .script-block:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function handleDrop(e) {
            e.preventDefault();
            const scriptArea = document.getElementById('scriptArea');
            scriptArea.classList.remove('drag-over');
            
            if (draggedBlock) {
                const blockData = draggedBlock.dataset;
                const blockType = blockData.block;
                const blockCategory = blockData.type;
                
                // Clone the block
                const newBlock = cloneBlock(draggedBlock);
                
                // Create container for control blocks
                let blockToAdd;
                if (['repeat', 'if', 'if_else', 'forever'].includes(blockType)) {
                    blockToAdd = createContainerBlock(blockType, newBlock);
                } else {
                    blockToAdd = document.createElement('div');
                    blockToAdd.className = 'script-block';
                    blockToAdd.appendChild(newBlock);
                }
                
                // Add to script area
                if (dropIndicator && dropIndicator.parentNode) {
                    scriptArea.insertBefore(blockToAdd, dropIndicator);
                } else {
                    scriptArea.appendChild(blockToAdd);
                }
                
                // Update script blocks array
                updateScriptBlocks();
                
                // Remove placeholder text
                const placeholder = scriptArea.querySelector('.placeholder-text');
                if (placeholder) {
                    placeholder.remove();
                }
                
                scriptArea.classList.add('has-blocks');
                
                // Validate block order
                if (!isValidBlockOrder(scriptBlocks)) {
                    alert('The first block must be an event block (like "when flag clicked")');
                    blockToAdd.remove();
                    updateScriptBlocks();
                    if (scriptBlocks.length === 0) {
                        scriptArea.classList.remove('has-blocks');
                        scriptArea.innerHTML = '<div class="placeholder-text">Drag blocks here to start coding!<br>Start with an event block (like "when flag clicked")</div>';
                    }
                }
            }
            
            if (dropIndicator) {
                dropIndicator.remove();
                dropIndicator = null;
            }
        }

        function updateScriptBlocks() {
            const scriptArea = document.getElementById('scriptArea');
            scriptBlocks = [...scriptArea.querySelectorAll('.script-block')];
        }

        function showTextMode() {
            const code = generateCode();
            document.getElementById('codeOutput').textContent = code;
            document.getElementById('overlay').classList.add('active');
            document.getElementById('textOutput').classList.add('active');
        }

        function hideTextMode() {
            document.getElementById('overlay').classList.remove('active');
            document.getElementById('textOutput').classList.remove('active');
        }

        function generateCode() {
            const scriptArea = document.getElementById('scriptArea');
            const blocks = scriptArea.querySelectorAll('.script-block');
            
            if (blocks.length === 0) {
                return '// No blocks to convert';
            }
            
            let code = '';
            let indentLevel = 0;
            
            blocks.forEach((block, index) => {
                const blockElement = block.querySelector('.block');
                if (!blockElement) return;
                
                const blockType = blockElement.dataset.block;
                const blockCategory = blockElement.dataset.type;
                
                const indent = '  '.repeat(indentLevel);
                
                if (blockCategory === 'event') {
                    code += `${indent}${blockElement.textContent.trim()}\n`;
                } else if (blockCategory === 'motion') {
                    code += `${indent}${getBlockText(blockElement)}\n`;
                } else if (blockCategory === 'control') {
                    if (['repeat', 'if', 'if_else', 'forever'].includes(blockType)) {
                        code += `${indent}${getBlockText(blockElement)}\n`;
                        
                        // Process container content
                        const containerContent = block.querySelector('.container-content');
                        if (containerContent) {
                            const innerBlocks = containerContent.querySelectorAll('.script-block');
                            indentLevel++;
                            innerBlocks.forEach(innerBlock => {
                                const innerBlockElement = innerBlock.querySelector('.block');
                                if (innerBlockElement) {
                                    code += `${'  '.repeat(indentLevel)}${getBlockText(innerBlockElement)}\n`;
                                }
                            });
                            indentLevel--;
                        }
                        
                        code += `${indent}end\n`;
                    } else {
                        code += `${indent}${getBlockText(blockElement)}\n`;
                    }
                } else {
                    code += `${indent}${getBlockText(blockElement)}\n`;
                }
            });
            
            return code || '// No valid blocks found';
        }

        function getBlockText(blockElement) {
            let text = blockElement.textContent;
            
            // Replace input values
            const inputs = blockElement.querySelectorAll('input');
            inputs.forEach(input => {
                const value = input.value || input.placeholder || '';
                text = text.replace(input.outerHTML, `(${value})`);
            });
            
            // Replace select values
            const selects = blockElement.querySelectorAll('select');
            selects.forEach(select => {
                const value = select.value || select.options[0]?.textContent || '';
                text = text.replace(select.outerHTML, `[${value}]`);
            });
            
            return text.trim();
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            setupDragAndDrop();
            updateVariableDropdowns();
            
            // Add some default variables
            variables = ['score', 'lives', 'speed'];
            updateVariableDropdowns();
            updateVariableList();
            
            // Handle container drop zones
            setupContainerDropZones();
            
            // Add click handlers for removing blocks
            setupBlockRemoval();
        });

        function setupContainerDropZones() {
            // Handle container-specific drag and drop
            document.addEventListener('dragover', function(e) {
                const container = e.target.closest('.container-content');
                if (container && draggedBlock) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Show drop indicator in container
                    const afterElement = getDragAfterElementInContainer(container, e.clientY);
                    
                    if (!dropIndicator) {
                        dropIndicator = createDropIndicator();
                    }
                    
                    if (afterElement == null) {
                        container.appendChild(dropIndicator);
                    } else {
                        container.insertBefore(dropIndicator, afterElement);
                    }
                    
                    dropIndicator.classList.add('active');
                    container.classList.add('drag-over');
                }
            });
            
            document.addEventListener('dragenter', function(e) {
                const container = e.target.closest('.container-content');
                if (container && draggedBlock) {
                    e.preventDefault();
                    e.stopPropagation();
                    container.classList.add('drag-over');
                }
            });
            
            document.addEventListener('dragleave', function(e) {
                const container = e.target.closest('.container-content');
                if (container && (!container.contains(e.relatedTarget) || e.relatedTarget.classList.contains('drop-indicator'))) {
                    container.classList.remove('drag-over');
                    
                    // Remove drop indicator if leaving container
                    if (dropIndicator && dropIndicator.parentNode === container) {
                        dropIndicator.classList.remove('active');
                    }
                }
            });
            
            document.addEventListener('drop', function(e) {
                const container = e.target.closest('.container-content');
                if (container && draggedBlock) {
                    e.preventDefault();
                    e.stopPropagation();
                    container.classList.remove('drag-over');
                    
                    // Don't allow event blocks inside containers
                    if (draggedBlock.dataset.type === 'event') {
                        if (dropIndicator) {
                            dropIndicator.remove();
                            dropIndicator = null;
                        }
                        return;
                    }
                    
                    const blockData = draggedBlock.dataset;
                    const blockType = blockData.block;
                    
                    // Clone the block
                    const newBlock = cloneBlock(draggedBlock);
                    
                    // Create container for control blocks
                    let blockToAdd;
                    if (['repeat', 'if', 'if_else', 'forever'].includes(blockType)) {
                        blockToAdd = createContainerBlock(blockType, newBlock);
                    } else {
                        blockToAdd = document.createElement('div');
                        blockToAdd.className = 'script-block';
                        blockToAdd.appendChild(newBlock);
                    }
                    
                    // Insert at the correct position
                    if (dropIndicator && dropIndicator.parentNode === container) {
                        container.insertBefore(blockToAdd, dropIndicator);
                    } else {
                        container.appendChild(blockToAdd);
                    }
                    
                    setupBlockRemoval();
                    
                    // Remove drop indicator
                    if (dropIndicator) {
                        dropIndicator.remove();
                        dropIndicator = null;
                    }
                }
            });
        }

        function getDragAfterElementInContainer(container, y) {
            const draggableElements = [...container.querySelectorAll('.script-block:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function setupBlockRemoval() {
            const scriptArea = document.getElementById('scriptArea');
            
            scriptArea.addEventListener('contextmenu', function(e) {
                const blockElement = e.target.closest('.script-block');
                if (blockElement) {
                    e.preventDefault();
                    if (confirm('Remove this block?')) {
                        blockElement.remove();
                        updateScriptBlocks();
                        
                        // Check if script area is empty
                        const remainingBlocks = scriptArea.querySelectorAll('.script-block');
                        if (remainingBlocks.length === 0) {
                            scriptArea.classList.remove('has-blocks');
                            scriptArea.innerHTML = '<div class="placeholder-text">Drag blocks here to start coding!<br>Start with an event block (like "when flag clicked")</div>';
                        }
                    }
                }
            });
            
            // Add double-click to remove as well
            scriptArea.addEventListener('dblclick', function(e) {
                const blockElement = e.target.closest('.script-block');
                if (blockElement && blockElement.querySelector('.block:not(.end-block)')) {
                    if (confirm('Remove this block?')) {
                        blockElement.remove();
                        updateScriptBlocks();
                        
                        // Check if script area is empty
                        const remainingBlocks = scriptArea.querySelectorAll('.script-block');
                        if (remainingBlocks.length === 0) {
                            scriptArea.classList.remove('has-blocks');
                            scriptArea.innerHTML = '<div class="placeholder-text">Drag blocks here to start coding!<br>Start with an event block (like "when flag clicked")</div>';
                        }
                    }
                }
            });
        }

        // Enhanced code generation with better formatting
        function generateCode() {
            const scriptArea = document.getElementById('scriptArea');
            const blocks = scriptArea.querySelectorAll('.script-block');
            
            if (blocks.length === 0) {
                return '// No blocks to convert';
            }
            
            let code = '';
            
            function processBlock(block, indentLevel = 0) {
                const blockElement = block.querySelector('.block:not(.end-block)');
                if (!blockElement) return '';
                
                const blockType = blockElement.dataset.block;
                const blockCategory = blockElement.dataset.type;
                const indent = '  '.repeat(indentLevel);
                
                let blockCode = '';
                
                if (blockCategory === 'event') {
                    blockCode = `${indent}${getBlockText(blockElement)}\n`;
                } else if (blockCategory === 'control') {
                    if (['repeat', 'if', 'if_else', 'forever'].includes(blockType)) {
                        blockCode = `${indent}${getBlockText(blockElement)}\n`;
                        
                        // Process container content
                        const containerContent = block.querySelector('.container-content');
                        if (containerContent) {
                            const innerBlocks = containerContent.querySelectorAll(':scope > .script-block');
                            innerBlocks.forEach(innerBlock => {
                                blockCode += processBlock(innerBlock, indentLevel + 1);
                            });
                        }
                        
                        // Add else block for if_else
                        if (blockType === 'if_else') {
                            blockCode += `${indent}else\n`;
                            // In a real implementation, you'd handle else content here
                        }
                        
                        blockCode += `${indent}end\n`;
                    } else {
                        blockCode = `${indent}${getBlockText(blockElement)}\n`;
                    }
                } else {
                    blockCode = `${indent}${getBlockText(blockElement)}\n`;
                }
                
                return blockCode;
            }
            
            blocks.forEach(block => {
                code += processBlock(block);
            });
            
            return code || '// No valid blocks found';
        }

        // Enhanced block text extraction
        function getBlockText(blockElement) {
            let text = '';
            const nodes = blockElement.childNodes;
            
            nodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'INPUT') {
                        const value = node.value || node.placeholder || '';
                        text += `(${value})`;
                    } else if (node.tagName === 'SELECT') {
                        const value = node.value || node.options[0]?.textContent || '';
                        text += `[${value}]`;
                    } else {
                        text += node.textContent;
                    }
                }
            });
            
            return text.trim();
        }

        // Add keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 't':
                        e.preventDefault();
                        showTextMode();
                        break;
                    case 'n':
                        e.preventDefault();
                        // Clear all blocks
                        if (confirm('Clear all blocks?')) {
                            const scriptArea = document.getElementById('scriptArea');
                            scriptArea.classList.remove('has-blocks');
                            scriptArea.innerHTML = '<div class="placeholder-text">Drag blocks here to start coding!<br>Start with an event block (like "when flag clicked")</div>';
                            scriptBlocks = [];
                        }
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                hideTextMode();
            }
        });

        // Add visual feedback for valid drop zones
        function highlightDropZones() {
            const containers = document.querySelectorAll('.container-content');
            containers.forEach(container => {
                container.addEventListener('dragenter', function(e) {
                    if (draggedBlock && draggedBlock.dataset.type !== 'event') {
                        this.style.background = 'rgba(0, 184, 148, 0.1)';
                        this.style.borderColor = '#00b894';
                    }
                });
                
                container.addEventListener('dragleave', function(e) {
                    if (!this.contains(e.relatedTarget)) {
                        this.style.background = 'rgba(255, 255, 255, 0.05)';
                        this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                });
            });
        }

        // Add block validation feedback
        function validateScript() {
            const scriptArea = document.getElementById('scriptArea');
            const blocks = scriptArea.querySelectorAll('.script-block');
            
            if (blocks.length === 0) return true;
            
            // Check if first block is an event block
            const firstBlock = blocks[0];
            const firstBlockElement = firstBlock.querySelector('.block');
            
            if (!firstBlockElement || firstBlockElement.dataset.type !== 'event') {
                // Add visual feedback
                firstBlock.style.border = '2px solid #e17055';
                setTimeout(() => {
                    firstBlock.style.border = '';
                }, 2000);
                return false;
            }
            
            return true;
        }

        // Add undo/redo functionality
        let actionHistory = [];
        let historyIndex = -1;
        
        function saveState() {
            const scriptArea = document.getElementById('scriptArea');
            const state = scriptArea.innerHTML;
            
            // Remove states after current index
            actionHistory = actionHistory.slice(0, historyIndex + 1);
            actionHistory.push(state);
            historyIndex++;
            
            // Limit history size
            if (actionHistory.length > 20) {
                actionHistory.shift();
                historyIndex--;
            }
        }
        
        function undo() {
            if (historyIndex > 0) {
                historyIndex--;
                const scriptArea = document.getElementById('scriptArea');
                scriptArea.innerHTML = actionHistory[historyIndex];
                updateScriptBlocks();
                setupBlockRemoval();
            }
        }
        
        function redo() {
            if (historyIndex < actionHistory.length - 1) {
                historyIndex++;
                const scriptArea = document.getElementById('scriptArea');
                scriptArea.innerHTML = actionHistory[historyIndex];
                updateScriptBlocks();
                setupBlockRemoval();
            }
        }

        // Add tooltips for blocks
        function addTooltips() {
            const tooltips = {
                'when_flag_clicked': 'Starts the script when the green flag is clicked',
                'when_sprite_clicked': 'Starts the script when the sprite is clicked',
                'move': 'Moves the sprite forward by the specified number of steps',
                'turn': 'Turns the sprite by the specified number of degrees',
                'go_to': 'Moves the sprite to specific x,y coordinates',
                'repeat': 'Repeats the blocks inside the specified number of times',
                'if': 'Runs the blocks inside only if the condition is true',
                'if_else': 'Runs different blocks based on whether the condition is true or false',
                'wait': 'Pauses the script for the specified number of seconds',
                'forever': 'Repeats the blocks inside forever',
                'say': 'Makes the sprite say the specified message',
                'switch_costume': 'Changes the sprite\'s appearance to the selected costume',
                'set_var': 'Sets a variable to the specified value',
                'change_var': 'Changes a variable by the specified amount',
                'add': 'Adds two numbers together',
                'subtract': 'Subtracts the second number from the first',
                'equals': 'Checks if two values are equal',
                'less_than': 'Checks if the first number is less than the second',
                'greater_than': 'Checks if the first number is greater than the second'
            };
            
            document.querySelectorAll('.block').forEach(block => {
                const blockType = block.dataset.block;
                if (tooltips[blockType]) {
                    block.title = tooltips[blockType];
                }
            });
        }

        // Initialize tooltips when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            addTooltips();
        });
