const path = require( 'path' );
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
    context: __dirname,
    entry: './src/index.js',
    output: {
        path: path.resolve( __dirname, 'dist' ),
        filename: 'golfity.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            }
        ]
    },
    plugins: [
        new BrowserSyncPlugin({
            host: 'localhost',
            port: 3000,
            server: { baseDir: '.' },
        }),
    ],
};
