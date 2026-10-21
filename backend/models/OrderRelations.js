
import Order from "./Order.js";
import OrderItem from "./OrderItem.js";
import Product from "./Product.js";
import Customer from "./Customer.js";

// Eine Bestellung hat mehrere Positionen
Order.hasMany(OrderItem, {
    foreignKey: "orderId",
    onDelete: "CASCADE"
});

OrderItem.belongsTo(Order, {
    foreignKey: "orderId"
});

// Eine Bestellposition gehört zu einem Produkt
OrderItem.belongsTo(Product, {
    foreignKey: "productId",
    onDelete: "SET NULL"
});

Product.hasMany(OrderItem, {
    foreignKey: "productId"
});

// Ein Kunde kann mehrere Bestellungen haben
Customer.hasMany(Order, {
    foreignKey: "customerId",
    onDelete: "SET NULL"
});

// Eine Bestellung kann einem Kunden gehören
Order.belongsTo(Customer, {
    foreignKey: "customerId",
    onDelete: "SET NULL"
});

export { Order, OrderItem };
