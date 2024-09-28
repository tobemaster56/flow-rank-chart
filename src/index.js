import { initChart } from './components/Chart.js';
import { merge, set } from 'lodash-es';
import { defaultData } from './data';


document.addEventListener('DOMContentLoaded', () => {
  const chartContainer = document.getElementById('chart-container');
  const chart = initChart(chartContainer);

  const option = getOption(defaultData);
  chart.setOption(option);
  window.addEventListener('resize', chart.resize);
});

function formatMoney(money) {
  return money
}

function getOption(data = defaultData, height = 500) {
  const chartHeight = height;
  const maxY = 100;
  const maxHeight = chartHeight - maxY;

  function createData(initData = []) {
    const list = initData.map(item => ({
      ...item,
      total: item.list.reduce((pre, cur) => pre + cur.value, 0),
      list: item.list.sort((a, b) => a.value - b.value)
    }));
    const legendData = [];
    const xAxisData = [];
    const seriesDataMap = {};
    let max = 0;

    // 生成x轴、图例数据
    list.forEach((item, dateIndex) => {
      xAxisData.push(item.date);
      if (dateIndex < list.length - 1) {
        xAxisData.push(...Array(3).fill().map((_, lineIndex) => `line-${lineIndex}`));
      }
      max = Math.max(max, item.total);
      item.list.forEach(dataItem => {
        if (!legendData.includes(dataItem.name)) {
          legendData.push(dataItem.name);
        }
      });
    });

    // 根据图例生成数据
    list.forEach((item, index) => {
      legendData.forEach(name => {
        const dataItem = item.list.find(dataItem => dataItem.name === name);
        set(seriesDataMap, `${name}.${index}`, dataItem?.value);
      });
    });

    return { list, legendData, xAxisData, seriesDataMap, max };
  }

  function createLineChart({ seriesData = [], initDataResult }) {
    const { list, max } = initDataResult;
    const spaceLineSeries = [];
    const lineSeries = [];

    seriesData.forEach((seriesItem, seriesIndex) => {
      const defaultLineSeries = {
        type: 'line',
        name: seriesItem.name,
        stack: `Line-${seriesIndex}`,
        smooth: 0.3,
        lineStyle: { width: 0, opacity: 0 },
        symbol: 'none',
        showSymbol: false,
        triggerLineEvent: true,
        silent: true,
        areaStyle: {},
        emphasis: { focus: 'series' }
      };

      spaceLineSeries.push({
        ...defaultLineSeries,
        areaStyle: { opacity: 0 },
        data: getLineData(seriesItem.data, seriesItem.name, true)
      });

      lineSeries.push({
        ...defaultLineSeries,
        data: getLineData(seriesItem.data, seriesItem.name)
      });
    });

    function getLineData(data, name, isSpace = false) {
      return data.map((_, index) => {
        const dateIndex = Math.floor(index / 4);
        const lineIndex = index % 4;
        const item = data[index] || {};
        const lastItem = data[index - (4 - lineIndex)] || {};
        const nextItem = data[index + (4 - lineIndex)] || {};
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
            if (!nextItem?.radioValue) value = undefined;
            break;
          case 2:
            spaceValue = (nextOffset + offset) / 2;
            value = (nextItem.radioValue + item.radioValue) / 2 - spaceValue;
            break;
          case 3:
            spaceValue = nextOffset;
            value = nextItem.radioValue - nextOffset;
            if (!lastItem?.radioValue) value = undefined;
            break;
        }
        if (!lastItem?.radioValue && !nextItem?.radioValue) value = undefined;

        return { ...item, value: isSpace ? spaceValue : value };
      });
    }

    return [...spaceLineSeries, ...lineSeries];
  }

  function createOption(initData) {
    const initDataResult = createData(initData);
    const { list, legendData, xAxisData, seriesDataMap, max } = initDataResult;
    const seriesData = [];

    Object.keys(seriesDataMap).forEach(name => {
      const data = seriesDataMap[name];
      seriesData.push({
        name,
        type: 'scatter',
        symbol: 'rect',
        z: 3,
        itemStyle: { opacity: 1 },
        label: {
          show: true,
          color: '#fff',
          formatter: params => formatMoney(params.data.realValue, 0)
        },
        tooltip: {
          trigger: 'item',
          formatter: params => `
            <div>
              <div>年度月份：${params.name}</div>
              <div>${params.seriesName}：${formatMoney(params.data.realValue, 0)}</div>
            </div>`
        },
        data: getChartData({ data, name })
      });
    });

    function getChartData({ data = [], name }) {
      return data.flatMap((value, dateIndex) => {
        const y = maxY * (value / max);
        const ySize = maxHeight * (y / maxY);
        const offset = getOffset({ list, dateIndex, name, max });
        const radioValue = y + offset > 100 ? 100 : y + offset;

        const result = [{
          name,
          value: radioValue,
          radioValue,
          realValue: value,
          symbolOffset: [0, '50%'],
          symbolSize: [50, ySize]
        }];

        if (dateIndex < data.length - 1) {
          result.push(...Array(3).fill().map((_, lineIndex) => ({
            value: '',
            radioValue,
            realValue: value,
            isLine: true,
            lineIndex
          })));
        }

        return result;
      });
    }

    const lineSeries = createLineChart({ seriesData, initDataResult });

    return {
      option: {
        legend: { data: legendData },
        xAxis: {
          data: xAxisData,
          axisTick: { show: false }
        },
        series: [...seriesData, ...lineSeries]
      }
    };
  }

  function getOffset({ list, dateIndex, name, max }) {
    const dateData = list[dateIndex]?.list || [];
    const itemIndex = dateData.findIndex(item => item.name === name);
    return dateData.slice(0, itemIndex).reduce((offset, item) => offset + maxY * (item.value / max), 0);
  }

  const { option: newOption } = createOption(data);

  return merge({
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
    tooltip: {},
    xAxis: {
      type: 'category',
      data: newOption.xAxis.data,
      axisLabel: {
        formatter: value => value.includes('line') ? '' : value
      }
    }
  }, newOption);
}
