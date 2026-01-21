/* 
1. el usuario envia un request con jwt
2. JWT contiene el id y el username: "ferchoDMC"
3. el Middleware agregar un WHERE userid=1
4. Query: SELECT * FROM users WHERE userid=1
5. usuario solo vea sus reqistros
*/

function buildRLSFilter(user){
    if(user.role === "admin"){
        return {clause: "1=1", param:[]};
    }
    return {clause: "user_id = ?", param:[user.id]};
}

//verificar si el usuario es dueño de un registroespecifico
async function verifyOwnership(pool, table, recorId, userId){
    const [rows] = await pool.query(`SELECT user_id FROM ${table} WHERE id = ?`, [recorId]);
    if(rows.length === 0) return false; //registro no existe

    return rows[0].user_id === userId; // este es el dueño del registro??
}
export default {buildRLSFilter, verifyOwnership};
