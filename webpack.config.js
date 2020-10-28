const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const Dotenv = require('dotenv-webpack')

module.exports = {
  devtool: 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', 'jsx', '.json', '.css'],
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(js|jsx)$/,
        loader: 'source-map-loader'
      },
      {
        test: /\.(ts|tsx)?$/,
        exclude: /node_modules/,
        use: [{ loader: 'ts-loader', options: { transpileOnly: true } }]
      },
      {
        test: /\.(css)$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          }
        ]
      },
      {
        test: /\.(bmp|gif|jpg|jpeg|png|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]?[hash:8]'
        }
      }
    ]
  },
  plugins: [
    new Dotenv({
      path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
    }),
    new ForkTsCheckerWebpackPlugin({
      workers: 4,
      checkSyntacticErrors: true,
      useTypescriptIncrementalAPI: true,
      async: false,
      watch: ['src/']
    })
  ]
}
