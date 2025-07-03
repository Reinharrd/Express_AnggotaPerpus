const db = require('../../../config/db');
exports.loginValidation = (data) => {
    const errors = {};
    if (!data.user_email) {
        errors.user_email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.user_email)) {
        errors.user_email = 'Email tidak valid. Hanya huruf, angka, @, dan . yang diperbolehkan';
    }

    if (!data.user_password) {
        errors.user_password = 'Kata Sandi harus diisi';
    } else if (data.user_password.length < 6) {
        errors.user_password = 'Kata Sandi minimal terdiri dari 6 karakter';
    }

    return errors;
}

exports.registerValidation = async (data) => {
    const errors = {};
    
    if (!data.user_nis) {
        errors.user_nis = 'NIS harus diisi';
    } else if (!/^[a-z0-9]+$/i.test(data.user_nis)) {
        errors.user_nis = 'NIS hanya boleh berisi huruf dan angka';
    }

    if (!data.user_name) {
        errors.user_name = 'Nama harus diisi';
    } else if (!/^[a-zA-Z\s]+$/.test(data.user_name)) {
        errors.user_name = 'Nama hanya boleh berisi huruf dan spasi';
    }

    if (!data.user_email) {
        errors.user_email = 'Email harus diisi';
    } else {
        const email = data.user_email;
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!validEmail.test(email)) {
            errors.user_email = 'Email tidak valid';
        }

        const regexMatch = /^[a-zA-Z0-9@.]+$/;
        if (!regexMatch.test(email)) {
            errors.user_email = 'Email tidak valid. Hanya huruf, angka, @, dan . yang diperbolehkan';
        }

        const [existingEmail] = await db.query('SELECT user_email FROM erl_user WHERE user_email = ?', [email]);
        if (existingEmail.length > 0) {
            errors.user_email = 'Email sudah terdaftar';
        }
    }

    if (!data.phone) {
        errors.phone = 'No. Telepon harus diisi';
    } else {
        if (!/^\d+$/.test(data.phone)) {
            errors.phone = 'No. Telepon harus berupa angka';
        } else if (data.phone.length < 10) {
            errors.phone = 'No. Telepon minimal terdiri dari 10 angka';
        } else if (data.phone.length > 13) {
            errors.phone = 'No. Telepon maksimal terdiri dari 13 angka';
        } else if (!/^(08[1-9][0-9]{7,10}|021[0-9]{7,9})$/.test(data.phone)) {
            errors.phone = 'No Telepon tidak valid';
        }
    }

    if (!data.jk) {
        errors.jk = 'Jenis Kelamin harus diisi';
    }

    if (!data.user_password) {
        errors.user_password = 'Kata Sandi harus diisi';
    } else {
        if (data.user_password.length < 6) {
            errors.user_password = 'Kata Sandi minimal terdiri dari 6 karakter';
        } else if (!/^[a-zA-Z0-9@.]+$/.test(data.user_password)) {
            errors.user_password = 'Kata Sandi tidak valid. Hanya huruf, angka, @, dan . yang diperbolehkan';
        }
    }

    if (!data.confirm_password) {
        errors.confirm_password = 'Konfirmasi Kata Sandi harus diisi';
    } else if (data.confirm_password !== data.user_password) {
        errors.confirm_password = 'Konfirmasi Kata Sandi tidak sesuai';
    }

    if (!data.admin_email) {
        errors.admin_email = 'Email Perpustakaan harus diisi';
    }

    if (!data.user_kelas) {
        errors.user_kelas = 'Kelas harus diisi';
    }

    return errors;
}