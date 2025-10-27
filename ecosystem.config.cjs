module.exports = {
  apps: [
    {
      name: 'cswind-mto',
      script: 'python3',
      args: '-m http.server 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
