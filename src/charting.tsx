import * as React from 'react'
import { LineChart, Line, XAxis, YAxis, Legend } from 'recharts'

type SeriesData = { name: string } & any

interface IComponentProps {
  width: number
  height: number
  data: SeriesData[]
  xAxisKey: string
}

const lineColors = [
  '#D26E50',
  '#698778',
  '#F4C054',
  '#4C7B74',
  '#E59C5E',
  '#85966F',
  '#6B5052',
  '#6E6369',
  '#79747B'
]

export const Component = ({
  width,
  height,
  data,
  xAxisKey
}: IComponentProps) => {
  const margin = { top: 30, right: 42, left: 0, bottom: 42 }

  const lineKeys = Object.keys(data[0]).filter(key => key !== xAxisKey)
  const lines = lineKeys.map((lineKey, idx) => (
    <Line
      key={idx}
      type="monotone"
      dataKey={lineKey}
      stroke={lineColors[idx]}
    />
  ))

  return (
    <div style={{ backgroundColor: 'white' }}>
      <LineChart width={width} height={height} data={data} margin={margin}>
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Legend wrapperStyle={{ bottom: 16 }} />
        {lines}
      </LineChart>
    </div>
  )
}
