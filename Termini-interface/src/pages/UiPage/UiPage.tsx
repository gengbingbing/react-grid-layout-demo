import camelCase from "lodash/camelCase";
import entries from "lodash/entries";
import mapKeys from "lodash/mapKeys";
import upperFirst from "lodash/upperFirst";
import Footer from "components/Footer/Footer";
import { Button, ButtonGroup } from 'components/Button';
import { MINATO_MAINNET, MINATO_TESTNET, getChainName } from "config/chains";
import { getCategoryTokenAddresses, getToken } from "config/tokens";
import { TokenCategory } from "config/static/tokens";
import Tooltip from "components/Tooltip/Tooltip";
import { 
  FiSearch, 
  FiDownload, 
  FiEdit, 
  FiTrash2, 
  FiChevronRight,
  FiPlus,
  FiMinus,
  FiCheck,
  FiX,
  FiSettings,
  FiArrowLeft,
  FiArrowRight,
  FiSave,
  FiShare2,
  FiUpload
} from 'react-icons/fi';
import { useReducer } from "react";
const iconsContext = mapKeys(
  import.meta.glob("img/ic_*.svg", {
    query: "?url",
    import: "default",
    eager: true,
  }),
  (_, key) => key.split("/").pop()
);

const icons = Object.keys(iconsContext).map((rawPath) => {
  let name = camelCase(rawPath.match(/ic_(.+)\.svg$/)?.[1]) + "Icon";

  if (/[0-9]/.test(name[0])) {
    name = camelCase("ic " + name);
  }

  let componentName = upperFirst(name);

  return {
    path: rawPath,
    name: name,
    importUrl: `import ${name} from "${rawPath}";`,
    importSvg: `import ${componentName} from "${rawPath}";`,
    src: iconsContext[rawPath],
  };
}) as { src: string; name: string; path: string; importUrl: string; importSvg: string }[];

const otherImagesContext = mapKeys(
  import.meta.glob("img/**/*.{png,jpg,jpeg,gif,svg}", {
    query: "?url",
    import: "default",
    eager: true,
  }),
  (_, key) => key.split("/").pop()
);

const otherImages = Object.keys(otherImagesContext)
  .filter((key) => !key.includes("/ic_"))
  .map((key) => {
    let name = camelCase(key.match(/img\/(.+)\.(png|jpg|jpeg|gif|svg)$/)?.[1]) + "Image";

    if (/[0-9]/.test(name[0])) {
      name = "img" + name;
    }

    return {
      path: key,
      name: name,
      importUrl: `import ${name} from "${key}";`,
      src: otherImagesContext[key],
    };
  }) as { src: string; name: string; path: string; importUrl: string }[];

const colors = {
  blue: {
    "300": "bg-blue-300",
    "400": "bg-blue-400",
    "500": "bg-blue-500",
    "600": "bg-blue-600",
    "700": "bg-blue-700",
  },
  "cold-blue": {
    "500": "bg-cold-blue-500",
    "700": "bg-cold-blue-700",
    "900": "bg-cold-blue-900",
  },
  slate: {
    "100": "bg-slate-100",
    "500": "bg-slate-500",
    "600": "bg-slate-600",
    "700": "bg-slate-700",
    "800": "bg-slate-800",
    "900": "bg-slate-900",
    "950": "bg-slate-950",
  },
  gray: {
    "50": "bg-gray-50",
    "100": "bg-gray-100",
    "200": "bg-gray-200",
    "300": "bg-gray-300",
    "400": "bg-gray-400",
    "500": "bg-gray-500",
    "600": "bg-gray-600",
    "700": "bg-gray-700",
    "800": "bg-gray-800",
    "900": "bg-gray-900",
    "950": "bg-gray-950",
  },
  yellow: {
    "300": "bg-yellow-300",
    "500": "bg-yellow-500",
  },
  red: {
    "400": "bg-red-400",
    "500": "bg-red-500",
  },
  green: {
    "300": "bg-green-300",
    "500": "bg-green-500",
  },
  white: "bg-white",
  black: "bg-black",
};
export default function UiPage() {
  function reducer(state, action) {
    switch (action.type) {
      case 'INCREMENT':
        return { count: state.count + 1 };
      case 'DECREMENT':
        return { count: state.count - 1 };
      case 'RESET':
        return { count: 0 };
      default:
        throw new Error('Unknown action type');
    }
  }

  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <main className="mx-auto max-w-[1265px] p-20">
      <div>
        <p>Count: {state.count}</p>
        <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
        <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
        <button onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
      </div>
      
      <div style={{ padding: '24px', background: 'var(--color-bg-base)' }}>
        {/* 基础按钮类型 */}
        <div style={{ marginBottom: '24px' }}>
          <h3>基础按钮类型</h3>
          <Button type="primary" onClick={() => console.log('clicked')}>主按钮</Button>
          <Button type="default" style={{ marginLeft: '8px' }}>次要按钮</Button>
          <Button type="tertiary" style={{ marginLeft: '8px' }}>第三级按钮</Button>
          <Button type="dashed" style={{ marginLeft: '8px' }}>虚线按钮</Button>
          <Button type="text" style={{ marginLeft: '8px' }}>文本按钮</Button>
          <Button type="link" style={{ marginLeft: '8px' }}>链接按钮</Button>
          <Button type="ghost" style={{ marginLeft: '8px' }}>幽灵按钮</Button>
        </div>

        {/* 图标按钮 */}
        <div style={{ marginBottom: '24px' }}>
          <h3>图标按钮</h3>
          <Button type="primary" shape="circle" icon={<FiPlus />} />
          <Button type="primary" shape="circle" icon={<FiSearch />} style={{ marginLeft: '8px' }} />
          <Button type="default" shape="circle" icon={<FiSettings />} style={{ marginLeft: '8px' }} />
          <Button
            type="default"
            shape="circle"
            status="danger"
            icon={<FiX />}
            style={{ marginLeft: '8px' }}
          />
        </div>

        {/* 带图标的按钮 */}
        <div style={{ marginBottom: '24px' }}>
          <h3>带图标的按钮</h3>
          <Button type="primary" icon={<FiSearch />}>搜索</Button>
          <Button type="primary" icon={<FiDownload />} style={{ marginLeft: '8px' }}>下载</Button>
          <Button type="default" icon={<FiEdit />} style={{ marginLeft: '8px' }}>编辑</Button>
          <Button
            type="default"
            status="danger"
            icon={<FiTrash2 />}
            style={{ marginLeft: '8px' }}
          >
            删除
          </Button>
          <Button
            type="primary"
            icon={<FiChevronRight />}
            iconPosition="right"
            style={{ marginLeft: '8px' }}
          >
            下一步
          </Button>
        </div>

        {/* 不同状态的图标按钮 */}
        <div style={{ marginBottom: '24px' }}>
          <h3>不同状态的图标按钮</h3>
          <Button type="primary" status="success" icon={<FiCheck />}>
            确认
          </Button>
          <Button
            type="primary"
            status="warning"
            icon={<FiSettings />}
            style={{ marginLeft: '8px' }}
          >
            设置
          </Button>
          <Button
            type="primary"
            status="danger"
            icon={<FiX />}
            style={{ marginLeft: '8px' }}
          >
            取消
          </Button>
          <Button
            type="primary"
            status="info"
            icon={<FiShare2 />}
            style={{ marginLeft: '8px' }}
          >
            分享
          </Button>
        </div>

        {/* 加载状态 */}
        <div style={{ marginBottom: '24px' }}>
          <h3>加载状态</h3>
          <Button type="primary" loading icon={<FiDownload />}>
            下载中
          </Button>
          <Button
            type="default"
            loading
            icon={<FiSave />}
            style={{ marginLeft: '8px' }}
          >
            保存中
          </Button>
        </div>

        {/* 按钮组 */}
        <div style={{ marginBottom: '24px' }}>
          <h3>按钮组</h3>
          <ButtonGroup>
            <Button type="default" icon={<FiMinus />} />
            <Button type="default">100</Button>
            <Button type="default" icon={<FiPlus />} />
          </ButtonGroup>

          <ButtonGroup style={{ marginLeft: '8px' }}>
            <Button type="primary" icon={<FiArrowLeft />}>上一页</Button>
            <Button type="primary" icon={<FiArrowRight />} iconPosition="right">
              下一页
            </Button>
          </ButtonGroup>
        </div>

        {/* 组合使用示例 */}
        <div style={{ marginBottom: '24px' }}>
          <h3>组合使用示例</h3>
          <Button
            type="primary"
            size="large"
            icon={<FiDownload />}
            onClick={() => console.log('下载开始')}
          >
            开始下载
          </Button>

          <ButtonGroup style={{ marginLeft: '8px' }}>
            <Button
              type="default"
              icon={<FiEdit />}
              size="small"
            >
              编辑
            </Button>
            <Button
              type="default"
              status="danger"
              icon={<FiTrash2 />}
              size="small"
            >
              删除
            </Button>
          </ButtonGroup>
        </div>

        {/* 常见业务场景 */}
        <div style={{ marginBottom: '24px' }}>
          <h3>常见业务场景</h3>
          {/* 表单提交场景 */}
          <div style={{ marginBottom: '16px' }}>
            <Button type="default" icon={<FiX />} style={{ marginRight: '8px' }}>
              取消
            </Button>
            <Button type="primary" icon={<FiCheck />}>
              确认
            </Button>
          </div>

          {/* 文件操作场景 */}
          <div style={{ marginBottom: '16px' }}>
            <Button type="primary" icon={<FiUpload />} style={{ marginRight: '8px' }}>
              上传文件
            </Button>
            <Button type="default" icon={<FiDownload />}>
              下载文件
            </Button>
          </div>

          {/* 设置场景 */}
          <div>
            <Button
              type="default"
              icon={<FiSettings />}
              shape="round"
            >
              系统设置
            </Button>
          </div>
        </div>
      </div>
      <h1 className="text-34 font-bold">UI Page</h1>

      <p>This page demonstrates the use of the UI components in the app.</p>

      <h2 className="mb-16 mt-24 text-24 font-bold">Fill colors</h2>
      <div className="overflow-auto">
        <div className="flex flex-col">
          {entries(colors).map(([color, shades]) => {
            if (typeof shades === "string") {
              return (
                <div key={color}>
                  <div className="flex w-fit overflow-hidden *:size-64">
                    <div className="!w-96 text-12">{color}</div>
                    <div className={shades} />
                  </div>
                </div>
              );
            }

            return (
              <div key={color}>
                <div className="flex w-fit overflow-hidden *:size-64">
                  <div className="!w-96 text-12"> {color}</div>
                  {entries(shades).map(([shade, value]) => {
                    if (shade === "DEFAULT") return <div key={shade + value} className={value}></div>;
                    return (
                      <div key={shade + value} className={value}>
                        {shade}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="mb-16 mt-24 text-24 font-bold">Text colors</h2>

      <div className="flex gap-16">
        <p className="text-blue-500">Blue text is blue</p>
        <p className="text-gray-300">Gray text is gray</p>
        <p className="text-yellow-500">Yellow text is yellow</p>
        <p className="text-red-500">Red text is red</p>
        <p className="text-green-500">Green text is green</p>
        <p className="text-white">White text is white</p>
      </div>
      <p className="mt-8 text-white underline decoration-gray-400 decoration-dashed decoration-8">
        Decoration is gray-400
      </p>

      <h2 className="mb-16 mt-24 text-24 font-bold">Font sizes</h2>
      <div className="flex flex-col gap-16">
        <div className="flex items-baseline gap-8">
          <div>h1</div>
          <p className="text-h1">H1 Text Size</p>
        </div>
        <div className="flex items-baseline gap-8">
          <div>h2</div>
          <p className="text-h2">H2 Text size</p>
        </div>
        <div className="flex items-baseline gap-8">
          <div>Body Large</div>
          <p className="text-body-large">Some important text indeed</p>
        </div>
        <div className="flex items-baseline gap-8">
          <div>Medium</div>
          <p className="text-body-medium">Base text it is. Nothing special</p>
        </div>
        <div className="flex items-baseline gap-8">
          <div>Small</div>
          <p className="text-body-small">Somewhat unimportant text, but still readable</p>
        </div>
        <div className="flex items-baseline gap-8">
          <div>Caption</div>
          <p className="text-caption">Somewhat unimportant text, but still readable</p>
        </div>

        <div className="flex items-baseline gap-8">
          <div>&lt;unset&gt;</div>
          <p>Text with no size set</p>
        </div>
      </div>

      <h2 className="mb-16 mt-24 text-24 font-bold">Line heights</h2>
      <div className="flex flex-col gap-16">
        <p className="leading-1">
          leading-1
          <br />
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus beatae atque eligendi sunt quasi et porro
          nemo cumque nesciunt dolorum earum, minus fuga similique exercitationem ad. Eos omnis vitae suscipit
          recusandae iste adipisci quasi rem odio, quidem qui modi impedit quibusdam culpa nemo distinctio rerum tempora
          sequi facilis quaerat laudantium pariatur dicta ab. Pariatur mollitia magni consectetur praesentium nulla
          nobis non voluptates laborum obcaecati enim unde, in tempore voluptas, expedita aut corrupti ipsum sequi
          consequatur iste corporis quasi! Officia nihil pariatur, asperiores molestiae quia earum tempora, in neque
          inventore quisquam dolore veniam minus beatae adipisci quod hic? Saepe, aperiam consequuntur!
        </p>
        <p className="leading-base">
          leading-base
          <br />
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus beatae atque eligendi sunt quasi et porro
          nemo cumque nesciunt dolorum earum, minus fuga similique exercitationem ad. Eos omnis vitae suscipit
          recusandae iste adipisci quasi rem odio, quidem qui modi impedit quibusdam culpa nemo distinctio rerum tempora
          sequi facilis quaerat laudantium pariatur dicta ab. Pariatur mollitia magni consectetur praesentium nulla
          nobis non voluptates laborum obcaecati enim unde, in tempore voluptas, expedita aut corrupti ipsum sequi
          consequatur iste corporis quasi! Officia nihil pariatur, asperiores molestiae quia earum tempora, in neque
          inventore quisquam dolore veniam minus beatae adipisci quod hic? Saepe, aperiam consequuntur!
        </p>
      </div>

      <h2 className="mb-16 mt-24 text-24 font-bold">Tooltips</h2>

      <Tooltip
        content={
          <>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam enim excepturi veritatis, architecto ab
            qui odio repudiandae vero accusantium dicta, eius similique a aspernatur, maxime iste ipsam facilis. Libero,
            et.
            <br />
            <br />
          </>
        }
        handle={"Lorem ipsum dolor."}
        closeDelay={100000000000}
      />

      <h2 className="mb-16 mt-24 text-24 font-bold">Token categories</h2>

      <div className="flex flex-col gap-16">
        {[MINATO_MAINNET, MINATO_TESTNET].map((chainId) => (
          <div key={chainId}>
            <h3 className="text-h3">{getChainName(chainId)}</h3>
            {["meme", "layer1", "layer2", "defi"].map((category) => (
              <div key={category}>
                <h3 className="text-h3">{category}</h3>
                <div className="flex flex-wrap gap-4">
                  {getCategoryTokenAddresses(chainId, category as TokenCategory).map((tokenAddress) => (
                    <div key={tokenAddress}>{getToken(chainId, tokenAddress)?.symbol}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <h2 className="mb-16 mt-24 text-24 font-bold">Icons</h2>
      <style>{`.ImageTooltip .Tooltip-popup {max-width: unset !important;}`}</style>
      <div className="relative left-1/2 flex w-screen -translate-x-1/2 flex-wrap items-center gap-16 px-20">
        {icons.map((icon) => (
          <Tooltip
            key={icon.src}
            disableHandleStyle
            as={"div"}
            className="ImageTooltip"
            closeDelay={500}
            content={
              <div>
                <pre>
                  <code>
                    Name: {icon.name}
                    <br />
                    Path: {icon.path}
                    <br />
                    Import URL: {icon.importUrl}
                    <br />
                    Import SVG: {icon.importSvg}
                  </code>
                </pre>
              </div>
            }
          >
            <img className="max-w-[50px]" src={icon.src} />
          </Tooltip>
        ))}
      </div>

      <h2 className="mb-16 mt-24 text-24 font-bold">Images</h2>

      <div className="relative left-1/2 flex w-screen -translate-x-1/2 flex-wrap items-center gap-16 px-20">
        {otherImages.map((src) => (
          <Tooltip
            key={src.src}
            disableHandleStyle
            as={"div"}
            className="ImageTooltip"
            closeDelay={500}
            content={
              <div>
                <pre>
                  <code>
                    Name: {src.name}
                    <br />
                    Path: {src.path}
                    <br />
                    Import URL: {src.importUrl}
                  </code>
                </pre>
              </div>
            }
          >
            <img className="max-w-[100px]" src={src.src} />
          </Tooltip>
        ))}
      </div>

    </main>
  );
}
