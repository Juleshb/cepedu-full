const prisma = require('../config/db');
const { serialize } = require('../utils/serialize');

exports.logAction = async (admin_id, action, affected_table = null, details = null) => {
    try {
        if (!admin_id || !action) {
            throw new Error('Admin ID and action are required for logging');
        }
        console.log('Logging action:', { admin_id, action, affected_table, details });
        await prisma.adminLog.create({
            data: {
                admin_id: Number(admin_id),
                action,
                affected_table: affected_table || '',
                details: details || '',
            },
        });
        console.log('Action logged successfully');
    } catch (error) {
        console.error('Failed to log admin action:', error.stack || error.message);
    }
};

exports.getAllLogs = async (req, res) => {
    try {
        const logs = await prisma.adminLog.findMany({
            orderBy: { timestamp: 'desc' },
        });
        res.json(serialize(logs));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLogsByAdminId = async (req, res) => {
    const { adminId } = req.params;
    try {
        const logs = await prisma.adminLog.findMany({
            where: { admin_id: Number(adminId) },
            orderBy: { timestamp: 'desc' },
        });
        res.json(serialize(logs));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
