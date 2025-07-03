const { knex } = require('../../../config/db');
const md5 = require('md5');
const {loginValidation} = require('../models/authModel');
const {registerValidation} = require('../models/authModel');

exports.login = async (req, res) => {
    const errors = loginValidation(req.body);
    if (Object.keys(errors).length > 0) {
        return res.status(200).json({
            status: 'error',
            messages: errors
        })
    }
    const {user_email, user_password} = req.body;
    try {
        // const [result] = await db.query('SELECT * FROM erl_user WHERE user_email =?', [user_email]);
        const user = await knex('erl_user').where({ user_email}).first();
        if (!user) {
            return res.status(200).json({
                status: 'error',
                messages: {
                    errors: { user_email: 'Email tidak terdaftar'}
                }
            });
        }
        if (user.user_password !== md5(user_password)) {
            return res.status(200).json({
                status: 'error',
                messages: {
                    errors: { user_password: 'Email atau password salah'}
                }
            });
        }
        if (user.user_delete_status === 1) {
            return res.status(200).json({
                status: 'error',
                messages: {
                    errors: { user_email: 'Email tidak terdaftar'}
                }
            });
        }
        if (user.user_request_delete === 1) {
            const currentDate = new Date().toISOString().slice(0, 10);
            const maxDate = user.user_request_delete_max_date;

            if (currentDate > maxDate) {
                // await db.query('UPDATE erl_user SET user_delete_status = ? ', [1, user.idx])
                await knex('erl_user').where({ idx: user.idx }).update({ user_delete_status: 1})
                return res.status(200).json({
                    status: 'error',
                    messages: {
                        errors: {user_email: 'Akun anda telah dihapus'}
                    }
                });
            }
            return res.status(200).json({
                status: 'konfirmasi',
                messages: {
                    konfirmasi: 'Akun Anda sedang dalam proses penghapusan. Apakah Anda ingin memulihkan akun atau melanjutkan penghapusan?'
                },
                data: {
                    max_date: maxDate,
                    user_id: Buffer.from(user.idx.toString()).toString('base64') 
                }
            });
        }
        // const [memberPerpus] = await db.query('SELECT * FROM erl_member_perpus JOIN erl_admin ON erl_admin.idx = erl_member_perpus.member_id_perpus WHERE erl_member_perpus.member_id_user = ?', [user.idx]);
        const memberPerpus = await knex('erl_member_perpus').join('erl_admin', 'erl_admin.idx', 'erl_member_perpus.member_id_perpus').where('erl_member_perpus.member_id_user', user.idx).first();
        if (!memberPerpus) {
            return res.status(200).json({
                status: 'error',
                messages: {
                    user_email: 'Data member perpustakaan tidak ditemukan'
                }
            })
        }
        return res.status(200).json({
            status: 'success',
            messages: {
                success: 'Selamat datang ' + user.user_name
            },
            data: {
                id_user: user.idx,
                user_email: user.user_email,
                user_name: user.user_name,
                user_nis: user.user_nis,
                user_kelas: user.user_kelas,
                user_photo: user.user_photo,
                id_admin: memberPerpus.member_id_perpus
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            pesan: 'Terjadi kesalahan server',
            status: 'error'
        });
    }
}

exports.PulihkanAkun = async (req, res) => {
    const {user_id} = req.body;
    if (!user_id) {
        return res.status(400).json({
            status: 'error',
            messages: {
                errors: { user_id: 'User ID tidak boleh kosong' }
            }
        });
    }
    const userId = Buffer.from(user_id, 'base64').toString('utf-8');
    try {
        // const [result] = await db.query('SELECT * FROM erl_user WHERE idx = ?', [userId]);
        const user = await knex('erl_user').where({ idx: userId }).first();
        if (!user) {
            return res.status(404).json({
                status: 'error',
                messages: {
                    errors: { user_id: 'User tidak ditemukan' }
                }
            });
        }
        // await db.query('UPDATE erl_user SET user_request_delete = ?, user_request_delete_max_date = ? WHERE idx = ?', [0, 0, userId]);
        await knex('erl_user').where({ idx: userId }).update({ user_request_delete: 0, user_request_delete_max_date: null });
        return res.status(200).json({
            status: 'success',
            messages: {
                success: 'Akun Anda berhasil dipulihkan'
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            pesan: 'Terjadi kesalahan server',
            status: 'error'
        });
    }
}

exports.HapusAkun = async (req, res) => {
    const {user_id} = req.body;
    if (!user_id) {
        return res.status(400).json({
            status: 'error',
            messages: {
                errors: { user_id: 'User ID tidak boleh kosong' }
            }
        });
    }
    const userId = Buffer.from(user_id, 'base64').toString('utf-8');
    try {
        // const [result] = await db.query('SELECT * FROM erl_user WHERE idx = ?', [userId]);
        const user = await knex('erl_user').where({ idx: userId }).first();
        if (!user) {
            return res.status(404).json({
                status: 'error',
                messages: {
                    errors: { user_id: 'User tidak ditemukan' }
                }
            });
        }
        // await db.query('UPDATE erl_user SET user_delete_status = ? WHERE idx = ?', [1, userId]);
        await knex('erl_user').where({ idx: userId }).update({ user_delete_status: 1 });
        return res.status(200).json({
            status: 'success',
            messages: {
                success: 'Akun Anda berhasil dihapus'
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            pesan: 'Terjadi kesalahan server',
            status: 'error'
        });
    }
}

exports.register = async (req, res) => {
    const errors = await registerValidation(req.body);
    if (Object.keys(errors).length > 0) {
        return res.status(200).json({
            status: 'error',
            errors: errors
        })
    }
    const {user_nis, user_name, user_email, phone, jk, user_password, admin_email, user_kelas} = req.body;
    // const koneksi = await db.getConnection();
    // await koneksi.beginTransaction();
    const koneksi = await knex.transaction();
    try {
        // const [adminPerpus] = await koneksi.query('SELECT * FROM erl_admin WHERE admin_email = ?', [admin_email]);
        const adminPerpus = await koneksi('erl_admin ').where({ admin_email }).first();
        if (!adminPerpus) {
            await koneksi.rollback();
            return res.status(200).json({
                status: 'error',
                error: 'Email perpustakaan tidak ditemukan'
            });
        }
        const member_id_perpus = adminPerpus.member_id_perpus;

        // const [kelasPerpus] = await koneksi.query('SELECT idx, nama_group FROM erl_group_library WHERE nama_group = ?', [user_kelas]);
        const kelasPerpus = await koneksi('erl_group_library').select('idx', 'nama_group').where({ nama_group: user_kelas }).first();
        if (!kelasPerpus) {
            await koneksi.rollback();
            return res.status(200).json({
                status: 'error',
                error: 'Group Kelas tidak ditemukan'
            });
        }
        const idx_group = kelasPerpus.idx;
        const nama_group = kelasPerpus.nama_group;

        // const [regisUser] = await koneksi.query(`
        //     INSERT INTO erl_user (user_email, user_password, user_name, user_nis, phone, jk, user_kelas, user_photo)
        //     VALUES (?, ?, ?, ?, ?, ?, ?)
        // `, [user_email, md5(user_password), user_name, user_nis, phone, jk, nama_group, 'default.png']);
        // const id_user = regisUser.insertId;

        // const [insertMember] = await koneksi.query(`
        //     INSERT INTO erl_member_perpus (member_id_user, member_id_perpus, member_status, idx_group)
        //     VALUES (?, ?, ?, ?)
        // `, [id_user, member_id_perpus, 0, idx_group]);

        const [id_user] = await koneksi('erl_user').insert({
            user_email,
            user_password: md5(user_password),
            user_name,
            user_nis,
            phone,
            jk,
            user_kelas: nama_group,
            user_photo: 'default.png'
        })

        await koneksi('erl_member_perpus').insert({
            member_id_user: id_user,
            member_id_perpus,
            member_status: 0,
            idx_group
        })

        await koneksi.commit();
        return res.status(200).json({
            status: 'success',
            error: null,
            messages: 'Silakan Login'
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            pesan: 'Terjadi kesalahan server',
            status: 'error'
        });
    }
}