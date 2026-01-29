import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

//configuracion de la base de datos 

const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER_MCP,
    password: process.env.DB_PASSWORD_MCP,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    }
};

const server = new Server({
    name: "MCP Server",
    description: "MCP Server",
    version: "1.0.0"
},
{ capabilities:{tools:{}}});

//definir lo que la ia puede hacer o puede ver

server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    return{
        tools:[
            {
                name: "db_readonly",
                description: "Consulta segura de informacion finaciera y solo permita leer el balance y sus transacciones",
                inputSchema:{
                    type: "object",
                    properties:{
                        query_type:{
                            type: "string",
                            enum:["balance", "get_last_transactions"],
                            description: "tipo de consulta: 'balance o 'get_last_transactions'"
                        },
                        account_id:{
                            type: "number",
                            description: "ID de la cuenta"
                        } 
                    },
                    required: ["query_type", "account_id"]
                }
            }
        ]
    }
});

//ejecutar las herramientas

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name!== 'db_readonly') throw new Error("Tool not found");
    const inputSchema = z.object({
        query_type: z.enum(["balance", "get_last_transactions"]),
        account_id: z.number().int().positive()
    })

    try {
        //validacion estricta - validar la entrada
        const { query_type, account_id } = inputSchema.parse(request.params.arguments);

        const connection = await mysql.createConnection(DB_CONFIG);

        try {
            //establecer identidad
            //antes de cualquir consulta le decimos a a db quienes somos
            await connection.execute(
                "SET @app_current_user_id = ?", 
                [account_id]
            );

            let result;
            if (query_type === "balance") {
                const [rows] = await connection.execute(
                    "SELECT SUM(amount) as total_balance FROM financial_records_secure"
                );
                result = rows[0].total_balance || 0;
            }else if (query_type === "get_last_transactions") {
                const [rows] = await connection.execute(
                    "SELECT * FROM financial_records_secure ORDER BY created_at DESC LIMIT 5"
                );
                result = rows;
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            }
            
        }finally{
            connection.end()
        }
    } catch (error) {
        return{
            content: [
                {
                    type: "text",
                    text: `Error al ejecutar la herramienta: ${error.message}`,
                    isError: true
                }
            ]
        }
    }
})

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server started");
}

main().catch(console.error);