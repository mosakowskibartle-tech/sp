// PM2 конфигурация для автозапуска сервера
// Запуск: pm2 start ecosystem.config.cjs
// Автозапуск при перезагрузке: pm2 startup && pm2 save

module.exports = {
  apps: [{
    name: 'sol-perec',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
