# Inkbird ITC-308 WiFi

Monitor current temperature, temperature setpoint and heating/cooling status.

# Requirements

- Docker
- sops
- Node.js
- TypeScript

# Run in Docker

    sops --decrypt config/default.encrypted.json > config/default.json
    
    NODE_CONFIG="$(cat config/default.json)" docker-compose up

# Decrypt, edit and encrypt configuration

Decrypt

    sops --decrypt config/default.encrypted.json > config/default.json

Edit `config.default.json`

Encrypt

    sops --encrypt config/default.json > config/default.encrypted.json

Finally, commit and push `config/default.encrypted.json`.