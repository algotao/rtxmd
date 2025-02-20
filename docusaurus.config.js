// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer');
const lightTheme = themes.github;
const darkTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '程序化知识库',
  tagline: 'RTA & RTB & PDB',
  url: 'https://wiki.algo.com.cn',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'algo.com.cn', // Usually your GitHub org/user name.
  projectName: 'rtx', // Usually your repo name.
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },
  scripts: [
    { src: 'https://hm.baidu.com/hm.js?4fe7505b2ad8d0a8fb1ac4db5ab518ad', async: true },
    { src: '/js/bing.js' },
  ],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          //editUrl:
          //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: {
          trackingID: 'G-L7880LB482',
          anonymizeIP: false,
        },
      }),
    ],
  ],
  themes: ['docusaurus-theme-search-typesense'],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: '首页',
        logo: {
          alt: 'Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: '知识',
          }
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '文档',
            items: [
              {
                label: '知识',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: '工具',
            items: [
              {
                label: '质量指标监控',
                href: 'https://stat.algo.com.cn/',
              },
            ],
          },
          {
            title: '更多',
            items: [
            ],
          },
        ],
        copyright: `本站内容由 <b>algotao</b> 整理与编写。<a href="https://beian.miit.gov.cn/" target="_blank">沪ICP备2021035926号-1</a>`,
      },
      prism: {
        theme: lightTheme,
        darkTheme: darkTheme,
        additionalLanguages: ['protobuf', 'http', 'bash'],
      },
      typesense: {
        typesenseCollectionName: 'wiki',
        typesenseServerConfig: {
          nodes: [
            {
              host: 'pi.algo.com.cn',
              port: 443,
              protocol: 'https',
            },
          ],
          apiKey: 's0uaFsTcYWySRCaQc3Nylm5URuB8mPcF',
        },
        typesenseSearchParameters: {},
        contextualSearch: true,
      },
    }),
};

module.exports = config;
