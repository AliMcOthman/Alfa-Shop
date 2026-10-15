import { Sequelize } from "sequelize";

// Verbindung zur SQLite-Datenbank herstellen
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./alfaShop.db",
    logging: false
});

// Verbindung exportieren
export default sequelize;