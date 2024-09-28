import { initChart } from "./components/Chart.js";
import { merge, set } from "lodash-es";
import { DataItem, DataItemWithTotal, defaultData } from "./data";
import type { LineSeriesOption, ScatterSeriesOption } from "echarts/charts";

function createArray(count: number): any[] {
  return Array(count).fill(null);
}

document.addEventListener("DOMContentLoaded", () => {
  const chartContainer = document.getElementById("chart-container");
  if (!chartContainer) return;
  const chart = initChart(chartContainer);

  const option = getOption(defaultData);
  console.log("echarts option", option);
  chart.setOption(option);
  window.addEventListener("resize", () => {
    chart.resize();
  });
});

function formatMoney(money: number) {
  return String(money);
}
function createData(initData: DataItem[] = []): {
  list: DataItemWithTotal[];
  legendData: string[];
  xAxisData: string[];
  seriesDataMap: Record<string, any>;
  max: number;
} {
  const list = initData.map((item) => ({
    ...item,
    total: item.list.reduce((pre, cur) => pre + cur.value, 0),
    list: item.list.sort((a, b) => a.value - b.value),
  }));
  const legendData: string[] = [];
  const xAxisData: string[] = [];
  const seriesDataMap: Record<string, any> = {};
  let max = 0;

  // 生成x轴、图例数据
  list.forEach((item, dateIndex) => {
    xAxisData.push(item.date);
    if (dateIndex < list.length - 1) {
      xAxisData.push(
        ...createArray(3).map((_, lineIndex) => `line-${lineIndex}`),
      );
    }
    max = Math.max(max, item.total);
    item.list.forEach((dataItem) => {
      if (!legendData.includes(dataItem.name)) {
        legendData.push(dataItem.name);
      }
    });
  });

  // 根据图例生成数据
  list.forEach((item, index) => {
    legendData.forEach((name) => {
      const dataItem = item.list.find((dataItem) => dataItem.name === name);
      set(seriesDataMap, `${name}.${index}`, dataItem?.value);
    });
  });

  return { list, legendData, xAxisData, seriesDataMap, max };
}

function getOffset({
  list,
  dateIndex,
  name,
  max,
  maxY,
}: {
  list: DataItemWithTotal[];
  dateIndex: number;
  name: string;
  max: number;
  maxY: number;
}) {
  const dateData = list[dateIndex]?.list || [];
  const itemIndex = dateData.findIndex((item) => item.name === name);
  return dateData
    .slice(0, itemIndex)
    .reduce((offset, item) => offset + maxY * (item.value / max), 0);
}

function createScatterSeries(
  seriesDataMap: Record<string, number[]>,
  maxY: number,
  maxHeight: number,
  list: DataItemWithTotal[],
  max: number,
): ScatterSeriesOption[] {
  return Object.keys(seriesDataMap).map((name) => {
    const seriesData = seriesDataMap[name];
    const res = seriesData.flatMap((value, dateIndex) => {
      const y = maxY * (value / max);
      const ySize = maxHeight * (y / maxY);
      const offset = getOffset({ list, dateIndex, name, max, maxY });
      const radioValue = y + offset > 100 ? 100 : y + offset;

      const result: {
        name?: string;
        value: string | number;
        radioValue: number;
        realValue: number;
        symbolOffset?: (string | number)[];
        symbolSize?: [number, number];
      }[] = [
        {
          name,
          value: radioValue,
          radioValue,
          realValue: value,
          symbolOffset: [0, "50%"],
          symbolSize: [50, ySize],
        },
      ];

      if (dateIndex < seriesData.length - 1) {
        result.push(
          ...createArray(3).map((_, lineIndex) => ({
            value: "",
            radioValue,
            realValue: value,
            isLine: true,
            lineIndex,
          })),
        );
      }

      return result;
    });

    return {
      name,
      type: "scatter",
      symbol: "rect",
      z: 3,
      itemStyle: { opacity: 1 },
      label: {
        show: true,
        color: "#fff",
        formatter: (params) => formatMoney((params.data as any).realValue),
      },
      tooltip: {
        trigger: "item",
        formatter: (params) => `
            <div>
              <div>年度月份：${params.name}</div>
              <div>${params.seriesName}：${formatMoney((params.data as any).realValue)}</div>
            </div>`,
      },
      data: res,
    };
  });
}

type RadioValueObj = {
  radioValue: number;
  [k: string]: any;
};

function calcLineData(
  data: ScatterSeriesOption["data"] = [],
  name: string,
  list: DataItemWithTotal[],
  max: number,
  maxY: number,
  isSpace = false,
) {
  return (data as any[]).map((_: any, index: number) => {
    const dateIndex = Math.floor(index / 4);
    const lineIndex = index % 4;
    const item = (data[index] || {}) as RadioValueObj;
    const lastItem = (data[index - (4 - lineIndex)] || {}) as RadioValueObj;
    const nextItem = (data[index + (4 - lineIndex)] || {}) as RadioValueObj;
    const offset = getOffset({ list, dateIndex, name, max, maxY });
    const nextOffset = getOffset({
      list,
      dateIndex: dateIndex + 1,
      name,
      max,
      maxY,
    });
    let spaceValue;
    let value: number | undefined = item.radioValue - offset;

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

function createLineSeries(
  seriesData: ScatterSeriesOption[] = [],
  list: DataItemWithTotal[],
  max: number,
  maxY: number,
) {
  const spaceLineSeries: LineSeriesOption[] = [];
  const lineSeries: LineSeriesOption[] = [];

  seriesData.forEach((seriesItem, seriesIndex) => {
    const defaultLineSeries: LineSeriesOption = {
      type: "line",
      name: seriesItem.name,
      stack: `Line-${seriesIndex}`,
      smooth: 0.3,
      lineStyle: { width: 0, opacity: 0 },
      symbol: "none",
      showSymbol: false,
      triggerLineEvent: true,
      silent: true,
      areaStyle: {},
      emphasis: { focus: "series" },
    };

    spaceLineSeries.push({
      ...defaultLineSeries,
      areaStyle: { opacity: 0 },
      data: calcLineData(
        seriesItem.data,
        seriesItem.name as string,
        list,
        max,
        maxY,
        true,
      ),
    });

    lineSeries.push({
      ...defaultLineSeries,
      data: calcLineData(
        seriesItem.data,
        seriesItem.name as string,
        list,
        max,
        maxY,
      ),
    });
  });

  return [...spaceLineSeries, ...lineSeries];
}

function createOption(initData: DataItem[], maxY: number, maxHeight: number) {
  const { list, legendData, xAxisData, seriesDataMap, max } =
    createData(initData);

  const scatterSeries = createScatterSeries(
    seriesDataMap,
    maxY,
    maxHeight,
    list,
    max,
  );

  const lineSeries = createLineSeries(scatterSeries, list, max, maxY);

  return {
    legend: { data: legendData },
    xAxis: {
      data: xAxisData,
      axisTick: { show: false },
    },
    series: [...scatterSeries, ...lineSeries],
  };
}

function getOption(data = defaultData, chartHeight = 500) {
  const maxY = 100;
  const maxHeight = chartHeight - maxY;
  const newOption = createOption(data, maxY, maxHeight);
  return merge(
    {
      grid: {
        top: 40,
        left: 20,
        right: 20,
        bottom: 40,
        containLabel: true,
      },
      yAxis: {
        show: false,
        max: maxY,
      },
      tooltip: {},
      xAxis: {
        type: "category",
        data: newOption.xAxis.data,
        axisLabel: {
          formatter: (value: string) => (value.includes("line") ? "" : value),
        },
      },
    },
    newOption,
  );
}
