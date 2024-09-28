import { merge } from 'lodash-es';
import { formatMoney } from './formatters.js';
import { MAX_Y } from '../constants.js';

export function getOption(data, height = 500) {
  const chartHeight = height;
  const maxY = MAX_Y;
  const maxHeight = chartHeight - maxY;

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
        trigger: 'axis',
        axisPointer: {
          type: 'none'
        }
      },
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
      seriesDataMap[name] = seriesDataMap[name] || {};
      seriesDataMap[name][index] = dataItem?.value;
    }
  }

  return { list, legendData, xAxisData, seriesDataMap, max };
}

function createLineChart({ seriesData = [], initDataResult }) {
  const { list, max } = initDataResult;
  const spaceLineSeries = [];
  const lineSeries = [];

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
    return data?.map((_, index) => {
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
      return {
        ...item,
        value: isSpace ? spaceValue : value
      };
    });
  }

  return [...spaceLineSeries, ...lineSeries];
}

function createOption(initData) {
  const initDataResult = createData(initData);
  const { legendData, xAxisData, seriesDataMap, max } = initDataResult;
  const seriesData = [];

  for (const name of Object.keys(seriesDataMap)) {
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
        formatter: (params) => formatMoney(params.data.realValue)
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          return `<div>
          <div>年度月份：${params.name}</div>
          <div>${params.seriesName}：${formatMoney(params.data.realValue)}</div>
        </div>`;
        }
      },
      data: getChartData({ data, name })
    });
  }

  function getChartData({ data = [], name }) {
    return Object.entries(data).flatMap(([dateIndex, value]) => {
      const y = MAX_Y * (value / max);
      const ySize = maxHeight * (y / MAX_Y);
      const offset = getOffset({ list: initDataResult.list, dateIndex: parseInt(dateIndex), name, max });
      const radioValue = Math.min(y + offset, 100);

      const result = [{
        name,
        value: radioValue,
        radioValue,
        realValue: value,
        symbolOffset: [0, '50%'],
        symbolSize: [50, ySize]
      }];

      if (parseInt(dateIndex) < Object.keys(data).length - 1) {
        new Array(3).fill(0).forEach((_, lineIndex) => {
          result.push({
            value: '',
            radioValue,
            realValue: value,
            isLine: true,
            lineIndex
          });
        });
      }

      return result;
    });
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
    offset += MAX_Y * (itemValue / max);
  }

  return offset;
}
