import { MINATO_MAINNET, MINATO_TESTNET } from './chains'

export const themes = {
  common: {
    // 字体大小
    fontSize: {
      xs: "10px",           // 超小号字体
      sm: "12px",           // 小号字体
      base: "14px",         // 基础字体大小
      lg: "18px",           // 大号字体
      xl: "20px",           // 超大号字体
      xxl: "24px",          // 标题字体
      xxxl: "30px"          // 大标题字体
    },
    // 字体粗细
    fontWeight: {
      light: 300,           // 细体
      normal: 400,          // 常规
      medium: 500,          // 中等
      semibold: 600,        // 半粗体
      bold: 700             // 粗体
    },
    // 行高
    lineHeight: {
      tight: 1.25,          // 紧凑
      normal: 1.5,          // 常规
      relaxed: 1.75         // 宽松
    },
    // 圆角
    borderRadius: {
      none: "0",            // 无圆角
      sm: "2px",            // 小圆角
      md: "4px",            // 中等圆角
      mds:"6px",
      lg: "8px",            // 大圆角
      xl: "12px",           // 超大圆角
      full: "9999px"        // 完全圆形
    },
    // 间距
    spacing: {
      0: "0",
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      5: "20px",
      6: "24px",
      7: "28px",
      8: "32px",
      9: "36px",
      10: "40px",
      11: "44px",
      12: "48px",
      13: "52px",
      14: "56px",
      15: "60px",
      16: "64px",
      17: "68px",
      18: "72px",
      19: "76px",
      20: "80px",
      21: "84px",
      22: "88px",
      23: "92px",
      24: "96px",
      25: "100px",
      26: "104px",
      27: "108px",
      28: "112px",
      29: "116px",
      30: "120px",
      31: "124px",
      32: "128px",
      33: "132px",
      34: "136px",
      35: "140px",
      36: "144px",
      37: "148px",
      38: "152px",
      39: "156px",
      40: "160px",
      41: "164px",
      42: "168px",
      43: "172px",
      44: "176px",
      45: "180px",
      46: "184px",
      47: "188px",
      48: "192px",
      49: "196px",
      50: "200px"
    },
    // 阴影
    shadow: {
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    },
    // 过渡
    transition: {
      default: "all 0.3s ease",
      fast: "all 0.15s ease",
      slow: "all 0.5s ease"
    },
    // 按钮尺寸
    buttonSize: {
      small: {
        height: "24px",
        padding: "0 8px",
        fontSize: "12px"
      },
      default: {
        height: "36px",
        padding: "0 16px",
        fontSize: "14px"
      },
      large: {
        height: "50px",
        padding: "0 20px",
        fontSize: "16px"
      }
    },
    // 按钮形状
    buttonShape: {
      default: "4px",       // 默认圆角
      round: "9999px",      // 圆形按钮
      circle: "50%"         // 完全圆形（图标按钮）
    },
  },
  [MINATO_MAINNET]: {
    light: {
      color: {
        primary: '#00B8CC',
        bg: {
          base: "#F4F4F4",      //页面主背景色
          main: "#FAFAFA",      //外层容器背景色
          sub: "#FFFFFF",       //内部盒子容器背景色
          tips: "#1D202B",
          active:"#1E2129",
          select:"#FAFAFA",     // 展示容器盒子选中 Tab 后的背景色
          unselect:"#EFEFEF",   // 展示容器盒子未选中 Tab 后的背景色
        },
        border: "#D8DCE1",      //分割线、默认边框
        disabledBorder:"#CFD1D6",
        button: {
          hover: "#00CAE0",     //主要按钮鼠标悬浮状态
          active: "#00B8CC",    //主要按钮选中状态
          disable: "#CFD1D6"    //主要按钮禁用状态
        },
        hover: "#CFD1D6",       //鼠标悬浮状态、导航菜单等
        active: "#00B8CC",      //选中状态，如下拉，tab选中
        disable: "#CFD1D6",     //禁用色
        secondary: "#D2DFE6",   //次要颜色（如"取消"）、图表中的辅助数据线、徽标（Badge）
        tertiary: "#4a4e6d",
        success: "#27AE60",     //成功色、可用按钮背景色，文字、标签等
        warning: "#F2C94C",     //警告色
        error: "#EB5757",       //错误色
        info: "#2D9CDB",        //信息提示色，如帮助说明文本
        text: {
          primary: "#090C12",   //主标题、正文内容、表单输入文字
          secondary: "#707A8A", //副标题、表格描述文字、卡片辅助说明
          tertiary: "#56616C",  //次级文字
          disable: "#707A8A"    //占位符文字、禁用状态文字
        },
        white: "#ffffff",
        black: "#0F111f",
        web3: {
          red: '#DD7789',
          green: '#4FA480',
          yellow: '#D8BA42'
        }
      }
    },
    dark:{
      color: {
        primary: '#00CAE0',
        bg: {
          base: "#06070d",      //页面主背景色
          main: "#181B21",      //外层容器背景色
          sub: "#22252B",       //内部盒子容器背景色
          tips: "#1D202B",
          active:"#1E2129",
          select:"#343A45",     // 展示容器盒子选中 Tab 后的背景色
          unselect:"#141819",   // 展示容器盒子未选中 Tab 后的背景色
        },
        border: "#1F2729",      //分割线、默认边框
        disabledBorder:"#343A45",
        button: {
          hover: "#00A4C2",     //主要按钮鼠标悬浮状态
          active: "#3A3C3E",    //主要按钮选中状态
          disable: "#343A45"    //主要按钮禁用状态
        },
        hover: "#343A45",       //鼠标悬浮状态、导航菜单等
        active: "#00CAE0",      //选中状态，如下拉，tab选中
        disable: "#343A45",     //禁用色
        secondary: "#232B31",   //次要颜色（如"取消"）、图表中的辅助数据线、徽标（Badge）
        tertiary: "#4a4e6d",
        success: "#27AE60",     //成功色、可用按钮背景色，文字、标签等
        warning: "#F2C94C",     //警告色
        error: "#EB5757",       //错误色
        info: "#2D9CDB",        //信息提示色，如帮助说明文本
        text: {
          primary: "#EBF8FF",   //主标题、正文内容、表单输入文字
          secondary: "#BACBD5", //副标题、表格描述文字、卡片辅助说明
          tertiary: "#94A2AA",  //次级文字
          disable: "#6E7880"    //占位符文字、禁用状态文字
        },
        white: "#ffffff",
        black: "#0F111f",
        web3: {
          red: '#DD7789',
          green: '#4FA480',
          yellow: '#D8BA42'
        }
      }
    },
  },
  [MINATO_TESTNET]: {
    light: {
      color: {
        primary: '#00B8CC',
        bg: {
          base: "#F4F4F4",      //页面主背景色
          main: "#FAFAFA",      //外层容器背景色
          sub: "#FFFFFF",       //内部盒子容器背景色
          tips: "#1D202B",
          active:"#CFD1D6",
          select:"#FAFAFA",     // 展示容器盒子选中 Tab 后的背景色
          unselect:"#EFEFEF",   // 展示容器盒子未选中 Tab 后的背景色
        },
        border: "#D8DCE1",      //分割线、默认边框
        disabledBorder:"#CFD1D6",
        button: {
          hover: "#00CAE0",     //主要按钮鼠标悬浮状态
          active: "#00B8CC",    //主要按钮选中状态
          disable: "#CFD1D6"    //主要按钮禁用状态
        },
        hover: "#CFD1D6",       //鼠标悬浮状态、导航菜单等
        active: "#00B8CC",      //选中状态，如下拉，tab选中
        disable: "#CFD1D6",     //禁用色
        secondary: "#D2DFE6",   //次要颜色（如"取消"）、图表中的辅助数据线、徽标（Badge）
        tertiary: "#4a4e6d",
        success: "#27AE60",     //成功色、可用按钮背景色，文字、标签等
        warning: "#F2C94C",     //警告色
        error: "#EB5757",       //错误色
        info: "#2D9CDB",        //信息提示色，如帮助说明文本
        text: {
          primary: "#090C12",   //主标题、正文内容、表单输入文字
          secondary: "#707A8A", //副标题、表格描述文字、卡片辅助说明
          tertiary: "#56616C",  //次级文字
          disable: "#707A8A"    //占位符文字、禁用状态文字
        },
        white: "#ffffff",
        black: "#0F111f",
        web3: {
          red: '#DD7789',
          green: '#4FA480',
          yellow: '#D8BA42'
        }
      }
    },
    dark:{
      color: {
        primary: '#00CAE0',
        bg: {
          base: "#06070d",      //页面主背景色
          main: "#181B21",      //外层容器背景色
          sub: "#22252B",       //内部盒子容器背景色
          tips: "#1D202B",
          active:"#1E2129",
          select:"#343A45",     // 展示容器盒子选中 Tab 后的背景色
          unselect:"#141819",   // 展示容器盒子未选中 Tab 后的背景色
        },
        border: "#1F2729",      //分割线、默认边框
        disabledBorder:"#343A45",
        button: {
          hover: "#00A4C2",     //主要按钮鼠标悬浮状态
          active: "#3A3C3E",    //主要按钮选中状态
          disable: "#343A45"    //主要按钮禁用状态
        },
        hover: "#343A45",       //鼠标悬浮状态、导航菜单等
        active: "#00CAE0",      //选中状态，如下拉，tab选中
        disable: "#343A45",     //禁用色
        secondary: "#232B31",   //次要颜色（如"取消"）、图表中的辅助数据线、徽标（Badge）
        tertiary: "#4a4e6d",
        success: "#27AE60",     //成功色、可用按钮背景色，文字、标签等
        warning: "#F2C94C",     //警告色
        error: "#EB5757",       //错误色
        info: "#2D9CDB",        //信息提示色，如帮助说明文本
        text: {
          primary: "#EBF8FF",   //主标题、正文内容、表单输入文字
          secondary: "#BACBD5", //副标题、表格描述文字、卡片辅助说明
          tertiary: "#94A2AA",  //次级文字
          disable: "#6E7880"    //占位符文字、禁用状态文字
        },
        white: "#ffffff",
        black: "#0F111f",
        web3: {
          red: '#DD7789',
          green: '#4FA480',
          yellow: '#D8BA42'
        }
      }
    },
  },
}