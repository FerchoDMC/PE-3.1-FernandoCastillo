import {pool} from "../config/database.js";
import {buildRLSFilter, verifyOwnership} from "../middleware/rls.js";

export default async function recordRoutes(fastify, options){
    //vamos siempre a pedir autenticacion
    fastify.addHook("onRequest", fastify.authenticate);

    //get
    fastify.get('/', async (request, reply)=>{
        try{
            const { clause, params } = buildRLSFilter(request.user);
            const [records] = await pool.execute(`SELECT * FROM financial_records 
                WHERE ${clause}
                ORDER BY created_at DESC`, params);

            return reply.status(200).send({
                message: 'Registros obtenidos con RLS',
                userId: request.user.id,
                rlsFilter: request.user.role === 'admin' ? 'ADMIN' : `user_id = ${request.user.id}`,
                count: records.length,
                records
            });
            
        }catch(error){
            reply.status(500).send({
                message: 'Error al obtener registros',
                error: error.message
            });
        }
    });
    //crear un registro
    fastify.post('/',async (request,reply)=>{
        const { amount, category, description } = request.body;
        const userId = request.user.id;

        try{
            const [result] = await pool.execute(
                `INSERT INTO financial_records (user_id, amount, category, description) 
                VALUES (?, ?, ?, ?)`,
                [userId, amount, category, description]
            );
            reply.status(201).send({
                message: 'Registro creado exitosamente',
                record: result.insertId
            });
        }catch(error){
            reply.status(500).send({
                message: 'Error al crear registro',
                error: error.message
            });
        }
    });
//update
    fastify.put('/:id', async (request, reply) => {
        const { id } = request.params;
        const { amount, category, description } = request.body;
        const userId = request.user.id;
        
        // cual es el rol del usuario

        const isAdmin = request.user.role === 'admin';
        
        try {
            if(!isAdmin){
                const isOwner = await verifyOwnership(request.user, id, 'financial_records');
                if(!isOwner){
                    return reply.status(403).send({
                        message: 'No tienes permiso para actualizar este registro'
                    });
                }
                // si es dueño
                await pool.execute(`UPDATE financial_records SET amount = ?, category = ?, description = ? WHERE id = ?`, [amount, category, description, id]);
                return reply.status(200).send({
                    message: 'Registro actualizado exitosamente'
                });
            }
        }catch(error){
            reply.status(500).send({
                message: 'Error al actualizar registro',
                error: error.message
            });
        }
    });

    //delete

    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params;
        const userId = request.user.id;
        
        // cual es el rol del usuario

        const isAdmin = request.user.role === 'admin';
        
        try {
            if(!isAdmin){
                const isOwner = await verifyOwnership(request.user, id, 'financial_records');
                if(!isOwner){
                    return reply.status(403).send({
                        error: 'Forbidden',
                        message: 'No tienes permiso para eliminar este registro'
                    });
                }
                // si es dueño
                await pool.execute(`DELETE FROM financial_records WHERE id = ?`, [id]);
                return reply.status(200).send({
                    message: 'Registro eliminado exitosamente'
                });
            }
        }catch(error){
            reply.status(500).send({
                message: 'Error al eliminar registro',
                error: error.message
            });
        }
    });
    
}