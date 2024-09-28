export interface ListItem {
  name: string;
  value: number;
}

export interface DataItem {
  date: string;
  list: ListItem[];
}

export interface DataItemWithTotal extends DataItem {
  total: number;
}

export const defaultData: DataItem[] = [
  {
    date: '2022年02月',
    list: [
      {
        name: '安列克-常州四药',
        value: 48196
      },
      {
        name: '贝克宁-成都贝特',
        value: 85944
      },
      {
        name: '瀚宝-深圳瀚宇',
        value: 43122
      },
      {
        name: '卡贝缩宫素-杭州澳亚',
        value: 46082
      },
      {
        name: '卡贝缩宫素-天吉生物',
        value: 28473
      },
      {
        name: '卡贝缩宫素-星银药业',
        value: 20584
      }
    ]
  },
  {
    date: '2022年03月',
    list: [
      {
        name: '安列克-常州四药',
        value: 97775
      },
      {
        name: '贝克宁-成都贝特',
        value: 134262
      },
      {
        name: '瀚宝-深圳瀚宇',
        value: 102538
      },
      {
        name: '卡贝缩宫素-杭州澳亚',
        value: 77479
      },
      {
        name: '卡贝缩宫素-天吉生物',
        value: 59422
      },
      {
        name: '卡贝缩宫素-星银药业',
        value: 32413
      }
    ]
  },
  {
    date: '2022年04月',
    list: [
      {
        name: '安列克-常州四药',
        value: 91399
      },
      {
        name: '贝克宁-成都贝特',
        value: 151064
      },
      {
        name: '瀚宝-深圳瀚宇',
        value: 74733
      },
      {
        name: '卡贝缩宫素-杭州澳亚',
        value: 75197
      },
      {
        name: '卡贝缩宫素-天吉生物',
        value: 46853
      },
      {
        name: '卡贝缩宫素-星银药业',
        value: 24845
      }
    ]
  },
  {
    date: '2022年05月',
    list: [
      {
        name: '安列克-常州四药',
        value: 83667
      },
      {
        name: '贝克宁-成都贝特',
        value: 114716
      },
      {
        name: '瀚宝-深圳瀚宇',
        value: 57327
      },
      {
        name: '卡贝缩宫素-杭州澳亚',
        value: 62267
      },
      {
        name: '卡贝缩宫素-天吉生物',
        value: 38604
      },
      {
        name: '卡贝缩宫素-星银药业',
        value: 19766
      }
    ]
  },
  {
    date: '2022年06月',
    list: [
      {
        name: '安列克-常州四药',
        value: 80524
      },
      {
        name: '贝克宁-成都贝特',
        value: 155227
      },
      {
        name: '瀚宝-深圳瀚宇',
        value: 67098
      },
      {
        name: '卡贝缩宫素-杭州澳亚',
        value: 61857
      },
      {
        name: '卡贝缩宫素-天吉生物',
        value: 44098
      },
      {
        name: '卡贝缩宫素-星银药业',
        value: 26956
      }
    ]
  },
  {
    date: '2022年07月',
    list: [
      {
        name: '安列克-常州四药',
        value: 92172
      },
      {
        name: '贝克宁-成都贝特',
        value: 118129
      },
      {
        name: '瀚宝-深圳瀚宇',
        value: 61548
      },
      {
        name: '卡贝缩宫素-杭州澳亚',
        value: 64490
      },
      {
        name: '卡贝缩宫素-天吉生物',
        value: 38073
      },
      {
        name: '卡贝缩宫素-星银药业',
        value: 21705
      }
    ]
  },
  {
    date: '2022年08月',
    list: [
      {
        name: '安列克-常州四药',
        value: 94615
      },
      {
        name: '贝克宁-成都贝特',
        value: 119397
      },
      {
        name: '瀚宝-深圳瀚宇',
        value: 60547
      },
      {
        name: '卡贝缩宫素-杭州澳亚',
        value: 73835
      },
      {
        name: '卡贝缩宫素-天吉生物',
        value: 37406
      },
      {
        name: '卡贝缩宫素-星银药业',
        value: 26228
      }
    ]
  }
]
