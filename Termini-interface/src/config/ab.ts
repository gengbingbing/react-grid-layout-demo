import mapValues from "lodash/mapValues";
import { AB_FLAG_STORAGE_KEY } from "./localStorage";

/**
 * A/B 测试标志的值类型，包含一个 enabled 属性表示是否启用
 * Type definition for A/B flag value, containing an 'enabled' property indicating whether the flag is enabled
 */
type AbFlagValue = {
  enabled: boolean;
};

/**
 * A/B 测试存储的类型，是一个键值对，键为标志名，值为标志状态
 * Type definition for A/B storage, a key-value pair with flag names as keys and flag states as values
 */
type AbStorage = {
  [key in AbFlag]: AbFlagValue;
};

/**
 * A/B 测试配置，每个标志对应一个概率值（0-1之间）
 * 概率值决定了该标志被启用的可能性
 * 目前所有配置都被注释掉了
 * 
 * A/B test configuration, each flag corresponds to a probability value (between 0-1)
 * The probability value determines the likelihood of the flag being enabled
 * Currently all configurations are commented out
 */
const abFlagsConfig = {
  // testExampleAb: 0.5, // 示例：50%的用户会启用此标志 | Example: 50% of users will have this flag enabled
};

/**
 * AbFlag 类型定义，当前只有一个占位符 "noop"
 * 实际使用时应该是 abFlagsConfig 的键名
 * 
 * AbFlag type definition, currently only has a placeholder "noop"
 * In actual use, it should be the key names from abFlagsConfig
 */
export type AbFlag = "noop"; //keyof typeof abFlagsConfig;

/**
 * 从配置中提取所有标志名称
 * Extract all flag names from the configuration
 */
const flags: AbFlag[] = Object.keys(abFlagsConfig) as AbFlag[];

/**
 * 声明存储 A/B 测试状态的变量
 * Declare the variable to store A/B test states
 */
let abStorage: AbStorage;

/**
 * 初始化 A/B 测试存储
 * 为每个标志随机分配启用状态，概率基于 abFlagsConfig 中的配置
 * 并将结果保存到 localStorage
 * 
 * Initialize A/B test storage
 * Randomly assign enabled states for each flag based on probabilities in abFlagsConfig
 * And save the results to localStorage
 */
function initAbStorage() {
  abStorage = {} as AbStorage;

  /**
   * 遍历所有标志，根据配置的概率随机决定是否启用
   * Iterate through all flags and randomly decide whether to enable based on configured probability
   */
  for (const flag of flags) {
    abStorage[flag] = {
      enabled: Math.random() < abFlagsConfig[flag],
    };
  }

  /**
   * 将 A/B 测试状态保存到 localStorage
   * Save A/B test states to localStorage
   */
  localStorage.setItem(AB_FLAG_STORAGE_KEY, JSON.stringify(abStorage));
}

/**
 * 从 localStorage 加载 A/B 测试状态
 * 如果不存在或解析失败，则初始化新的状态
 * 如果存在但不完整，则更新缺失的部分
 * 
 * Load A/B test states from localStorage
 * If it doesn't exist or fails to parse, initialize new states
 * If it exists but is incomplete, update the missing parts
 */
function loadAbStorage(): void {
  /**
   * 尝试从 localStorage 获取存储的 A/B 测试状态
   * Try to get stored A/B test states from localStorage
   */
  const rawAbStorage = localStorage.getItem(AB_FLAG_STORAGE_KEY);

  if (rawAbStorage === null) {
    /**
     * 如果不存在，初始化新的状态
     * If it doesn't exist, initialize new states
     */
    initAbStorage();
  } else {
    try {
      /**
       * 尝试解析存储的 JSON 数据
       * Try to parse the stored JSON data
       */
      abStorage = JSON.parse(rawAbStorage);

      let changed = false;

      /**
       * 检查是否有新增的标志未在存储中
       * Check if there are new flags not in storage
       */
      for (const flag of flags) {
        if (!abStorage[flag]) {
          /**
           * 为新标志随机分配启用状态
           * Randomly assign enabled state for new flags
           */
          abStorage[flag] = {
            enabled: Math.random() < abFlagsConfig[flag],
          };
          changed = true;
        }
      }

      /**
       * 检查存储中是否有已删除的标志
       * Check if there are deleted flags in storage
       */
      for (const flag of Object.keys(abStorage)) {
        if (!flags.includes(flag as AbFlag)) {
          /**
           * 删除不再使用的标志
           * Delete flags that are no longer used
           */
          // @ts-ignore
          delete abStorage[flag];
          changed = true;
        }
      }

      /**
       * 如果有变更，更新 localStorage
       * If there are changes, update localStorage
       */
      if (changed) {
        localStorage.setItem(AB_FLAG_STORAGE_KEY, JSON.stringify(abStorage));
      }
    } catch (error) {
      /**
       * 如果解析失败，初始化新的状态
       * If parsing fails, initialize new states
       */
      initAbStorage();
    }
  }
}

/**
 * 在模块加载时立即加载 A/B 测试状态
 * Immediately load A/B test states when the module is loaded
 */
loadAbStorage();

/**
 * 获取当前的 A/B 测试存储对象
 * Get the current A/B test storage object
 * 
 * @returns {AbStorage} 当前的 A/B 测试存储对象 | The current A/B test storage object
 */
export function getAbStorage() {
  return abStorage;
}

/**
 * 设置指定标志的启用状态
 * Set the enabled state for a specified flag
 * 
 * @param {AbFlag} flag 要设置的标志名 | The name of the flag to set
 * @param {boolean} enabled 是否启用 | Whether to enable
 */
export function setAbFlagEnabled(flag: AbFlag, enabled: boolean) {
  abStorage[flag] = {
    enabled,
  };

  /**
   * 更新 localStorage
   * Update localStorage
   */
  localStorage.setItem(AB_FLAG_STORAGE_KEY, JSON.stringify(abStorage));
}

/**
 * 检查指定标志是否启用
 * Check if a specified flag is enabled
 * 
 * @param {AbFlag} flag 要检查的标志名 | The name of the flag to check
 * @returns {boolean} 标志是否启用 | Whether the flag is enabled
 */
export function getIsFlagEnabled(flag: AbFlag): boolean {
  return Boolean(abStorage[flag]?.enabled);
}

/**
 * 获取所有 A/B 测试标志的启用状态
 * Get the enabled states of all A/B test flags
 * 
 * @returns {Record<AbFlag, boolean>} 包含所有标志启用状态的对象 | An object containing the enabled states of all flags
 */
export function getAbFlags(): Record<AbFlag, boolean> {
  return mapValues(abStorage, ({ enabled }) => enabled);
}

/**
 * 生成包含所有 A/B 测试标志状态的 URL 参数字符串
 * 格式为 "flag1=1&flag2=0"，其中 1 表示启用，0 表示禁用
 * 
 * Generate a URL parameter string containing all A/B test flag states
 * Format is "flag1=1&flag2=0", where 1 means enabled and 0 means disabled
 * 
 * @returns {string} URL 参数字符串 | URL parameter string
 */
export function getAbFlagUrlParams(): string {
  return Object.entries(abStorage)
    .map(([flag, { enabled }]) => `${flag}=${enabled ? 1 : 0}`)
    .join("&");
}
