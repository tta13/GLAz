import React from 'react';
import Plot from 'react-plotly.js';
import * as d3 from 'd3';
import { useEffect, useState } from 'react';
import { Carousel } from 'react-bootstrap';

interface ChartData {
  x: string[];
  y: number[];
  name: string;
  mode: any;
  type: any;
}

const COMMIT_INDEX = 0;
const PRS_INDEX = 1;
const REPO_INDEX = 2;

const LineCharts = () => {
  const [seriesData, setSeriesData] = useState<ChartData[]>([] as ChartData[]);
  const [eventData, setEventData] = useState<ChartData[]>([] as ChartData[]);
  const [index, setIndex] = useState(0);

  useEffect(() => init(), []);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  useEffect(() => {}, [seriesData, eventData]);

  function init() {
    setIndex(0);
    updateCarouselDataSource('./data/commits.csv', 'commit_count');
    updateEventDataSource();
  }

  const handleSelect = (selectedIndex: number) => {
    setIndex(selectedIndex);
    switch (selectedIndex) {
      case PRS_INDEX:
        updateCarouselDataSource('./data/prs.csv', 'pr_count');
        break;
      case REPO_INDEX:
        updateCarouselDataSource('./data/repos.csv', 'repos_count');
        break;
      case COMMIT_INDEX:
      default:
        updateCarouselDataSource('./data/commits.csv', 'commit_count');
        break;
    }
  };

  const groupBy = function (xs: any[], key: string) {
    return xs.reduce(function (rv, x) {
      if (x[key] in rv) {
        if (rv[x[key]].quarter.at(-1) === x.quarter[0] && rv[x[key]].year.at(-1) === x.year[0]) {
          rv[x[key]].count[rv[x[key]].count.length - 1] += x.count[0];
        } else {
          rv[x[key]].count.push(x.count[0]);
          rv[x[key]].quarter.push(x.quarter[0]);
          rv[x[key]].year.push(x.year[0]);
        }
      } else {
        rv[x[key]] = x;
      }
      return rv;
    }, {});
  };

  function updateCarouselDataSource(path: string, countCol: string) {
    const quarters = Array.from({ length: 4 }, (_, i) => i + 1).sort();
    const years = Array.from({ length: 10 }, (_, i) => i + 2012).sort();
    const cartesian = (...a: any[]) =>
      a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
    let yearsQuarters = cartesian(years, quarters);
    function sliderLabel(val: number) {
      return `Q${yearsQuarters[val][1]}/${yearsQuarters[val][0]}`;
    }
    yearsQuarters = yearsQuarters.map((v: number, index: number) => sliderLabel(index));

    d3.csv(path).then((data: any[]) => {
      let processedData = data.map((each) => {
        return {
          language_name: each.language_name,
          count: [+each[countCol]],
          year: [+each.year],
          quarter: [+each.quarter]
        };
      });
      processedData.sort((a, b) => {
        const v = a.year[0] - b.year[0];
        if (v !== 0) return v;
        return a.quarter[0] - b.quarter[0];
      });
      processedData = groupBy(processedData, 'language_name');
      const plotData = Object.keys(processedData)
        .map((language) => {
          const x = (processedData as any)[language].quarter.map(
            (q: any, index: any) => `Q${q}/${(processedData as any)[language].year[index]}`
          );
          const difference = yearsQuarters.filter((item: any) => !x.includes(item));
          const zeroPadding = difference.map(() => null);
          return {
            x: difference.concat(x),
            y: zeroPadding.concat((processedData as any)[language].count),
            name: (processedData as any)[language].language_name,
            mode: 'lines',
            type: 'scatter'
          } as ChartData;
        })
        .sort((a, b) => b.y[b.y.length - 1] - a.y[a.y.length - 1]);

      setSeriesData(plotData.slice(0, 10));
    });
  }

  function updateEventDataSource() {
    const quarters = Array.from({ length: 4 }, (_, i) => i + 1).sort();
    const years = Array.from({ length: 10 }, (_, i) => i + 2012).sort();
    const cartesian = (...a: any[]) =>
      a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
    let yearsQuarters = cartesian(years, quarters);
    function sliderLabel(val: number) {
      return `Q${yearsQuarters[val][1]}/${yearsQuarters[val][0]}`;
    }
    yearsQuarters = yearsQuarters.map((v: number, index: number) => sliderLabel(index));

    d3.csv('./data/events_normalized.csv').then((data: any[]) => {
      let processedData = data.map((each) => {
        return {
          event_name: each.event,
          count: [+each.count],
          year: [+each.year],
          quarter: [+each.quarter]
        };
      });
      processedData.sort((a, b) => {
        const v = a.year[0] - b.year[0];
        if (v !== 0) return v;
        return a.quarter[0] - b.quarter[0];
      });
      processedData = groupBy(processedData, 'event_name');
      const plotData = Object.keys(processedData).map((event) => {
        const x = (processedData as any)[event].quarter.map(
          (q: any, index: any) => `Q${q}/${(processedData as any)[event].year[index]}`
        );
        const difference = yearsQuarters.filter((item: any) => !x.includes(item));
        const zeroPadding = difference.map(() => null);
        return {
          x: difference.concat(x),
          y: zeroPadding.concat((processedData as any)[event].count),
          name: (processedData as any)[event].event_name,
          mode: 'lines',
          type: 'scatter'
        } as ChartData;
      });

      setEventData(plotData);
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '20px'
      }}>
      <h2>Line charts</h2>
      <p
        style={{
          width: '50%'
        }}>
        Time series for programming languages according to total number of <b>commits</b>,{' '}
        <b>pull requests</b> and <b>repositories</b>.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          width: '100%'
        }}>
        <div>
          <Carousel variant="dark" interval={null} activeIndex={index} onSelect={handleSelect}>
            <Carousel.Item>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  paddingBottom: '40px'
                }}>
                <h3>Commits</h3>
                <Plot
                  data={seriesData}
                  layout={{
                    width: 750,
                    height: 500,
                    xaxis: {
                      title: {
                        text: 'Time'
                      }
                    },
                    yaxis: {
                      title: {
                        text: 'Commits'
                      }
                    }
                  }}
                />
              </div>
            </Carousel.Item>
            <Carousel.Item>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  paddingBottom: '40px'
                }}>
                <h3>PRs</h3>
                <Plot
                  data={seriesData}
                  layout={{
                    width: 750,
                    height: 500,
                    xaxis: {
                      title: {
                        text: 'Time'
                      }
                    },
                    yaxis: {
                      title: {
                        text: 'Pull requests'
                      }
                    }
                  }}
                />
              </div>
            </Carousel.Item>
            <Carousel.Item>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  paddingBottom: '40px'
                }}>
                <h3>Repos</h3>
                <Plot
                  data={seriesData}
                  layout={{
                    width: 750,
                    height: 500,
                    xaxis: {
                      title: {
                        text: 'Time'
                      }
                    },
                    yaxis: {
                      title: {
                        text: 'Repositories'
                      }
                    }
                  }}
                />
              </div>
            </Carousel.Item>
          </Carousel>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            paddingBottom: '25px'
          }}>
          <h3>Events</h3>
          <Plot
            data={eventData}
            layout={{
              width: 600,
              height: 500,
              xaxis: {
                title: {
                  text: 'Time'
                }
              },
              yaxis: {
                title: {
                  text: 'Events (normalized)'
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LineCharts;
