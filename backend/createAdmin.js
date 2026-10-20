import bcrypt from "bcryptjs";
import sequelize from "./db.js";
import Admin from "./models/Admin.js";

async function createAdmin() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        const username = "Admin"
        const password = "Ali123";
        const existAdmin = await Admin.findOne({
            where: { username },
        });
        if(existAdmin){
            console.log("Admin existiert bereits.");
            return;

        }
        const hashedPassword = await bcrypt.hash(password,12);
        await Admin.create({
            username,
            password:hashedPassword
        });
        console.log("Admin wurde erfolgreich erstellt.");
        console.log("Benutzername:", username);
        console.log("Bitte ändern Sie das Beispielpasswort vor der Verwendung.");
    } catch (error) {
        console.error("Fehler beim Erstellen des Admins:", error);
    } finally {
        await sequelize.close();
    }
}
createAdmin();