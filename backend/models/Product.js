import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// Produktmodell erstellen
const Product = sequelize.define("Product", {
    // Produktname
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // Produktbeschreibung
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // Produktpreis
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    // Verfügbarer Lagerbestand
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },

    // Produktkategorie
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Produktbild
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
    }


});

export default Product;