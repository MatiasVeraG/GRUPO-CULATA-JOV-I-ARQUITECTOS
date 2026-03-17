/**
 * =====================================================
 * DROPBOX REFRESH TOKEN GENERATOR (Node.js)
 * =====================================================
 * 
 * Script alternativo para obtener el Refresh Token
 * 
 * USO:
 *   node get-dropbox-token.js
 * 
 * REQUISITOS:
 *   - Node.js 14 o superior
 *   - No requiere dependencias externas
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}

function httpsPost(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = new URLSearchParams(data).toString();

        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function main() {
    console.log('');
    console.log('=========================================');
    console.log('  DROPBOX REFRESH TOKEN GENERATOR');
    console.log('=========================================');
    console.log('');

    // Paso 1: Solicitar credenciales
    console.log('[PASO 1] Ingresa tus credenciales de Dropbox App\n');

    const APP_KEY = await question('App Key: ');
    const APP_SECRET = await question('App Secret: ');

    if (!APP_KEY || !APP_SECRET) {
        console.log('\nError: Las credenciales no pueden estar vacías.');
        process.exit(1);
    }

    // Paso 2: Mostrar URL de autorización
    console.log('\n[PASO 2] Abre esta URL en tu navegador:\n');

    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${APP_KEY}&token_access_type=offline&response_type=code`;
    console.log('\x1b[32m%s\x1b[0m', authUrl);
    console.log('');
    console.log('1. Inicia sesión en Dropbox');
    console.log('2. Haz clic en "Allow" para autorizar la app');
    console.log('3. Copia el código de autorización que aparece');
    console.log('');

    // Paso 3: Solicitar código de autorización
    console.log('[PASO 3] Ingresa el código de autorización:');
    const AUTH_CODE = await question('Authorization Code: ');

    if (!AUTH_CODE) {
        console.log('\nError: El código de autorización no puede estar vacío.');
        process.exit(1);
    }

    // Paso 4: Intercambiar código por tokens
    console.log('\n[PASO 4] Obteniendo Refresh Token...\n');

    try {
        const response = await httpsPost('https://api.dropboxapi.com/oauth2/token', {
            code: AUTH_CODE,
            grant_type: 'authorization_code',
            client_id: APP_KEY,
            client_secret: APP_SECRET
        });

        if (response.error) {
            console.log('=========================================');
            console.log('  ERROR AL OBTENER TOKENS');
            console.log('=========================================');
            console.log('');
            console.log('Error:', response.error);
            console.log('Descripción:', response.error_description);
            console.log('');
            console.log('Posibles causas:');
            console.log('- El código de autorización ya fue usado o expiró');
            console.log('- Las credenciales (App Key/Secret) son incorrectas');
            console.log('- Los scopes no están configurados en la app');
            process.exit(1);
        }

        console.log('=========================================');
        console.log('  ¡TOKENS OBTENIDOS EXITOSAMENTE!');
        console.log('=========================================');
        console.log('');
        console.log('REFRESH TOKEN (permanente - GUARDAR ESTE):');
        console.log('\x1b[36m%s\x1b[0m', response.refresh_token);
        console.log('');
        console.log('Access Token (temporal - 4 horas):');
        console.log(response.access_token.substring(0, 50) + '...');
        console.log('');
        console.log('Scopes autorizados:');
        console.log(response.scope);
        console.log('');
        console.log('=========================================');
        console.log('  SIGUIENTE PASO');
        console.log('=========================================');
        console.log('');
        console.log('Copia el REFRESH_TOKEN y pégalo en tu archivo');
        console.log('dropbox-config.js en la línea correspondiente:');
        console.log('');
        console.log(`REFRESH_TOKEN: '${response.refresh_token}'`);
        console.log('');

        // Guardar en archivo
        const fs = require('fs');
        const outputFile = 'dropbox-tokens.json';
        const tokensData = {
            generated_at: new Date().toISOString(),
            app_key: APP_KEY,
            app_secret: '***HIDDEN***',
            refresh_token: response.refresh_token,
            access_token: response.access_token,
            scope: response.scope,
            note: 'IMPORTANTE: Guarda este archivo en un lugar seguro y NO lo subas a Git.'
        };
        fs.writeFileSync(outputFile, JSON.stringify(tokensData, null, 2));
        console.log(`Tokens guardados en: ${outputFile}`);

    } catch (error) {
        console.log('Error de conexión:', error.message);
        process.exit(1);
    }

    rl.close();
}

main().catch(console.error);
