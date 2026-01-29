-- =============================================================================
-- PE-3.2: Actualización de Seguridad para Agente MCP
-- =============================================================================
-- Este script se ejecuta SOBRE la base de datos 'pe31_rls' existente.

USE pe31_rls;

-- =============================================================================
-- 1. IMPLEMENTACIÓN DE RLS (VISTA SEGURA)
-- =============================================================================
-- Como 'financial_records' ya existe, creamos una vista que filtra por la variable de sesión.

-- Para que la vista funcione en MySQL 8 con variables, debemos encapsular la variable en una funcion
-- o usar una subconsulta que MySQL optimice.
-- Workaround: Crear una función auxiliar que lea la variable.

DELIMITER //
CREATE FUNCTION get_current_app_user_id() RETURNS INT DETERMINISTIC
BEGIN
    RETURN @app_current_user_id;
END //
DELIMITER ;

CREATE OR REPLACE VIEW financial_records_secure AS
SELECT * 
FROM financial_records 
WHERE user_id = get_current_app_user_id();

-- =============================================================================
-- 2. HARDENING & PERMISOS
-- =============================================================================
-- Crear usuario específico para el Agente MCP (si no existe)
-- Este usuario NO tendrá acceso a 'financial_records' directos, solo a la vista.

CREATE USER IF NOT EXISTS 'mcp_agent'@'%' IDENTIFIED BY 'Agent_Secret_Pass_123!';

-- Permisos estrictos: Solo SELECT en la vista segura.
GRANT SELECT ON pe31_rls.financial_records_secure TO 'mcp_agent'@'%';

-- En MySQL 8, 'GRANT SELECT' es suficiente para usar variables de sesión propias (usuario-definidas @).
-- No se requieren permisos de administración global si solo usamos @variables.

FLUSH PRIVILEGES;
