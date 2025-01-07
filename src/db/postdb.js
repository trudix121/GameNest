const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.POSTGRE_QUERY,
});

async function run() {
  try {
    await pool.connect();
    console.log('Database Connected');
  } catch (error) {
    throw new Error('Database Connection Failed: ', error);
  }
}

async function createUser(username, email, password, security_code, phone) {
  try {
    const rest = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (rest.rows.length > 0) {
      return { success: false, error: 'Username or Email already Exists!' };
    } else {
      const hashedPassword = await bcrypt.hash(password, 12); // Increased cost factor
      await pool.query(
        'INSERT INTO users (username, email, password, security_code, phone) VALUES ($1, $2, $3, $4, $5)',
        [username, email, hashedPassword, security_code, phone]
      );
      return { success: true };
    }
  } catch (error) {
    return { success: false, error: `${error}` };
  }
}

async function login(credentials, password, data = false) {
  try {
    const rest = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $1', [credentials]);
    if (rest.rows.length > 0) {
      const isPasswordValid = await bcrypt.compare(password, rest.rows[0].password);
      if (isPasswordValid) {
        if (data) {
          return { success: true, data: rest.rows[0] };
        } else {
          return { success: true };
        }
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } else {
      return { success: false, error: 'Invalid Credentials' };
    }
  } catch (error) {
    return { success: false, error: `${error}` };
  }
}

async function getUserData(username) {
  const rest = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (rest.rows.length > 0) {
    return rest.rows[0];
  } else {
    return { success: false, error: 'Invalid Username!' };
  }
}

// Example Usage (uncomment to test)
/*
const s = async () => {
  // console.log(await createUser('Trudix', 'alexandrucarp14@gmail.com', 'alexandru2021@AAA', '658797', '0787453951'));
  // console.log(await login('Trudix', 'alexandru2021@AAA', true));
  // console.log(await getUserData('Trudix'));
};

s();
*/

run()

module.exports = {
  pool,
  createUser,
  login,
  getUserData,
};
