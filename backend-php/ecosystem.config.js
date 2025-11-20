/**
 * PM2 Ecosystem Configuration for PHP Backend
 * Install PM2: npm install -g pm2
 * Start: pm2 start ecosystem.config.js
 * Save: pm2 save
 * Enable startup: pm2 startup
 */

module.exports = {
    apps: [{
        name: 'trendy-dresses-backend',
        script: 'php',
        args: '-S 127.0.0.1:8000 -t .',
        cwd: '/var/www/trendydresses.co.ke/backend-php',
        instances: 1,
        exec_mode: 'fork',
        watch: false,
        max_memory_restart: '500M',
        env: {
            NODE_ENV: 'production'
        },
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s',
        restart_delay: 4000
    }]
};

