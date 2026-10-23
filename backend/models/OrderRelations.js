import Order from "./Order.js";
import OrderItem from "./OrderItem.js";
import Product from "./Product.js";
import Customer from "./Customer.js";

// Eine Bestellung hat mehrere Positionen
// Beim Löschen einer Bestellung werden ihre Positionen ebenfalls gelöscht
Order.hasMany(OrderItem, {
    foreignKey: "orderId",
    onDelete: "CASCADE"
});

// Jede Bestellposition gehört zu einer Bestellung
OrderItem.belongsTo(Order, {
    foreignKey: "orderId"
});

// Eine Bestellposition gehört zu einem Produkt
// Wird das Produkt gelöscht, wird die productId auf NULL gesetzt
OrderItem.belongsTo(Product, {
    foreignKey: "productId",
    onDelete: "SET NULL"
});

// Ein Produkt kann in mehreren Bestellpositionen vorkommen
Product.hasMany(OrderItem, {
    foreignKey: "productId"
});

// Ein Kunde kann mehrere Bestellungen haben
// Beim Löschen eines Kunden bleiben seine Bestellungen erhalten
Customer.hasMany(Order, {
    foreignKey: "customerId",
    onDelete: "SET NULL"
});

// Eine Bestellung kann einem Kunden gehören
Order.belongsTo(Customer, {
    foreignKey: "customerId",
    onDelete: "SET NULL"
});

// Modelle exportieren, damit sie in anderen Dateien verwendet werden können
export { Order, OrderItem };