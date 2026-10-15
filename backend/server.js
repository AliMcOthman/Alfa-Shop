import express from "express";
import cors from "cors";
import sequelize from "./db.js";
import "./models/Product.js";

const app = new express();
const IP = "127.0.0.1";
const PORT = 3000;


app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(express.json());
app.get("/" , (req,res) => {
    res.send("Willkommen bei unsere Alfa-Shop");
});

app.get("/api/health" ,(req,res) => {
    res.json({
        status: "Ok",
        message: "Alfa-Shop API läuft"
    });
});

async function startServer(){
    try {
        await sequelize.authenticate();
        console.log("Datenbankverbindung erfolgreich.");
        await sequelize.sync();
        console.log("Datenbank und Tabellen sind bereit.");

        app.listen(PORT,IP, () =>{
            console.log(`http://${IP}:${PORT}`);
        });
    }catch (err){
        console.log("Fehler ",err);
        process.exit(1);
    }
}
startServer();