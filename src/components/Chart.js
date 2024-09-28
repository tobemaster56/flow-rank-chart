import * as echarts from 'echarts/core';
import { ScatterChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

import { getOption } from '../utils/dataProcessing.js';

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

export function initChart(container) {
  return echarts.init(container, null, {
    renderer: 'canvas',
    useDirtyRect: false
  });
}

export { echarts }

export { getOption };
