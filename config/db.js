// const mysql = require('mysql2/promise');
// const db = mysql.createPool({
//     host: '10.1.28.107',
//     user: 'edo',
//     password: '',
//     database: 'erlangga_e-library'
//     // database: 'erlangga_readnest'
// })
// db.getConnection()
//     .then(() => {
//         console.log('Database connection established successfully');
//     })
//     .catch(err => {
//         console.error('Database connection failed:', err);
//     });

// module.exports = db;

const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: '10.1.28.107',
        user: 'edo',
        password: '',
        database: 'erlangga_e-library'
    }
})
knex.raw('SELECT 1')
    .then(() => {
        console.log('Knex connection established successfully');
    })
    .catch(err => {
        console.error('Knex connection failed:', err);
    });

module.exports.knex = knex;