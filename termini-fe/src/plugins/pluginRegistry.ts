// 导入官方插件
import twitterSentimentPlugin from './official/twitter-sentiment';
import marketSignalsPlugin from './official/market-signals';
import tradingChartPlugin from './official/trading-chart';
import cryptoNewsPlugin from './official/crypto-news';
import onchainDataPlugin from './official/onchain-data';
import threadsChatPlugin from './official/threads-chat';
import priceChartPlugin from './official/price-chart';
import orderBookPlugin from './official/order-book';

// 导入主题包装函数
import { wrapPluginWithTheme } from './registry';

// 为每个插件应用主题支持
const wrappedPriceChartPlugin = wrapPluginWithTheme(priceChartPlugin);
const wrappedOrderBookPlugin = wrapPluginWithTheme(orderBookPlugin);
const wrappedTwitterSentimentPlugin = wrapPluginWithTheme(twitterSentimentPlugin);
const wrappedMarketSignalsPlugin = wrapPluginWithTheme(marketSignalsPlugin);
const wrappedTradingChartPlugin = wrapPluginWithTheme(tradingChartPlugin);
const wrappedCryptoNewsPlugin = wrapPluginWithTheme(cryptoNewsPlugin);
const wrappedOnchainDataPlugin = wrapPluginWithTheme(onchainDataPlugin);
const wrappedThreadsChatPlugin = wrapPluginWithTheme(threadsChatPlugin);

// 注册所有插件
export const pluginRegistry = {
  // 官方插件（应用主题支持）
  [priceChartPlugin.metadata.id]: wrappedPriceChartPlugin,
  [orderBookPlugin.metadata.id]: wrappedOrderBookPlugin,
  [twitterSentimentPlugin.metadata.id]: wrappedTwitterSentimentPlugin,
  [marketSignalsPlugin.metadata.id]: wrappedMarketSignalsPlugin,
  [tradingChartPlugin.metadata.id]: wrappedTradingChartPlugin,
  [cryptoNewsPlugin.metadata.id]: wrappedCryptoNewsPlugin,
  [onchainDataPlugin.metadata.id]: wrappedOnchainDataPlugin,
  [threadsChatPlugin.metadata.id]: wrappedThreadsChatPlugin,

  // 用户插件
  // 用户插件也应该应用主题支持
  // [userPlugin.metadata.id]: wrapPluginWithTheme(userPlugin),
};

// 导出插件类型
export type PluginId = keyof typeof pluginRegistry; 