// 按需引入 ECharts 核心模块
import * as echarts from 'echarts/core';
// 引入柱状图图表，图表后缀都为 Chart
import { ScatterChart, LineChart } from 'echarts/charts';
// 引入提示框，标题，直角坐标系，数据集，内置数据转换器组件，组件后缀都为 Component
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent
} from 'echarts/components';
// 标签自动布局、全局过渡动画等特性
import { LabelLayout, UniversalTransition } from 'echarts/features';
// 引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
import { CanvasRenderer } from 'echarts/renderers';

import { merge, set } from 'lodash-es';
import { defaultData } from './data';

// 注册必须的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ScatterChart,
  LineChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer
]);

var dom = document.getElementById('chart-container');
var myChart = echarts.init(dom, null, {
  renderer: 'canvas',
  useDirtyRect: false
});
var app = {};

var option;



function formatMoney(money) {
  return money
}

function run({ data = defaultData, height = 500 }) {
  const chartHeight = height;
  const maxY = 100;
  const maxHeight = chartHeight - maxY;

  function createData(initData = []) {
    const list = initData?.map((item) => ({
      ...item,
      total: item.list.reduce((pre, cur) => pre + cur.value, 0),
      list: item.list?.sort((a, b) => a.value - b.value)
    }));
    const legendData = [];
    const xAxisData = [];
    const seriesDataMap = {};
    let max = 0;

    // 生成x轴、图例数据
    for (const dateIndex in list) {
      const item = list[dateIndex];
      xAxisData.push(item.date);
      if (dateIndex < list?.length - 1) {
        new Array(3).fill(0).forEach((_, lineIndex) => {
          xAxisData.push(`line-${lineIndex}`);
        });
      }
      max = Math.max(max, item.total);
      for (const index in item.list) {
        const dataItem = item.list[index];
        if (!legendData?.includes(dataItem.name)) {
          legendData.push(dataItem.name);
        }
      }
    }

    // 根据图例生成数据
    for (const index in list) {
      const item = list[index];
      for (const name of legendData) {
        const dataItem = item?.list?.find((dataItem) => dataItem.name === name);
        set(seriesDataMap, `${name}.${index}`, dataItem?.value);
      }
    }

    const result = { list, legendData, xAxisData, seriesDataMap, max };
    // console.log('result', result);
    return result;
  }

  function createLineChart({ seriesData = [], initDataResult }) {
    const { list, max } = initDataResult;
    const spaceLineSeries = [];
    const lineSeries = [];
    // console.log('seriesData', seriesData);
    for (const seriesIndex in seriesData) {
      const seriesItem = seriesData[seriesIndex];
      const defaultLineSeries = {
        type: 'line',
        name: seriesItem.name,
        stack: `Line-${seriesIndex}`,
        smooth: 0.3,
        lineStyle: {
          width: 0,
          opacity: 0
        },
        symbol: 'none',
        showSymbol: false,
        triggerLineEvent: true,
        silent: true,
        areaStyle: {},
        emphasis: {
          focus: 'series'
        }
      };

      spaceLineSeries.push({
        ...defaultLineSeries,
        areaStyle: {
          opacity: 0
        },
        data: getLineData(seriesItem?.data, seriesItem.name, true)
      });

      lineSeries.push({
        ...defaultLineSeries,
        data: getLineData(seriesItem?.data, seriesItem.name)
      });
    }

    function getLineData(data, name, isSpace = false) {
      const result = data?.map((_, index) => {
        const dateIndex = Math.floor(index / 4);
        const lineIndex = index % 4;

        const item = data?.[index] || {};
        const lastItem = data?.[index - (4 - lineIndex)] || {};
        const nextItem = data?.[index + (4 - lineIndex)] || {};

        const offset = getOffset({ list, dateIndex, name, max });
        const nextOffset = getOffset({ list, dateIndex: dateIndex + 1, name, max });
        let spaceValue;
        let value = item.radioValue - offset;

        switch (lineIndex) {
          case 0:
            spaceValue = offset;
            break;
          case 1:
            spaceValue = offset;
            if (!nextItem?.radioValue) {
              value = undefined;
            }
            break;
          case 2:
            spaceValue = (nextOffset + offset) / 2;
            value = (nextItem.radioValue + item.radioValue) / 2 - spaceValue;
            break;
          case 3:
            spaceValue = nextOffset;
            value = nextItem.radioValue - nextOffset;
            if (!lastItem?.radioValue) {
              value = undefined;
            }
            break;
        }
        if (!lastItem?.radioValue && !nextItem?.radioValue) {
          value = undefined;
        }
        // console.log(lineIndex, item, offset, nextOffset, spaceValue, value);
        const newItem = {
          ...item,
          value: isSpace ? spaceValue : value
        };
        return newItem;
      });
      // console.log('result', result);
      return result;
    }

    return [...spaceLineSeries, ...lineSeries];
  }

  function createOption(initData) {
    const initDataResult = createData(initData);
    const { list, legendData, xAxisData, seriesDataMap, max } = initDataResult;
    const seriesData = [];

    for (const seriesIndex in Object.keys(seriesDataMap)) {
      const name = Object.keys(seriesDataMap)[seriesIndex];
      const data = seriesDataMap[name];
      seriesData.push({
        name,
        type: 'scatter',
        symbol: 'rect',
        z: 3,
        itemStyle: {
          opacity: 1
        },
        label: {
          show: true,
          color: '#fff',
          formatter: (params) => formatMoney(params.data.realValue, 0)
        },
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            return `<div>
            <div>年度月份：${params.name}</div>
            <div>${params.seriesName}：${formatMoney(params.data.realValue, 0)}</div>
          </div>`;
          }
        },
        data: getChartData({ data, name })
      });
    }

    function getChartData({ data = [], name }) {
      const dataResult = [];
      data?.forEach((value, dateIndex) => {
        const y = maxY * (value / max);
        const ySize = maxHeight * (y / maxY);
        const offset = getOffset({ list, dateIndex, name, max });
        const radioValue = y + offset > 100 ? 100 : y + offset;

        dataResult.push({
          name,
          value: radioValue,
          radioValue,
          realValue: value,
          symbolOffset: [0, '50%'],
          symbolSize: [50, ySize]
        });

        if (dateIndex < data?.length - 1) {
          new Array(3).fill(0).forEach((_, lineIndex) => {
            dataResult.push({
              value: '',
              radioValue,
              realValue: value,
              isLine: true,
              lineIndex
            });
          });
        }
      });
      return dataResult;
    }

    const lineSeries = createLineChart({ seriesData, initDataResult });

    return {
      option: {
        legend: {
          data: legendData
        },
        xAxis: {
          data: xAxisData,
          axisTick: {
            show: false
          }
        },
        series: [...seriesData, ...lineSeries]
      }
    };
  }

  function getOffset({ list, dateIndex, name, max }) {
    const dateData = list[dateIndex]?.list || [];
    const itemIndex = dateData?.findIndex((item) => item.name === name);

    let offset = 0;
    for (let i = 0; i < itemIndex; i++) {
      const itemValue = dateData[i].value;
      offset += maxY * (itemValue / max);
    }

    return offset;
  }

  const { option: newOption } = createOption(data);

  return merge(
    {
      grid: {
        top: 40,
        left: 20,
        right: 20,
        bottom: 40,
        containLabel: true
      },
      yAxis: {
        show: false,
        max: maxY
      },
      tooltip: {
        // show: true,
        // trigger: 'axis',
        // axisPointer: {
        //   type: 'none'
        // },
        // formatter: (params, ticket) => {
        //   // console.log('params', params, ticket);
        //   return '';
        // }
      },
      // dataZoom: [
      //   {
      //     type: 'slider',
      //     filterMode: 'weakFilter',
      //     showDataShadow: false,
      //     showDetail: false,
      //     brushSelect: false,
      //     height: 20,
      //     bottom: 10,
      //     startValue: 1,
      //     endValue: 5,
      //     xAxisIndex: 0,
      //     start: 0,
      //     end: 100
      //   }
      // ],
      xAxis: {
        type: 'category',
        data: newOption.xAxis.data,
        axisLabel: {
          formatter: function (value) {
            return value?.includes('line') ? '' : value;
          }
        }
      }
    },
    newOption
  );
}

function getOption(data, height) {
  return run({ data, height });
}

option = getOption(defaultData);

if (option && typeof option === 'object') {
  myChart.setOption(option);
}

window.addEventListener('resize', myChart.resize);
