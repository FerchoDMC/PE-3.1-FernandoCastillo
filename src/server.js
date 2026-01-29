import fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import { testConnection } from "./config/database.js";
import authPlugin from "./plugin/auth.js";
import authRoutes from "./routes/auth.routes.js";
import recordRoutes from "./routes/record.routes.js";
import auditRoutes from "./routes/audit.routes.js";

dotenv.config();

// habilita los logs automaticamente
const app = fastify({
    logger: true
});

//Register plugins
await app.register(cors, {
    origin: "*"
});
await app.register(authPlugin);

// Register routes
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(recordRoutes, { prefix: '/api/records' });
await app.register(auditRoutes, { prefix: '/api/audit' });

app.get('/', async (request, reply) => {
    reply.send({ message: 'Hello World' });
});

// configuracion a la base de datos
testConnection();

async function startServer() {
    try {
        await await app.listen({ port: process.env.PORT || 3000 });
        console.log(`Server running on port ${process.env.PORT || 3000}`);
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

startServer();