// Stock management module
import { supabase, getUser } from '../lib/supabaseClient.js';
import { db, hydrate } from './database.js';
import { getCurrentUser, checkTabAccess, isSuperUser } from './auth.js';
import { addColumnIfExists } from './utils.js';

// Guard util para estoque: usa tab_access OU bypass admin
async function canSeeStock() {
  try {
    if (typeof isSuperUser === 'function' && isSuperUser(getCurrentUser()?.role)) return true;
    if (typeof checkTabAccess === 'function') {
      return await checkTabAccess('estoque', 'view');
    }
  } catch (_) {}
  return false;
}

export async function renderStockList() {
    if (!document.getElementById('stock-list')) return;
    const stockList = document.getElementById('stock-list');
    
    // Usar canSeeStock com bypass admin
    if (!(await canSeeStock())) {
        stockList.innerHTML = '<p>Você não tem permissão para visualizar o estoque.</p>';
        return;
    }

    stockList.innerHTML = '';
    
    if (db.stockItems.length === 0) {
        stockList.innerHTML = '<p>Nenhum item no estoque.</p>';
        return;
    }
    
    // Group items by category
    const categories = {};
    safeArray(db.stockItems).forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });
    
    const categoryNameMap = { 
        'papelaria': 'Papelaria',
        'testes': 'Testes Neuropsicológicos',
        'brinquedos': 'Brinquedos Terapêuticos',
        'jogos': 'Jogos e Quebra-cabeças',
        'tecnologia': 'Equipamentos Tecnológicos',
        'consumiveis': 'Materiais Consumíveis',
        'outros': 'Outros'
    };
    
    // Sort categories alphabetically for consistent display
    const sortedCategoryKeys = Object.keys(categories).sort((a, b) => {
        const nameA = categoryNameMap[a] || a;
        const nameB = categoryNameMap[b] || b;
        return nameA.localeCompare(nameB);
    });

    safeArray(sortedCategoryKeys).forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'stock-category';
        
        // Count normal and low stock items in category
        const lowStockInCategory = categories[category].filter(item => {
            return item.quantity > 0 && item.quantity <= item.minStock;
        }).length;
        const outOfStockInCategory = categories[category].filter(item => {
            return item.quantity === 0;
        }).length;
        const totalInCategory = categories[category].length;
        
        let categorySummaryHtml = `
            <span class="category-summary">
                <span class="category-total">${totalInCategory} itens</span>
        `;
        if (outOfStockInCategory > 0) {
            categorySummaryHtml += `<span class="category-low-stock out-of-stock-summary">🚫 ${outOfStockInCategory} sem estoque</span>`;
        }
        if (lowStockInCategory > 0) {
            categorySummaryHtml += `<span class="category-low-stock low-stock-summary">⚠️ ${lowStockInCategory} baixo estoque</span>`;
        }
        categorySummaryHtml += `</span>`;
        
        categorySection.innerHTML = `
            <h3>
                <i class="fa-solid fa-tag"></i>
                ${categoryNameMap[category] || category}
                ${categorySummaryHtml}
            </h3>
        `;
        
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'stock-items-grid';
        
        // Sort items within each category by name
        const sortedItemsInCategory = [...categories[category]].sort((a, b) => a.name.localeCompare(b.name));

        safeArray(sortedItemsInCategory).forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.id = `stock-item-card-${item.id}`; // Add ID for global search
            
            // Display quantities directly in units
            const displayQuantity = item.quantity;
            const displayUnit = 'unidade';
            
            const isLowStock = item.quantity > 0 && item.quantity <= item.minStock;
            const isOutOfStock = item.quantity === 0;
            const stockStatus = isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'normal-stock';
            
            itemCard.className = `stock-item-card ${stockStatus}`;
            
            let stockBadge = '';
            if (isOutOfStock) {
                stockBadge = '<span class="stock-status-badge out-of-stock">🚫 SEM ESTOQUE</span>';
            } else if (isLowStock) {
                stockBadge = '<span class="stock-status-badge low-stock">⚠️ ESTOQUE BAIXO</span>';
            } else {
                stockBadge = '<span class="stock-status-badge normal-stock">✅ ESTOQUE OK</span>';
            }
            
            itemCard.innerHTML = `
                <div class="stock-item-header">
                    <h4>${item.name}</h4>
                    <div class="stock-info">
                        <span class="stock-quantity ${isLowStock ? 'low' : ''} ${isOutOfStock ? 'empty' : ''}">${displayQuantity} ${displayUnit}s</span>
                    </div>
                </div>
                <div class="stock-status-container">
                    ${stockBadge}
                </div>
                <div class="stock-item-details">
                    ${item.description ? `<p class="stock-description">${item.description}</p>` : ''}
                    <div class="stock-meta">
                        <small>Estoque mínimo: ${item.minStock} unidades</small>
                        <small>Valor unitário: R$ ${fmtMoney(item.unitValue).replace('.', ',')}</small>
                        <small>Valor total para ${displayQuantity} unidades: R$ ${fmtMoney(item.quantity * item.unitValue).replace('.', ',')}</small>
                        ${isLowStock && !isOutOfStock ? `<span class="stock-deficit">Faltam ${item.minStock - item.quantity} unidades para atingir o mínimo.</span>` : ''}
                    </div>
                </div>
                <div class="stock-item-actions">
                    <button class="btn-stock-add" onclick="adjustStock(${item.id}, 'add')">
                        <i class="fa-solid fa-plus"></i> Adicionar
                    </button>
                    <button class="btn-stock-remove" onclick="adjustStock(${item.id}, 'remove')" ${item.quantity === 0 ? 'disabled' : ''}>
                        <i class="fa-solid fa-minus"></i> Remover
                    </button>
                    <button class="btn-stock-delete" onclick="showDeleteStockItemConfirmation(${item.id})">
                        <i class="fa-solid fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            
            itemsGrid.appendChild(itemCard);
        });
        
        categorySection.appendChild(itemsGrid);
        stockList.appendChild(categorySection);
    });
}

export async function renderStockMovements(selectedMonthYear = null) {
    const stockMovements = document.getElementById('stock-movements');
    if (!stockMovements) return;

    // Usar canSeeStock com bypass admin
    if (!(await canSeeStock())) {
        stockMovements.innerHTML = '<p>Você não tem permissão para visualizar movimentações de estoque.</p>';
        return;
    }
    
    stockMovements.innerHTML = '';
    
    let filteredMovements = db.stockMovements;
    
    // Filter by month if selectedMonthYear is provided
    if (selectedMonthYear) {
        const [targetYear, targetMonth] = selectedMonthYear.split('-').map(Number);
        filteredMovements = db.stockMovements.filter(movement => {
            const movementDate = new Date(movement.date);
            return movementDate.getMonth() === (targetMonth - 1) && movementDate.getFullYear() === targetYear;
        });
    }
    
    // Sort movements by date (newest first)
    const sortedMovements = [...filteredMovements].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate month summary
    let monthEntries = 0;
    let monthExits = 0;
    let monthEntriesValue = 0;
    let monthExitsValue = 0;
    
    safeArray(filteredMovements).forEach(movement => {
        const movementValue = (movement.quantity || 0) * (movement.itemUnitValue || 0);
        if (movement.type === 'entrada') {
            monthEntries++;
            monthEntriesValue += movementValue;
        } else if (movement.type === 'saida') {
            monthExits++;
            monthExitsValue += movementValue;
        }
    });
    
    // Add month summary if filtering by month or if there are any movements to show a total summary
    if (selectedMonthYear || db.stockMovements.length > 0) {
        const summaryCard = document.createElement('div');
        summaryCard.className = 'stock-month-summary';
        
        const summaryTitle = selectedMonthYear ? 'Resumo do Período' : 'Resumo Geral';

        summaryCard.innerHTML = `
            <h4>${summaryTitle}</h4>
            <div class="summary-grid">
                <div class="summary-item entrada">
                    <span class="summary-label">📥 Entradas</span>
                    <span class="summary-count">${monthEntries} movimentações</span>
                    <span class="summary-value">R$ ${fmtMoney(monthEntriesValue).replace('.', ',')}</span>
                </div>
                <div class="summary-item saida">
                    <span class="summary-label">📤 Saídas</span>
                    <span class="summary-count">${monthExits} movimentações</span>
                    <span class="summary-value">R$ ${fmtMoney(monthExitsValue).replace('.', ',')}</span>
                </div>
                <div class="summary-item total">
                    <span class="summary-label">💰 Saldo Líquido</span>
                    <span class="summary-count">${monthEntries + monthExits} total</span>
                    <span class="summary-value">R$ ${fmtMoney(monthEntriesValue - monthExitsValue).replace('.', ',')}</span>
                </div>
            </div>
        `;
        stockMovements.appendChild(summaryCard);
    }

    if (filteredMovements.length === 0) {
        if (selectedMonthYear) {
            stockMovements.innerHTML += '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">Nenhuma movimentação registrada para o período selecionado.</p>';
        } else {
            stockMovements.innerHTML += '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">Nenhuma movimentação registrada.</p>';
        }
        return;
    }
    
    const displayLimit = selectedMonthYear ? sortedMovements.length : 20;
    safeArray(sortedMovements.slice(0, displayLimit)).forEach(movement => { // Show all movements for selected month, last 20 for all
        const movementCard = document.createElement('div');
        movementCard.className = `stock-movement-card ${movement.type}`;
        
        // Display quantity correctly, assuming all quantities are now in 'unidade'
        const displayQuantity = movement.quantity;
        const displayUnit = 'unidade';
        const movementValue = fmtMoney(movement.quantity * (movement.itemUnitValue || 0)).replace('.', ',');
        
        let typeText = '';
        let typeClass = '';
        let purchaseInfoHtml = '';

        if (movement.type === 'entrada') {
            typeText = '📥 Entrada';
            typeClass = 'entrada';
            // Show purchase info for entry movements if it exists
            if (movement.purchaseNotes || movement.purchaseFileData) {
                purchaseInfoHtml = `
                    <div class="purchase-info">
                        ${movement.purchaseNotes ? `<p class="purchase-notes"><strong>Notas da Compra:</strong> ${movement.purchaseNotes}</p>` : ''}
                        ${movement.purchaseFileData ? `<a href="${movement.purchaseFileData}" download="${movement.purchaseFileName}" class="btn-download-small"><i class="fa-solid fa-file-invoice-dollar"></i> Ver Comprovante</a>` : ''}
                    </div>
                `;
            }
        } else if (movement.type === 'saida') {
            typeText = '📤 Saída';
            typeClass = 'saida';
        } else if (movement.type === 'exclusao') {
            typeText = '🗑️ Exclusão';
            typeClass = 'exclusao'; // Add a new class for deletion movements
        }

        movementCard.innerHTML = `
            <div class="movement-info">
                <h5>${movement.itemName || 'Item removido'}</h5>
                <div class="movement-details">
                    <span class="movement-type ${typeClass}">${typeText}</span>
                    ${movement.type !== 'exclusao' ? `<span class="movement-quantity">${displayQuantity} ${displayUnit}s - R$ ${movementValue}</span>` : ''}
                </div>
                <p class="movement-reason">${movement.reason}</p>
                ${purchaseInfoHtml}
            </div>
            <div class="movement-meta">
                <div class="movement-date">${new Date(movement.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                <div class="movement-user">${movement.user}</div>
            </div>
        `;
        
        stockMovements.appendChild(movementCard);
    });
}

export async function updateStockSummary() {
    // Only Director and Finance can view stock summary
    const allowed = await canSeeStock();
    if (!allowed) {
        // Não quebra a UI: apenas limpa os cards/resumos
        const elements = ['total-items', 'low-stock-items', 'total-stock-value', 'total-categories'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '—';
        });
        return;
    }

    const totalItems = db.stockItems.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = db.stockItems.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length;
    const outOfStockItems = db.stockItems.filter(item => item.quantity === 0).length;
    const totalStockValue = db.stockItems.reduce((sum, item) => sum + (item.quantity * item.unitValue), 0);
    const totalCategories = new Set(db.stockItems.map(item => item.category)).size;

    const totalItemsElement = document.getElementById('total-items');
    const lowStockItemsElement = document.getElementById('low-stock-items');
    const totalStockValueElement = document.getElementById('total-stock-value');
    const totalCategoriesElement = document.getElementById('total-categories');
    const lowStockAlertCard = document.querySelector('.low-stock-alert-card');

    if (totalItemsElement) {
        totalItemsElement.textContent = String(totalItems);
    }
    
    if (lowStockItemsElement) {
        lowStockItemsElement.textContent = String(lowStockItems + outOfStockItems); // Count both low and out of stock
    }

    if (totalStockValueElement) {
        totalStockValueElement.textContent = `R$ ${fmtMoney(totalStockValue).replace('.', ',')}`;
    }

    if (totalCategoriesElement) {
        totalCategoriesElement.textContent = String(totalCategories);
    }
    
    // Update summary card colors based on stock status
    if (lowStockAlertCard) {
        if (lowStockItems + outOfStockItems > 0) {
            lowStockAlertCard.classList.add('warning-card');
        } else {
            lowStockAlertCard.classList.remove('warning-card');
        }
    }
}

export async function adjustStock(itemId, action) {
    // Only Director and Finance can adjust stock
    if (!(await canSeeStock())) { 
        showNotification('Você não tem permissão para ajustar o estoque.', 'error'); 
        return; 
    }

    const { data: stockItems } = await supabase.from('stock_items').select('*');
    const item = stockItems.find(item => item.id === itemId);
    if (!item) return;
    
    // Store the current adjustment data globally
    window.currentStockAdjustment = { itemId, action };
    
    // Update modal content based on action and item
    const modal = document.getElementById('modal-adjust-stock');
    const title = document.getElementById('adjust-stock-title');
    const quantityLabel = document.getElementById('adjust-stock-quantity-label');
    const unitInfo = document.getElementById('adjust-stock-unit-info');
    const submitBtn = document.getElementById('adjust-stock-submit-btn');
    const quantityInput = document.getElementById('adjust-stock-quantity');
    
    if (action === 'add') {
        title.textContent = `Adicionar - ${item.name}`;
        submitBtn.textContent = 'Adicionar ao Estoque';
        submitBtn.className = 'btn-primary';
        quantityInput.min = '1';
    } else { // action === 'remove'
        title.textContent = `Remover - ${item.name}`;
        submitBtn.textContent = 'Remover do Estoque';
        submitBtn.className = 'btn-primary btn-danger'; // Use btn-danger for remove action
        quantityInput.min = '1';
    }
    
    quantityLabel.textContent = `Quantidade em unidades para ${action === 'add' ? 'adicionar' : 'remover'}`;
    unitInfo.textContent = `Disponível: ${item.quantity} unidades`; // Always show in units
    
    // Reset form and show modal
    document.getElementById('form-adjust-stock').reset();
    modal.style.display = 'flex';
}

// NEW: Update stock function
export async function updateStock(itemId, quantity, reason, action = 'adjustment') {
    if (!(await canSeeStock())) {
        showNotification('Você não tem permissão para atualizar o estoque.', 'error');
        return;
    }

    try {
        const { data: stockItem } = await supabase.from('stock_items').select('*').eq('id', itemId).single();
        if (!stockItem) throw new Error('Item não encontrado');

        let newQuantity;
        if (action === 'add') {
            newQuantity = stockItem.quantity + quantity;
        } else if (action === 'remove') {
            newQuantity = Math.max(0, stockItem.quantity - quantity);
        } else {
            newQuantity = quantity; // Direct set
        }

        const { error: updateError } = await supabase
            .from('stock_items')
            .update({ quantity: newQuantity })
            .eq('id', itemId);

        if (updateError) throw updateError;

        // Add movement record
        const { error: movementError } = await supabase.from('stock_movements').insert([{
            item_id: itemId,
            item_name: stockItem.name,
            type: action === 'add' ? 'entrada' : 'saida',
            quantity: quantity,
            reason: reason,
            user_id: (await getUser()).id,
            item_unit_value: stockItem.unit_value
        }]);

        if (movementError) throw movementError;

        await hydrate('stock_items');
        await hydrate('stock_movements');

        showNotification('Estoque atualizado com sucesso!', 'success');
        return newQuantity;
    } catch (error) {
        showNotification('Erro ao atualizar estoque: ' + error.message, 'error');
        throw error;
    }
}

export function showDeleteStockItemConfirmation(itemId) {
    // Usar checkTabAccess centralizado
    if (!checkTabAccess('estoque', 'edit')) { 
        showNotification('Você não tem permissão para excluir itens do estoque.', 'error'); 
        return; 
    }

    const itemToDelete = db.stockItems.find(item => item.id === itemId);
    if (!itemToDelete) {
        showNotification('Item não encontrado no estoque.', 'error');
        return;
    }

    // Store the item ID and type to be deleted globally for the confirmation handler
    window.currentDeleteItem = itemId;
    window.currentDeleteItemType = 'stock'; 

    const modal = document.getElementById('modal-confirm-delete');
    const message = document.getElementById('delete-confirmation-message');
    message.textContent = `Tem certeza que deseja excluir o item "${itemToDelete.name}" do estoque? Esta ação é irreversível e o item será removido permanentemente.`;
    
    modal.style.display = 'flex';
}

// [B4] NEW: Add stock item function (migrated from main.js)
export async function addStockItem(item) {
    if (!(await canSeeStock())) throw new Error('Sem permissão para estoque');
    try {
        const user = await getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const payload = {
            name: item.name,
            category: item.category,
            quantity: item.quantity || 0,
            min_stock: item.minStock || item.min_stock || 0,
            unit: item.unit || 'unidade',
            unit_value: item.unitValue || item.unit_value || 0,
            description: item.description || '',
            user_id: user.id
        };

        // Verifica se a coluna 'created_by' existe no schema antes de adicionar
        // Isto evita o erro "Could not find the 'created_by' column" em ambientes sem essa coluna
        addColumnIfExists(payload, db.stockItems, 'created_by', user.id);

        const { data: stockItem, error: stockError } = await supabase
            .from('stock_items')
            .insert([payload])
            .select()
            .single();
        
        if (stockError) throw stockError;

        // If quantity > 0, create initial stock movement
        if (payload.quantity > 0) {
            const movement = {
                item_id: stockItem.id,
                item_name: stockItem.name,
                type: 'entrada',
                quantity: payload.quantity,
                reason: item.reason || 'Adição inicial de estoque',
                user_id: user.id,
                item_unit_value: stockItem.unit_value,
                purchase_notes: item.purchaseNotes || '',
                purchase_file_data: item.purchaseFileData || null,
                purchase_file_name: item.purchaseFileName || null
            };

            const { error: movementError } = await supabase
                .from('stock_movements')
                .insert([movement]);
            
            if (movementError) throw movementError;
        }

        await hydrate('stockItems');
        await hydrate('stockMovements');
        
        return stockItem;
    } catch (error) {
        console.error('Error adding stock item:', error);
        
        // Melhoria do feedback de erro para o usuário
        if (error.message?.includes('created_by')) {
            throw new Error('Erro de configuração do sistema. Contate o administrador.');
        } else {
            throw new Error(`Erro ao adicionar item: ${error.message || 'Erro desconhecido'}`);
        }
    }
}

// [B4] NEW: Delete stock item function
export async function deleteStockItem(itemId) {
    if (!(await canSeeStock())) throw new Error('Sem permissão para estoque');
    try {
        // RLS: só dono ou admin consegue deletar item. Movements caem por ON DELETE CASCADE.
        const { error } = await supabase.from('stock_items').delete().eq('id', itemId);
        if (error) throw error;
        await hydrate('stockItems');
        await hydrate('stockMovements');
    } catch (error) {
        console.error('Error deleting stock item:', error);
        throw error;
    }
}

// Make functions globally available
window.adjustStock = adjustStock;
window.showDeleteStockItemConfirmation = showDeleteStockItemConfirmation;
