// const { QueryBuilder } = require('knex');
const { knex } = require('../../../config/db');
const crypto = require('crypto');
const ENCRYPTION_KEY = '3rl4ngg454l4m50l1dv1ct0ry1234567';
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
}

exports.getDataKategori = async (req, res) => {
    const { search } = req.query;
    try {
        // const per_halaman = 5;
        // const halaman = Number(req.query.halaman) || 1;
        // const offset = (halaman - 1) * per_halaman;

        const DataKategori = await knex('erl_inv_kategori')
            .select('inv_kategori_idx as id_kategori',
                    'inv_kategori_nama as nama_kategori',)
            // .limit(per_halaman)
            // .offset(offset)
            .modify(QueryBuilder => {
                if (search) {
                    QueryBuilder.where('inv_kategori_nama', 'like', `%${search}%`);
                }
            })

        // const totalData_result = await knex('erl_inv_kategori').clone().count('* as total');
        // const total_data = totalData_result[0]?.total || 0;

        // if (!DataKategori.length) {
        //     return res.status(404).json({
        //         status: 'error',
        //         message: 'Kategori tidak ditemukan.'
        //     });
        // }
        if (!DataKategori) {
            return res.status(404).json({
                status: 'error',
                message: 'Kategori tidak ditemukan.'
            });
        }
        // return res.status(200).json({
        //     status: 'success',
        //     message: 'Kategori ditemukan.',
        //     data: DataKategori,
        //     // pagination: {
        //     //     halaman: Number(halaman),
        //     //     per_halaman,
        //     //     total_data,
        //     //     total_halaman: Math.ceil(total_data / per_halaman)
        //     // }
        // });
        const response = {
            status: 'success',
            message: 'Kategori ditemukan.',
            data: DataKategori
        };
        const encryptedResponse = encrypt(JSON.stringify(response));
        return res.status(200).json({
            encrypted: encryptedResponse
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat mengambil data kategori.'
        });
    }
}

exports.tambahKategori = async (req, res) => {
    const { nama_kategori } = req.body;
    try {
        if (!nama_kategori) {
            return res.status(400).json({
                status: 'error',
                message: 'Nama kategori tidak boleh kosong.'
            });
        }

        const addKategori = await knex('erl_inv_kategori').insert({
            inv_kategori_nama: nama_kategori
        });

        if (!addKategori) {
            return res.status(402).json({
                status: 'error',
                message: 'Kategori gagal ditambahkan.',
            })
        };

        return res.status(201).json({
            status: 'success',
            message: 'Kategori berhasil ditambahkan.',
        });
    } catch (error) {
        console.error('Error adding category:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat menambahkan kategori.'
        });
    }
}

exports.editKategori = async (req, res) => {
    const {nama_kategori } = req.body;
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID kategori tidak ditemukan.'
            });
        }
        const decodedID = Buffer.from(id, 'base64').toString('utf-8');
        if (!nama_kategori || !decodedID) {
            return res.status(400).json({
                status: 'error',
                message: 'ID kategori dan nama kategori tidak boleh kosong.'
            });
        }
        const editKategori = await knex('erl_inv_kategori')
            .where('inv_kategori_idx', decodedID)
            .update({
                inv_kategori_nama: nama_kategori
            })

        if (!editKategori) {
            return res.status(404).json({
                satuts: 'error',
                message: 'Gagal merubah kategori.'
            });
        }
        return res.status(200).json({
            status: 'success',
            message: 'Kategori berhasil diubah.',
            data: {
                nama_kategori : nama_kategori,
            }
        })
    } catch (error) {
        console.error('Error editing category:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat mengedit kategori.'
        });
    }
}

exports.deleteKategori = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID kategori tidak ditemukan.'
            });
        }
        const deleteKategori = await knex('erl_inv_kategori')
            .where('inv_kategori_idx', id)
            .delete();
        
        if (!deleteKategori) {
            return res.status(404).json({
                status: 'error',
                message: 'Kategori tidak ditemukan atau gagal dihapus.'
            });
        }
        return res.status(200).json({
            status: 'success',
            message: 'Kategori berhasil dihapus.'
        })
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat menghapus kategori.'
        });
    }
}