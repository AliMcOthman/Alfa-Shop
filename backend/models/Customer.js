import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// Kundentabelle erstellen
const Customer = sequelize.define("Customer", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },

    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

export default Customer;
