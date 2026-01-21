import bcrypt from "bcryptjs";
import pool from "../config/databse.js";

async function authRoutes(fastify, options) {
    fastify.post("/register", {
        schema: {
            body: {
                type: "object",
                required: ["username", "password"],
                properties: {
                    username: { type: "string" },
                    password: { type: "string" }
                }
            }
        }
    }, async (request, reply) => {
        const { username, password } = request.body;
        try{
            const [existing] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
            if(existing.length > 0){
                return reply.code(400).send({ message: "User already exists" });
            }
            const passwordHash = await bcrypt.hash(password, 10);
            await pool.query("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, passwordHash]);
            reply.code(201).send({
                message: "User registered successfully" 
            });
        }catch(error){
            console.error(error);
            return reply.code(500).send({ message: "Internal server error" });
        }
        
    });

    fastify.post("/login", {
        schema: {
            body: {
                type: "object",
                required: ["username", "password"],
                properties: {
                    username: { type: "string" },
                    password: { type: "string" }
                }
            }
        }
    }, async (request, reply) => {
        const { username, password } = request.body;
        try{
            const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
            if(users.length === 0){
                return reply.code(401).send({ 
                    message: "Invalid credentials" 
                });
            }

            const user = users[0];

            const validPassWord = await bcrypt.compare(password, user.password_hash);
            if(!validPassWord){
                return reply.code(401).send({ 
                    message: "Invalid password" 
                });
            }
            const token = fastify.jwt.sign({
                id: user.id,
                username: user.username,
                role: user.role
            },{
                expiresIn: "1h"
            });
            reply.code(200).send({ 
                message: "Login successful",
                token,
                user:{
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
           
        }catch(error){
            console.error(error);
            return reply.code(500).send({ message: "Internal server error" });
        }
    });
}