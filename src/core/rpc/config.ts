
export function rpc_create_config() {
    const fs = require('fs');
    const rpcconfigplacehalder = [
        {
            "host": "localhost",
            "port": 8575,
            "protocol": "http",
            "type": "rpc"
        },
        {
            "host": "rpc.example.com",
            "port": 443,
            "protocol": "https",
            "type": "rpc"
        },
        {
            // Example IPFS gateway entry. Either provide a gateway URL or an api object.
            "type": "ipfs",
            "gateway": "https://ipfs.io"
        }
    ];

    fs.writeFile('vx.config.json', JSON.stringify(rpcconfigplacehalder, null, 2), (err) => {
        if (err) {
            console.error('ERR!', err);
            process.exit(1);
        } else {
            if (!fs.existsSync('vx.config.json')) {
                console.error('vx.config.json does not exist and could not be created.');
                process.exit(1);
            }
            console.log('vx.config.json created successfully!');
            process.exit(0);
        }
    });
}

