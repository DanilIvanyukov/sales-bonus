/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
    // @TODO: Расчет выручки от операции
    
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const totalDiscount = 1 - discount / 100;
    return sale_price * quantity * totalDiscount;
} 

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов 
 * @param seller карточка продавца
 * @returns {number}
 */
    // @TODO: Расчет бонуса от позиции в рейтинге

function calculateBonusByProfit(index, total, seller) {

    const { profit } = seller;
    if (index === 0) {
        return profit * 0.15;
    }
    else if (index === 1 || index === 2) {
        return profit * 0.10;
    }
    else if (index === total - 1) {
        return 0;
    }
    else {
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;
    
    // @TODO: Проверка входных данных
    if (!data 
        ||!Array.isArray(data.sellers)
        || data.sellers.length === 0
        ||!Array.isArray(data.products)
        ||data.products.length === 0
        ||!Array.isArray(data.purchase_records)
        ||data.purchase_records.length === 0
    ) {
        throw new Error (`Неконрректные входные данные!`);
    }
    // @TODO: Проверка наличия опций

    if (!calculateBonus || !calculateRevenue) {
        throw new Error (`Опции не найдены!`)
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller =>({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = sellerStats.reduce((result, statId)=>{
        result[statId.id] = statId;
        return result;
    }, {});

    const productIndex =data.products.reduce((result, skuId) => {
        result[skuId.sku] = skuId;
        return result;
    }, {});

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) {
            console.warn(`Статистика для продавца ${record.seller_id} не найдена в индексе.`);
            return;
        }
        seller.sales_count += 1;

    record.items.forEach(item => {
        const product = productIndex[item.sku];
        if (!product) {
            console.warn(`Пропущен товар в чеке: товар ${item.sku} не найден`);
            return;
        }
        const revenue = calculateRevenue(item, product);
        const cost = product.purchase_price * item.quantity;
        const profit = revenue - cost;
        seller.revenue += revenue;
        seller.profit += profit;
        if (!seller.products_sold[item.sku]) {
            seller.products_sold[item.sku] = 0;
        }
        seller.products_sold[item.sku] += item.quantity;
        }); 
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a,b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({sku, quantity}))
        .sort((a,b) => b.quantity - a.quantity)
        .slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями

    return sellerStats.map(seller =>({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
