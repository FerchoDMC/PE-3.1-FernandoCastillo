import dotenv from "dotenv";
import fastify from "fastify";
dotenv.config();


//habilita los logs automaticamente
const app = fastify();


//plugin
import cors from "@fastify/cors";

//rutas


//configuracion a la base de datos
import { testConnection } from "./config/databse.js";

async function startServer() {
    try {
        await testConnection();
        app.listen({ port: process.env.PORT }, (err, address) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log(`Server listening on ${address}`);
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

startServer();

