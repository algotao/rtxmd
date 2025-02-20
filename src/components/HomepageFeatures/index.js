import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'RTA',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        RTA（Real Time API）基于轻量级的交互接口，在标准 <code>直投</code> 广告的基础上引入广告主实时决策，实现人群筛选、用户分层、商品推荐等能力的扩展。
      </>
    ),
  },
  {
    title: 'RTB',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        RTB（Real Time Bidding）实时竞价广告由DSP进行广告推荐。
        尚未编写
      </>
    ),
  },
  {
    title: 'PDB',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        尚未编写
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
