const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const webpackConfig = require('./webpack.config')

module.exports = {
  ...webpackConfig,
  mode: 'production',
  watch: false,
  entry: {
    // main: __dirname + '/src/index.tsx'
    main: path.join(__dirname, '/src/index.tsx')
  },
  output: {
    // path: __dirname + '/dist',
    // path: path.join(__dirname, '/dist'),
    path: path.resolve(__dirname, 'dist'),
    filename: 'static/js/[name].[hash:8].js',
    chunkFilename: 'static/js/[name].[hash:8].chunk.js',
    publicPath: '/'
  },
  plugins: [
    ...webpackConfig.plugins,
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'public/index.html'
    }),
    new CopyPlugin({
      patterns: [{ from: 'public', to: './' }]
    }),
    new CompressionPlugin({
      test: /\.(js|css|csv)$/,
      algorithm: 'gzip',
      threshold: 8192
    })
  ],
  optimization: {
    usedExports: true,
    sideEffects: true,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        sourceMap: false,
        terserOptions: {
          compress: {
            drop_console: process.env.EXECUTE_ENV !== 'dev'
          }
        }
      })
    ],
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        common: {
          test: /[\\/]node_modules[\\/]/,
          name: 'common',
          chunks: 'initial',
          priority: 2,
          minChunks: 2
        },
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
          priority: 20
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  node: {
    fs: 'empty',
    net: 'empty'
  }
}
