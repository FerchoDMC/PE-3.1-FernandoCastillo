import fastifyPlugin from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";
dotenv.config();

async function authPlugin(fastify, options) {
    fastify.register(fastifyJwt, {
        secret: process.env.JWT_SECRET,
    });

    fastify.decorate("authenticate", async function (request, reply) {
        try {
            await request.jwtVerify();
        } catch (error) {
            reply.status(401).send({
                error: "Unauthorized",
                message: "Token de autenticación inválido o expirado"
            });
        }
    });

    //verificar si el usuario es admin
    fastify.decorate('requireAdmin', async function (request, reply) {
        try {
            await request.jwtVerify();
            if (request.user.role !== 'admin') {
                reply.status(403).send({
                    error: "Forbidden",
                    message: "No tienes permisos para acceder a este recurso"
                });
            }
        } catch (error) {
            reply.status(401).send({
                error: "Unauthorized",
                message: "Token de autenticación inválido o expirado"
            });
        }
    });
}

export default fastifyPlugin(authPlugin);
